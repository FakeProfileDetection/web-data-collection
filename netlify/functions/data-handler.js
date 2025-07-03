// netlify/functions/data-handler.js - Consolidated handler for all data operations

import {
  getSupabaseClient,
  checkRateLimit,
  validateFileUpload,
  validateSurveyCode,
  validateCompletionData,
  isCodeExpired,
  findCompletionFileByCode,
  markCodeAsUsed,
  createResponse,
  createErrorResponse,
  getClientInfo,
  corsHeaders,
  CONFIG
} from './utils/supabase-utils.js';

/* ------------------------------------------------------------------ */
/* 1. Main Handler - Route based on action parameter                 */
/* ------------------------------------------------------------------ */
export const handler = async (event) => {
  const startTime = Date.now();
  const { httpMethod, queryStringParameters } = event;
  const clientInfo = getClientInfo(event);
  
  console.log(`[${new Date().toISOString()}] ${httpMethod} request from ${clientInfo.ip}`);

  // Handle CORS preflight for all actions
  if (httpMethod === "OPTIONS") {
    // For OPTIONS requests, we need to be more explicit about CORS headers
    return createResponse(200, { message: "CORS preflight successful" }, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
      "Access-Control-Max-Age": "86400"
    }, event);
  }

  // Only allow POST requests
  if (httpMethod !== "POST") {
    return createResponse(405, { 
      error: "Method not allowed", 
      allowed: ["POST", "OPTIONS"] 
    }, {}, event);
  }

  // Get action from query parameters
  const action = queryStringParameters?.action;
  if (!action) {
    return createResponse(400, {
      error: "Missing required 'action' parameter",
      available_actions: ["upload-file", "store-completion", "validate-code"]
    }, {}, event);
  }

  // Rate limiting check
  if (!checkRateLimit(clientInfo.ip)) {
    console.warn(`Rate limit exceeded for IP: ${clientInfo.ip}`);
    return createResponse(429, { 
      error: "Rate limit exceeded",
      message: "Too many requests. Please try again later.",
      retryAfter: CONFIG.RATE_LIMIT_WINDOW / 1000
    }, {}, event);
  }

  // Route to appropriate handler
  try {
    let result;
    
    switch (action) {
      case 'upload-file':
        result = await handleFileUpload(event, clientInfo);
        break;
      case 'store-completion':
        result = await handleStoreCompletion(event, clientInfo);
        break;
      case 'validate-code':
        result = await handleValidateCode(event, clientInfo);
        break;
      default:
        return createResponse(400, {
          error: `Unknown action: ${action}`,
          available_actions: ["upload-file", "store-completion", "validate-code"]
        }, {}, event);
    }

    const processingTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${action} completed successfully (${processingTime}ms)`);
    
    return createResponse(200, {
      ...result,
      processingTime
    }, {}, event);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] ${action} error (${processingTime}ms):`, {
      error: error.message,
      stack: error.stack,
      clientIP: clientInfo.ip
    });

    return createErrorResponse(error, 500, processingTime, event);
  }
};

/* ------------------------------------------------------------------ */
/* 2. File Upload Handler                                             */
/* ------------------------------------------------------------------ */
async function handleFileUpload(event, clientInfo) {
  const { headers, body } = event;
  
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
  const bodyBuffer = Buffer.from(body, "base64");
  const parts = bodyBuffer.toString().split(`--${boundary}`);
  
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
  
  // Determine content type from file extension
  let detectedContentType = 'text/plain'; // Safe default for research data
  const lowerFileName = originalFileName.toLowerCase();
  
  if (lowerFileName.endsWith('.json')) {
    detectedContentType = 'application/json';
  } else if (lowerFileName.endsWith('.csv')) {
    detectedContentType = 'text/csv';
  } else if (lowerFileName.endsWith('.txt')) {
    detectedContentType = 'text/plain';
  }
  
  // Validate file
  const validationErrors = validateFileUpload(originalFileName, fileBuffer, detectedContentType);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }
  
  // Extract user ID from filename for additional validation
  // Support two formats:
  // 1. Task files: {platform_prefix}_{userId}_{taskId}.ext (e.g., i_abc123_1.csv)
  // 2. Form files: {userId}_{formType}.ext (e.g., abc123_consent.json)
  
  let userId;
  const taskFileMatch = originalFileName.match(/^[a-z]_([a-f0-9]{8,32})_/);
  const formFileMatch = originalFileName.match(/^([a-f0-9]{8,32})_(consent|demographics|start_time|completion)/);
  
  if (taskFileMatch) {
    userId = taskFileMatch[1];
  } else if (formFileMatch) {
    userId = formFileMatch[1];
  } else {
    throw new Error("Invalid filename format - expected: {platform_prefix}_{userId}_{taskId}.ext or {userId}_{formType}.ext");
  }
  
  // Use original filename as-is (frontend already generates correct format)
  const secureFileName = originalFileName;
  
  // Upload to Supabase
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage
    .from("data-collection-files")
    .upload(`uploads/${secureFileName}`, fileBuffer, {
      contentType: detectedContentType,
      upsert: true, // Allow overwriting for legitimate retries
      cacheControl: '3600'
    });
  
  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
  
  const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/data-collection-files/uploads/${secureFileName}`;
  
  return {
    success: true,
    url: publicUrl,
    fileName: secureFileName,
    originalName: originalFileName,
    size: fileBuffer.length
  };
}

/* ------------------------------------------------------------------ */
/* 3. Store Completion Handler                                        */
/* ------------------------------------------------------------------ */
async function handleStoreCompletion(event, clientInfo) {
  const { body } = event;
  
  if (!body) {
    throw new Error('Request body is required');
  }

  const completionData = JSON.parse(body);

  // Validate completion data
  const validationErrors = validateCompletionData(completionData);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  // Ensure required fields are set correctly
  const finalCompletionData = {
    completion_timestamp: new Date().toISOString(),
    user_id: completionData.user_id,
    study_version: completionData.study_version || '1.0',
    completion_status: 'success',
    survey_code: completionData.survey_code.toUpperCase(),
    code_used: false,
    code_used_timestamp: null,
    mturk_worker_id: null,
    code_expires_at: new Date(Date.now() + (CONFIG.CODE_EXPIRY_HOURS * 60 * 60 * 1000)).toISOString(),
    client_info: {
      ip_address: clientInfo.ip,
      user_agent: clientInfo.userAgent,
      stored_at: new Date().toISOString()
    }
  };

  // Generate filename using simple format
  const fileName = `${completionData.user_id}_completion.json`;

  // Convert to JSON blob
  const jsonBlob = new Blob([JSON.stringify(finalCompletionData, null, 2)], {
    type: 'application/json'
  });

  // Upload to Supabase Storage
  const supabase = getSupabaseClient();
  const { error: uploadError } = await supabase.storage
    .from('data-collection-files')
    .upload(`uploads/${fileName}`, jsonBlob, {
      contentType: 'application/json',
      upsert: true, // Allow overwriting for legitimate retries/refreshes
      cacheControl: '3600'
    });

  if (uploadError) {
    console.error('Supabase upload error:', uploadError);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/data-collection-files/uploads/${fileName}`;
  
  return {
    success: true,
    message: "Completion data stored successfully",
    survey_code: finalCompletionData.survey_code,
    user_id: finalCompletionData.user_id,
    file_name: fileName,
    expires_at: finalCompletionData.code_expires_at,
    url: publicUrl
  };
}

/* ------------------------------------------------------------------ */
/* 4. Validate Code Handler                                           */
/* ------------------------------------------------------------------ */
async function handleValidateCode(event, clientInfo) {
  const { body } = event;
  
  if (!body) {
    throw new Error('Request body is required');
  }

  const requestData = JSON.parse(body);
  const { code, workerInfo } = requestData;

  if (!code || typeof code !== 'string') {
    throw new Error('Survey code is required');
  }

  const surveyCode = code.trim().toUpperCase();

  // Validate code format
  if (!validateSurveyCode(surveyCode)) {
    return {
      valid: false,
      used: false,
      expired: false,
      message: "Invalid code format. Expected format: TASK-YYYYMMDD-XXXX-XXXXXX"
    };
  }

  // Search for the completion file with this code
  const completionFile = await findCompletionFileByCode(surveyCode);

  if (!completionFile) {
    return {
      valid: false,
      used: false,
      expired: false,
      message: "Code not found. Please check your code and try again."
    };
  }

  // Check if code has already been used
  if (completionFile.data.code_used === true) {
    return {
      valid: true,
      used: true,
      expired: false,
      message: "This code has already been used and cannot be reused.",
      used_at: completionFile.data.code_used_timestamp
    };
  }

  // Check if code has expired
  const expired = isCodeExpired(completionFile.data.completion_timestamp);
  if (expired) {
    return {
      valid: true,
      used: false,
      expired: true,
      message: `Code has expired. Codes are valid for ${CONFIG.CODE_EXPIRY_HOURS} hours after completion.`
    };
  }

  // Code is valid and unused - mark it as used
  await markCodeAsUsed(completionFile.filePath, completionFile.data, {
    workerId: workerInfo?.workerId,
    userAgent: clientInfo.userAgent,
    ipAddress: clientInfo.ip
  });

  return {
    valid: true,
    used: false,
    expired: false,
    message: "Code is valid! You may proceed with your submission.",
    validated_at: new Date().toISOString(),
    user_id: completionFile.data.user_id,
    completed_at: completionFile.data.completion_timestamp
  };
}