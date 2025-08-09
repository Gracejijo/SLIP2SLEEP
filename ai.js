// AI Helper Module for Roboflow API Integration
class AIHelper {
    constructor() {
        this.config = window.AI_CONFIG || {};
        this.roboflowApiKey = this.config.apiKey || '';
        this.classifyEndpoint = this.config.classifyEndpoint || 'https://classify.roboflow.com';
        this.detectEndpoint = this.config.detectEndpoint || 'https://detect.roboflow.com';
        this.projectName = this.config.projectName || 'slip-fall-detection';
        this.modelVersion = this.config.modelVersion || '1';
        this.task = this.config.task || 'classify';
    }

    // Set Roboflow API key
    setApiKey(apiKey) {
        this.roboflowApiKey = apiKey;
        console.log('Roboflow API key configured');
    }

    // Convert image to base64
    imageToBase64(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    }

    // Analyze image using Roboflow API
    async analyzeWithRoboflow(img, type) {
        if (!this.roboflowApiKey) {
            throw new Error('Roboflow API key not configured. Use AIHelper.setApiKey() first.');
        }

        const base64Image = this.imageToBase64(img);
        
        // Determine model details per type (allow override), and endpoint
        const model = (type === 'surface' ? (this.config.surfaceModel || this.projectName) : (this.config.objectModel || this.projectName));
        const version = (type === 'surface' ? (this.config.surfaceVersion || this.modelVersion) : (this.config.objectVersion || this.modelVersion));
        const base = this.task === 'detect' ? this.detectEndpoint : this.classifyEndpoint;
        // Roboflow classify/detect endpoint expects GET/POST with query params
        // We'll POST the image as base64 via multipart or JSON depending on task
        const apiUrl = `${base}/${model}/${version}?api_key=${encodeURIComponent(this.roboflowApiKey)}`;
        
        // For classify: send base64 as raw body; for detect: we can send multipart
        const isDetect = this.task === 'detect';
        let fetchOptions;
        if (isDetect) {
            const formData = new FormData();
            formData.append('image', this.base64ToBlob(base64Image), 'image.jpg');
            fetchOptions = { method: 'POST', body: formData };
        } else {
            // classify accepts image=BASE64 or base64 raw body; we use JSON with 'base64' key
            fetchOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ base64: base64Image })
            };
        }

        try {
            const response = await fetch(apiUrl, fetchOptions);

            if (!response.ok) {
                throw new Error(`Roboflow API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return this.processRoboflowResponse(data, type);
        } catch (error) {
            console.error('Roboflow API error:', error);
            throw error;
        }
    }

    // Convert base64 to blob for Roboflow API
    base64ToBlob(base64) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: 'image/jpeg' });
    }

    // Get classification examples based on type
    getExamplesForType(type) {
        if (type === 'surface') {
            return [
                { text: "concrete floor", label: "concrete" },
                { text: "wooden floor", label: "wood" },
                { text: "tile floor", label: "tile" },
                { text: "carpet", label: "carpet" },
                { text: "ice surface", label: "ice" },
                { text: "wet floor", label: "wet" },
                { text: "asphalt", label: "asphalt" },
                { text: "marble floor", label: "marble" },
                { text: "grass", label: "grass" },
                { text: "sand", label: "sand" }
            ];
        } else {
            return [
                { text: "rubber shoes", label: "rubber" },
                { text: "leather shoes", label: "leather" },
                { text: "plastic shoes", label: "plastic" },
                { text: "metal object", label: "metal" },
                { text: "wooden object", label: "wood" },
                { text: "glass object", label: "glass" },
                { text: "fabric", label: "fabric" },
                { text: "ceramic", label: "ceramic" },
                { text: "stone", label: "stone" },
                { text: "paper", label: "paper" }
            ];
        }
    }

    // Process Roboflow API response
    processRoboflowResponse(data, type) {
        if (!data.predictions || data.predictions.length === 0) {
            return { label: 'unknown', confidence: 0 };
        }

        const prediction = data.predictions[0]; // Get highest confidence prediction
        const label = prediction.class || prediction.label;
        const confidence = prediction.confidence || 0;

        // Use AI-detected label directly, don't force into predefined categories
        // Let the AI model determine what it actually sees
        const frictionCoefficient = this.calculateFrictionFromLabel(label, type, confidence);

        return {
            label: label,
            confidence: confidence,
            frictionCoefficient: frictionCoefficient,
            displayName: this.getDisplayNameFromAI(label, type, confidence)
        };
    }

    // Calculate friction based on AI-detected label and confidence
    calculateFrictionFromLabel(label, type, confidence) {
        // Base friction values for common materials (MADE MORE DEADLY)
        const baseFrictions = {
            surface: {
                'concrete': 0.4, 'asphalt': 0.3, 'wood': 0.2, 'carpet': 0.5,
                'tile': 0.1, 'marble': 0.05, 'ice': 0.02, 'wet': 0.08,
                'grass': 0.2, 'sand': 0.3, 'smooth': 0.08, 'rough': 0.3,
                'polished': 0.05, 'textured': 0.2
            },
            object: {
                'rubber': 0.3, 'leather': 0.2, 'plastic': 0.1, 'metal': 0.05,
                'wood': 0.2, 'glass': 0.02, 'fabric': 0.3, 'ceramic': 0.05,
                'stone': 0.2, 'paper': 0.05, 'smooth': 0.08, 'rough': 0.2,
                'textured': 0.15, 'slippery': 0.02, 'grippy': 0.3
            }
        };

        // Try to match the AI label to known friction values
        const labelLower = label.toLowerCase();
        const frictionMap = baseFrictions[type] || {};
        
        // Look for exact matches first
        if (frictionMap[labelLower]) {
            return frictionMap[labelLower];
        }

        // Look for partial matches (e.g., "rubber_shoe" matches "rubber")
        for (const [key, value] of Object.entries(frictionMap)) {
            if (labelLower.includes(key) || key.includes(labelLower)) {
                return value;
            }
        }

        // If no match found, use confidence to estimate friction (MORE DEADLY)
        // Higher confidence = more certain about the material = use more extreme friction
        const baseFriction = type === 'surface' ? 0.15 : 0.1; // Lower base friction
        const confidenceMultiplier = 0.3 + (confidence * 0.4); // 0.3 to 0.7 range (more deadly)
        
        return baseFriction * confidenceMultiplier;
    }

    // Get display name based on AI detection
    getDisplayNameFromAI(label, type, confidence) {
        const labelLower = label.toLowerCase();
        
        // Add emojis and descriptions based on what the AI detected
        const emojiMap = {
            // Surfaces
            'concrete': '🧱', 'asphalt': '🛣️', 'wood': '🪵', 'carpet': '🟫',
            'tile': '🧱', 'marble': '✨', 'ice': '🧊', 'wet': '💧',
            'grass': '🌱', 'sand': '🏖️', 'smooth': '✨', 'rough': '🪨',
            'polished': '✨', 'textured': '🔲',
            // Objects
            'rubber': '🔴', 'leather': '🟤', 'plastic': '🔵', 'metal': '⚙️',
            'wood': '🪵', 'glass': '🥃', 'fabric': '🧺', 'ceramic': '🏺',
            'stone': '🪨', 'paper': '📄', 'smooth': '✨', 'rough': '🪨',
            'textured': '🔲', 'slippery': '💧', 'grippy': '🔴'
        };

        const emoji = emojiMap[labelLower] || '🔍';
        const confidenceText = confidence > 0.8 ? ' (High Confidence)' : 
                              confidence > 0.6 ? ' (Medium Confidence)' : 
                              confidence > 0.4 ? ' (Low Confidence)' : ' (Uncertain)';
        
        return `${emoji} ${label.charAt(0).toUpperCase() + label.slice(1)}${confidenceText}`;
    }

    // Fallback to heuristic analysis if AI fails
    fallbackAnalysis(img, type) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        if (type === 'surface') {
            return this.analyzeSurfaceHeuristic(data);
        } else {
            return this.analyzeObjectHeuristic(data);
        }
    }

    // Heuristic surface analysis
    analyzeSurfaceHeuristic(data) {
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            totalBrightness += brightness;
        }
        const avgBrightness = totalBrightness / (data.length / 4);
        
        let surfaceType = '';
        let frictionCoefficient = 0.15; // Lower default
        
        if (avgBrightness < 50) {
            frictionCoefficient = 0.3; // Was 0.8
            surfaceType = 'Dark Surface (Concrete/Rough)';
        } else if (avgBrightness < 100) {
            frictionCoefficient = 0.2; // Was 0.5
            surfaceType = 'Medium Surface (Asphalt/Wood)';
        } else if (avgBrightness < 150) {
            frictionCoefficient = 0.1; // Was 0.3
            surfaceType = 'Light Surface (Tile/Smooth)';
        } else {
            frictionCoefficient = 0.05; // Was 0.1
            surfaceType = 'Slippery Surface (Ice/Wet)';
        }
        
        return {
            label: 'heuristic',
            confidence: 0.5,
            frictionCoefficient: frictionCoefficient,
            displayName: surfaceType
        };
    }

    // Heuristic object analysis
    analyzeObjectHeuristic(data) {
        let redSum = 0, greenSum = 0, blueSum = 0;
        for (let i = 0; i < data.length; i += 4) {
            redSum += data[i];
            greenSum += data[i + 1];
            blueSum += data[i + 2];
        }
        
        const avgRed = redSum / (data.length / 4);
        const avgGreen = greenSum / (data.length / 4);
        const avgBlue = blueSum / (data.length / 4);
        
        let objectType = '';
        let frictionCoefficient = 0.1; // Lower default
        
        if (avgRed > avgGreen && avgRed > avgBlue) {
            frictionCoefficient = 0.08; // Was 0.24
            objectType = 'Reddish Object (Smooth/Rubber)';
        } else if (avgBlue > avgRed && avgBlue > avgGreen) {
            frictionCoefficient = 0.12; // Was 0.36
            objectType = 'Bluish Object (Rough/Textured)';
        } else if (avgGreen > avgRed && avgGreen > avgBlue) {
            frictionCoefficient = 0.11; // Was 0.33
            objectType = 'Greenish Object (Medium Grip)';
        } else {
            frictionCoefficient = 0.1; // Lower default
            objectType = 'Neutral Object (Standard Grip)';
        }
        
        return {
            label: 'heuristic',
            confidence: 0.5,
            frictionCoefficient: frictionCoefficient,
            displayName: objectType
        };
    }
}

// Make AIHelper globally available
window.AIHelper = AIHelper;
