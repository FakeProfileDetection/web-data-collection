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