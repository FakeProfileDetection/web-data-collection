// utils/wasm-keystroke.js
import init, { KeystrokeCapture } from '../wasm-keystroke-capture/pkg/keystroke_capture.js';

class WASMKeystrokeManager {
  constructor() {
    this.initialized = false;
    this.initializing = false;
    this.capture = null;
    this.keyPressMap = new Map();
    this.pendingReleases = new Map(); // Track pending releases
    this.lastEventTime = 0;
    
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
    
    // Keys that can be held down
    this.modifierKeys = new Set(['Key.shift', 'Key.ctrl', 'Key.alt', 'Key.cmd', 'Key.caps_lock']);
  }

  async initialize() {
    if (this.initialized) {
      console.log('WASM already initialized');
      return;
    }
    
    if (this.initializing) {
      console.log('WASM initialization in progress...');
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
      
      // Test timing precision
      try {
        const timingTest = this.capture.test_timing_precision();
        console.log('✅ WASM keystroke capture initialized -', timingTest);
      } catch (e) {
        console.log('✅ WASM keystroke capture initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize WASM:', error);
      this.initialized = false;
      throw error;
    } finally {
      this.initializing = false;
    }
  }

  mapKey(key) {
    return this.keyMapping[key] || key;
  }

  isModifierKey(key) {
    return this.modifierKeys.has(key);
  }

  // Optimized for minimal timestamp capture latency
  captureKeyDown(event) {
      // Absolute minimum before WASM call
      const physicalCode = event.code;
      const displayKey = event.key;
      
      // Quick duplicate check
      if (this.keyPressMap.has(physicalCode)) {
          return;
      }
      
      // Map key quickly
      const mappedKey = this.keyMapping[displayKey] || displayKey;
      
      // CALL WASM IMMEDIATELY for timestamp capture
      if (this.initialized && this.capture) {
          try {
              this.capture.capture_keystroke(mappedKey, false);
              
              // Store mapping AFTER WASM call
              this.keyPressMap.set(physicalCode, {
                  key: mappedKey,
                  timestamp: performance.now() // This is just for our tracking
              });
              
              // Logging and pattern detection AFTER WASM capture
              console.log(`KeyDown: code=${physicalCode}, key=${displayKey}, mapped=${mappedKey}`);
              
              // Track event for pattern detection
              this.recentEvents.push({ type: 'P', key: mappedKey });
              if (this.recentEvents.length > 10) this.recentEvents.shift();
              
              // Process patterns AFTER capture
              if (!this.isModifierKey(mappedKey)) {
                  this.processPendingReleases();
              }
              
              this.detectBadPatterns();
              
          } catch (error) {
              console.error('Failed to capture keydown:', error);
          }
      }
  }

  captureKeyUp(event) {
      const physicalCode = event.code;
      const pressData = this.keyPressMap.get(physicalCode);
      
      if (!pressData) {
          return;
      }
      
      // CALL WASM IMMEDIATELY
      if (this.initialized && this.capture) {
          try {
              this.capture.capture_keystroke(pressData.key, true);
              
              // Everything else AFTER WASM call
              this.keyPressMap.delete(physicalCode);
              
              console.log(`KeyUp: code=${physicalCode}, key=${pressData.key}`);
              
              // Pattern detection after capture
              this.recentEvents.push({ type: 'R', key: pressData.key });
              if (this.recentEvents.length > 10) this.recentEvents.shift();
              
              if (!this.isModifierKey(pressData.key)) {
                  // Add to pending releases
                  this.pendingReleases.set(physicalCode, {
                      key: pressData.key,
                      timestamp: performance.now()
                  });
                  setTimeout(() => this.processPendingReleases(), 1);
              }
              
              this.detectBadPatterns();
              
          } catch (error) {
              console.error('Failed to capture keyup:', error);
          }
      }
  }

  processPendingReleases() {
    if (this.pendingReleases.size === 0) return;
    
    // Sort pending releases by timestamp
    const releases = Array.from(this.pendingReleases.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    for (const [code, data] of releases) {
      try {
        this.capture.capture_keystroke(data.key, true);
        this.lastEventTime = data.timestamp;
      } catch (error) {
        console.error('Failed to capture pending release:', error);
        this.handleWASMError(error);
      }
    }
    
    this.pendingReleases.clear();
  }

  handleWASMError(error) {
    if (error.message && (error.message.includes('unreachable') || error.message.includes('null'))) {
      console.error('WASM module corrupted, attempting recovery...');
      this.reset().catch(e => console.error('Failed to recover:', e));
    }
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
      // Process any remaining pending releases
      this.processPendingReleases();
      return this.capture.export_as_csv();
    } catch (error) {
      console.error('Failed to export CSV:', error);
      return '';
    }
  }

  getRawData() {
    if (!this.capture || !this.initialized) return [];
    try {
      // Process any remaining pending releases
      this.processPendingReleases();
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
    this.pendingReleases.clear();
    this.lastEventTime = 0;
  }
  
  getUnreleasedKeys() {
    return Array.from(this.keyPressMap.entries());
  }
  
  async reset() {
    console.log('Resetting WASM keystroke capture...');
    this.capture = null;
    this.initialized = false;
    this.initializing = false;
    this.keyPressMap.clear();
    this.pendingReleases.clear();
    this.lastEventTime = 0;
    await this.initialize();
  }
}

// Create a proper singleton
let instance = null;

export const wasmKeystrokeManager = {
  async initialize() {
    if (!instance) {
      instance = new WASMKeystrokeManager();
    }
    return instance.initialize();
  },
  
  captureKeyDown(event) {
    if (!instance) {
      console.error('WASM manager not initialized');
      return;
    }
    return instance.captureKeyDown(event);
  },
  
  captureKeyUp(event) {
    if (!instance) {
      console.error('WASM manager not initialized');
      return;
    }
    return instance.captureKeyUp(event);
  },
  
  getEventCount() {
    return instance ? instance.getEventCount() : 0;
  },
  
  exportAsCSV() {
    return instance ? instance.exportAsCSV() : '';
  },
  
  getRawData() {
    return instance ? instance.getRawData() : [];
  },
  
  clear() {
    if (instance) instance.clear();
  },
  
  getUnreleasedKeys() {
    return instance ? instance.getUnreleasedKeys() : [];
  },
  
  async reset() {
    if (instance) return instance.reset();
  }
};