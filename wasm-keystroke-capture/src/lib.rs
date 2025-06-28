use wasm_bindgen::prelude::*;
use web_sys::{Performance, Window};

#[wasm_bindgen]
pub struct KeystrokeCapture {
    timestamps: Vec<f64>,
    keys: Vec<String>,
    event_types: Vec<u8>, // 0 for press, 1 for release
    capacity: usize,
    performance: Performance,
}

#[wasm_bindgen]
impl KeystrokeCapture {
    #[wasm_bindgen(constructor)]
    pub fn new(capacity: usize) -> Result<KeystrokeCapture, JsValue> {
        // Get window and performance objects
        let window = web_sys::window()
            .ok_or_else(|| JsValue::from_str("No window object available"))?;
        let performance = window.performance()
            .ok_or_else(|| JsValue::from_str("No performance object available"))?;
        
        Ok(KeystrokeCapture {
            timestamps: Vec::with_capacity(capacity),
            keys: Vec::with_capacity(capacity),
            event_types: Vec::with_capacity(capacity),
            capacity,
            performance,
        })
    }
    
    #[wasm_bindgen]
    pub fn capture_keystroke(&mut self, key: &str, is_release: bool) -> Result<(), JsValue> {
        if self.timestamps.len() >= self.capacity {
            return Err(JsValue::from_str("Capacity exceeded"));
        }
        
        // Capture timestamp immediately in WASM context
        let timestamp = self.performance.now();
        
        self.timestamps.push(timestamp);
        self.keys.push(key.to_string());
        self.event_types.push(if is_release { 1 } else { 0 });
        
        Ok(())
    }
    
    #[wasm_bindgen]
    pub fn get_event_count(&self) -> usize {
        self.timestamps.len()
    }
    
    #[wasm_bindgen]
    pub fn export_as_csv(&self) -> String {
        let mut csv = String::from("Press or Release,Key,Time\n");
        
        for i in 0..self.timestamps.len() {
            let event_type = if self.event_types[i] == 0 { "P" } else { "R" };
            let timestamp = (self.timestamps[i] + 1735660000000.0) as u64; // Adjust base time
            csv.push_str(&format!("{},{},{}\n", 
                event_type, 
                self.keys[i], 
                timestamp
            ));
        }
        
        csv
    }
    
    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.timestamps.clear();
        self.keys.clear();
        self.event_types.clear();
    }
    
    #[wasm_bindgen]
    pub fn get_raw_data(&self) -> Result<JsValue, JsValue> {
        let result = js_sys::Array::new();
        
        for i in 0..self.timestamps.len() {
            let entry = js_sys::Array::new();
            entry.push(&JsValue::from_str(if self.event_types[i] == 0 { "P" } else { "R" }));
            entry.push(&JsValue::from_str(&self.keys[i]));
            entry.push(&JsValue::from_f64(self.timestamps[i] + 1735660000000.0));
            result.push(&entry);
        }
        
        Ok(result.into())
    }
}

