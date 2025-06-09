// Fixed Twitter Clone script.js
let tweet_button = document.querySelector(".tweetBox__tweetButton");
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

function replaceJsKey(e) {
  if (e.key === "Shift") {
    return "Key.shift";
  } else if (e.key === "Control") {
    return "Key.ctrl";
  } else if (e.key === "Alt") {
    return "Key.alt";
  } else if (e.key === "Meta") {
    return "Key.cmd";
  } else if (e.key === "Enter") {
    return "Key.enter";
  } else if (e.key === "Backspace") {
    return "Key.backspace";
  } else if (e.key === "Escape") {
    return "Key.esc";
  } else if (e.key === "Tab") {
    return "Key.tab";
  } else if (e.code === "Space") {
    return "Key.space";
  } else if (e.key === "ArrowLeft") {
    return "Key.left";
  } else if (e.key === "ArrowRight") {
    return "Key.right";
  } else if (e.key === "ArrowUp") {
    return "Key.up";
  } else if (e.key === "ArrowDown") {
    return "Key.down";
  } else if (e.key === "CapsLock") {
    return "Key.caps_lock";
  } else {
    return e.key;
  }
}

/**
 * Start recording keystrokes and expose a "Submit Keylog" button.
 */
function startKeyLogger(user_id_str, platform_initial, task_id) {
  /* -------------------- 1.  collect events -------------------- */
  const keyEvents = [];

  const onKeyDown = (e) => {
    keyEvents.push(["P", replaceJsKey(e), Date.now()]);
    
    // ⭐ FIXED: Handle Enter key properly in tweet input
    if (e.key === "Enter" && e.target.id === "input_value") {
      // Check if it's Shift+Enter (allow new line) or just Enter (prevent form submission)
      if (!e.shiftKey) {
        // Prevent form submission on Enter without Shift
        e.preventDefault();
        // Allow new line manually (some browsers need this)
        const textarea = e.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + '\n' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }
      // If Shift+Enter, allow the default behavior (new line)
    }
  };

  const onKeyUp = (e) => {
    console.log(
      ">>> DEBUG: e.key =",
      JSON.stringify(e.key),
      ", codePoint =",
      e.key.length > 0 ? e.key.charCodeAt(0) : null
    );
    keyEvents.push(["R", replaceJsKey(e), Date.now()]);
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  /* -------------------- 2.  helper to upload a file ------------ */
  const uploadToSaver = async (fileBlob, filename) => {
    const fd = new FormData();
    fd.append("file", fileBlob, filename);

    const res = await fetch(
      "https://melodious-squirrel-b0930c.netlify.app/.netlify/functions/saver",
      { method: "POST", body: fd }
    );

    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || res.statusText);
    return json.url; // public URL returned by your function
  };

  /* -------------------- 3.  click handler ---------------------- */
  if (!tweet_button) {
    console.error("Tweet button (.tweetBox__tweetButton) not found!");
    return;
  }

  tweet_button.onclick = async (e) => {
    // ⭐ FIXED: Prevent any default form behavior
    e.preventDefault();
    e.stopPropagation();
    
    if (tweet_button.disabled) return; // avoid double‑clicks
    tweet_button.disabled = true;

    try {
      /* ---- filenames ---- */
      const p =
        platform_initial === "0"
          ? "f"
          : platform_initial === "1"
          ? "i"
          : platform_initial === "2"
          ? "t"
          : "u";
      const csvName = `${p}_${user_id_str}_${task_id}.csv`;
      const txtName = `${p}_${user_id_str}_${task_id}_raw.txt`;
      const metadataName = `${p}_${user_id_str}_${task_id}_metadata.json`;

      /* ---- build CSV ---- */
      const heading = [["Press or Release", "Key", "Time"]];
      const csvString = heading
        .concat(keyEvents)
        .map((row) => row.join(","))
        .join("\n");
      const csvBlob = new Blob([csvString], {
        type: "text/csv;charset=utf-8",
      });

      /* ---- get and validate text ---- */
      const inputEl = document.getElementById("input_value");
      const rawText = inputEl ? inputEl.value.trim() : ""; // ⭐ ADDED: trim whitespace

      // ⭐ UPDATED: Use centralized configuration
      const minLength = getMinPostLength();
      console.log(`Using minimum post length: ${minLength} characters`);

      if (!rawText || rawText.length === 0) {
        alert("Empty posts are not allowed!");
        tweet_button.disabled = false; // Re-enable button so the user can try again
      } else if (rawText.length < minLength) {
        // ⭐ UPDATED: Use dynamic minimum length and fixed variable name
        alert(`Posts shorter than ${minLength} characters are not allowed! Current length: ${rawText.length}`);
        tweet_button.disabled = false; // ⭐ FIXED: Use correct variable name
      } else if (keyEvents.length === 0) {
        alert("No keystrokes recorded! Please type something before submitting.");
        tweet_button.disabled = false;
      } else {
        console.log("Submitting tweet with length:", rawText.length);
        console.log("Tweet content:", rawText);
        
        const txtBlob = new Blob([rawText], {
          type: "text/plain;charset=utf-8",
        });
        
        /* ---- build metadata JSON ---- */
        const endTime = Date.now(); // Record end time just before uploading
        const metadata = {
          user_id: user_id_str,
          platform_initial: platform_initial,
          task_id: task_id,
          start_time: startTime,
          end_time: endTime,
          duration_ms: endTime - startTime,
          platform: platform_initial === "0" ? "facebook" : platform_initial === "1" ? "instagram" : "twitter"
        };
        const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
          type: "application/json",
        });

        /* ---- upload all files in parallel ---- */
        const [csvUrl, txtUrl, metadataUrl] = await Promise.all([
          uploadToSaver(csvBlob, csvName),
          uploadToSaver(txtBlob, txtName),
          uploadToSaver(metadataBlob, metadataName),
        ]);

        console.log("✅ CSV uploaded →", csvUrl);
        console.log("✅ TXT uploaded →", txtUrl);
        console.log("✅ Metadata uploaded →", metadataUrl);
        console.log("✅ Keylog submitted!");
        alert(
          'Keystroke CSV, raw text, and metadata uploaded successfully! This tab will be closed after dismissing this message!'
        );
        window.close();
      }
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert("❌ Upload failed – see console for details. Please try again.");
      tweet_button.disabled = false; // let user try again
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
  startTime = Date.now();
  
  const user_id = getQueryParam("user_id");
  const platform_id = getQueryParam("platform_id");
  const task_id = getQueryParam("task_id");

  console.log("Initializing Twitter with:", { user_id, platform_id, task_id });

  if (user_id && platform_id && task_id) {
    startKeyLogger(user_id, platform_id, task_id);
    console.log("✅ Twitter keylogger initialized successfully");
  } else {
    console.error("Missing parameters:", { user_id, platform_id, task_id });
    alert("Missing user or platform or task info in URL");
  }
});

// ⭐ FIXED: Prevent any form submissions from causing page reloads
document.addEventListener('DOMContentLoaded', function() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log("Form submission prevented in Twitter");
    });
  });
});