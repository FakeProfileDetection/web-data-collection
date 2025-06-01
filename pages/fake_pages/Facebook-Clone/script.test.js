import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Polyfill setImmediate for JSDOM's FileReader if not present
if (typeof setImmediate === 'undefined') {
  global.setImmediate = (callback, ...args) => setTimeout(callback, 0, ...args);
}

// Mock global fetch
global.fetch = jest.fn();

// JSDOM setup
const htmlPath = path.join(__dirname, 'index.html'); // Ensure index.html is in the same directory
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');


describe('Facebook-Clone Script Tests', () => {
  let dom;
  let mockDocument;
  let mockWindow;
  let mockAddEventListener;
  let mockAlert;
  let mockFetch;
  let virtualConsole;
  let originalWindowDateNow; // To store JSDOM's original Date.now

  const loadScript = () => {
    const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');
    // Prevent original window.onload from running automatically if it exists in the raw script
    const modifiedScriptContent = scriptContent.replace(/window\.onload\s*=\s*.*?;/is, '');
    new dom.window.Function(modifiedScriptContent)(); // Execute script in JSDOM global scope
  };

  beforeEach(() => {
    // Create VirtualConsole instance first
    virtualConsole = new VirtualConsole();
    virtualConsole.on("error", (error) => {
      // Suppress JSDOM "Could not load" errors for external resources
      if (error && error.message && !error.message.includes("Could not load")) {
        // console.error('JSDOM Error:', error.message, error.detail); // Keep for debugging if needed
      }
    });

    // Initialize dom WITH the virtualConsole
    dom = new JSDOM(htmlContent, {
        url: 'http://localhost/?user_id=123&platform_id=0&task_id=abc',
        runScripts: "dangerously",
        resources: "usable",
        virtualConsole // Pass the configured virtualConsole
    });
    mockDocument = dom.window.document;
    mockWindow = dom.window;

    // Make JSDOM globals available to Jest's global scope
    global.document = mockDocument;
    global.window = mockWindow;
    global.URLSearchParams = mockWindow.URLSearchParams;
    global.Blob = mockWindow.Blob; // Use JSDOM's Blob
    global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/mock-url');
    global.URL.revokeObjectURL = jest.fn();
    mockAlert = jest.spyOn(mockWindow, 'alert').mockImplementation(() => {}); // Spy on window.alert

    // Mock JSDOM's Date.now specifically
    originalWindowDateNow = mockWindow.Date.now; // Store JSDOM's original Date.now
    mockWindow.Date.now = jest.fn(() => 12345); // Mock JSDOM's Date.now

    // Reset and mock fetch for each test
    mockFetch = jest.fn().mockResolvedValue({ // Use jest.fn() directly for mockFetch
      ok: true,
      json: () => Promise.resolve({ url: 'http://fake-url.com/file.csv' }),
    });
    mockWindow.fetch = mockFetch; // Assign to JSDOM window

    // Spy on document methods AFTER JSDOM is initialized
    mockAddEventListener = jest.spyOn(mockDocument, 'addEventListener');

    // Load the script after setting up mocks and JSDOM
    loadScript();
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restores all spies and original implementations
    if (originalWindowDateNow) {
      mockWindow.Date.now = originalWindowDateNow; // Restore JSDOM's Date.now
    }
  });

  describe('settingsMenuToggle', () => {
    test('should toggle setting_menu_height class on setting_menu element', () => {
      const menu = mockDocument.querySelector('.setting_menu');
      expect(menu.classList.contains('setting_menu_height')).toBe(false);
      mockWindow.FacebookCloneScript.settingsMenuToggle();
      expect(menu.classList.contains('setting_menu_height')).toBe(true);
      mockWindow.FacebookCloneScript.settingsMenuToggle();
      expect(menu.classList.contains('setting_menu_height')).toBe(false);
    });
  });

  describe('getQueryParam', () => {
    test('should return the correct query parameter value', () => {
      expect(mockWindow.FacebookCloneScript.getQueryParam('user_id')).toBe('123');
      expect(mockWindow.FacebookCloneScript.getQueryParam('platform_id')).toBe('0');
      expect(mockWindow.FacebookCloneScript.getQueryParam('task_id')).toBe('abc');
      expect(mockWindow.FacebookCloneScript.getQueryParam('non_existent')).toBeNull();
    });
  });

  describe('replaceJsKey', () => {
    test('should replace special key names correctly', () => {
      expect(mockWindow.FacebookCloneScript.replaceJsKey('Shift')).toBe('Key.shift');
      expect(mockWindow.FacebookCloneScript.replaceJsKey(' ')).toBe('Key.space');
      expect(mockWindow.FacebookCloneScript.replaceJsKey('ArrowLeft')).toBe('Key.left');
      expect(mockWindow.FacebookCloneScript.replaceJsKey('a')).toBe('a');
    });
  });

  describe('startKeyLogger', () => {
    beforeEach(() => {
      // Ensure the elements startKeyLogger depends on are in the JSDOM
      // The main htmlContent should already include these.
      // If not, they'd need to be added here.
      // e.g. mockDocument.body.innerHTML += '<input id="input_value"><button id="button_value">';
      // Re-run part of loadScript that querySelectors globals, if they are not found.
      // This is tricky. The script's global `let btnGet = ...` runs when Function is invoked.
      // We need to ensure it finds the elements.
      if (!mockWindow.btnGet && mockDocument.getElementById('button_value')) {
          mockWindow.btnGet = mockDocument.getElementById('button_value');
      }
       if (!mockWindow.inputGet && mockDocument.getElementById('input_value')) { // Corrected typo from input_vlaue
          mockWindow.inputGet = mockDocument.getElementById('input_value');
      }
    });

    test('should attach keydown and keyup event listeners', () => {
      mockWindow.FacebookCloneScript.startKeyLogger('user1', '0', 'task1');
      expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
    });

    test('should collect key events and upload on button click', async () => {
      // Date.now is now mocked in beforeEach for JSDOM's window

      mockWindow.FacebookCloneScript.startKeyLogger('user1', '0', 'task1');

      const inputEl = mockDocument.getElementById('input_value');
      inputEl.value = 't'.repeat(201); // Meet length requirement

      const keyDownListener = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
      const keyUpListener = mockAddEventListener.mock.calls.find(call => call[0] === 'keyup')[1];

      keyDownListener({ key: 'a' });
      keyUpListener({ key: 'b' });

      // btnGet should be initialized globally by the script execution in loadScript
      expect(mockWindow.btnGet).toBeDefined();
      await mockWindow.btnGet.onclick();

      expect(mockFetch).toHaveBeenCalledTimes(2); // For CSV and TXT

      const expectedCsvContent = 'Press or Release,Key,Time\nP,a,12345\nR,b,12345';
      const firstCallArgs = mockFetch.mock.calls[0]; // First call is to Netlify saver
      const formDataCsvFile = firstCallArgs[1].body.get('file'); // Access .body.get
      expect(formDataCsvFile.name).toBe('f_user1_task1.csv');
      // Read file content using FileReader for JSDOM compatibility
      const csvText = await new Promise((resolve, reject) => {
        const reader = new dom.window.FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(formDataCsvFile);
      });
      expect(csvText).toBe(expectedCsvContent);

      const secondCallArgs = mockFetch.mock.calls[1];
      const formDataTxtFile = secondCallArgs[1].body.get('file'); // Access .body.get
      expect(formDataTxtFile.name).toBe('f_user1_task1_raw.txt');
      const txtText = await new Promise((resolve, reject) => {
        const reader = new dom.window.FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(formDataTxtFile);
      });
      expect(txtText).toBe(inputEl.value);
    });

    test('should alert if post is empty', async () => {
        mockWindow.FacebookCloneScript.startKeyLogger('user1', '0', 'task1');
        mockDocument.getElementById('input_value').value = ''; // Empty post

        // Simulate key events to ensure keyEvents array is not empty
        const keyDownListener = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
        const keyUpListener = mockAddEventListener.mock.calls.find(call => call[0] === 'keyup')[1];
        if (keyDownListener) keyDownListener({ key: 'a' }); // Simulate a key press
        if (keyUpListener) keyUpListener({ key: 'a' });     // Simulate a key release


        await mockWindow.btnGet.onclick();

        expect(mockAlert).toHaveBeenCalledWith('Empty posts are not allowed!');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should alert if post is too short', async () => {
        mockWindow.FacebookCloneScript.startKeyLogger('user1', '0', 'task1');

        // Simulate at least one key event so keyEvents array is not empty
        const keyDownListener = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
        if (keyDownListener) keyDownListener({ key: 's' });

        mockDocument.getElementById('input_value').value = 'short';

        await mockWindow.btnGet.onclick();

        expect(mockAlert).toHaveBeenCalledWith('posts shorter than 200 chars are not allowed!');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should handle fetch error during upload', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            statusText: 'Simulated network error',
            json: () => Promise.resolve({ error: 'Simulated fetch error details' })
        });
        // Spy on JSDOM's window console
        const consoleErrorSpy = jest.spyOn(mockWindow.console, 'error').mockImplementation(() => {});

        mockWindow.FacebookCloneScript.startKeyLogger('user1', '0', 'task1');
        mockDocument.getElementById('input_value').value = 't'.repeat(201);

        // Simulate key events to ensure keyEvents array is not empty for this test
        const keyDownListener = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
        const keyUpListener = mockAddEventListener.mock.calls.find(call => call[0] === 'keyup')[1];
        if (keyDownListener) keyDownListener({ key: 'x' });
        if (keyUpListener) keyUpListener({ key: 'x' });

        await mockWindow.btnGet.onclick();

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy.mock.calls[0][0]).toBe('❌ Upload failed:');
        expect(consoleErrorSpy.mock.calls[0][1]).toHaveProperty('message'); // Check if it's error-like
        expect(consoleErrorSpy.mock.calls[0][1].message).toBe('Simulated fetch error details'); // From the mock
        expect(mockWindow.btnGet.disabled).toBe(false);
    });
  });

  describe('initializeFacebookPage (onload behavior)', () => {
    test('should call startKeyLogger with params from URL if present', async () => {
      // Spy on startKeyLogger before calling initialize
      const startKeyLoggerSpy = jest.spyOn(mockWindow.FacebookCloneScript, 'startKeyLogger');

      await mockWindow.FacebookCloneScript.initializeFacebookPage();

      expect(startKeyLoggerSpy).toHaveBeenCalledWith('123', '0', 'abc');
    });

    test('should alert if URL params are missing', async () => {
      // Change URL for this specific test
      dom.reconfigure({ url: 'http://localhost/' });
      // Re-run script loading and initialization in the new URL context
      loadScript(); // This will re-evaluate the script, making getQueryParam use the new URL.
                    // And it re-attaches initializeFacebookPage to mockWindow.FacebookCloneScript

      await mockWindow.FacebookCloneScript.initializeFacebookPage();
      expect(mockAlert).toHaveBeenCalledWith('Missing user or platform or task info in URL');
    });
  });
});
