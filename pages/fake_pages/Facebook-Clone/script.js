// Facebook Clone script.js - COMPLETE REPLACEMENT
// This file uses the PlatformSubmissionHandler from common.js

// Facebook-specific UI elements
var settingsMenu = document.querySelector(".setting_menu");
var darkBtn = document.getElementById("dark_btn");

// Facebook-specific UI functions
function settingsMenuToggle() {
  settingsMenu.classList.toggle("setting_menu_height");
}

// Dark mode functionality
if (darkBtn) {
  darkBtn.onclick = function () {
    darkBtn.classList.toggle("dark_btn_on");
  };
}

// PLATFORM CONFIGURATION - Change this per platform
const PLATFORM_CONFIG = {
  // FOR FACEBOOK:
  name: 'facebook',
  textInputId: 'input_value',
  submitButtonId: 'button_value',
  submitButtonSelector: '#button_value',
  
  // FOR INSTAGRAM:
  // name: 'instagram',
  // textInputId: 'input_value',
  // submitButtonId: 'post_comment',
  // submitButtonSelector: '#post_comment',
  
  // FOR TWITTER:
  // name: 'twitter',
  // textInputId: 'input_value',
  // submitButtonId: 'tweet_button',
  // submitButtonSelector: '.tweetBox__tweetButton',
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


// Initialize platform handler when page loads
window.addEventListener('load', function () {
  // Check if PlatformSubmissionHandler is available
  if (typeof PlatformSubmissionHandler === 'undefined') {
    console.error('PlatformSubmissionHandler not found! Make sure common.js is loaded first.');
    alert('Configuration error: Please refresh the page.');
    return;
  }

  // Initialize the standardized handler
  PlatformSubmissionHandler.init({
    platform: 'facebook',
    textInputId: 'input_value',
    submitButtonId: 'button_value'
  });
});

// Prevent form submissions from reloading the page
document.addEventListener('DOMContentLoaded', function() {
  // Find any forms and prevent their default submission
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log("Form submission prevented in Facebook");
    });
  });
  
  // Ensure the text input is a textarea for multi-line support
  const inputEl = document.getElementById("input_value");
  if (inputEl && inputEl.tagName.toLowerCase() !== 'textarea') {
    console.warn("Warning: input_value should be a textarea for multi-line support");
  }
});

// Legacy function kept for compatibility
function passvalue() {
  var message = document.getElementById("");
}