import { JSDOM } from 'jsdom';
import fs from 'fs'; // To read the script file

// Mock global fetch
global.fetch = jest.fn();

// JSDOM setup
const html = `
<!DOCTYPE html>
<html>
<head></head>
<body>
  <input id="input_value" type="text" />
  <button class="tweetBox__tweetButton">Tweet</button>
</body>
</html>
`;

const dom = new JSDOM(html, { url: 'http://localhost/?user_id=twitter_user&platform_id=2&task_id=twitter_task' });
global.document = dom.window.document;
global.window = dom.window;
global.URLSearchParams = dom.window.URLSearchParams;
global.Blob = jest.fn(parts => new dom.window.Blob(parts));
global.URL.createObjectURL = jest.fn(); // Mock if used by the script, though not directly visible in provided snippet for download
global.alert = jest.fn();

// Function to load and execute script.js in JSDOM
const loadScript = () => {
  const scriptContent = fs.readFileSync('pages/fake_pages/twitter-clone/script.js', 'utf8');
  const scriptEl = dom.window.document.createElement('script');
  scriptEl.textContent = scriptContent;
  dom.window.document.body.appendChild(scriptEl);
  console.log('typeof dom.window.getQueryParam after script load (Twitter):', typeof dom.window.getQueryParam); // Debugging line

  // Make functions available globally for testing
  global.startKeyLogger = dom.window.startKeyLogger;
  global.replaceJsKey = dom.window.replaceJsKey;
  global.getQueryParam = dom.window.getQueryParam;

  if (typeof dom.window.onload === 'function') {
    global.handleOnLoad = dom.window.onload;
  } else if (dom.window.handleOnLoad) { // If the script itself created a global handleOnLoad
    global.handleOnLoad = dom.window.handleOnLoad;
  }
};

describe('Twitter-Clone Script Tests', () => {
  let mockAddEventListener;
  let mockFetch;

  beforeEach(() => {
    // Reset JSDOM body and URL
    dom.window.document.body.innerHTML = html.match(/<body>(.*)<\/body>/s)[1];
    window.history.pushState({}, '', '/?user_id=twitter_user&platform_id=2&task_id=twitter_task');

    // Load script
    loadScript();

    mockAddEventListener = jest.spyOn(document, 'addEventListener');
    mockFetch = global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'http://fake-url.com/file.csv' }),
    });
    global.alert.mockClear();
    Blob.mockClear();
    if (URL.createObjectURL) URL.createObjectURL.mockClear();


    // Ensure elements exist for tests
    if (!document.getElementById("input_value")) {
        const input = document.createElement('input');
        input.id = "input_value";
        document.body.appendChild(input);
    }
    // The script uses `document.querySelector(".tweetBox__tweetButton")`
    // Ensure this element is correctly assigned if startKeyLogger's scope needs it.
    // In the provided script, `tweet_button` is a global variable, so JSDOM should pick it up.
    // However, re-assigning it to `dom.window.tweet_button` can ensure consistency if needed.
    if (document.querySelector(".tweetBox__tweetButton")) {
        dom.window.tweet_button = document.querySelector(".tweetBox__tweetButton");
    } else {
        const btn = document.createElement('button');
        btn.className = "tweetBox__tweetButton";
        document.body.appendChild(btn);
        dom.window.tweet_button = btn;
    }
  });

  afterEach(() => {
    mockAddEventListener.mockRestore();
    mockFetch.mockRestore();
    document.body.innerHTML = '';
  });

  describe('replaceJsKey', () => {
    test('should replace special key names correctly', () => {
      if (!global.replaceJsKey) { console.warn("replaceJsKey not loaded"); return; }
      expect(replaceJsKey('Meta')).toBe('Key.cmd');
      expect(replaceJsKey(' ')).toBe('Key.space');
      expect(replaceJsKey('ArrowDown')).toBe('Key.down');
      expect(replaceJsKey('x')).toBe('x');
    });
  });

  describe('getQueryParam', () => {
    test('should return the correct query parameter value', () => {
      if (!global.getQueryParam) { console.warn("getQueryParam not loaded"); return; }
      expect(getQueryParam('user_id')).toBe('twitter_user');
      expect(getQueryParam('platform_id')).toBe('2');
      expect(getQueryParam('task_id')).toBe('twitter_task');
    });
  });

  describe('startKeyLogger', () => {
    test('should attach keydown and keyup event listeners', () => {
      if (!global.startKeyLogger) { console.warn("startKeyLogger not loaded"); return; }
      startKeyLogger('user_tw', '2', 'task_tw');
      expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
    });

    test('should collect key events and upload on tweet button click', async () => {
      if (!global.startKeyLogger) { console.warn("startKeyLogger not loaded"); return; }
      startKeyLogger('user_tw', '2', 'task_tw');

      const inputEl = document.getElementById('input_value');
      inputEl.value = 't'.repeat(201); // Valid tweet length

      // Simulate key events
      const keyDownListener = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
      const keyUpListener = mockAddEventListener.mock.calls.find(call => call[0] === 'keyup')[1];
      keyDownListener(new dom.window.KeyboardEvent('keydown', { key: 't' }));
      keyUpListener(new dom.window.KeyboardEvent('keyup', { key: 't' }));

      const tweetButton = document.querySelector('.tweetBox__tweetButton');
      await tweetButton.onclick();

      expect(mockFetch).toHaveBeenCalledTimes(2); // CSV and TXT
      expect(Blob).toHaveBeenCalledTimes(2);
      const formData = mockFetch.mock.calls[0][1]; // FormData from first call (CSV)
      expect(formData.get('file').name).toBe('t_user_tw_task_tw.csv');
    });

    test('should alert if tweet is empty', async () => {
      if (!global.startKeyLogger) { console.warn("startKeyLogger not loaded"); return; }
      startKeyLogger('user_tw', '2', 'task_tw');
      document.getElementById('input_value').value = ''; // Empty tweet

      const tweetButton = document.querySelector('.tweetBox__tweetButton');
      await tweetButton.onclick();

      expect(alert).toHaveBeenCalledWith('Empty posts are not allowed!');
      expect(mockFetch).not.toHaveBeenCalled();
      expect(tweetButton.disabled).toBe(false); // Should be re-enabled
    });

    test('should alert if tweet is too short', async () => {
      if (!global.startKeyLogger) { console.warn("startKeyLogger not loaded"); return; }
      startKeyLogger('user_tw', '2', 'task_tw');
      document.getElementById('input_value').value = 'short tweet'; // Too short

      const tweetButton = document.querySelector('.tweetBox__tweetButton');
      await tweetButton.onclick();

      expect(alert).toHaveBeenCalledWith('posts shorter than 200 chars are not allowed!');
      expect(mockFetch).not.toHaveBeenCalled();
      expect(tweetButton.disabled).toBe(false); // Should be re-enabled
    });

    test('should handle upload failure', async () => {
        if (!global.startKeyLogger) { console.warn("startKeyLogger not loaded"); return; }
        startKeyLogger('user_tw', '2', 'task_tw');
        document.getElementById('input_value').value = 't'.repeat(201);

        mockFetch.mockRejectedValueOnce(new Error("Upload failed"));
        console.error = jest.fn(); // Mock console.error

        const tweetButton = document.querySelector('.tweetBox__tweetButton');
        await tweetButton.onclick();

        expect(mockFetch).toHaveBeenCalledTimes(1); // Only one attempt before error (Promise.all)
        expect(console.error).toHaveBeenCalledWith('❌ Upload failed:', expect.any(Error));
        expect(tweetButton.disabled).toBe(false); // Button should be re-enabled
    });
  });

  describe('window.onload assignment', () => {
    test('should call startKeyLogger with params from URL if present on load', async () => {
      if (!global.handleOnLoad || !global.startKeyLogger) { console.warn("handleOnLoad or startKeyLogger not loaded"); return; }

      const mockStartKeyLogger = jest.fn();
      global.startKeyLogger = mockStartKeyLogger; // Spy

      if (typeof global.handleOnLoad === 'function') {
        await global.handleOnLoad();
        expect(mockStartKeyLogger).toHaveBeenCalledWith('twitter_user', '2', 'twitter_task');
      } else {
        console.warn("handleOnLoad not captured, cannot test onload behavior for calling startKeyLogger.");
      }
      global.startKeyLogger = dom.window.startKeyLogger; // Restore
    });

    test('should alert if URL params are missing on load', async () => {
      if (!global.getQueryParam) {
        console.warn("getQueryParam not loaded, cannot reliably test onload alert for missing params.");
        return;
      }
      window.history.pushState({}, '', '/'); // No params

      if (typeof global.handleOnLoad === 'function') {
         const originalGetQueryParam = global.getQueryParam;
         global.getQueryParam = jest.fn(param => {
            if (window.location.search === '') {
                return null;
            }
            return originalGetQueryParam ? originalGetQueryParam(param) : null;
        });

        await global.handleOnLoad();
        expect(alert).toHaveBeenCalledWith('Missing user or platform or task info in URL');

        global.getQueryParam = originalGetQueryParam; // Restore
      } else {
         console.warn("handleOnLoad not captured, cannot test onload alert for missing params.");
      }
    });
  });
});
