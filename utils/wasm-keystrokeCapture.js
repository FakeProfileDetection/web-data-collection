// utils/wasm-keystroke.js
import init, { KeystrokeCapture } from '../wasm-keystroke-capture/pkg/keystroke_capture.js';

class WASMKeystrokeManager {
  constructor() {
    this.initialized = false;
    this.capture = null;
    this.keyMapping = {
      'Shift': 'Key.shift',
      'Control': 'Key.ctrl',
      'Alt': 'Key.alt',
      'Meta': 'Key.cmd',
      'Enter': 'Key.enter',
      'Backspace': 'Key.backspace',
      'Escape': 'Key.esc',
      'Tab': 'Key.tab',
      'ArrowLeft': 'Key.left',
      'ArrowRight': 'Key.right',
      'ArrowUp': 'Key.up',
      'ArrowDown': 'Key.down',
      'CapsLock': 'Key.caps_lock',
      ' ': 'Key.space'
    };
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Initialize WASM module
      await init();
      
      // Create capture instance with 50k capacity
      this.capture = new KeystrokeCapture(50000);
      this.initialized = true;
      
      console.log('✅ WASM keystroke capture initialized');
    } catch (error) {
      console.error('❌ Failed to initialize WASM:', error);
      throw error;
    }
  }

  mapKey(key) {
    return this.keyMapping[key] || key;
  }

  captureKeyDown(key) {
    if (!this.initialized) {
      console.warn('WASM not initialized');
      return;
    }
    
    const mappedKey = this.mapKey(key);
    try {
      this.capture.capture_keystroke(mappedKey, false);
    } catch (error) {
      console.error('Failed to capture keydown:', error);
    }
  }

  captureKeyUp(key) {
    if (!this.initialized) {
      console.warn('WASM not initialized');
      return;
    }
    
    const mappedKey = this.mapKey(key);
    try {
      this.capture.capture_keystroke(mappedKey, true);
    } catch (error) {
      console.error('Failed to capture keyup:', error);
    }
  }

  getEventCount() {
    return this.capture ? this.capture.get_event_count() : 0;
  }

  exportAsCSV() {
    if (!this.capture) return '';
    return this.capture.export_as_csv();
  }

  getRawData() {
    if (!this.capture) return [];
    try {
      return this.capture.get_raw_data();
    } catch (error) {
      console.error('Failed to get raw data:', error);
      return [];
    }
  }

  clear() {
    if (this.capture) {
      this.capture.clear();
    }
  }
}

// Export singleton instance
export const wasmKeystrokeManager = new WASMKeystrokeManager();

