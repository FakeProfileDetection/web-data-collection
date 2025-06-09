// utils/common.js - Shared utilities following DRY principle

/**
 * Security-focused cookie utilities with proper validation
 */
class SecureCookieManager {
  static generateSecureUserId() {
    // Use crypto API for secure random generation
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    
    // Convert bytes to hex string - more explicit method
    let hexString = '';
    for (let i = 0; i < array.length; i++) {
      const hex = array[i].toString(16).padStart(2, '0');
      hexString += hex;
    }
    
    console.log('Generated secure user ID:', hexString);
    return hexString;
  }

  static setCookie(name, value, options = {}) {
    const defaults = {
      path: '/',
      secure: true,
      sameSite: 'Strict', // Changed from None for security
      maxAge: 86400 // 24 hours
    };
    
    const config = { ...defaults, ...options };
    const cookieString = `${name}=${encodeURIComponent(value)}; path=${config.path}; max-age=${config.maxAge}; secure; samesite=${config.sameSite}`;
    
    document.cookie = cookieString;
    console.log(`Cookie set: ${name}`);
  }

  static getCookie(name) {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      
      if (parts.length === 2) {
        return decodeURIComponent(parts.pop().split(';').shift());
      }
      return null;
    } catch (error) {
      console.error('Error reading cookie:', error);
      return null;
    }
  }

  static getOrCreateUserId() {
    let userId = this.getCookie('user_id');
    
    if (!userId) {
      userId = this.generateSecureUserId();
      this.setCookie('user_id', userId);
      console.log('New user ID created:', userId);
    }
    
    return userId;
  }

  static deleteCookie(name) {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict`;
  }
}

/**
 * Form validation utilities with consistent error handling
 */
class FormValidator {
  static validateEmail(email) {
    if (!email) return { valid: true, message: '' }; // Email is optional
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return {
      valid: emailRegex.test(email),
      message: emailRegex.test(email) ? '' : 'Please enter a valid email address'
    };
  }

  static validateRequired(value, fieldName) {
    const isValid = value && value.trim() !== '';
    return {
      valid: isValid,
      message: isValid ? '' : `${fieldName} is required`
    };
  }

  static validateSelect(value, fieldName) {
    const isValid = value && value !== '';
    return {
      valid: isValid,
      message: isValid ? '' : `Please select a ${fieldName.toLowerCase()}`
    };
  }

  static showError(message) {
    // Create a more user-friendly error display
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      background: #f8d7da;
      color: #721c24;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
      border: 1px solid #f5c6cb;
    `;
    
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(el => el.remove());
    
    // Add new error message
    const form = document.querySelector('form') || document.body;
    form.insertBefore(errorDiv, form.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => errorDiv.remove(), 5000);
  }
}

/**
 * Secure API communication with proper error handling
 */
class APIClient {
  static isLocalDevelopment() {
    return window.location.hostname === '127.0.0.1' || 
           window.location.hostname === 'localhost';
  }

  static async uploadFile(fileBlob, fileName, userId) {
    // For local development, simulate successful upload
    if (this.isLocalDevelopment()) {
      console.log(`🧪 LOCAL DEV: Simulating upload of ${fileName}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      return {
        success: true,
        url: `http://localhost/simulated/${fileName}`,
        fileName: fileName
      };
    }
    try {
      // Validate inputs
      if (!fileBlob || !fileName || !userId) {
        throw new Error('Missing required parameters for file upload');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', fileBlob, fileName);

      // Upload with timeout and retry logic
      const response = await this.fetchWithRetry(
        'https://melodious-squirrel-b0930c.netlify.app/.netlify/functions/saver',
        {
          method: 'POST',
          body: formData,
        },
        3 // max retries
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Successfully uploaded: ${fileName}`);
      return result;

    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  static async fetchWithRetry(url, options, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response;
        
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed:`, error.message);
        
        // Don't retry on certain errors
        if (error.name === 'AbortError' && attempt === maxRetries) {
          throw new Error('Request timeout - please check your connection');
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError;
  }
}

/**
 * Enhanced keylogger with memory management and performance optimization
 */
class EnhancedKeyLogger {
  constructor(userId, platformId) {
    this.userId = userId;
    this.platformId = platformId;
    this.keyEvents = [];
    this.maxEvents = 10000; // Prevent memory leaks
    this.isActive = false;
    
    // Bind methods to preserve context
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    
    this.createDownloadButton();
    console.log('Keylogger started');
  }

  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    
    const button = document.getElementById('keylogger-download-btn');
    if (button) button.remove();
    
    console.log('Keylogger stopped');
  }

  handleKeyDown(event) {
    this.addKeyEvent('P', event.key);
  }

  handleKeyUp(event) {
    this.addKeyEvent('R', event.key);
  }

  addKeyEvent(type, key) {
    // Prevent memory leaks by limiting array size
    if (this.keyEvents.length >= this.maxEvents) {
      this.keyEvents = this.keyEvents.slice(-this.maxEvents / 2); // Keep last half
      console.warn('Keylogger array truncated to prevent memory issues');
    }
    
    this.keyEvents.push([type, key, Date.now()]);
  }

  createDownloadButton() {
    const button = document.createElement('button');
    button.id = 'keylogger-download-btn';
    button.textContent = 'Download Keylog';
    button.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: #333;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 5px;
      cursor: pointer;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 12px;
    `;
    
    button.onclick = () => this.downloadKeylog();
    document.body.appendChild(button);
  }

  downloadKeylog() {
    try {
      const platformLetters = { 0: 'f', 1: 'i', 2: 't' };
      const platformLetter = platformLetters[this.platformId] || 'unknown';
      const filename = `${platformLetter}_${this.userId}.csv`;
      
      const header = [['Press or Release', 'Key', 'Time']];
      const csvData = header.concat(this.keyEvents);
      const csvString = csvData.map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      
      // Modern download approach
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      URL.revokeObjectURL(url);
      
      console.log(`Keylog downloaded: ${filename}`);
      
    } catch (error) {
      console.error('Failed to download keylog:', error);
      FormValidator.showError('Failed to download keylog. Please try again.');
    }
  }

  getEventCount() {
    return this.keyEvents.length;
  }

  clearEvents() {
    this.keyEvents = [];
    console.log('Keylog events cleared');
  }
}

/**
 * Navigation utilities with proper URL handling
 */
class NavigationManager {
  static getQueryParam(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch (error) {
      console.error('Error reading query parameter:', error);
      return null;
    }
  }

  static navigateWithUserId(page, userId = null) {
    const finalUserId = userId || SecureCookieManager.getOrCreateUserId();
    
    if (!finalUserId) {
      FormValidator.showError('Unable to get user ID. Please refresh the page.');
      return;
    }
    
    const url = `${page}?user_id=${encodeURIComponent(finalUserId)}`;
    window.location.href = url;
  }

  static openPlatform(platformUrl, userId, platformId, taskId) {
    const url = `${platformUrl}?user_id=${encodeURIComponent(userId)}&platform_id=${platformId}&task_id=${taskId}`;
    
    try {
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        FormValidator.showError('Please enable popups for this site to continue.');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to open platform:', error);
      FormValidator.showError('Failed to open platform. Please try again.');
      return false;
    }
  }
}

/**
 * Constants and configuration
 */
const CONFIG = {
  PLATFORMS: {
    FACEBOOK: {
      id: 0,
      name: 'Facebook',
      url: 'https://fakeprofiledetection.github.io/web-data-collection/pages/fake_pages/Facebook-Clone/index.html'
    },
    INSTAGRAM: {
      id: 1,
      name: 'Instagram', 
      url: 'https://fakeprofiledetection.github.io/web-data-collection/pages/fake_pages/instagram-clone/index.html'
    },
    TWITTER: {
      id: 2,
      name: 'Twitter',
      url: 'https://fakeprofiledetection.github.io/web-data-collection/pages/fake_pages/twitter-clone/index.html'
    }
  },
  
  VIDEOS: {
    CARTER: 'videos/Coach Carter (6_9) Movie CLIP - Our Deepest Fear (2005) HD.mp4',
    OSCARS: 'videos/Watch the uncensored moment Will Smith smacks Chris Rock on stage at the Oscars, drops F-bomb.mp4',
    TRUMP: 'videos/TrumpandVancecallZelenskyydisrespectfulinOvalOfficemeeting.mp4'
  },
  
  API: {
    BASE_URL: 'https://melodious-squirrel-b0930c.netlify.app/.netlify/functions/saver',
    TIMEOUT: 30000,
    MAX_RETRIES: 3
  },

  // Post validation settings
  POST_VALIDATION: {
    MIN_LENGTH: 150,        // Changed from 200 to 150
    MIN_LENGTH_DEBUG: 50,   // For debugging - much shorter
    MAX_LENGTH: 500,        // Optional: maximum length
    
    // Easy way to switch between debug and production
    get currentMinLength() {
      // Only use debug mode when explicitly requested
      const isDebugMode = window.location.search.includes('debug=true');
      
      console.log('Debug mode:', isDebugMode, 'Using length:', isDebugMode ? this.MIN_LENGTH_DEBUG : this.MIN_LENGTH);
      return isDebugMode ? this.MIN_LENGTH_DEBUG : this.MIN_LENGTH;
    }
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SecureCookieManager,
    FormValidator,
    APIClient,
    EnhancedKeyLogger,
    NavigationManager,
    CONFIG
  };
}

// ============================================
// PLATFORM SUBMISSION HANDLER
// Claude says add this to common.js
// ============================================

const PlatformSubmissionHandler = {
  // State
  keyEvents: [],
  startTime: null,
  isInitialized: false,

  /**
   * Initialize the platform handler
   * @param {Object} config - Configuration object
   * @param {string} config.platform - Platform name (facebook, instagram, twitter)
   * @param {string} config.textInputId - ID of the text input element
   * @param {string} config.submitButtonId - ID of the submit button element
   * @param {function} config.onBeforeSubmit - Optional callback before submission
   * @param {function} config.onAfterSubmit - Optional callback after successful submission
   */
  init(config) {
    if (this.isInitialized) {
      console.log("Platform handler already initialized, skipping...");
      return;
    }

    this.isInitialized = true;
    this.startTime = Date.now();
    this.config = config;

    // Get URL parameters
    const urlParams = this.getUrlParameters();
    
    console.log(`=== ${config.platform.toUpperCase()} PAGE LOADED ===`);
    console.log("Current URL:", window.location.href);
    console.log("Parsed parameters:", urlParams);

    // Validate required parameters
    if (!urlParams.user_id || !urlParams.platform_id || !urlParams.task_id) {
      console.error("Missing required parameters:", urlParams);
      alert('Missing user or platform or task info in URL');
      return;
    }

    // Start keylogger
    this.startKeyLogger(urlParams);

    // Set up submit button
    this.setupSubmitButton(urlParams);

    console.log(`✅ ${config.platform} handler initialized successfully`);
  },

  /**
   * Get URL parameters
   */
  getUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    return {
      user_id: params.get('user_id'),
      platform_id: params.get('platform_id'),
      task_id: params.get('task_id'),
      return_url: params.get('return_url')
    };
  },

  /**
   * Start keystroke logging
   */
  startKeyLogger(urlParams) {
    const onKeyDown = (e) => {
      this.keyEvents.push(['P', this.replaceJsKey(e), Date.now()]);
      
      // Handle Enter key for multi-line support
      if (e.key === "Enter" && e.target.id === this.config.textInputId) {
        if (!e.shiftKey) {
          e.preventDefault();
          const textarea = e.target;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          textarea.value = textarea.value.substring(0, start) + '\n' + textarea.value.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + 1;
          
          // Trigger any auto-resize if needed
          textarea.dispatchEvent(new Event('input'));
        }
      }
    };

    const onKeyUp = (e) => {
      this.keyEvents.push(['R', this.replaceJsKey(e), Date.now()]);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  },

  /**
   * Setup submit button handler
   */
  setupSubmitButton(urlParams) {
    const submitButton = document.getElementById(this.config.submitButtonId);
    
    if (!submitButton) {
      console.error(`Submit button #${this.config.submitButtonId} not found!`);
      return;
    }

    submitButton.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Call before submit callback if provided
      if (this.config.onBeforeSubmit) {
        const shouldContinue = this.config.onBeforeSubmit(e);
        if (!shouldContinue) return;
      }

      await this.handleSubmission(urlParams, submitButton);
    };
  },

  /**
   * Handle form submission
   */
  async handleSubmission(urlParams, submitButton) {
    if (submitButton.disabled) return;
    
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Posting...';

    try {
      // Get and validate text
      const inputEl = document.getElementById(this.config.textInputId);
      const rawText = inputEl ? inputEl.value.trim() : '';

      // Validate post content
      const validation = this.validatePost(rawText);
      if (!validation.isValid) {
        alert(validation.message);
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
      }

      // Prepare file names
      const filePrefix = this.getPlatformPrefix(urlParams.platform_id);
      const csvName = `${filePrefix}_${urlParams.user_id}_${urlParams.task_id}.csv`;
      const txtName = `${filePrefix}_${urlParams.user_id}_${urlParams.task_id}_raw.txt`;
      const metadataName = `${filePrefix}_${urlParams.user_id}_${urlParams.task_id}_metadata.json`;

      // Build files
      const csvBlob = this.buildCsvBlob();
      const txtBlob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
      const metadataBlob = this.buildMetadataBlob(urlParams);

      // Upload files
      const [csvUrl, txtUrl, metadataUrl] = await Promise.all([
        this.uploadToSaver(csvBlob, csvName),
        this.uploadToSaver(txtBlob, txtName),
        this.uploadToSaver(metadataBlob, metadataName),
      ]);

      console.log('✅ CSV uploaded →', csvUrl);
      console.log('✅ TXT uploaded →', txtUrl);
      console.log('✅ Metadata uploaded →', metadataUrl);

      // Call after submit callback if provided
      if (this.config.onAfterSubmit) {
        this.config.onAfterSubmit();
      }

      // Handle navigation back to tasks
      this.navigateBackToTasks(urlParams);

    } catch (err) {
      console.error('❌ Upload failed:', err);
      alert('❌ Upload failed – see console for details. Please try again.');
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  },

  /**
   * Validate post content
   */
  validatePost(text) {
    if (!text || text.length === 0) {
      return { isValid: false, message: 'Empty posts are not allowed!' };
    }

    const minLength = this.getMinPostLength();
    if (text.length < minLength) {
      return { 
        isValid: false, 
        message: `Posts shorter than ${minLength} characters are not allowed! Current length: ${text.length}` 
      };
    }

    if (this.keyEvents.length === 0) {
      return { isValid: false, message: 'No keystrokes recorded! Please type something before submitting.' };
    }

    return { isValid: true };
  },

  /**
   * Navigate back to tasks page
   */
  navigateBackToTasks(urlParams) {
    alert('Post submitted successfully! Click OK to return to tasks...');

    const returnUrl = urlParams.return_url;
    
    if (returnUrl) {
      const decodedUrl = decodeURIComponent(returnUrl);
      console.log("Redirecting to:", decodedUrl);
      window.location.replace(decodedUrl);
    } else {
      // Fallback: construct URL if return_url is missing
      console.error("No return URL found, using fallback");
      
      if (urlParams.user_id && urlParams.task_id) {
        const fallbackUrl = `/web-data-collection/pages/hosting/tasks.html?user_id=${urlParams.user_id}&completed_task=${urlParams.task_id}`;
        console.log("Using fallback URL:", fallbackUrl);
        window.location.replace(fallbackUrl);
      } else {
        alert("Cannot return to tasks page. Please navigate back manually.");
        if (window.history.length > 1) {
          window.history.back();
        }
      }
    }
  },

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Get minimum post length from CONFIG
   */
  getMinPostLength() {
    if (typeof CONFIG !== 'undefined' && CONFIG.POST_VALIDATION) {
      console.log(`Using CONFIG minimum length: ${CONFIG.POST_VALIDATION.currentMinLength}`);
      return CONFIG.POST_VALIDATION.currentMinLength;
    }
    
    console.error('CONFIG not loaded! Using fallback minimum length.');
    return 100;
  },

  /**
   * Get platform prefix for file naming
   */
  getPlatformPrefix(platformId) {
    const prefixes = { '0': 'f', '1': 'i', '2': 't' };
    return prefixes[platformId] || 'u';
  },

  /**
   * Map keyboard keys to standard format
   */
  replaceJsKey(e) {
    const keyMap = {
      'Shift': 'Key.shift',
      'Control': 'Key.ctrl',
      'Alt': 'Key.alt',
      'Meta': 'Key.cmd',
      'Enter': 'Key.enter',
      'Backspace': 'Key.backspace',
      'Escape': 'Key.esc',
      'Tab': 'Key.tab',
      'ArrowLeft': 'Key.left',
      'ArrowRight': 'Key.right',
      'ArrowUp': 'Key.up',
      'ArrowDown': 'Key.down',
      'CapsLock': 'Key.caps_lock'
    };
    
    if (e.code === 'Space') return 'Key.space';
    return keyMap[e.key] || e.key;
  },

  /**
   * Build CSV blob from keystroke events
   */
  buildCsvBlob() {
    const heading = [['Press or Release', 'Key', 'Time']];
    const csvString = heading
      .concat(this.keyEvents)
      .map(row => row.join(','))
      .join('\n');
    return new Blob([csvString], { type: 'text/csv;charset=utf-8' });
  },

  /**
   * Build metadata blob
   */
  buildMetadataBlob(urlParams) {
    const endTime = Date.now();
    const metadata = {
      user_id: urlParams.user_id,
      platform_id: urlParams.platform_id,
      task_id: urlParams.task_id,
      start_time: this.startTime,
      end_time: endTime,
      duration_ms: endTime - this.startTime,
      platform: this.config.platform
    };
    return new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
  },

  /**
   * Upload file to Netlify saver function
   */
  async uploadToSaver(fileBlob, filename) {
    const fd = new FormData();
    fd.append('file', fileBlob, filename);

    const res = await fetch(
      'https://melodious-squirrel-b0930c.netlify.app/.netlify/functions/saver',
      { method: 'POST', body: fd }
    );

    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || res.statusText);
    return json.url;
  }
};