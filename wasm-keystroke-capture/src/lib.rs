use wasm_bindgen::prelude::*;
use web_sys::{Performance, Window};

#[wasm_bindgen]
pub struct KeystrokeCapture {
    timestamps: Vec<f64>,
    keys: Vec<String>,
    event_types: Vec<u8>, // 0 for press, 1 for release
    capacity: usize,
}

#[wasm_bindgen]
impl KeystrokeCapture {
    #[wasm_bindgen(constructor)]
    pub fn new(capacity: usize) -> Result<KeystrokeCapture, JsValue> {
        // Just validate that we can access performance
        let window = web_sys::window()
            .ok_or_else(|| JsValue::from_str("No window object available"))?;
        let _ = window.performance()
            .ok_or_else(|| JsValue::from_str("No performance object available"))?;
        
        Ok(KeystrokeCapture {
            timestamps: Vec::with_capacity(capacity),
            keys: Vec::with_capacity(capacity),
            event_types: Vec::with_capacity(capacity),
            capacity,
        })
    }
    
    // Helper function to get performance.now()
    fn get_timestamp() -> Result<f64, JsValue> {
        let window = web_sys::window()
            .ok_or_else(|| JsValue::from_str("No window object available"))?;
        let performance = window.performance()
            .ok_or_else(|| JsValue::from_str("No performance object available"))?;
        Ok(performance.now())
    }
    
    #[wasm_bindgen]
    pub fn capture_keystroke(&mut self, key: String, is_release: bool) -> Result<(), JsValue> {
        if self.timestamps.len() >= self.capacity {
            return Err(JsValue::from_str("Capacity exceeded"));
        }
        
        // Get timestamp immediately when called
        let timestamp = Self::get_timestamp()?;
        
        self.timestamps.push(timestamp);
        self.keys.push(key);
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
            let timestamp = (self.timestamps[i] + 1735660000000.0) as u64;
            
            // Handle special characters
            let key = match self.keys[i].as_str() {
                "," => "Key.comma",
                k => k,
            };
            
            csv.push_str(&format!("{},{},{}\n", 
                event_type, 
                key, 
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
            
            // Handle comma
            let key = match self.keys[i].as_str() {
                "," => "Key.comma",
                k => k,
            };
            entry.push(&JsValue::from_str(key));
            
            entry.push(&JsValue::from_f64(self.timestamps[i] + 1735660000000.0));
            result.push(&entry);
        }
        
        Ok(result.into())
    }
    
    #[wasm_bindgen]
    pub fn get_last_10_events(&self) -> String {
        let start = if self.timestamps.len() > 10 { 
            self.timestamps.len() - 10 
        } else { 
            0 
        };
        
        let mut result = String::new();
        for i in start..self.timestamps.len() {
            let event_type = if self.event_types[i] == 0 { "P" } else { "R" };
            result.push_str(&format!("{} {} {:.0}\n", 
                event_type, 
                &self.keys[i], 
                self.timestamps[i]
            ));
        }
        result
    }
    
    // Debug method to check timing precision
    #[wasm_bindgen]
    pub fn test_timing_precision() -> Result<String, JsValue> {
        let mut times = Vec::new();
        for _ in 0..10 {
            times.push(Self::get_timestamp()?);
        }
        
        let mut deltas = Vec::new();
        for i in 1..times.len() {
            deltas.push(times[i] - times[i-1]);
        }
        
        let min_delta = deltas.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        let max_delta = deltas.iter().fold(0.0, |a, &b| a.max(b));
        
        Ok(format!("Timing test - Min delta: {:.3}ms, Max delta: {:.3}ms", min_delta, max_delta))
    }
}