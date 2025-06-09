// Instagram Clone script.js - Complete replacement
let startTime;

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
 * Get query parameter from URL
 */
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/**
 * Map JavaScript key events to standardized format
 */
function replaceJsKey(e) {
  if (e.key === "Shift") return "Key.shift";
  else if (e.key === "Control") return "Key.ctrl";
  else if (e.key === "Alt") return "Key.alt";
  else if (e.key === "Meta") return "Key.cmd";
  else if (e.key === "Enter") return "Key.enter";
  else if (e.key === "Backspace") return "Key.backspace";
  else if (e.key === "Escape") return "Key.esc";
  else if (e.key === "Tab") return "Key.tab";
  else if (e.code === "Space") return "Key.space";
  else if (e.key === "ArrowLeft") return "Key.left";
  else if (e.key === "ArrowRight") return "Key.right";
  else if (e.key === "ArrowUp") return "Key.up";
  else if (e.key === "ArrowDown") return "Key.down";
  else if (e.key === "CapsLock") return "Key.caps_lock";
  else return e.key;
}

/**
 * Auto-grow textarea functionality
 */
function initializeAutoGrowTextarea() {
  const textarea = document.getElementById('input_value');
  
  if (!textarea) {
    console.log('Textarea not found for auto-grow');
    return;
  }

  function autoResize() {
    // Reset height to measure content
    textarea.style.height = '20px';
    
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

/**
 * Start recording keystrokes and handle post submission
 */
function startKeyLogger(user_id_str, platform_initial, task_id) {
  const keyEvents = [];

  // Keystroke event handlers
  const onKeyDown = (e) => {
    keyEvents.push(["P", replaceJsKey(e), Date.now()]);
    
    // Handle Enter key properly for Instagram-style posting
    if (e.key === "Enter" && e.target.id === "input_value") {
      // Allow Shift+Enter for new lines
      if (!e.shiftKey) {
        // Prevent default Enter behavior
        e.preventDefault();
        // Manually insert newline
        const textarea = e.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + '\n' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 1;
        
        // Trigger auto-resize
        textarea.dispatchEvent(new Event('input'));
      }
    }
  };

  const onKeyUp = (e) => {
    keyEvents.push(["R", replaceJsKey(e), Date.now()]);
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  // Helper function to upload files to Netlify function
  const uploadToSaver = async (fileBlob, filename) => {
    const fd = new FormData();
    fd.append("file", fileBlob, filename);

    const res = await fetch(
      "https://melodious-squirrel-b0930c.netlify.app/.netlify/functions/saver",
      { method: "POST", body: fd }
    );

    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || res.statusText);
    return json.url;
  };

  // Get the Share button
  const shareButton = document.querySelector('.share-button');
  if (!shareButton) {
    console.error("Share button not found!");
    return;
  }

  // Handle Share button click
  shareButton.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (shareButton.disabled) return;
    shareButton.disabled = true;
    shareButton.textContent = 'Sharing...';

    try {
      // Prepare file names
      const p = platform_initial === "0" ? "f" : 
                platform_initial === "1" ? "i" : 
                platform_initial === "2" ? "t" : "u";
      const csvName = `${p}_${user_id_str}_${task_id}.csv`;
      const txtName = `${p}_${user_id_str}_${task_id}_raw.txt`;
      const metadataName = `${p}_${user_id_str}_${task_id}_metadata.json`;

      // Build CSV
      const heading = [["Press or Release", "Key", "Time"]];
      const csvString = heading
        .concat(keyEvents)
        .map((row) => row.join(","))
        .join("\n");
      const csvBlob = new Blob([csvString], {
        type: "text/csv;charset=utf-8",
      });

      // Get text content
      const inputEl = document.getElementById("input_value");
      const rawText = inputEl ? inputEl.value.trim() : "";

      // Validate post length
      const minLength = getMinPostLength();
      console.log(`Using minimum post length: ${minLength} characters`);

      if (!rawText || rawText.length === 0) {
        alert("Empty posts are not allowed!");
        shareButton.disabled = false;
        shareButton.textContent = 'Share';
        return;
      } else if (rawText.length < minLength) {
        alert(`Posts shorter than ${minLength} characters are not allowed! Current length: ${rawText.length}`);
        shareButton.disabled = false;
        shareButton.textContent = 'Share';
        return;
      } else if (keyEvents.length === 0) {
        alert("No keystrokes recorded! Please type something before submitting.");
        shareButton.disabled = false;
        shareButton.textContent = 'Share';
        return;
      }

      console.log("Submitting post with length:", rawText.length);
      console.log("Post content:", rawText);

      // Create text blob
      const txtBlob = new Blob([rawText], {
        type: "text/plain;charset=utf-8",
      });

      // Create metadata
      const endTime = Date.now();
      const metadata = {
        user_id: user_id_str,
        platform_initial: platform_initial,
        task_id: task_id,
        start_time: startTime,
        end_time: endTime,
        duration_ms: endTime - startTime,
        platform: platform_initial === "0" ? "facebook" : 
                  platform_initial === "1" ? "instagram" : "twitter"
      };
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: "application/json",
      });

      // Upload all files
      const [csvUrl, txtUrl, metadataUrl] = await Promise.all([
        uploadToSaver(csvBlob, csvName),
        uploadToSaver(txtBlob, txtName),
        uploadToSaver(metadataBlob, metadataName),
      ]);

      console.log("✅ CSV uploaded →", csvUrl);
      console.log("✅ TXT uploaded →", txtUrl);
      console.log("✅ Metadata uploaded →", metadataUrl);
      console.log("✅ Post submitted!");
      
      // Show success message
      alert("Post submitted successfully! Returning to tasks...");
      
      // Redirect back to tasks page
      const returnUrl = getQueryParam("return_url");
      if (returnUrl) {
        // Redirect back to the tasks page
        console.log("Redirecting to:", decodeURIComponent(returnUrl));
        window.location.href = decodeURIComponent(returnUrl);
      } else {
        // Fallback if no return URL provided
        console.error("No return URL found in query parameters");
        alert("No return URL found. Please navigate back to the tasks page manually.");
        
        // Try to go back in history as a last resort
        if (window.history.length > 1) {
          window.history.back();
        }
      }
      
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert("❌ Upload failed – see console for details. Please try again.");
      shareButton.disabled = false;
      shareButton.textContent = 'Share';
    }
  };
}

// Prevent multiple initializations
let isInitialized = false;

// Initialize when page loads
window.addEventListener('load', async function () {
  if (isInitialized) {
    console.log("Already initialized, skipping...");
    return;
  }
  
  isInitialized = true;
  startTime = Date.now();
  
  const user_id = getQueryParam("user_id");
  const platform_id = getQueryParam("platform_id");
  const task_id = getQueryParam("task_id");
  const return_url = getQueryParam("return_url");

  console.log("Initializing Instagram with:", { user_id, platform_id, task_id, return_url });

  if (user_id && platform_id && task_id) {
    startKeyLogger(user_id, platform_id, task_id);
    console.log("✅ Instagram keylogger initialized successfully");
  } else {
    console.error("Missing parameters:", { user_id, platform_id, task_id });
    alert("Missing user or platform or task info in URL");
  }
});

// Initialize auto-grow and prevent form submissions when DOM is ready
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

// Original Instagram clone functionality (preserved)
const homeButton = document.querySelector('.home-button');
const newPostButton = document.querySelector('.create-button');
const profileButton = document.querySelector('.profile-button');

// Instagram-specific UI interactions can be added here if needed