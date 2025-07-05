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
    // window.location.href = url;
    window.location.replace(url);

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
    NavigationManager,
    CONFIG
  };
}

/**
 * Device detection utilities
 */
class DeviceDetector {
  static isMobile() {
    // Check multiple indicators for mobile devices
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Check for mobile user agents
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    const isMobileUA = mobileRegex.test(userAgent);
    
    // Check for touch capability (though some laptops have touch)
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Check screen size (mobile typically < 768px)
    const isMobileWidth = window.innerWidth < 768;
    
    // Check for mobile-specific features
    const hasMobileOrientation = typeof window.orientation !== 'undefined';
    
    // Combine checks - if multiple indicators suggest mobile, it probably is
    return isMobileUA || (hasTouch && isMobileWidth) || hasMobileOrientation;
  }
  
  static getDeviceInfo() {
    const info = {
      isMobile: this.isMobile(),
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      touchCapable: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      platform: navigator.platform,
      vendor: navigator.vendor,
      deviceType: this.isMobile() ? 'mobile' : 'desktop'
    };
    
    // Add specific device type detection
    if (info.isMobile) {
      if (/iPad/i.test(navigator.userAgent)) {
        info.deviceType = 'tablet';
      } else if (/iPhone/i.test(navigator.userAgent)) {
        info.deviceType = 'iphone';
      } else if (/Android/i.test(navigator.userAgent)) {
        info.deviceType = 'android';
      }
    }
    
    return info;
  }
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
  hasSubmitted: false, 
  keyEventsAttached: false, // Track if event listeners are attached
  // High-performance keystroke capture
  keyBuffer: null,
  keyCodeMap: null,
  keyCodeIndex: 0,

  useWASM: false, // Will be set to true when WASM loads
  wasmCapture: null, // Will hold the WASM capture instance

  initHighPerformanceCapture() {
    // Pre-allocate typed arrays for maximum performance
    this.keyBuffer = {
      types: new Uint8Array(50000),      // 1 byte per type
      keys: new Uint16Array(50000),      // 2 bytes per key code
      timestamps: new Float64Array(50000), // 8 bytes per timestamp
      index: 0
    };
    
    // Create key code map
    this.keyCodeMap = new Map();
    this.keyCodeIndex = 0;
  },



  /**
   * Initialize the platform handler
   * @param {Object} config - Configuration object
   * @param {string} config.platform - Platform name (facebook, instagram, twitter)
   * @param {string} config.textInputId - ID of the text input element
   * @param {string} config.submitButtonId - ID of the submit button element
   * @param {function} config.onBeforeSubmit - Optional callback before submission
   * @param {function} config.onAfterSubmit - Optional callback after successful submission
   */
    async init(config) {
    // Store config first
    this.config = config;
    
    // Check if already submitted for this task
    const urlParams = this.getUrlParameters();
    const submissionKey = `submitted_${urlParams.user_id}_${urlParams.task_id}_${urlParams.platform_id}`;
    this.hasSubmitted = sessionStorage.getItem(submissionKey) === 'true';
    
    if (this.hasSubmitted) {
      console.log("Task already submitted, disabling form");
      this.disableForm();
      return;
    }

    // Prevent multiple initializations for the same page
    const initKey = `initialized_${config.platform}_${urlParams.task_id}`;
    if (sessionStorage.getItem(initKey) === 'true' && this.isInitialized) {
      console.log("Platform handler already initialized for this task, skipping...");
      return;
    }

    this.isInitialized = true;
    this.startTime = Date.now();
    sessionStorage.setItem(initKey, 'true');

    console.log(`=== ${config.platform.toUpperCase()} PAGE LOADED ===`);
    console.log("Current URL:", window.location.href);
    console.log("Parsed parameters:", urlParams);

    // Validate required parameters
    if (!urlParams.user_id || !urlParams.platform_id || !urlParams.task_id) {
      console.error("Missing required parameters:", urlParams);
      alert('Missing user or platform or task info in URL');
      return;
    }

    // Check if WASM is available
    if (window.wasmKeystrokeManager) {
      try {
        await window.wasmKeystrokeManager.initialize();
        this.wasmCapture = window.wasmKeystrokeManager;
        this.useWASM = true;
        console.log('✅ Using WASM for high-performance keystroke capture');
      } catch (error) {
        console.error('Failed to initialize WASM, falling back to JavaScript:', error);
        this.useWASM = false;
      }
    } else {
      console.log('WASM not available, using JavaScript keystroke capture');
    }

    // Only attach keylogger if not already attached
    if (!this.keyEventsAttached) {
      this.startKeyLogger(urlParams);
      this.keyEventsAttached = true;
    }
    
    // Set up submit button
    this.setupSubmitButton(urlParams);

    // Set up visibility handler
    this.setupVisibilityHandler();

    // Set up paste prevention
    const inputEl = document.getElementById(this.config.textInputId);
    if (inputEl) {
      inputEl.addEventListener('paste', this.handlePaste.bind(this));
      console.log('Paste prevention enabled for', this.config.textInputId);
    }

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      sessionStorage.removeItem(initKey);
      if (this.wasmCapture) {
        this.wasmCapture.clear();
      }
    });

    console.log(`✅ ${config.platform} handler initialized successfully`);
  },

  /**
   * Disable form when already submitted
   */
  disableForm() {
    const inputEl = document.getElementById(this.config.textInputId);
    const submitButton = document.getElementById(this.config.submitButtonId);
    
    if (inputEl) {
      inputEl.disabled = true;
      inputEl.value = "You have already submitted this task.";
    }
    
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Already Submitted";
    }
  },

  /**
   * Setup visibility handler to handle back/forward navigation
   */
  setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.hasSubmitted) {
        // Page is visible again and not submitted
        console.log("Page visible again, state preserved");
        
        // Re-check textarea value
        const inputEl = document.getElementById(this.config.textInputId);
        if (inputEl && inputEl.value) {
          console.log("Previous text preserved:", inputEl.value.length, "chars");
        }
      }
    });

    // Also handle page show event for back/forward cache
    window.addEventListener('pageshow', (event) => {
      if (event.persisted && !this.hasSubmitted) {
        console.log("Page restored from cache");
        // Re-validate state
        const urlParams = this.getUrlParameters();
        const submissionKey = `submitted_${urlParams.user_id}_${urlParams.task_id}_${urlParams.platform_id}`;
        if (sessionStorage.getItem(submissionKey) === 'true') {
          this.hasSubmitted = true;
          this.disableForm();
        }
      }
    });
  },

  /**
   * Handle paste events
   */
  handlePaste(e) {
    e.preventDefault(); // This stops the paste from happening
    
    // Show warning message
    this.showPasteWarning();
    
    // Log the attempt for debugging
    console.warn('Paste attempt blocked at', new Date().toISOString());
  },

  /**
   * Show paste warning message
   */
  showPasteWarning() {
    // Create warning element
    const warning = document.createElement('div');
    warning.className = 'paste-warning';
    warning.innerHTML = `
      <strong>⚠️ Paste Disabled</strong><br>
      Please type your response. This study requires actual typing for data collection.
    `;
    
    // Style the warning
    warning.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff6b6b;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      text-align: center;
      font-family: Arial, sans-serif;
    `;
    
    // Add to page
    document.body.appendChild(warning);
    
    // Remove after 5 seconds
    setTimeout(() => warning.remove(), 5000);
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
  if (this.useWASM && this.wasmCapture) {
      // Use WASM for capture
      console.log('Using WASM keystroke capture');
      
      document.addEventListener('keydown', (e) => {
        this.wasmCapture.captureKeyDown(e);
        
        // Handle Enter key
        if (e.key === "Enter" && e.target.id === this.config.textInputId && !e.shiftKey) {
          e.preventDefault();
          const textarea = e.target;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          textarea.value = textarea.value.substring(0, start) + '\n' + textarea.value.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + 1;
          textarea.dispatchEvent(new Event('input'));
        }
      });
      
      document.addEventListener('keyup', (e) => {
        this.wasmCapture.captureKeyUp(e);
      });
    } else {
      // Fallback to JavaScript implementation with physical key tracking
      console.log('Using JavaScript keystroke capture with physical key tracking');
      
      // Initialize high-performance capture
      this.initHighPerformanceCapture();
      
      // Add physical key tracking map
      this.physicalKeyMap = new Map();
      
      const captureEvent = (e, eventType) => {
        const timestamp = performance.now();
        const idx = this.keyBuffer.index;
        const physicalCode = e.code;
        
        let keyToStore;
        
        if (eventType === 0) { // Press event
          // Store the display key for this physical key
          keyToStore = e.key;
          this.physicalKeyMap.set(physicalCode, keyToStore);
        } else { // Release event
          // Get the stored key from press time
          keyToStore = this.physicalKeyMap.get(physicalCode);
          
          if (!keyToStore) {
            console.warn(`No tracked press for code=${physicalCode}, using current key=${e.key}`);
            keyToStore = e.key;
          } else {
            // Remove from tracking
            this.physicalKeyMap.delete(physicalCode);
          }
        }
        
        // Get or create key code
        let keyCode = this.keyCodeMap.get(keyToStore);
        if (keyCode === undefined) {
          keyCode = this.keyCodeIndex++;
          this.keyCodeMap.set(keyToStore, keyCode);
        }
        
        // Store in typed arrays
        this.keyBuffer.types[idx] = eventType;
        this.keyBuffer.keys[idx] = keyCode;
        this.keyBuffer.timestamps[idx] = timestamp;
        this.keyBuffer.index++;
        
        // Handle Enter key
        if (e.key === "Enter" && e.target.id === this.config.textInputId && !e.shiftKey) {
          e.preventDefault();
          requestAnimationFrame(() => {
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, start) + '\n' + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 1;
            textarea.dispatchEvent(new Event('input'));
          });
        }
      };
      
      document.addEventListener('keydown', (e) => captureEvent(e, 0), { passive: false });
      document.addEventListener('keyup', (e) => captureEvent(e, 1), { passive: true });
    }
  },

  getKeystrokeData() {
      if (this.useWASM && this.wasmCapture) {
          // Get data from WASM
          return this.wasmCapture.getRawData();
      } else {
          // Original implementation
          const events = [];
          const keyMap = Array.from(this.keyCodeMap.entries());
          
          for (let i = 0; i < this.keyBuffer.index; i++) {
              const keyEntry = keyMap.find(([_, code]) => code === this.keyBuffer.keys[i]);
              if (keyEntry) {
                  const originalKey = keyEntry[0];
                  
                  // Create a more complete fake event object for replaceJsKey
                  const fakeEvent = {
                      key: originalKey,
                      code: originalKey === ' ' ? 'Space' : `Key${originalKey.toUpperCase()}`
                  };
                  
                  events.push([
                      this.keyBuffer.types[i] === 0 ? 'P' : 'R',
                      this.replaceJsKey(fakeEvent),
                      Math.round(this.keyBuffer.timestamps[i] + performance.timeOrigin)
                  ]);
              }
          }
          
          return events;
      }
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
    // Check if already submitted
    if (this.hasSubmitted) {
      alert('You have already submitted this task. Please continue to the next task.');
      this.navigateBackToTasks(urlParams);
      return;
    }

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

      // After successful upload, mark as submitted
      const submissionKey = `submitted_${urlParams.user_id}_${urlParams.task_id}_${urlParams.platform_id}`;
      sessionStorage.setItem(submissionKey, 'true');
      this.hasSubmitted = true;
      
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
    // Always get fresh value from DOM
    const inputEl = document.getElementById(this.config.textInputId);
    const currentText = inputEl ? inputEl.value.trim() : text;
    
    if (!currentText || currentText.length === 0) {
      return { isValid: false, message: 'Empty posts are not allowed!' };
    }

    const minLength = this.getMinPostLength();
    if (currentText.length < minLength) {
      return { 
        isValid: false, 
        message: `Posts shorter than ${minLength} characters are not allowed! Current length: ${currentText.length}` 
      };
    }

    // Check keystroke data
    if (this.useWASM && this.wasmCapture) {
        if (this.wasmCapture.getEventCount() === 0) {
            return { isValid: false, message: 'No keystrokes recorded! Please type something before submitting.' };
        }
    } else {
        // Check the buffer instead of the text input
        if (!this.keyBuffer || this.keyBuffer.index === 0) {
            return { isValid: false, message: 'No keystrokes recorded! Please type something before submitting.' };
        }
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
        // window.location.replace(fallbackUrl);
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
    
    // Handle space key - check both e.code and e.key
    if (e.code === 'Space' || e.key === ' ') return 'Key.space';
    if (e.code === 'Comma' || e.key == ',' ) return 'Key.comma';
    
    // Check if it's a mapped key
    if (keyMap[e.key]) return keyMap[e.key];
    
    // Return the original key
    return e.key;
  },

  /**
   * Build CSV blob from keystroke events
   */
  buildCsvBlob() {
    console.log('=== Building CSV ===');
    console.log('useWASM:', this.useWASM);
    console.log('wasmCapture:', this.wasmCapture);
    
    if (this.useWASM && this.wasmCapture) {
      console.log('✅ Using WASM export');
      // Get CSV directly from WASM
      const csvString = this.wasmCapture.exportAsCSV();
      console.log('First few lines of WASM CSV:', csvString.split('\n').slice(0, 5));
      return new Blob([csvString], { type: 'text/csv;charset=utf-8' });
    } else {
      console.log('❌ Using JavaScript export');
      // Original implementation
      // Convert high-performance buffer to array format only when needed
      this.keyEvents = this.getKeystrokeData();
      
      const heading = [['Press or Release', 'Key', 'Time']];
      const csvString = heading
          .concat(this.keyEvents)
          .map(row => row.join(','))
          .join('\n');
      return new Blob([csvString], { type: 'text/csv;charset=utf-8' });
    }
  },

  /**
   * Build metadata blob
   */
  buildMetadataBlob(urlParams) {
    const endTime = Date.now();

    // Get device info
    const deviceInfoStr = sessionStorage.getItem('device_info');
    const deviceInfo = deviceInfoStr ? JSON.parse(deviceInfoStr) : DeviceDetector.getDeviceInfo();

    const metadata = {
      user_id: urlParams.user_id,
      platform_id: urlParams.platform_id,
      task_id: urlParams.task_id,
      start_time: this.startTime,
      end_time: endTime,
      duration_ms: endTime - this.startTime,
      platform: this.config.platform,
      // Add device info
      is_mobile: deviceInfo.isMobile,
      device_type: deviceInfo.deviceType,
      user_agent: deviceInfo.userAgent,
      screen_size: `${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`
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

