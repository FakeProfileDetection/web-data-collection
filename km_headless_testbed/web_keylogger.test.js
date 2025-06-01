import { JSDOM } from 'jsdom';
import { startKeyLogger } from './web_keylogger';

describe('startKeyLogger', () => {
  let dom;
  let mockDocument;
  let mockWindow;
  let mockAddEventListener;
  let mockCreateElement;
  let mockAppendChild;
  let mockRemoveChild;
  let mockButtonElement;
  let mockLinkElement;
  let originalDateNow;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost' });
    mockDocument = dom.window.document;
    mockWindow = dom.window;

    // Mock Date.now()
    originalDateNow = Date.now;
    Date.now = jest.fn(() => 1234567890); // Consistent timestamp

    // Mock global.Blob
    global.Blob = jest.fn((parts, options) => new mockWindow.Blob(parts, options));
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/mock-url');
    global.URL.revokeObjectURL = jest.fn();


    mockAddEventListener = jest.spyOn(mockDocument, 'addEventListener');

    mockButtonElement = mockDocument.createElement('button');
    jest.spyOn(mockButtonElement, 'click'); // Spy on click of this specific instance

    mockLinkElement = mockDocument.createElement('a');
    jest.spyOn(mockLinkElement, 'click'); // Spy on click of this specific instance
    jest.spyOn(mockLinkElement, 'setAttribute');


    mockCreateElement = jest.spyOn(mockDocument, 'createElement').mockImplementation(tagName => {
      if (tagName === 'button') {
        // Return the same button instance for consistent spying, already has style, etc.
        return mockButtonElement;
      }
      if (tagName === 'a') {
        return mockLinkElement;
      }
      // Fallback for any other elements, though not expected by this script
      return dom.window.document.createElement(tagName);
    });

    // Spy on appendChild and removeChild on the *specific JSDOM body instance*
    mockAppendChild = jest.spyOn(mockDocument.body, 'appendChild');
    mockRemoveChild = jest.spyOn(mockDocument.body, 'removeChild');

    // Clear msSaveBlob for most tests
    delete mockWindow.navigator.msSaveBlob;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Date.now = originalDateNow; // Restore original Date.now
    // Clean up JSDOM window properties if necessary
    delete global.Blob;
    delete global.URL.createObjectURL;
    delete global.URL.revokeObjectURL;
  });

  test('should attach keydown and keyup event listeners to the document', () => {
    startKeyLogger('test_user', '0', mockDocument);
    expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledTimes(2);
  });

  test('should create and append a download button', () => {
    const button = startKeyLogger('test_user', '0', mockDocument);
    expect(mockCreateElement).toHaveBeenCalledWith('button');
    expect(mockAppendChild).toHaveBeenCalledWith(button); // Check if the returned button was appended
    expect(button.textContent).toBe('Download Keylog');
  });

  test('should record key events and prepare CSV for download', async () => {
    const button = startKeyLogger('test_user_csv', '0', mockDocument); // Platform 'f'

    // Simulate key events by invoking the captured listeners
    const keyDownListener = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
    const keyUpListener = mockAddEventListener.mock.calls.find(call => call[0] === 'keyup')[1];

    keyDownListener({ key: 'a' }); // Simulate event object
    keyUpListener({ key: 'b' });

    button.onclick(); // Trigger the download process

    const expectedCsvString = 'Press or Release,Key,Time\nP,a,1234567890\nR,b,1234567890';
    expect(global.Blob).toHaveBeenCalledWith([expectedCsvString], { type: 'text/csv;charset=utf-8;' });

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockLinkElement.setAttribute).toHaveBeenCalledWith('href', 'blob:http://localhost/mock-url');
    expect(mockLinkElement.setAttribute).toHaveBeenCalledWith('download', 'f_test_user_csv.csv');
    expect(mockAppendChild).toHaveBeenCalledWith(mockLinkElement); // Link is appended
    expect(mockLinkElement.click).toHaveBeenCalled(); // Link is clicked
    expect(mockRemoveChild).toHaveBeenCalledWith(mockLinkElement); // Link is removed
  });

  test('should use correct filename for platform "i"', () => {
    const button = startKeyLogger('test_user_i', '1', mockDocument);
    button.onclick();
    expect(mockLinkElement.setAttribute).toHaveBeenCalledWith('download', 'i_test_user_i.csv');
  });

  test('should use correct filename for platform "t"', () => {
    const button = startKeyLogger('test_user_t', '2', mockDocument);
    button.onclick();
    expect(mockLinkElement.setAttribute).toHaveBeenCalledWith('download', 't_test_user_t.csv');
  });

  test('should use msSaveBlob for IE10+ if available', () => {
    mockWindow.navigator.msSaveBlob = jest.fn(); // Mock msSaveBlob for this test

    const button = startKeyLogger('test_user_ie', '0', mockDocument);
    button.onclick();

    expect(mockWindow.navigator.msSaveBlob).toHaveBeenCalled();
    const expectedCsvString = 'Press or Release,Key,Time'; // No key events simulated for this specific test
    expect(mockWindow.navigator.msSaveBlob).toHaveBeenCalledWith(expect.any(mockWindow.Blob), 'f_test_user_ie.csv');

    // Check Blob content passed to msSaveBlob (simplified)
    const blobInstance = mockWindow.navigator.msSaveBlob.mock.calls[0][0];
    // To check blob content, you might need a way to read it, which can be tricky with JSDOM's Blob.
    // For this test, expect.any(mockWindow.Blob) is often sufficient.
  });
});
