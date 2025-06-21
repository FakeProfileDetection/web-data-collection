// Instagram Clone script.js - COMPLETE REPLACEMENT
// This file uses the PlatformSubmissionHandler from common.js

// Instagram-specific UI elements
const toggleThemeBtn = document.querySelector('.header__theme-button');
const storiesContent = document.querySelector('.stories__content');
const storiesLeftButton = document.querySelector('.stories__left-button');
const storiesRightButton = document.querySelector('.stories__right-button');
const posts = document.querySelectorAll('.post');
const postsContent = document.querySelectorAll('.post__content');
const commentButton = document.getElementById('comment_button');
const commentBox = document.getElementById('comment_box');


// PLATFORM CONFIGURATION - Change this per platform
const PLATFORM_CONFIG = {
  // FOR FACEBOOK:
  // name: 'facebook',
  // textInputId: 'input_value',
  // submitButtonId: 'button_value',
  // submitButtonSelector: '#button_value',
  
  // FOR INSTAGRAM:
  name: 'instagram',
  textInputId: 'input_value',
  submitButtonId: 'post_comment',
  submitButtonSelector: '#post_comment',
  
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


// ===================================
// INSTAGRAM-SPECIFIC UI FUNCTIONALITY
// ===================================

// Dark/Light Theme
document.onload = setInitialTheme(localStorage.getItem('theme'));

function setInitialTheme(themeKey) {
  if (themeKey === 'dark') {
    document.documentElement.classList.add('darkTheme');
  } else {
    document.documentElement.classList.remove('darkTheme');
  }
}

// Toggle theme button
if (toggleThemeBtn) {
  toggleThemeBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('darkTheme');
    if (document.documentElement.classList.contains('darkTheme')) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
    }
  });
}

// Stories scroll functionality
if (storiesLeftButton && storiesRightButton && storiesContent) {
  storiesLeftButton.addEventListener('click', () => {
    storiesContent.scrollLeft -= 320;
  });
  storiesRightButton.addEventListener('click', () => {
    storiesContent.scrollLeft += 320;
  });

  // Observer for story scroll buttons
  if (window.matchMedia('(min-width: 1024px)').matches) {
    const storiesObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach((entry) => {
          if (entry.target === document.querySelector('.story:first-child')) {
            storiesLeftButton.style.display = entry.isIntersecting ? 'none' : 'unset';
          } else if (entry.target === document.querySelector('.story:last-child')) {
            storiesRightButton.style.display = entry.isIntersecting ? 'none' : 'unset';
          }
        });
      },
      { root: storiesContent, threshold: 1 }
    );

    const firstStory = document.querySelector('.story:first-child');
    const lastStory = document.querySelector('.story:last-child');
    if (firstStory) storiesObserver.observe(firstStory);
    if (lastStory) storiesObserver.observe(lastStory);
  }
}

// Post multiple media functionality
posts.forEach((post) => {
  if (post.querySelectorAll('.post__media').length > 1) {
    const leftButtonElement = document.createElement('button');
    leftButtonElement.classList.add('post__left-button');
    leftButtonElement.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <path fill="#fff" d="M256 504C119 504 8 393 8 256S119 8 256 8s248 111 248 248-111 248-248 248zM142.1 273l135.5 135.5c9.4 9.4 24.6 9.4 33.9 0l17-17c9.4-9.4 9.4-24.6 0-33.9L226.9 256l101.6-101.6c9.4-9.4 9.4-24.6 0-33.9l-17-17c-9.4-9.4-24.6-9.4-33.9 0L142.1 239c-9.4 9.4-9.4 24.6 0 34z"></path>
      </svg>
    `;

    const rightButtonElement = document.createElement('button');
    rightButtonElement.classList.add('post__right-button');
    rightButtonElement.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <path fill="#fff" d="M256 8c137 0 248 111 248 248S393 504 256 504 8 393 8 256 119 8 256 8zm113.9 231L234.4 103.5c-9.4-9.4-24.6-9.4-33.9 0l-17 17c-9.4 9.4-9.4 24.6 0 33.9L285.1 256 183.5 357.6c-9.4 9.4-9.4 24.6 0 33.9l17 17c9.4 9.4 24.6 9.4 33.9 0L369.9 273c9.4-9.4 9.4-24.6 0-34z"></path>
      </svg>
    `;

    const postContent = post.querySelector('.post__content');
    if (postContent) {
      postContent.appendChild(leftButtonElement);
      postContent.appendChild(rightButtonElement);
    }

    // Add indicators
    post.querySelectorAll('.post__media').forEach(function () {
      const postMediaIndicatorElement = document.createElement('div');
      postMediaIndicatorElement.classList.add('post__indicator');
      const indicatorsContainer = post.querySelector('.post__indicators');
      if (indicatorsContainer) {
        indicatorsContainer.appendChild(postMediaIndicatorElement);
      }
    });
  }
});

// Auto-grow textarea functionality
function initializeAutoGrowTextarea() {
  const textarea = document.getElementById('input_value');
  if (!textarea) {
    console.log('Textarea not found for auto-grow');
    return;
  }

  function autoResize() {
    textarea.style.height = '20px';
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = newHeight + 'px';
    textarea.style.overflowY = textarea.scrollHeight > 200 ? 'scroll' : 'hidden';
  }

  textarea.addEventListener('input', autoResize);
  textarea.addEventListener('paste', () => setTimeout(autoResize, 0));
  autoResize();
  
  console.log('✅ Auto-grow textarea initialized');
}

// ===================================
// INITIALIZE PLATFORM HANDLER
// ===================================

window.addEventListener('load', function () {
  // Check if PlatformSubmissionHandler is available
  if (typeof PlatformSubmissionHandler === 'undefined') {
    console.error('PlatformSubmissionHandler not found! Make sure common.js is loaded first.');
    alert('Configuration error: Please refresh the page.');
    return;
  }

  // Initialize the standardized handler
  PlatformSubmissionHandler.init({
    platform: 'instagram',
    textInputId: 'input_value',
    submitButtonId: 'post_comment'
  });
});

// Initialize Instagram-specific features when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  initializeAutoGrowTextarea();
  
  // Prevent form submissions
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log("Form submission prevented in Instagram");
    });
  });
});