# 🚀 AI Setup Guide for Slip & Fall Calculator

## 🔑 Setting up Roboflow API

### Step 1: Get Roboflow API Key
1. Go to [Roboflow Console](https://app.roboflow.com/)
2. Sign up or log in to your account
3. Navigate to Account Settings → API Keys
4. Create a new API key or copy existing one
5. Copy your API key

### Step 2: Configure Your Project
1. **Update `ai-config.js`** with your Roboflow details:
   ```javascript
   apiKey: 'YOUR_ROBOFLOW_API_KEY_HERE',
   projectName: 'your-project-name', // Your Roboflow project name
   modelVersion: '1', // Your model version number
   ```

2. **Or use browser console** (F12):
   ```javascript
   setRoboflowApiKey("your-roboflow-api-key-here")
   ```

Replace `"your-roboflow-api-key-here"` with your actual Roboflow API key.

### Step 3: Test AI Analysis
1. Upload a surface image (floor, tile, concrete, etc.)
2. Upload an object image (shoes, object, etc.)
3. Enter weight and height
4. Click "CALCULATE FALL SPEED"

## 🎯 AI Features

The AI system now uses **actual AI detection** from your Roboflow model instead of predetermined classifications. This means:

### 🔍 **Dynamic Object Detection**
- The AI identifies whatever objects your model is trained to recognize
- No predetermined categories - works with any Roboflow model
- Shows confidence levels for each detection
- Automatically calculates friction based on detected materials

### 📊 **How It Works**
1. **Upload Image** → AI analyzes the image using your Roboflow model
2. **AI Detection** → Model returns actual detected objects/materials
3. **Friction Calculation** → System matches detected labels to friction values
4. **Confidence Display** → Shows how certain the AI is about the detection

### 🎯 **Expected AI Labels**
Your Roboflow model can detect any objects, but common useful labels include:

#### **Surfaces** (for surface images):
- `concrete`, `asphalt`, `wood`, `carpet`, `tile`, `marble`
- `ice`, `wet`, `grass`, `sand`, `smooth`, `rough`, `polished`

#### **Objects** (for object images):
- `rubber`, `leather`, `plastic`, `metal`, `wood`, `glass`
- `fabric`, `ceramic`, `stone`, `paper`, `smooth`, `rough`
- `slippery`, `grippy`, `textured`

### 🔧 **Friction Calculation**
The system automatically calculates friction based on:
- **Exact matches**: If AI detects "rubber", uses rubber friction (0.8)
- **Partial matches**: If AI detects "rubber_shoe", matches to "rubber"
- **Confidence-based**: If no match, uses confidence to estimate friction
- **Fallback**: Uses heuristic analysis if AI fails

### 📈 **Confidence Levels**
- **High Confidence (>80%)**: Very certain about detection
- **Medium Confidence (60-80%)**: Reasonably certain
- **Low Confidence (40-60%)**: Somewhat uncertain
- **Uncertain (<40%)**: AI is not confident about detection

## 🔄 Fallback System

If the AI analysis fails (network issues, API limits, etc.), the system automatically falls back to the original heuristic analysis based on image brightness and color analysis.

## 💡 Tips

1. **Clear Images**: Use well-lit, clear images for better AI accuracy
2. **Specific Objects**: Focus on the main object/surface in the image
3. **Multiple Attempts**: If AI fails, try uploading the image again
4. **Console Monitoring**: Check browser console for AI analysis results

## 🛠️ Troubleshooting

### API Key Issues
- Make sure your API key is correct
- Check if you have sufficient Cohere credits
- Verify the API key is active in your Cohere console

### Network Issues
- Check your internet connection
- The system will automatically fallback to heuristic analysis

### Image Issues
- Use JPEG or PNG format
- Keep image size reasonable (under 5MB)
- Ensure the image is clear and well-lit

## 🎮 Commands

Available console commands:
- `setRoboflowApiKey("key")` - Set your Roboflow API key
- `calculator.aiHelper.setApiKey("key")` - Alternative way to set API key
- `calculator.aiHelper` - Access AI helper directly

## 📋 Roboflow Project Setup

To use Roboflow effectively, you'll need to:

1. **Create a Roboflow Project** for slip/fall detection
2. **Train a model** on surface and object images
3. **Deploy the model** and get the project name and version
4. **Update the config** with your project details

The system expects your Roboflow model to classify:
- **Surfaces**: concrete, asphalt, wood, carpet, tile, marble, ice, wet, grass, sand
- **Objects**: rubber, leather, plastic, metal, wood, glass, fabric, ceramic, stone, paper

---

*Happy calculating! 🎯*
