// netlify/functions/saver.js - Enhanced with security and validation

import { createClient } from "@supabase/supabase-js";
import crypto from 'crypto';

/* ------------------------------------------------------------------ */
/* 1. Configuration and Constants                                     */
/* ------------------------------------------------------------------ */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
const ALLOWED_MIME_TYPES = [
  'application/json',
  'text/csv',
  'text/plain'
];

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // max requests per window

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map();

/* ------------------------------------------------------------------ */
/* 2. Supabase client with error handling                            */
/* ------------------------------------------------------------------ */
let supabase;
try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    throw new Error('Missing required environment variables');
  }
  
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

/* ------------------------------------------------------------------ */
/* 3. Security and validation utilities                              */
/* ------------------------------------------------------------------ */

/**
 * Rate limiting implementation
 */
function checkRateLimit(clientIP) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Clean old entries
  for (const [ip, requests] of rateLimitStore.entries()) {
    const filteredRequests = requests.filter(time => time > windowStart);
    if (filteredRequests.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, filteredRequests);
    }
  }
  
  // Check current IP
  const requests = rateLimitStore.get(clientIP) || [];
  const recentRequests = requests.filter(time => time > windowStart);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitStore.set(clientIP, recentRequests);
  
  return true;
}

/**
 * Validate file content and metadata
 */
function validateFile(fileName, fileBuffer, contentType) {
  const errors = [];
  
  // File size validation
  if (fileBuffer.length > MAX_FILE_SIZE) {
    errors.push(`File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  
  // File name validation
  if (!fileName || fileName.length > 255) {
    errors.push('Invalid file name');
  }
  
  // File name sanitization check
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '');
  if (sanitizedName !== fileName) {
    errors.push('File name contains invalid characters');
  }
  
  // MIME type validation
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    errors.push(`File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }
  
  // Content validation for JSON files
  if (contentType === 'application/json') {
    try {
      JSON.parse(fileBuffer.toString());
    } catch (e) {
      errors.push('Invalid JSON content');
    }
  }
  
  // Check for suspicious content patterns
  const fileContent = fileBuffer.toString().toLowerCase();
  const suspiciousPatterns = [
    '<script',
    'javascript:',
    'data:text/html',
    'eval(',
    'document.cookie'
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (fileContent.includes(pattern)) {
      errors.push('File content contains suspicious patterns');
      break;
    }
  }
  
  return errors;
}

/**
 * Generate secure filename with timestamp and hash
 */
function generateSecureFileName(originalName, userId) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const hash = crypto.createHash('sha256')
    .update(userId + originalName + Date.now())
    .digest('hex')
    .substring(0, 8);
  
  const extension = originalName.split('.').pop();
  return `${timestamp}_${hash}_${originalName}`;
}

/**
 * Enhanced CORS headers with security
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://fakeprofiledetection.github.io",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "3600", // Reduced from 24h
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
};

/* ------------------------------------------------------------------ */
/* 4. Main handler function                                           */
/* ------------------------------------------------------------------ */
export const handler = async (event) => {
  const startTime = Date.now();
  const { httpMethod, headers } = event;
  
  // Get client IP for rate limiting
  const clientIP = headers['x-forwarded-for'] || 
                   headers['x-real-ip'] || 
                   event.requestContext?.identity?.sourceIp || 
                   'unknown';
  
  console.log(`[${new Date().toISOString()}] ${httpMethod} request from ${clientIP}`);
  
  /* ---- 4.1 CORS pre-flight handling ------------------------------ */
  if (httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ""
    };
  }
  
  /* ---- 4.2 Method validation ------------------------------------- */
  if (httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: "Method not allowed", 
        allowed: ["POST", "OPTIONS"] 
      })
    };
  }
  
  /* ---- 4.3 Rate limiting ----------------------------------------- */
  if (!checkRateLimit(clientIP)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return {
      statusCode: 429,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: "Rate limit exceeded",
        retryAfter: RATE_LIMIT_WINDOW / 1000
      })
    };
  }
  
  /* ---- 4.4 File processing and validation ----------------------- */
  try {
    // Validate content type
    const contentType = headers["content-type"] || headers["Content-Type"] || "";
    if (!contentType.includes("multipart/form-data")) {
      throw new Error("Content-Type must be multipart/form-data");
    }
    
    // Extract boundary
    const boundary = contentType.split("boundary=")[1];
    if (!boundary) {
      throw new Error("Missing multipart boundary");
    }
    
    // Parse multipart data
    const body = Buffer.from(event.body, "base64");
    const parts = body.toString().split(`--${boundary}`);
    
    // Find file part
    const filePart = parts.find(part => 
      part.includes("Content-Disposition") && 
      part.includes("filename=")
    );
    
    if (!filePart) {
      throw new Error("No file found in request");
    }
    
    // Extract filename with validation
    const fileNameMatch = filePart.match(/filename="(.+?)"/);
    if (!fileNameMatch) {
      throw new Error("Invalid filename format");
    }
    
    const originalFileName = fileNameMatch[1];
    
    // Extract file data
    const fileDataMatch = filePart.split("\r\n\r\n");
    if (fileDataMatch.length < 2) {
      throw new Error("Invalid file data format");
    }
    
    const fileData = fileDataMatch[1].split("\r\n")[0];
    const fileBuffer = Buffer.from(fileData, "binary");
    
    // Determine content type from file content
    let detectedContentType = 'application/octet-stream';
    if (originalFileName.endsWith('.json')) {
      detectedContentType = 'application/json';
    } else if (originalFileName.endsWith('.csv')) {
      detectedContentType = 'text/csv';
    }
    
    // Validate file
    const validationErrors = validateFile(originalFileName, fileBuffer, detectedContentType);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    // Extract user ID from filename for additional validation
    const userIdMatch = originalFileName.match(/^([a-f0-9]{32})_/);
    if (!userIdMatch) {
      throw new Error("Invalid filename format - missing user ID");
    }
    
    const userId = userIdMatch[1];
    
    // Generate secure filename
    const secureFileName = generateSecureFileName(originalFileName, userId);
    
    /* ---- 4.5 Upload to Supabase with error handling --------------- */
    if (!supabase) {
      throw new Error("Storage service unavailable");
    }
    
    const { data, error } = await supabase.storage
      .from("data-collection-files")
      .upload(`uploads/${secureFileName}`, fileBuffer, {
        contentType: detectedContentType,
        upsert: false, // Changed to false to prevent overwrites
        cacheControl: '3600'
      });
    
    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    /* ---- 4.6 Generate response with metrics ----------------------- */
    const processingTime = Date.now() - startTime;
    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/data-collection-files/uploads/${secureFileName}`;
    
    console.log(`[${new Date().toISOString()}] Upload successful: ${secureFileName} (${processingTime}ms)`);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        url: publicUrl,
        fileName: secureFileName,
        originalName: originalFileName,
        size: fileBuffer.length,
        processingTime
      })
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error(`[${new Date().toISOString()}] Upload error (${processingTime}ms):`, {
      error: error.message,
      stack: error.stack,
      clientIP
    });
    
    // Don't expose internal error details to client
    const userMessage = error.message.includes('Validation failed') || 
                       error.message.includes('Rate limit') ||
                       error.message.includes('Method not allowed') ||
                       error.message.includes('No file found') ||
                       error.message.includes('Invalid filename') ||
                       error.message.includes('Content-Type must be')
      ? error.message
      : 'Upload failed due to server error';
    
    return {
      statusCode: error.message.includes('Rate limit') ? 429 : 
                 error.message.includes('Validation failed') ? 400 : 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: userMessage,
        processingTime
      })
    };
  }
};

/* ------------------------------------------------------------------ */
/* 5. Health check endpoint (optional)                               */
/* ------------------------------------------------------------------ */
export const healthCheck = async () => {
  try {
    // Basic health check
    const { data, error } = await supabase.storage.from('data-collection-files').list('', { limit: 1 });
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        storage: error ? 'error' : 'ok'
      })
    };
  } catch (error) {
    return {
      statusCode: 503,
      headers: corsHeaders,
      body: JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};