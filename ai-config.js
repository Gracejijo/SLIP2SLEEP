// AI configuration scaffold for Roboflow API
// Fill in your Roboflow API details below

window.AI_CONFIG = {
  enabled: true, // set to true to use AI, false to fallback to heuristic
  providerName: 'roboflow',
  // Choose task: 'classify' or 'detect'
  task: 'classify',
  // Roboflow classify/detect endpoints (have CORS enabled)
  classifyEndpoint: 'https://classify.roboflow.com',
  detectEndpoint: 'https://detect.roboflow.com',
  apiKey: 'fHlK7HfLPzNuCUL4S5FE',   // INSERT YOUR ROBOFLOW API KEY HERE
  // Default Roboflow model and version
  projectName: 'slip-fall-detection', // Your default Roboflow model name
  modelVersion: '1', // Your model version number
  // Optional: you can override per type
  surfaceModel: undefined, // e.g., 'surface-classifier'
  surfaceVersion: undefined, // e.g., '2'
  objectModel: undefined, // e.g., 'object-classifier'
  objectVersion: undefined, // e.g., '3'
  // Optional: extra headers
  headers: {},
  // Map Roboflow response to a standard shape
  // Normalized result shape: { label: string, confidence: number }
  responseMapper: function (raw) {
    // Roboflow classify/detect response often includes predictions array; fallback to top
    if (!raw) return { label: 'unknown', confidence: 0 };
    let label = 'unknown';
    let confidence = 0;
    if (Array.isArray(raw.predictions) && raw.predictions.length > 0) {
      const p = raw.predictions[0];
      label = p.class || p.label || 'unknown';
      confidence = p.confidence || 0;
    } else if (raw.top) {
      label = raw.top.class || 'unknown';
      confidence = raw.top.confidence || 0;
    }
    return { label, confidence };
  }
};
