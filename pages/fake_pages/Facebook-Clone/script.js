// Fixed Facebook Clone script.js
var settingsMenu = document.querySelector(".setting_menu");
var darkBtn = document.getElementById("dark_btn");
let startTime;

function settingsMenuToggle() {
  settingsMenu.classList.toggle("setting_menu_height");
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
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
 * The button uploads a CSV (keystrokes) and a TXT (raw text typed in
 * the #input_value element) to the Netlify `saver` function.
 */
function startKeyLogger(user_id_str, platform_initial, task_id) {
  /* -------------------- 1.  collect events -------------------- */
  const keyEvents = [];

  const onKeyDown = (e) => {
    keyEvents.push(["P", replaceJsKey(e), Date.now()]);
    
    // ⭐ FIXED: Prevent Enter key from submitting forms or reloading page
    // Only allow Enter to create new lines in the text area
    if (e.key === "Enter" && e.target.id === "input_value") {
      // Don't prevent default - allow new line in textarea
      // But prevent any form submission
      const form = e.target.closest('form');
      if (form) {
        e.preventDefault();
        // Manually insert new line (in case textarea doesn't handle it)
        const textarea = e.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + '\n' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }
    }
  };
  
  const onKeyUp = (e) => keyEvents.push(["R", replaceJsKey(e), Date.now()]);

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

  /* -------------------- 3.  Get the submit button -------------------- */
  const btnGet = document.querySelector("#button_value");
  if (!btnGet) {
    console.error("Submit button (#button_value) not found!");
    return;
  }

  /* -------------------- 4.  click handler ---------------------- */
  btnGet.onclick = async (e) => {
    // ⭐ FIXED: Prevent any default form submission behavior
    e.preventDefault();
    e.stopPropagation();
    
    if (btnGet.disabled) return; // avoid double‑clicks
    btnGet.disabled = true;

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

      /* ---- build TXT ---- */
      const inputEl = document.getElementById("input_value");
      const rawText = inputEl ? inputEl.value.trim() : ""; // ⭐ ADDED: trim whitespace
      
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

      // ⭐ UPDATED: Use centralized configuration
      const minLength = getMinPostLength();
      console.log(`Using minimum post length: ${minLength} characters`);

      if (!rawText || rawText.length === 0) {
        alert("Empty posts are not allowed!");
        btnGet.disabled = false; // Re-enable button so the user can try again
      } else if (rawText.length < minLength) {
        // ⭐ UPDATED: Use dynamic minimum length
        alert(`Posts shorter than ${minLength} characters are not allowed! Current length: ${rawText.length}`);
        btnGet.disabled = false; // Re-enable button so the user can try again
      } else if (keyEvents.length === 0) {
        alert("No keystrokes recorded! Please type something before submitting.");
        btnGet.disabled = false;
      } else {
        console.log("Submitting post with length:", rawText.length);
        console.log("Post content:", rawText);
        
        const txtBlob = new Blob([rawText], {
          type: "text/plain;charset=utf-8",
        });
        const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
          type: "application/json",
        });

        /* ---- upload both in parallel ---- */
        const [csvUrl, txtUrl, metadataUrl] = await Promise.all([
          uploadToSaver(csvBlob, csvName),
          uploadToSaver(txtBlob, txtName),
          uploadToSaver(metadataBlob, metadataName),
        ]);

        console.log("✅ CSV uploaded →", csvUrl);
        console.log("✅ TXT uploaded →", txtUrl);
        console.log("✅ Metadata uploaded →", metadataUrl);
        console.log("✅ Keylog submitted!");
        
        // ⭐ UPDATED: Redirect back to tasks page instead of closing window
        alert("Post submitted successfully! Returning to tasks...");
        
        // Get the return URL from query parameters
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
      }
      
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert("❌ Upload failed – see console for details. Please try again.");
      btnGet.disabled = false; // let user try again
    }
  };
}

// ⭐ FIXED: Only run initialization once, when page fully loads
let isInitialized = false;

window.addEventListener('load', async function () {
  // ⭐ FIXED: Prevent multiple initializations
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

  console.log("Initializing with:", { user_id, platform_id, task_id, return_url });

  if (user_id && platform_id && task_id) {
    startKeyLogger(user_id, platform_id, task_id);
    console.log("✅ Keylogger initialized successfully");
  } else {
    console.error("Missing parameters:", { user_id, platform_id, task_id });
    alert("Missing user or platform or task info in URL");
  }
});

// ⭐ FIXED: Prevent form submissions from reloading the page
document.addEventListener('DOMContentLoaded', function() {
  // Find any forms and prevent their default submission
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log("Form submission prevented");
    });
  });
  
  // ⭐ FIXED: Ensure the text input is a textarea for multi-line support
  const inputEl = document.getElementById("input_value");
  if (inputEl && inputEl.tagName.toLowerCase() !== 'textarea') {
    console.warn("Warning: input_value should be a textarea for multi-line support");
  }
});

// Dark mode functionality
if (darkBtn) {
  darkBtn.onclick = function () {
    darkBtn.classList.toggle("dark_btn_on");
  };
}

// Other existing functions
function passvalue() {
  var message = document.getElementById("");
}

// Get elements (keeping existing code structure)
let btnGet = document.querySelector("#button_value");
let inputGet = document.querySelector("#input_vlaue"); // Note: this has a typo in original
let post = document.querySelector("#post");