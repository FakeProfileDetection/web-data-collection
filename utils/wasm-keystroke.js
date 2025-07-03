// utils/wasm-keystroke.js
import init, { KeystrokeCapture } from '../wasm-keystroke-capture/pkg/keystroke_capture.js';

class WASMKeystrokeManager {
  constructor() {
    this.initialized = false;
    this.initializing = false; // Prevent multiple init calls
    this.capture = null;
    this.keyPressMap = new Map();
    this.eventQueue = []; // Queue for ensuring order
    this.processing = false;
    
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
    if (this.initialized) {
      console.log('WASM already initialized, skipping');
      return;
    }
    
    if (this.initializing) {
      console.log('WASM initialization already in progress, waiting...');
      // Wait for initialization to complete
      while (this.initializing) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return;
    }
    
    this.initializing = true;
    
    try {
      await init();
      this.capture = new KeystrokeCapture(50000);
      this.initialized = true;
      console.log('✅ WASM keystroke capture initialized');
    } catch (error) {
      console.error('❌ Failed to initialize WASM:', error);
      throw error;
    } finally {
      this.initializing = false;
    }
  }

  mapKey(key) {
    return this.keyMapping[key] || key;
  }

  // Process events in order
  async processEventQueue() {
    if (this.processing || this.eventQueue.length === 0) return;
    
    this.processing = true;
    
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      
      try {
        if (event.type === 'down') {
          this.capture.capture_keystroke(event.key, false);
        } else {
          this.capture.capture_keystroke(event.key, true);
        }
      } catch (error) {
        console.error(`Failed to capture ${event.type}:`, error);
        // If WASM is corrupted, try to reinitialize
        if (error.message && error.message.includes('unreachable')) {
          console.error('WASM module corrupted, attempting recovery...');
          this.initialized = false;
          this.capture = null;
          try {
            await this.initialize();
          } catch (e) {
            console.error('Failed to recover WASM:', e);
          }
        }
      }
    }
    
    this.processing = false;
  }

  captureKeyDown(event) {
    const timestamp = performance.now();
    if (!this.initialized) {
      console.warn('WASM not initialized');
      return;
    }
    
    const physicalCode = event.code;
    const displayKey = event.key;
    const mappedKey = this.mapKey(displayKey);
    
    // Check if this key is already pressed (prevent duplicate press events)
    if (this.keyPressMap.has(physicalCode)) {
      console.log(`Ignoring duplicate keydown for ${physicalCode}`);
      return;
    }
    
    // Store the display key for this physical key
    this.keyPressMap.set(physicalCode, {
      key: mappedKey,
      timestamp: performance.now()
    });
    
    // Debug logging
    console.log(`KeyDown: code=${physicalCode}, key=${displayKey}, mapped=${mappedKey}`);
    
    // Queue the event
    this.eventQueue.push({
      type: 'down',
      key: mappedKey,
      code: physicalCode,
      timestamp: timestamp
    });
    
    // Process queue
    this.processEventQueue();
  }

  captureKeyUp(event) {
    const timestamp = performance.now();
    if (!this.initialized) {
      console.warn('WASM not initialized');
      return;
    }
    
    const physicalCode = event.code;
    
    // Get the stored key from when it was pressed
    const pressData = this.keyPressMap.get(physicalCode);
    
    if (!pressData) {
      console.warn(`No tracked press for code=${physicalCode}, ignoring release`);
      return;
    }
    
    const mappedKey = pressData.key;
    
    // Debug logging
    console.log(`KeyUp: code=${physicalCode}, stored=${mappedKey}, current=${event.key}`);
    
    // Remove from tracking
    this.keyPressMap.delete(physicalCode);
    
    // Queue the event
    this.eventQueue.push({
      type: 'up',
      key: mappedKey,
      code: physicalCode,
      timestamp: timestamp
    });
    
    // Process queue
    this.processEventQueue();
  }

  getEventCount() {
    if (!this.capture || !this.initialized) return 0;
    try {
      return this.capture.get_event_count();
    } catch (error) {
      console.error('Failed to get event count:', error);
      return 0;
    }
  }

  exportAsCSV() {
    if (!this.capture || !this.initialized) return '';
    try {
      return this.capture.export_as_csv();
    } catch (error) {
      console.error('Failed to export CSV:', error);
      return '';
    }
  }

  getRawData() {
    if (!this.capture || !this.initialized) return [];
    try {
      return this.capture.get_raw_data();
    } catch (error) {
      console.error('Failed to get raw data:', error);
      return [];
    }
  }

  clear() {
    if (this.capture && this.initialized) {
      try {
        this.capture.clear();
      } catch (error) {
        console.error('Failed to clear capture:', error);
      }
    }
    // Always clear JavaScript state
    this.keyPressMap.clear();
    this.eventQueue = [];
  }
  
  // Debug method to check for unreleased keys
  getUnreleasedKeys() {
    return Array.from(this.keyPressMap.entries());
  }
  
  // Reset the entire WASM module
  async reset() {
    console.log('Resetting WASM keystroke capture...');
    this.capture = null;
    this.initialized = false;
    this.keyPressMap.clear();
    this.eventQueue = [];
    await this.initialize();
  }
}

// Export singleton instance
let wasmKeystrokeManagerInstance = null;

export const wasmKeystrokeManager = {
  async initialize() {
    if (!wasmKeystrokeManagerInstance) {
      wasmKeystrokeManagerInstance = new WASMKeystrokeManager();
    }
    return wasmKeystrokeManagerInstance.initialize();
  },
  
  captureKeyDown(event) {
    if (!wasmKeystrokeManagerInstance) return;
    return wasmKeystrokeManagerInstance.captureKeyDown(event);
  },
  
  captureKeyUp(event) {
    if (!wasmKeystrokeManagerInstance) return;
    return wasmKeystrokeManagerInstance.captureKeyUp(event);
  },
  
  getEventCount() {
    if (!wasmKeystrokeManagerInstance) return 0;
    return wasmKeystrokeManagerInstance.getEventCount();
  },
  
  exportAsCSV() {
    if (!wasmKeystrokeManagerInstance) return '';
    return wasmKeystrokeManagerInstance.exportAsCSV();
  },
  
  getRawData() {
    if (!wasmKeystrokeManagerInstance) return [];
    return wasmKeystrokeManagerInstance.getRawData();
  },
  
  clear() {
    if (!wasmKeystrokeManagerInstance) return;
    return wasmKeystrokeManagerInstance.clear();
  },
  
  getUnreleasedKeys() {
    if (!wasmKeystrokeManagerInstance) return [];
    return wasmKeystrokeManagerInstance.getUnreleasedKeys();
  },
  
  async reset() {
    if (!wasmKeystrokeManagerInstance) return;
    return wasmKeystrokeManagerInstance.reset();
  }
};