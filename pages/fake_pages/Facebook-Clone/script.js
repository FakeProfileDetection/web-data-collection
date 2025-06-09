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