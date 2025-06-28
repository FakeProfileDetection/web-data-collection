// utils/wasm-keystroke.js
import init, { KeystrokeCapture } from '../wasm-keystroke-capture/pkg/keystroke_capture.js';

class WASMKeystrokeManager {
  constructor() {
    this.initialized = false;
    this.capture = null;
    // Map physical keys to their display values at press time
    this.keyPressMap = new Map();
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
      ' ': 'Key.space',
      ',': 'Key.comma'
    };
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      await init();
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

  captureKeyDown(event) {
    if (!this.initialized) {
      console.warn('WASM not initialized');
      return;
    }
    
    const physicalCode = event.code; // e.g., "KeyH"
    const displayKey = event.key;    // e.g., "H" or "h"
    const mappedKey = this.mapKey(displayKey);
    
    // Store the display key for this physical key
    this.keyPressMap.set(physicalCode, mappedKey);
    
    // Debug logging
    console.log(`KeyDown: code=${physicalCode}, key=${displayKey}, mapped=${mappedKey}`);
    
    try {
      this.capture.capture_keystroke(mappedKey, false);
    } catch (error) {
      console.error('Failed to capture keydown:', error);
    }
  }

  captureKeyUp(event) {
    if (!this.initialized) {
      console.warn('WASM not initialized');
      return;
    }
    
    const physicalCode = event.code;
    
    // Get the stored key from when it was pressed
    const mappedKey = this.keyPressMap.get(physicalCode);
    
    if (!mappedKey) {
      // Fallback if we didn't track the press
      console.warn(`No tracked press for code=${physicalCode}, using current key=${event.key}`);
      const fallbackKey = this.mapKey(event.key);
      
      try {
        this.capture.capture_keystroke(fallbackKey, true);
      } catch (error) {
        console.error('Failed to capture keyup:', error);
      }
      return;
    }
    
    // Debug logging
    console.log(`KeyUp: code=${physicalCode}, stored=${mappedKey}, current=${event.key}`);
    
    // Remove from tracking
    this.keyPressMap.delete(physicalCode);
    
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
    // Also clear the key press map
    this.keyPressMap.clear();
  }
  
  // Debug method to check for unreleased keys
  getUnreleasedKeys() {
    return Array.from(this.keyPressMap.entries());
  }
}

// Export singleton instance
export const wasmKeystrokeManager = new WASMKeystrokeManager();