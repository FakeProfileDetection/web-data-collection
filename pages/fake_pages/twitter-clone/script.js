let tweet_button = document.querySelector(".tweetBox__tweetButton");
let startTime;
/**
 * Start recording keystrokes and expose a “Submit Keylog” button.
 * The button uploads a CSV (keystrokes) and a TXT (raw text typed in
 * the #input_value element) to the Netlify `saver` function.
 */
function startKeyLogger(user_id_str, platform_initial, task_id) {
  /* -------------------- 1.  collect events -------------------- */
  const keyEvents = [];

  const onKeyDown = (e) => keyEvents.push(["P", replaceJsKey(e), Date.now()]);
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

  /* -------------------- 4.  click handler ---------------------- */
  tweet_button.onclick = async () => {
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

      

      // ⭐ UPDATED: Use centralized configuration
      const minLength = getMinPostLength();
      console.log(`Using minimum post length: ${minLength} characters`);

      /* ---- build TXT ---- */
      const inputEl = document.getElementById("input_value");
      const rawText = inputEl ? inputEl.value : ""; // safe if element missing
      if (!rawText || rawText.length === 0) {
        alert("Empty posts are not allowed!");
        tweet_button.disabled = false; // Re-enable button so the user can try again
      } else if (rawText.length < minLength) {
        // ⭐ UPDATED: Use dynamic minimum length
        alert(`Posts shorter than ${minLength} characters are not allowed! Current length: ${rawText.length}`);
        btnGet.disabled = false; // Re-enable button so the user can try again
      } else {
        console.error(rawText);
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
        };
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
        alert(
        'Keystroke CSV, raw text, and metadata uploaded successfully! This tab will be closed after dismissing this message!'
        );
        window.close();
      }
      /* ---- optional: stop recording after successful upload ---- */
      // document.removeEventListener("keydown", onKeyDown);
      // document.removeEventListener("keyup",   onKeyUp);
    } catch (err) {
      console.error("❌ Upload failed:", err);
      console.error("❌ Upload failed – see console for details");
      tweet_button.disabled = false; // let user try again
    }
  };
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

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

window.onload = async function () {
  startTime = Date.now();
  const user_id = getQueryParam("user_id");
  const platform_id = getQueryParam("platform_id");
  const task_id = getQueryParam("task_id");

  if (user_id && platform_id && task_id) {
    startKeyLogger(user_id, platform_id, task_id);
  } else {
    alert("Missing user or platform or task info in URL");
  }
};
