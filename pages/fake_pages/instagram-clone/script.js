// Complete Instagram Clone script.js - FIXED VERSION

// Elements
const toggleThemeBtn = document.querySelector('.header__theme-button');
const storiesContent = document.querySelector('.stories__content');
const storiesLeftButton = document.querySelector('.stories__left-button');
const storiesRightButton = document.querySelector('.stories__right-button');
const posts = document.querySelectorAll('.post');
const postsContent = document.querySelectorAll('.post__content');
let startTime;

// ===================================
// DARK/LIGHT THEME
// Set initial theme from LocalStorage
document.onload = setInitialTheme(localStorage.getItem('theme'));
function setInitialTheme(themeKey) {
  if (themeKey === 'dark') {
    document.documentElement.classList.add('darkTheme');
  } else {
    document.documentElement.classList.remove('darkTheme');
  }
}

function replaceJsKey(e) {
  if (e.key === 'Shift') {
    return 'Key.shift';
  } else if (e.key === 'Control') {
    return 'Key.ctrl';
  } else if (e.key === 'Alt') {
    return 'Key.alt';
  } else if (e.key === 'Meta') {
    return 'Key.cmd';
  } else if (e.key === 'Enter') {
    return 'Key.enter';
  } else if (e.key === 'Backspace') {
    return 'Key.backspace';
  } else if (e.key === 'Escape') {
    return 'Key.esc';
  } else if (e.key === 'Tab') {
    return 'Key.tab';
  } else if (e.code === 'Space') {
    return 'Key.space';
  } else if (e.key === 'ArrowLeft') {
    return 'Key.left';
  } else if (e.key === 'ArrowRight') {
    return 'Key.right';
  } else if (e.key === 'ArrowUp') {
    return 'Key.up';
  } else if (e.key === 'ArrowDown') {
    return 'Key.down';
  } else if (e.key === 'CapsLock') {
    return 'Key.caps_lock';
  } else {
    return e.key;
  }
}

// Toggle theme button
if (toggleThemeBtn) {
  toggleThemeBtn.addEventListener('click', () => {
    // Toggle root class
    document.documentElement.classList.toggle('darkTheme');

    // Saving current theme on LocalStorage
    if (document.documentElement.classList.contains('darkTheme')) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
    }
  });
}

// ===================================
// STORIES SCROLL BUTTONS
if (storiesLeftButton && storiesRightButton && storiesContent) {
  // Scrolling stories content
  storiesLeftButton.addEventListener('click', () => {
    storiesContent.scrollLeft -= 320;
  });
  storiesRightButton.addEventListener('click', () => {
    storiesContent.scrollLeft += 320;
  });

  // Checking if screen has minimum size of 1024px
  if (window.matchMedia('(min-width: 1024px)').matches) {
    // Observer to hide buttons when necessary
    const storiesObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach((entry) => {
          if (entry.target === document.querySelector('.story:first-child')) {
            storiesLeftButton.style.display = entry.isIntersecting
              ? 'none'
              : 'unset';
          } else if (
            entry.target === document.querySelector('.story:last-child')
          ) {
            storiesRightButton.style.display = entry.isIntersecting
              ? 'none'
              : 'unset';
          }
        });
      },
      { root: storiesContent, threshold: 1 }
    );

    // Calling the observer with the first and last stories
    const firstStory = document.querySelector('.story:first-child');
    const lastStory = document.querySelector('.story:last-child');
    if (firstStory) storiesObserver.observe(firstStory);
    if (lastStory) storiesObserver.observe(lastStory);
  }
}

// ===================================
// POST MULTIPLE MEDIAS
// Creating scroll buttons and indicators when post has more than one media
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

    post.querySelectorAll('.post__media').forEach(function () {
      const postMediaIndicatorElement = document.createElement('div');
      postMediaIndicatorElement.classList.add('post__indicator');

      const indicatorsContainer = post.querySelector('.post__indicators');
      if (indicatorsContainer) {
        indicatorsContainer.appendChild(postMediaIndicatorElement);
      }
    });

    // Observer to change the actual media indicator
    const postMediasContainer = post.querySelector('.post__medias');
    const postMediaIndicators = post.querySelectorAll('.post__indicator');
    if (postMediasContainer && postMediaIndicators.length > 0) {
      const postIndicatorObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Removing all the indicators
              postMediaIndicators.forEach((indicator) =>
                indicator.classList.remove('post__indicator--active')
              );
              // Adding the indicator that matches the current post media
              const postMedias = post.querySelectorAll('.post__media');
              const index = Array.from(postMedias).indexOf(entry.target);
              if (postMediaIndicators[index]) {
                postMediaIndicators[index].classList.add('post__indicator--active');
              }
            }
          });
        },
        { root: postMediasContainer, threshold: 0.5 }
      );

      // Calling the observer for every post media
      const postMedias = post.querySelectorAll('.post__media');
      postMedias.forEach((media) => {
        postIndicatorObserver.observe(media);
      });
    }
  }
});

// Adding buttons features on every post with multiple medias
postsContent.forEach((post) => {
  if (post.querySelectorAll('.post__media').length > 1) {
    const leftButton = post.querySelector('.post__left-button');
    const rightButton = post.querySelector('.post__right-button');
    const postMediasContainer = post.querySelector('.post__medias');

    if (leftButton && rightButton && postMediasContainer) {
      // Functions for left and right buttons
      leftButton.addEventListener('click', () => {
        postMediasContainer.scrollLeft -= 400;
      });
      rightButton.addEventListener('click', () => {
        postMediasContainer.scrollLeft += 400;
      });

      // Observer to hide button if necessary
      const postButtonObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach((entry) => {
            if (entry.target === post.querySelector('.post__media:first-child')) {
              leftButton.style.display = entry.isIntersecting ? 'none' : 'unset';
            } else if (
              entry.target === post.querySelector('.post__media:last-child')
            ) {
              rightButton.style.display = entry.isIntersecting ? 'none' : 'unset';
            }
          });
        },
        { root: postMediasContainer, threshold: 0.5 }
      );

      if (window.matchMedia('(min-width: 1024px)').matches) {
        const firstMedia = post.querySelector('.post__media:first-child');
        const lastMedia = post.querySelector('.post__media:last-child');
        if (firstMedia) postButtonObserver.observe(firstMedia);
        if (lastMedia) postButtonObserver.observe(lastMedia);
      }
    }
  }
});

// ===================================
// KEYLOGGING AND FORM SUBMISSION
const commentButton = document.getElementById('comment_button');
const commentBox = document.getElementById('comment_box');
const postCommentButton = document.getElementById('post_comment');

/**
 * Get the minimum post length from CONFIG
 */
function getMinPostLength() {
  // Check if CONFIG is available from common.js
  if (typeof CONFIG !== 'undefined' && CONFIG.POST_VALIDATION) {
    console.log(`Using CONFIG minimum length: ${CONFIG.POST_VALIDATION.currentMinLength}`);
    return CONFIG.POST_VALIDATION.currentMinLength;
  }
  
  // If CONFIG is not available, show error and use emergency fallback
  console.error('CONFIG not loaded! Make sure common.js is included before this script.');
  alert('Configuration error: Please refresh the page. If this persists, contact the research team.');
  
  // Emergency fallback (should never be used if common.js is loaded properly)
  return 100; // Conservative fallback
}

/**
 * Start recording keystrokes and expose a "Submit Keylog" button.
 */
function startKeyLogger(user_id_str, platform_initial, task_id) {
  /* -------------------- 1.  collect events -------------------- */
  const keyEvents = [];

  const onKeyDown = (e) => {
    keyEvents.push(['P', replaceJsKey(e), Date.now()]);
    
    // ⭐ FIXED: Handle Enter key properly in Instagram comment input
    if (e.key === "Enter" && e.target.id === "comment_input") {
      // Check if it's Shift+Enter (allow new line) or just Enter (prevent form submission)
      if (!e.shiftKey) {
        // Prevent form submission on Enter without Shift
        e.preventDefault();
        // Manually insert new line (same as Facebook/Twitter)
        const textarea = e.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + '\n' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }
      // If Shift+Enter, allow the default behavior (new line)
    }
  };
  
  const onKeyUp = (e) => keyEvents.push(['R', replaceJsKey(e), Date.now()]);

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  /* -------------------- 2.  helper to upload a file ------------ */
  const uploadToSaver = async (fileBlob, filename) => {
    const fd = new FormData();
    fd.append('file', fileBlob, filename);

    const res = await fetch(
      'https://melodious-squirrel-b0930c.netlify.app/.netlify/functions/saver',
      { method: 'POST', body: fd }
    );

    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || res.statusText);
    return json.url;
  };

  if (!postCommentButton) {
    console.error("Post comment button (#post_comment) not found!");
    return;
  }

  postCommentButton.onclick = async (e) => {
    // ⭐ FIXED: Prevent any default form behavior
    e.preventDefault();
    e.stopPropagation();
    
    // 1) Grab & trim the comment text
    const inputEl = document.getElementById('comment_input');
    const rawText = inputEl ? inputEl.value.trim() : '';

    // 2) If empty, alert and stop (button never gets disabled)
    if (!rawText) {
      alert('Empty posts are not allowed!');
      return;
    }

    // 3) Use centralized configuration for minimum length
    const minLength = getMinPostLength();
    console.log(`Using minimum post length: ${minLength} characters`);

    if (rawText.length < minLength) {
      alert(`Posts shorter than ${minLength} characters are not allowed! Current length: ${rawText.length}`);
      return;
    }

    // 4) Prevent double-clicks now that validation passed
    if (postCommentButton.disabled) return;
    postCommentButton.disabled = true;

    try {
      /* ---- filenames ---- */
      const p =
        platform_initial === '0'
          ? 'f'
          : platform_initial === '1'
          ? 'i'
          : platform_initial === '2'
          ? 't'
          : 'u';
      const csvName = `${p}_${user_id_str}_${task_id}.csv`;
      const txtName = `${p}_${user_id_str}_${task_id}_raw.txt`;
      const metadataName = `${p}_${user_id_str}_${task_id}_metadata.json`;

      /* ---- build CSV ---- */
      const heading = [['Press or Release', 'Key', 'Time']];
      const csvString = heading
        .concat(keyEvents)
        .map((row) => row.join(','))
        .join('\n');
      const csvBlob = new Blob([csvString], {
        type: 'text/csv;charset=utf-8',
      });

      /* ---- build TXT ---- */
      const txtBlob = new Blob([rawText], {
        type: 'text/plain;charset=utf-8',
      });
      
      /* ---- build metadata JSON ---- */
      const endTime = Date.now();
      const metadata = {
        user_id: user_id_str,
        platform_initial: platform_initial,
        task_id: task_id,
        start_time: startTime,
        end_time: endTime,
        duration_ms: endTime - startTime,
        platform: platform_initial === '0' ? 'facebook' : platform_initial === '1' ? 'instagram' : 'twitter'
      };
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: 'application/json',
      });

      /* ---- upload all files in parallel ---- */
      const [csvUrl, txtUrl, metadataUrl] = await Promise.all([
        uploadToSaver(csvBlob, csvName),
        uploadToSaver(txtBlob, txtName),
        uploadToSaver(metadataBlob, metadataName),
      ]);

      console.log('✅ CSV uploaded →', csvUrl);
      console.log('✅ TXT uploaded →', txtUrl);
      console.log('✅ Metadata uploaded →', metadataUrl);
      alert(
        'Keystroke CSV, raw text, and metadata uploaded successfully! This tab will be closed after dismissing this message!'
      );
      window.close();
    } catch (err) {
      console.error('❌ Upload failed:', err);
      alert('❌ Upload failed – see console for details. Please try again.');
    } finally {
      // 5) Re-enable the button regardless of success or failure
      postCommentButton.disabled = false;
    }
  };
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ⭐ FIXED: Prevent multiple initializations and form submission issues
let isInitialized = false;

window.addEventListener('load', async function () {
  // Prevent multiple initializations
  if (isInitialized) {
    console.log("Already initialized, skipping...");
    return;
  }
  
  isInitialized = true;
  startTime = Date.now(); // ⭐ FIXED: Set startTime here
  
  const user_id = getQueryParam('user_id');
  const platform_id = getQueryParam('platform_id');
  const task_id = getQueryParam('task_id');

  console.log("Initializing Instagram with:", { user_id, platform_id, task_id });

  if (user_id && platform_id && task_id) {
    startKeyLogger(user_id, platform_id, task_id);
    console.log("✅ Instagram keylogger initialized successfully");
  } else {
    console.error("Missing parameters:", { user_id, platform_id, task_id });
    alert('Missing user or platform or task info in URL');
  }
});

// ⭐ FIXED: Prevent any form submissions from causing page reloads
document.addEventListener('DOMContentLoaded', function() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log("Form submission prevented in Instagram");
    });
  });
});