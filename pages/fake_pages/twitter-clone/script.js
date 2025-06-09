// Twitter Clone script.js - Complete replacement
let tweet_button = document.querySelector(".tweetBox__tweetButton");
let startTime;

/**
 * Get the minimum post length from CONFIG
 */
function getMinPostLength() {
  if (typeof CONFIG !== 'undefined' && CONFIG.POST_VALIDATION) {
    console.log(`Using CONFIG minimum length: ${CONFIG.POST_VALIDATION.currentMinLength}`);
    return CONFIG.POST_VALIDATION.currentMinLength;
  }
  
  console.error('CONFIG not loaded! Make sure common.js is included before this script.');
  alert('Configuration error: Please refresh the page. If this persists, contact the research team.');
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
 * Auto-grow textarea like Twitter
 */
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

/**
 * Start recording keystrokes
 */
function startKeyLogger(user_id_str, platform_initial, task_id) {
  const keyEvents = [];

  const onKeyDown = (e) => {
    keyEvents.push(["P", replaceJsKey(e), Date.now()]);
    
    // Handle Enter key properly in tweet input
    if (e.key === "Enter" && e.target.id === "input_value") {
      if (!e.shiftKey) {
        // Prevent form submission on Enter without Shift
        e.preventDefault();
        // Allow new line manually
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

  if (!tweet_button) {
    console.error("Tweet button (.tweetBox__tweetButton) not found!");
    return;
  }

  tweet_button.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (tweet_button.disabled) return;
    tweet_button.disabled = true;
    tweet_button.textContent = 'Posting...';

    try {
      const p = platform_initial === "0" ? "f" : 
                platform_initial === "1" ? "i" : 
                platform_initial === "2" ? "t" : "u";
      const csvName = `${p}_${user_id_str}_${task_id}.csv`;
      const txtName = `${p}_${user_id_str}_${task_id}_raw.txt`;
      const metadataName = `${p}_${user_id_str}_${task_id}_metadata.json`;

      const heading = [["Press or Release", "Key", "Time"]];
      const csvString = heading.concat(keyEvents).map((row) => row.join(",")).join("\n");
      const csvBlob = new Blob([csvString], { type: "text/csv;charset=utf-8" });

      const inputEl = document.getElementById("input_value");
      const rawText = inputEl ? inputEl.value.trim() : "";

      const minLength = getMinPostLength();
      console.log(`Using minimum post length: ${minLength} characters`);

      if (!rawText || rawText.length === 0) {
        alert("Empty posts are not allowed!");
        tweet_button.disabled = false;
        tweet_button.textContent = 'Tweet';
        return;
      } else if (rawText.length < minLength) {
        alert(`Posts shorter than ${minLength} characters are not allowed! Current length: ${rawText.length}`);
        tweet_button.disabled = false;
        tweet_button.textContent = 'Tweet';
        return;
      } else if (keyEvents.length === 0) {
        alert("No keystrokes recorded! Please type something before submitting.");
        tweet_button.disabled = false;
        tweet_button.textContent = 'Tweet';
        return;
      }

      console.log("Submitting tweet with length:", rawText.length);
      
      const txtBlob = new Blob([rawText], { type: "text/plain;charset=utf-8" });
      
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
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" });

      const [csvUrl, txtUrl, metadataUrl] = await Promise.all([
        uploadToSaver(csvBlob, csvName),
        uploadToSaver(txtBlob, txtName),
        uploadToSaver(metadataBlob, metadataName),
      ]);

      console.log("✅ CSV uploaded →", csvUrl);
      console.log("✅ TXT uploaded →", txtUrl);
      console.log("✅ Metadata uploaded →", metadataUrl);
      
      alert("Post submitted successfully! Returning to tasks...");
      
      // Redirect back to tasks page instead of closing window
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
      tweet_button.disabled = false;
      tweet_button.textContent = 'Tweet';
    }
  };
}

// Prevent multiple initializations
let isInitialized = false;

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

  console.log("Initializing Twitter with:", { user_id, platform_id, task_id, return_url });

  if (user_id && platform_id && task_id) {
    startKeyLogger(user_id, platform_id, task_id);
    console.log("✅ Twitter keylogger initialized successfully");
  } else {
    console.error("Missing parameters:", { user_id, platform_id, task_id });
    alert("Missing user or platform or task info in URL");
  }
});

// Initialize auto-grow when DOM is ready
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