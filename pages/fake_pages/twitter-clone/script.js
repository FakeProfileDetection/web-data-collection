// Twitter Clone script.js - COMPLETE REPLACEMENT
// This file uses the PlatformSubmissionHandler from common.js

// PLATFORM CONFIGURATION - Change this per platform
const PLATFORM_CONFIG = {
  // FOR FACEBOOK:
  // name: 'facebook',
  // textInputId: 'input_value',
  // submitButtonId: 'button_value',
  // submitButtonSelector: '#button_value',
  
  // FOR INSTAGRAM:
  // name: 'instagram',
  // textInputId: 'input_value',
  // submitButtonId: 'post_comment',
  // submitButtonSelector: '#post_comment',
  
  // FOR TWITTER:
  name: 'twitter',
  textInputId: 'input_value',
  submitButtonId: 'tweet_button',
  submitButtonSelector: '.tweetBox__tweetButton',
};

// ===================================
// SAVE/RESTORE TEXT FUNCTIONALITY
// ===================================

// Save text to sessionStorage when leaving page
window.addEventListener('beforeunload', function() {
  const textInput = document.getElementById(PLATFORM_CONFIG.textInputId);
  if (textInput && textInput.value.trim()) {
    const taskId = new URLSearchParams(window.location.search).get('task_id');
    const storageKey = `draft_${PLATFORM_CONFIG.name}_${taskId}`;
    sessionStorage.setItem(storageKey, textInput.value);
    console.log(`Saved draft for ${storageKey}:`, textInput.value);
  }
});

// Restore text when page loads
function restoreSavedText() {
  const taskId = new URLSearchParams(window.location.search).get('task_id');
  const storageKey = `draft_${PLATFORM_CONFIG.name}_${taskId}`;
  const savedText = sessionStorage.getItem(storageKey);
  
  if (savedText) {
    const textInput = document.getElementById(PLATFORM_CONFIG.textInputId);
    if (textInput) {
      textInput.value = savedText;
      console.log(`Restored draft for ${storageKey}:`, savedText);
      
      // Trigger any auto-resize functions
      textInput.dispatchEvent(new Event('input'));
      
      // Clear the saved text after restoring
      // Comment this out if you want to keep drafts even after submission
      // sessionStorage.removeItem(storageKey);
    }
  }
}

// ===================================
// INITIALIZE PLATFORM
// ===================================

window.addEventListener('load', function () {
  console.log(`Initializing ${PLATFORM_CONFIG.name} platform...`);
  
  // Check if PlatformSubmissionHandler is available
  if (typeof PlatformSubmissionHandler === 'undefined') {
    console.error('PlatformSubmissionHandler not found! Make sure common.js is loaded first.');
    alert('Configuration error: Please refresh the page.');
    return;
  }

  // Handle Twitter's class-based button
  if (PLATFORM_CONFIG.submitButtonSelector && PLATFORM_CONFIG.submitButtonSelector.startsWith('.')) {
    const button = document.querySelector(PLATFORM_CONFIG.submitButtonSelector);
    if (button && !button.id) {
      button.id = PLATFORM_CONFIG.submitButtonId;
    }
  }

  // Initialize the standardized handler
  PlatformSubmissionHandler.init({
    platform: PLATFORM_CONFIG.name,
    textInputId: PLATFORM_CONFIG.textInputId,
    submitButtonId: PLATFORM_CONFIG.submitButtonId,
    onAfterSubmit: () => {
      // Clear the saved draft after successful submission
      const taskId = new URLSearchParams(window.location.search).get('task_id');
      const storageKey = `draft_${PLATFORM_CONFIG.name}_${taskId}`;
      sessionStorage.removeItem(storageKey);
      console.log(`Cleared draft for ${storageKey}`);
    }
  });
  
  // Restore any saved text
  restoreSavedText();
});


// Auto-grow textarea functionality (Twitter-specific)
function initializeAutoGrowTextarea() {
  const textarea = document.getElementById('input_value');
  
  if (!textarea) {
    console.log('Textarea not found for auto-grow');
    return;
  }

  function autoResize() {
    // Reset height to measure content
    textarea.style.height = '50px';
    
    // Calculate new height based on content
    const newHeight = Math.min(textarea.scrollHeight, 200); // Max 200px
    
    // Apply new height
    textarea.style.height = newHeight + 'px';
    
    // Show scrollbar if content exceeds max height
    if (textarea.scrollHeight > 200) {
      textarea.style.overflowY = 'scroll';
    } else {
      textarea.style.overflowY = 'hidden';
    }
  }

  // Add event listeners
  textarea.addEventListener('input', autoResize);
  textarea.addEventListener('paste', () => setTimeout(autoResize, 0));
  
  // Initial resize
  autoResize();
  
  console.log('✅ Auto-grow textarea initialized');
}

// Initialize platform handler when page loads
window.addEventListener('load', function () {
  // Check if PlatformSubmissionHandler is available
  if (typeof PlatformSubmissionHandler === 'undefined') {
    console.error('PlatformSubmissionHandler not found! Make sure common.js is loaded first.');
    alert('Configuration error: Please refresh the page.');
    return;
  }

  // Get the tweet button element first
  const tweetButton = document.querySelector('.tweetBox__tweetButton');
  
  if (!tweetButton) {
    console.error('Tweet button not found!');
    return;
  }

  // Since Twitter uses a class instead of an ID, we need to temporarily add an ID
  // or modify the handler to accept a selector
  tweetButton.id = 'tweet-submit-button';

  // Initialize the standardized handler
  PlatformSubmissionHandler.init({
    platform: 'twitter',
    textInputId: 'input_value',
    submitButtonId: 'tweet-submit-button'
  });
});

// Initialize Twitter-specific features when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  initializeAutoGrowTextarea();
  
  // Prevent form submissions
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log("Form submission prevented in Twitter");
    });
  });
});