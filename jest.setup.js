// Polyfill for TextEncoder and TextDecoder if not available
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// Mock for localStorage if not available (e.g. in Node environment)
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
}

// Mock for navigator.msSaveBlob if not available
if (typeof navigator.msSaveBlob === 'undefined') {
  global.navigator.msSaveBlob = jest.fn();
}

// Mock for URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();
