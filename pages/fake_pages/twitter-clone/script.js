// Twitter Clone script.js - COMPLETE REPLACEMENT
// This file uses the PlatformSubmissionHandler from common.js

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