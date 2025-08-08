# 🎮 Slip & Fall Speed Calculator

A retro-style physics calculator that determines the speed at which you'll slip and fall based on surface analysis, object identification, and personal data.

## 🚀 Features

- **Retro Gaming Aesthetics**: 8-bit style design with neon green and pink colors
- **AI-Powered Image Analysis**: Upload images of surfaces and objects for automatic friction coefficient calculation
- **Physics Calculations**: Real physics formulas for slip speed, fall duration, and impact force
- **Interactive Interface**: Drag-and-drop image uploads with visual feedback
- **Responsive Design**: Works on desktop and mobile devices

## 🎯 How It Works

1. **Surface Analysis**: Upload an image of the surface you're walking on
   - AI analyzes brightness and texture to determine friction coefficient
   - Darker surfaces = higher friction, lighter surfaces = lower friction

2. **Object Analysis**: Upload an image of your footwear or the object you're slipping on
   - AI analyzes color distribution to identify material properties
   - Different materials affect the overall friction coefficient

3. **Personal Data**: Enter your weight and height
   - Used in physics calculations for accurate results

4. **Physics Engine**: The calculator uses real physics formulas:
   - Potential Energy = m × g × h
   - Kinetic Energy = Potential Energy - Work Done by Friction
   - Final Velocity = √(2 × Kinetic Energy / mass)
   - Fall Duration = √(2 × height / gravity)
   - Impact Force = weight × gravity × (1 + velocity/gravity)

## 🎨 Retro Gaming Style

- **Font**: Press Start 2P (authentic 8-bit font)
- **Colors**: Neon green (#00ff41) and pink (#ff0080)
- **Effects**: Scanlines, glowing borders, particle animations
- **Animations**: Smooth transitions and retro-style feedback

## 🛠️ Technical Details

- **Frontend**: Pure HTML, CSS, and JavaScript
- **Image Processing**: Canvas API for pixel analysis
- **Physics Engine**: Custom calculations based on real physics formulas
- **Responsive**: CSS Grid and Flexbox for layout
- **Animations**: CSS keyframes and JavaScript animations

## 🚀 Getting Started

1. Clone or download the project files
2. Open `index.html` in your web browser
3. Upload surface and object images
4. Enter your weight and height
5. Click "CALCULATE FALL SPEED" to see results

## 📁 File Structure

```
slip-fall-calculator/
├── index.html          # Main HTML file
├── styles.css          # Retro gaming CSS styles
├── script.js           # Physics calculations and interactions
└── README.md          # This file
```

## 🎮 Future Enhancements

- Real AI integration for more accurate surface/object analysis
- 3D physics simulation with visual representation
- Sound effects and retro game music
- Multiple calculation modes (different fall scenarios)
- Export results as retro-style images

## ⚠️ Disclaimer

This is a fun, educational project for physics calculations. The results are simplified approximations and should not be used for real safety assessments. Always be careful when walking on potentially slippery surfaces!

---

*Built with ❤️ and retro gaming nostalgia*
