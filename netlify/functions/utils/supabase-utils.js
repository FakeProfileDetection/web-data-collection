// netlify/functions/utils/supabase-utils.js - Shared utilities for Supabase operations

import { createClient } from "@supabase/supabase-js";
import crypto from 'crypto';

/* ------------------------------------------------------------------ */
/* 1. Configuration and Constants                                     */
/* ------------------------------------------------------------------ */
export const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB limit
  ALLOWED_MIME_TYPES: [
    'application/json',
    'text/csv',
    'text/plain'
  ],
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 10, // max requests per window
  CODE_EXPIRY_HOURS: 48, // codes expire after 48 hours
};

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map();

/* ------------------------------------------------------------------ */
/* 2. Supabase client initialization                                  */
/* ------------------------------------------------------------------ */
let supabase;
try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    throw new Error('Missing required Supabase environment variables');
  }
  
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }
  return supabase;
}

/* ------------------------------------------------------------------ */
/* 3. CORS Configuration                                              */
/* ------------------------------------------------------------------ */
// Allow multiple origins for production deployment flexibility
const getAllowedOrigin = (requestOrigin) => {
  const allowedOrigins = [
    'https://fakeprofiledetection.github.io',
    'https://melodious-squirrel-b0930c.netlify.app',
    'http://localhost:3999',
    'http://localhost:8888'
  ];
  
  // Handle undefined/null origin and return appropriate value
  if (!requestOrigin) {
    return '*';
  }
  
  return allowedOrigins.includes(requestOrigin) ? requestOrigin : '*';
};

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Will be dynamically set in createResponse
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "false",
  "Content-Type": "application/json"
};

/* ------------------------------------------------------------------ */
/* 4. Rate Limiting                                                   */
/* ------------------------------------------------------------------ */
export function checkRateLimit(clientIP, maxRequests = CONFIG.RATE_LIMIT_MAX_REQUESTS) {
  const now = Date.now();
  const windowStart = now - CONFIG.RATE_LIMIT_WINDOW;
  
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
  
  if (recentRequests.length >= maxRequests) {
    return false;
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitStore.set(clientIP, recentRequests);
  
  return true;
}

/* ------------------------------------------------------------------ */
/* 5. Validation Utilities                                            */
/* ------------------------------------------------------------------ */
export function validateFileUpload(fileName, fileBuffer, contentType) {
  const errors = [];
  
  // File size validation
  if (fileBuffer.length > CONFIG.MAX_FILE_SIZE) {
    errors.push(`File size exceeds limit of ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
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
  if (!CONFIG.ALLOWED_MIME_TYPES.includes(contentType)) {
    errors.push(`File type not allowed. Allowed types: ${CONFIG.ALLOWED_MIME_TYPES.join(', ')}`);
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

export function validateSurveyCode(code) {
  // Expected format: TASK-[timestamp36]-[random6chars]-[userHash4chars]
  // Example: TASK-L8X4M2K-ABC123-CE87
  const codeRegex = /^TASK-[A-Z0-9]+-[A-Z0-9]{6}-[A-Z0-9]{4}$/i;
  return codeRegex.test(code);
}

export function validateCompletionData(data) {
  const errors = [];
  
  // Required fields
  if (!data.user_id || typeof data.user_id !== 'string') {
    errors.push('user_id is required and must be a string');
  }
  
  if (!data.survey_code || typeof data.survey_code !== 'string') {
    errors.push('survey_code is required and must be a string');
  }
  
  if (!data.completion_timestamp) {
    errors.push('completion_timestamp is required');
  }
  
  // Validate survey code format
  if (data.survey_code && !validateSurveyCode(data.survey_code)) {
    errors.push('survey_code has invalid format');
  }
  
  // Validate user_id format (should be 8-32 character hex)
  const userIdRegex = /^[a-f0-9]{8,32}$/i;
  if (data.user_id && !userIdRegex.test(data.user_id)) {
    errors.push('user_id has invalid format (expected 8-32 hex characters)');
  }
  
  return errors;
}

/* ------------------------------------------------------------------ */
/* 6. File Utilities (simplified - using original filenames)         */
/* ------------------------------------------------------------------ */
// Note: We now use original filenames as-is since frontend generates correct format

/* ------------------------------------------------------------------ */
/* 7. Survey Code Utilities                                           */
/* ------------------------------------------------------------------ */
export function isCodeExpired(completionTimestamp) {
  const completionTime = new Date(completionTimestamp);
  const expiryTime = new Date(completionTime.getTime() + (CONFIG.CODE_EXPIRY_HOURS * 60 * 60 * 1000));
  return new Date() > expiryTime;
}

export async function findCompletionFileByCode(surveyCode) {
  const supabase = getSupabaseClient();
  
  try {
    // List all files in the uploads directory
    const { data: files, error: listError } = await supabase.storage
      .from('data-collection-files')
      .list('uploads', {
        limit: 1000,
        search: '_completion.json'
      });

    if (listError) {
      throw new Error(`Failed to list files: ${listError.message}`);
    }

    if (!files || files.length === 0) {
      return null;
    }

    // Filter for completion files
    const completionFiles = files.filter(file => 
      file.name.endsWith('_completion.json')
    );

    console.log(`Searching through ${completionFiles.length} completion files for code: ${surveyCode}`);

    // Search through each completion file
    for (const file of completionFiles) {
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('data-collection-files')
          .download(`uploads/${file.name}`);

        if (downloadError) {
          console.warn(`Failed to download ${file.name}:`, downloadError.message);
          continue;
        }

        const fileContent = await fileData.text();
        const completionData = JSON.parse(fileContent);

        // Check if this file contains the matching survey code
        if (completionData.survey_code === surveyCode) {
          return {
            fileName: file.name,
            filePath: `uploads/${file.name}`,
            data: completionData
          };
        }
      } catch (parseError) {
        console.warn(`Failed to parse ${file.name}:`, parseError.message);
        continue;
      }
    }

    return null; // Code not found
  } catch (error) {
    console.error('Error searching for completion file:', error);
    throw error;
  }
}

export async function markCodeAsUsed(filePath, completionData, workerInfo = {}) {
  const supabase = getSupabaseClient();
  
  try {
    // Update the completion data
    const updatedData = {
      ...completionData,
      code_used: true,
      code_used_timestamp: new Date().toISOString(),
      mturk_worker_id: workerInfo.workerId || null,
      validation_metadata: {
        validated_at: new Date().toISOString(),
        user_agent: workerInfo.userAgent || null,
        ip_address: workerInfo.ipAddress || null
      }
    };

    // Convert back to JSON
    const updatedContent = JSON.stringify(updatedData, null, 2);
    const blob = new Blob([updatedContent], { type: 'application/json' });

    // Upload updated file (this will overwrite the existing file)
    const { error: uploadError } = await supabase.storage
      .from('data-collection-files')
      .upload(filePath, blob, {
        contentType: 'application/json',
        upsert: true // Allow overwrite
      });

    if (uploadError) {
      throw new Error(`Failed to update completion file: ${uploadError.message}`);
    }

    console.log(`Successfully marked code as used in ${filePath}`);
    return true;
  } catch (error) {
    console.error('Error marking code as used:', error);
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* 8. Response Utilities                                              */
/* ------------------------------------------------------------------ */
export function createResponse(statusCode, body, headers = {}, event = null) {
  // Dynamic CORS origin based on request
  const requestOrigin = event?.headers?.origin || event?.headers?.Origin;
  const allowedOrigin = getAllowedOrigin(requestOrigin);
  
  // Debug logging for CORS
  console.log('CORS Debug:', {
    requestOrigin,
    allowedOrigin,
    userAgent: event?.headers?.['user-agent']?.substring(0, 100)
  });
  
  const responseHeaders = {
    ...corsHeaders,
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
    "Access-Control-Max-Age": "86400",
    ...headers
  };
  
  return {
    statusCode,
    headers: responseHeaders,
    body: JSON.stringify(body)
  };
}

export function createErrorResponse(error, statusCode = 500, processingTime = 0, event = null) {
  const isClientError = error.message.includes('Validation failed') ||
                       error.message.includes('Rate limit') ||
                       error.message.includes('Method not allowed') ||
                       error.message.includes('required') ||
                       error.message.includes('Invalid');

  const userMessage = isClientError ? error.message : 'Service error. Please try again.';
  
  return createResponse(isClientError ? 400 : statusCode, {
    success: false,
    error: userMessage,
    processingTime
  }, {}, event);
}

export function getClientInfo(event) {
  const { headers } = event;
  return {
    ip: headers['x-forwarded-for'] || 
        headers['x-real-ip'] || 
        event.requestContext?.identity?.sourceIp || 
        'unknown',
    userAgent: headers['user-agent'] || null
  };
}