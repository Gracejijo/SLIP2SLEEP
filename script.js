// Retro Gaming Slip & Fall Calculator
class SlipFallCalculator {
    constructor() {
        this.surfaceImage = null;
        this.objectImage = null;
        this.weight = 0;
        this.height = 0;
        this.gravity = 9.81; // m/s²
        this.frictionCoefficient = 0.3; // Default value
        this.aiHelper = new AIHelper();
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Surface upload
        const surfaceUpload = document.getElementById('surfaceUpload');
        const surfaceInput = document.getElementById('surfaceInput');
        
        surfaceUpload.addEventListener('click', () => surfaceInput.click());
        surfaceInput.addEventListener('change', (e) => this.handleImageUpload(e, 'surface'));

        // Object upload
        const objectUpload = document.getElementById('objectUpload');
        const objectInput = document.getElementById('objectInput');
        
        objectUpload.addEventListener('click', () => objectInput.click());
        objectInput.addEventListener('change', (e) => this.handleImageUpload(e, 'object'));

        // Calculate button
        const calculateBtn = document.getElementById('calculateBtn');
        calculateBtn.addEventListener('click', () => this.calculateFallSpeed());

        // Run Simulation button
        const runSimulationBtn = document.getElementById('runSimulation');
        runSimulationBtn.addEventListener('click', () => {
            // Reset physics time and stickman state
            sim.time = 0;
            sim.lastTS = performance.now();
            sim.stick.state = 'walking';
            sim.stick.x = 20;
            sim.stick.rotation = 0;
            sim.stick.animFrame = 0;
            resultsSection.style.display = 'none';
            // Start animation loop
            requestAnimationFrame(loop);
        });

        // Play Simulation button
        const playSimulationBtn = document.getElementById('playSimulation');
        playSimulationBtn.addEventListener('click', () => this.playSimulation());

        // Reset Simulation button
        const resetSimulationBtn = document.getElementById('resetSimulation');
        resetSimulationBtn.addEventListener('click', () => this.resetSimulation());

        // Input fields
        document.getElementById('weight').addEventListener('input', (e) => {
            this.weight = parseFloat(e.target.value) || 0;
        });

        document.getElementById('height').addEventListener('input', (e) => {
            this.height = parseFloat(e.target.value) || 0;
        });

        // Initialize default simulation scene
        this.initDefaultSimulation();
    }

    initDefaultSimulation() {
        // Get canvas context
        const canvas = document.getElementById('simulationCanvas');
        this.ctx = canvas.getContext('2d');
        
        // Draw default scene
        this.drawDefaultScene();
    }

    drawDefaultScene() {
        const ctx = this.ctx;
        const canvas = document.getElementById('simulationCanvas');

        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw sky (top 2/3 of canvas)
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.67);
        skyGradient.addColorStop(0, '#0a0a2a');
        skyGradient.addColorStop(1, '#1a1a4a');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.67);

        // Draw ground (bottom 1/3 of canvas) using uploaded surface image if available
        if (this.surfaceImage) {
            ctx.save();
            ctx.globalAlpha = 0.95;
            ctx.drawImage(this.surfaceImage, 0, canvas.height * 0.67, canvas.width, canvas.height * 0.33);
            ctx.restore();
        } else {
            const groundGradient = ctx.createLinearGradient(0, canvas.height * 0.67, 0, canvas.height);
            groundGradient.addColorStop(0, '#2a2a2a');
            groundGradient.addColorStop(1, '#1a1a1a');
            ctx.fillStyle = groundGradient;
            ctx.fillRect(0, canvas.height * 0.67, canvas.width, canvas.height * 0.33);
        }

        // Draw horizon line
        ctx.strokeStyle = '#00ff41';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * 0.67);
        ctx.lineTo(canvas.width, canvas.height * 0.67);
        ctx.stroke();

        // Draw standing stick figure
        this.drawStandingStickFigure();
    }

    drawStandingStickFigure() {
        const ctx = this.ctx;
        const canvas = document.getElementById('simulationCanvas');
        
        // Position figure in center, on ground
        const figureX = canvas.width / 2;
        const figureY = canvas.height * 0.67 - 20; // Just above ground
        
        ctx.save();
        ctx.translate(figureX, figureY);
        
        // Draw stick figure
        ctx.strokeStyle = '#00ff41';
        ctx.lineWidth = 3;
        ctx.fillStyle = '#00ff41';
        
        // Head
        ctx.beginPath();
        ctx.arc(0, -30, 8, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Eyes
        ctx.fillRect(-3, -32, 2, 2);
        ctx.fillRect(1, -32, 2, 2);
        
        // Body
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(0, 0);
        ctx.stroke();
        
        // Arms
        ctx.beginPath();
        ctx.moveTo(-15, -15);
        ctx.lineTo(15, -15);
        ctx.stroke();
        
        // Legs
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-15, 15);
        ctx.moveTo(10, 0);
        ctx.lineTo(15, 15);
        ctx.stroke();
        
        // Feet
        ctx.fillRect(-12, 13, 4, 4);
        ctx.fillRect(8, 13, 4, 4);
        
        ctx.restore();
    }

    async handleImageUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                if (type === 'surface') {
                    this.surfaceImage = img;
                    await this.analyzeSurface(img);
                    this.updateUploadArea('surfaceUpload', file.name, img);
                } else {
                    this.objectImage = img;
                    await this.analyzeObject(img);
                    this.updateUploadArea('objectUpload', file.name, img);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    updateUploadArea(uploadId, fileName, img) {
        const uploadBox = document.getElementById(uploadId);
        const isSurface = uploadId === 'surfaceUpload';
        const detectedType = isSurface ? this.surfaceType : this.objectType;
        
        uploadBox.innerHTML = `
            <div class="upload-success">
                <div class="pixel-icon">✅</div>
                <p>${fileName}</p>
                <small>Image uploaded successfully!</small>
                <div class="detection-info">
                    <strong>Detected: ${detectedType}</strong>
                </div>
            </div>
        `;
        uploadBox.style.borderColor = '#00ff41';
        uploadBox.style.background = 'rgba(0, 255, 65, 0.1)';
    }

    async analyzeSurface(img) {
        try {
            // Try AI analysis first
            const result = await this.aiHelper.analyzeWithRoboflow(img, 'surface');
            this.frictionCoefficient = result.frictionCoefficient;
            this.surfaceType = result.displayName;
            console.log(`AI Surface analyzed: ${result.displayName}, Confidence: ${result.confidence.toFixed(2)}, Friction: ${this.frictionCoefficient}`);
        } catch (error) {
            console.warn('AI analysis failed, using fallback:', error.message);
            // Fallback to heuristic analysis
            const result = this.aiHelper.fallbackAnalysis(img, 'surface');
            this.frictionCoefficient = result.frictionCoefficient;
            this.surfaceType = result.displayName;
            console.log(`Fallback Surface analyzed: ${result.displayName}, Friction: ${this.frictionCoefficient}`);
        }
    }

    async analyzeObject(img) {
        try {
            // Try AI analysis first
            const result = await this.aiHelper.analyzeWithRoboflow(img, 'object');
            this.frictionCoefficient *= result.frictionCoefficient;
            this.objectType = result.displayName;
            console.log(`AI Object analyzed: ${result.displayName}, Confidence: ${result.confidence.toFixed(2)}, Adjusted friction = ${this.frictionCoefficient.toFixed(3)}`);
        } catch (error) {
            console.warn('AI analysis failed, using fallback:', error.message);
            // Fallback to heuristic analysis
            const result = this.aiHelper.fallbackAnalysis(img, 'object');
            this.frictionCoefficient *= result.frictionCoefficient;
            this.objectType = result.displayName;
            console.log(`Fallback Object analyzed: ${result.displayName}, Adjusted friction = ${this.frictionCoefficient.toFixed(3)}`);
        }
    }

    calculateFallSpeed() {
        if (!this.surfaceImage || !this.objectImage || this.weight === 0 || this.height === 0) {
            this.showError('Please upload both images and enter weight and height!');
            return;
        }

        // Show loading state
        const calculateBtn = document.getElementById('calculateBtn');
        const originalText = calculateBtn.querySelector('.btn-text').textContent;
        calculateBtn.querySelector('.btn-text').textContent = 'CALCULATING...';
        calculateBtn.disabled = true;

        // Simulate processing time
        setTimeout(() => {
            this.performCalculations();
            calculateBtn.querySelector('.btn-text').textContent = originalText;
            calculateBtn.disabled = false;
        }, 1500);
    }

    performCalculations() {
        // Convert height from cm to meters
        const heightM = this.height / 100;
        
        // Calculate potential energy at the start
        const potentialEnergy = this.weight * this.gravity * heightM;
        
        // Calculate kinetic energy considering friction
        const workDoneByFriction = this.weight * this.gravity * this.frictionCoefficient * heightM;
        const finalKineticEnergy = Math.max(0, potentialEnergy - workDoneByFriction);
        
        // Calculate final velocity
        const finalVelocity = Math.sqrt((2 * finalKineticEnergy) / Math.max(1, this.weight));
        
        // Calculate fall duration (simplified)
        const fallDuration = Math.sqrt((2 * Math.max(0.01, heightM)) / this.gravity);
        
        // Calculate impact force (simplified)
        const impactForce = this.weight * this.gravity * (1 + (finalVelocity / this.gravity));

        // Calculate fatality rate (heuristic): based on speed and weight/force
        // Normalized components
        const speedRisk = Math.min(1, finalVelocity / 12); // 12 m/s ~ 27 mph is very severe
        const weightRisk = Math.min(1, (this.weight - 50) / 100); // heavier than 50kg increases risk
        const forceRisk = Math.min(1, impactForce / 8000); // 8000N ~ severe impact
        // Weighted risk blend
        const fatalityRate = Math.min(1, 0.5 * speedRisk + 0.2 * weightRisk + 0.3 * forceRisk);
        const isFatal = fatalityRate >= 0.7; // Threshold for death
        
        // Display results
        this.displayResults({
            friction: this.frictionCoefficient.toFixed(3),
            speed: finalVelocity.toFixed(2),
            duration: fallDuration.toFixed(2),
            force: impactForce.toFixed(0),
            surface: this.surfaceType,
            object: this.objectType,
            fatalityRate: Math.round(fatalityRate * 100),
            isFatal: isFatal
        });
    }

    displayResults(results) {
        document.getElementById('frictionResult').textContent = results.friction;
        document.getElementById('speedResult').textContent = `${results.speed} m/s`;
        document.getElementById('durationResult').textContent = `${results.duration} s`;
        document.getElementById('forceResult').textContent = `${results.force} N`;
        
        // New: fatality rate and status
        const fatalityEl = document.getElementById('fatalityResult');
        const statusEl = document.getElementById('statusResult');
        const commentEl = document.getElementById('fatalityComment'); // Add this element in HTML
        if (fatalityEl && statusEl && commentEl) {
            fatalityEl.textContent = `${results.fatalityRate}%`;
            statusEl.textContent = results.isFatal ? 'DEAD ☠️' : 'ALIVE ✅';
            statusEl.style.color = results.isFatal ? '#ff3838' : '#00ff41';
            commentEl.textContent = this.getFatalityComment(results.fatalityRate); // Add the comment
        }
        
        // Update the results section to show detected surface and object
        const resultsSection = document.getElementById('resultsSection');
        const resultCard = resultsSection.querySelector('.result-card');
        
        // Remove any existing detection items
        const existingDetectionItems = resultCard.querySelectorAll('.detection-item');
        existingDetectionItems.forEach(item => item.remove());
        
        // Add surface and object detection info
        const detectionInfo = `
            <div class="result-item detection-item">
                <span class="result-label">Surface Detected:</span>
                <span class="result-value">${results.surface}</span>
            </div>
            <div class="result-item detection-item">
                <span class="result-label">Object Detected:</span>
                <span class="result-value">${results.object}</span>
            </div>
        `;
        
        // Insert detection info at the beginning of result card
        resultCard.insertAdjacentHTML('afterbegin', detectionInfo);
        
        resultsSection.style.display = 'block';
        
        // Update simulation info
        document.getElementById('simSurface').textContent = results.surface;
        document.getElementById('simObject').textContent = results.object;
        document.getElementById('simSpeed').textContent = `${results.speed} m/s`;
        
        // Show Run Simulation button
        document.getElementById('runSimulation').style.display = 'inline-block';
        document.getElementById('playSimulation').style.display = 'none';
        document.getElementById('resetSimulation').style.display = 'none';
        
        // Store results for simulation
        this.calculationResults = results;
        
        // Add retro sound effect (visual feedback)
        this.addRetroEffect();
    }

    runSimulation() {
        if (!this.calculationResults) return;
        
        // Initialize simulation with results
        this.initSimulation(this.calculationResults);
        
        // Show Play and Reset buttons
        document.getElementById('runSimulation').style.display = 'none';
        document.getElementById('playSimulation').style.display = 'inline-block';
        document.getElementById('resetSimulation').style.display = 'inline-block';
        
        // Draw the simulation scene
        this.drawSimulation();
    }

    showSimulation(results) {
        const simulationSection = document.getElementById('simulationSection');
        simulationSection.style.display = 'block';
        
        // Update simulation info
        document.getElementById('simSurface').textContent = results.surface;
        document.getElementById('simObject').textContent = results.object;
        document.getElementById('simSpeed').textContent = `${results.speed} m/s`;
        
        // Initialize simulation
        this.initSimulation(results);
        
        // Auto-play simulation after a short delay
        setTimeout(() => {
            this.playSimulation();
        }, 1000);
    }

    initSimulation(results) {
        this.simulationData = {
            surface: results.surface,
            object: results.object,
            friction: parseFloat(results.friction),
            speed: parseFloat(results.speed),
            duration: parseFloat(results.duration),
            force: parseFloat(results.force),
            isPlaying: false,
            time: 0,
            figure: {
                x: 50, // Start from left side
                y: 200, // Stay within visible canvas area
                vx: 0,
                vy: 0,
                rotation: 0,
                state: 'walking', // walking, slipping, falling, injured
                phase: 0, // Animation phase
                sprite: null
            },
            // Store the actual uploaded images
            surfaceImage: this.surfaceImage,
            objectImage: this.objectImage,
            objectBounds: null,
            // Ghost system for fatal falls
            ghost: {
                active: results.isFatal || false,
                x: null,
                y: null,
                vx: 0,
                vy: 0,
                rotation: 0,
                targetX: 350, // Top-right corner
                targetY: 50,
                arrived: false
            },
            // White orb system for all falls
            orbs: [], // Array to store multiple orbs
            orbId: 0 // Counter for unique orb IDs
        };
        
        // Load sprites
        this.loadSprites();
        
        // Get canvas context
        const canvas = document.getElementById('simulationCanvas');
        this.ctx = canvas.getContext('2d');
        
        // Add click event listener for orbs
        canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }

    loadSprites() {
        // Create sprite images programmatically since we don't have external files
        this.createSpriteImages();
    }

    createSpriteImages() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 50;
        canvas.height = 50;

        // Walking sprite
        ctx.clearRect(0, 0, 50, 50);
        this.drawStickFigureSprite(ctx, '#fff', 'walking');
        this.simulationData.sprites.walk = new Image();
        this.simulationData.sprites.walk.src = canvas.toDataURL();

        // Falling sprite
        ctx.clearRect(0, 0, 50, 50);
        this.drawStickFigureSprite(ctx, '#ff6b6b', 'falling');
        this.simulationData.sprites.fall = new Image();
        this.simulationData.sprites.fall.src = canvas.toDataURL();

        // Injured sprite
        ctx.clearRect(0, 0, 50, 50);
        this.drawStickFigureSprite(ctx, '#ff3838', 'injured');
        this.simulationData.sprites.injured = new Image();
        this.simulationData.sprites.injured.src = canvas.toDataURL();
    }

    drawStickFigureSprite(ctx, color, state) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.fillStyle = color;

        if (state === 'walking') {
            // Walking pose - normal walking stance
            // Head
            ctx.beginPath();
            ctx.arc(25, 10, 6, 0, 2 * Math.PI);
            ctx.stroke();
            
            // Eyes
            ctx.fillRect(22, 8, 2, 2);
            ctx.fillRect(26, 8, 2, 2);
            
            // Body
            ctx.beginPath();
            ctx.moveTo(25, 16);
            ctx.lineTo(25, 35);
            ctx.stroke();
            
            // Arms in walking motion
            ctx.beginPath();
            ctx.moveTo(15, 20);
            ctx.lineTo(35, 20);
            ctx.stroke();
            
            // Legs in walking motion
            ctx.beginPath();
            ctx.moveTo(20, 35);
            ctx.lineTo(15, 45);
            ctx.moveTo(30, 35);
            ctx.lineTo(35, 45);
            ctx.stroke();
            
            // Feet
            ctx.fillRect(12, 43, 6, 4);
            ctx.fillRect(32, 43, 6, 4);
        } else if (state === 'falling') {
            // Falling pose - flailing and tilted
            ctx.save();
            ctx.translate(25, 25);
            ctx.rotate(Math.PI / 6); // 30 degrees tilt for falling
            
            // Head
            ctx.beginPath();
            ctx.arc(0, -15, 6, 0, 2 * Math.PI);
            ctx.stroke();
            
            // Eyes (wide open)
            ctx.fillRect(-4, -17, 3, 3);
            ctx.fillRect(1, -17, 3, 3);
            
            // Body
            ctx.beginPath();
            ctx.moveTo(0, -9);
            ctx.lineTo(0, 10);
            ctx.stroke();
            
            // Flailing arms
            ctx.beginPath();
            ctx.moveTo(-25, -5);
            ctx.lineTo(25, -5);
            ctx.stroke();
            
            // Flailing legs
            ctx.beginPath();
            ctx.moveTo(-20, 10);
            ctx.lineTo(-30, 20);
            ctx.moveTo(20, 10);
            ctx.lineTo(30, 20);
            ctx.stroke();
            
            ctx.restore();
        } else if (state === 'injured') {
            // Injured pose - lying down (90 degrees rotated)
            ctx.save();
            ctx.translate(25, 25);
            ctx.rotate(Math.PI / 2); // 90 degrees - lying down
            
            // Head
            ctx.beginPath();
            ctx.arc(0, -15, 6, 0, 2 * Math.PI);
            ctx.stroke();
            
            // Eyes (closed)
            ctx.beginPath();
            ctx.moveTo(-3, -17);
            ctx.lineTo(3, -17);
            ctx.stroke();
            
            // Body
            ctx.beginPath();
            ctx.moveTo(0, -9);
            ctx.lineTo(0, 10);
            ctx.stroke();
            
            // Arms spread out
            ctx.beginPath();
            ctx.moveTo(-20, -5);
            ctx.lineTo(20, -5);
            ctx.stroke();
            
            // Legs spread out
            ctx.beginPath();
            ctx.moveTo(-15, 10);
            ctx.lineTo(-25, 20);
            ctx.moveTo(15, 10);
            ctx.lineTo(25, 20);
            ctx.stroke();
            
            ctx.restore();
        }
    }

    drawFallbackStickFigure(ctx, figure) {
        ctx.save();
        ctx.translate(figure.x + 25, figure.y + 25);
        ctx.rotate(figure.rotation);
        
        // Figure color based on state
        let color = '#fff';
        if (figure.state === 'walking') color = '#fff';
        else if (figure.state === 'falling') color = '#ff6b6b';
        else if (figure.state === 'injured') color = '#ff3838';
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.fillStyle = color;
        
        // Draw simple stick figure
        // Head
        ctx.beginPath();
        ctx.arc(0, -15, 6, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Eyes
        ctx.fillRect(-3, -17, 2, 2);
        ctx.fillRect(1, -17, 2, 2);
        
        // Body
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(0, 10);
        ctx.stroke();
        
        // Arms
        ctx.beginPath();
        ctx.moveTo(-15, -5);
        ctx.lineTo(15, -5);
        ctx.stroke();
        
        // Legs
        ctx.beginPath();
        ctx.moveTo(-10, 10);
        ctx.lineTo(-15, 20);
        ctx.moveTo(10, 10);
        ctx.lineTo(15, 20);
        ctx.stroke();
        
        ctx.restore();
    }

    playSimulation() {
        if (this.simulationData.isPlaying) return;
        
        this.simulationData.isPlaying = true;
        this.simulationData.time = 0;
        this.simulationData.figure.state = 'walking';
        this.simulationData.figure.x = 50;
        this.simulationData.figure.y = 200;
        this.simulationData.figure.vx = 0;
        this.simulationData.figure.vy = 0;
        this.simulationData.figure.rotation = 0;
        
        // Reset/initialize ghost based on fatality
        if (this.simulationData.ghost.active) {
            this.simulationData.ghost.x = this.simulationData.figure.x + 25;
            this.simulationData.ghost.y = this.simulationData.figure.y - 10;
            this.simulationData.ghost.vx = 0.8;
            this.simulationData.ghost.vy = -0.6;
            this.simulationData.ghost.arrived = false;
        }
        
        // Start animation loop
        this.animateSimulation();
    }

    resetSimulation() {
        this.simulationData.isPlaying = false;
        this.simulationData.time = 0;
        this.simulationData.figure.state = 'walking';
        this.simulationData.figure.x = 50;
        this.simulationData.figure.y = 200;
        this.simulationData.figure.vx = 0;
        this.simulationData.figure.vy = 0;
        this.simulationData.figure.rotation = 0;
        
        // Reset ghost to initial state if active
        if (this.simulationData.ghost.active) {
            this.simulationData.ghost.x = this.simulationData.figure.x + 25;
            this.simulationData.ghost.y = this.simulationData.figure.y - 10;
            this.simulationData.ghost.vx = 0.8;
            this.simulationData.ghost.vy = -0.6;
            this.simulationData.ghost.arrived = false;
        }
        
        // Clear orbs
        this.simulationData.orbs = [];
        this.simulationData.orbId = 0;
        
        // Draw default scene
        this.drawDefaultScene();
        
        // Hide simulation buttons
        document.getElementById('playSimulation').style.display = 'none';
        document.getElementById('resetSimulation').style.display = 'none';
        document.getElementById('runSimulation').style.display = 'inline-block';
    }

    animateSimulation() {
        if (!this.simulationData.isPlaying) return;
        
        this.updateSimulation();
        this.drawSimulation();
        
        if (this.simulationData.figure.state !== 'injured') {
            requestAnimationFrame(() => this.animateSimulation());
        } else {
            this.simulationData.isPlaying = false;
            // Auto-restart after 3 seconds
            setTimeout(() => {
                this.playSimulation();
            }, 3000);
        }
    }

    updateSimulation() {
        const figure = this.simulationData.figure;
        const objectBounds = this.simulationData.objectBounds;
        const time = this.simulationData.time;
        
        // Check if figure is near the object
        let nearObject = false;
        if (objectBounds) {
            nearObject = figure.x >= objectBounds.x - 30 && 
                        figure.x <= objectBounds.x + objectBounds.width + 30;
        }
        
        // Animation phases based on Manim implementation
        if (time < 3.0) {
            // Walking phase - walk to object
            figure.state = 'walking';
            figure.vx = 2; // Walking speed
            figure.rotation = 0;
            figure.phase = 0;
        } else if (time < 4.5) {
            // Falling phase - switch to fall sprite and rotate
            figure.state = 'falling';
            figure.vx = 1; // Slower horizontal movement
            figure.vy = 2; // Downward movement
            figure.rotation = 90; // Rotate like Manim
            figure.phase = 1;
            
            // Create orb when falling starts (only once)
            if (time < 3.1) {
                this.createOrb(figure.x, figure.y);
            }
        } else {
            // Injured phase - stay rotated and still
            figure.state = 'injured';
            figure.vx = 0;
            figure.vy = 0;
            figure.rotation = 90;
            figure.phase = 2;
        }
        
        // Update position
        figure.x += figure.vx;
        figure.y += figure.vy;
        
        // Keep figure in bounds - within visible canvas area
        figure.x = Math.max(20, Math.min(350, figure.x));
        figure.y = Math.max(150, Math.min(250, figure.y));
        
        this.simulationData.time += 0.05;
        
        // Update orbs
        this.updateOrbs();
        
        // Update ghost if active
        if (this.simulationData.ghost.active) {
            this.updateGhost();
        }
    }

    updateWalkingAnimation(figure) {
        const walkCycle = figure.walkCycle;
        
        // Animate joints for walking
        figure.joints.leftShoulder.angle = Math.sin(walkCycle * 4) * 0.3;
        figure.joints.rightShoulder.angle = Math.sin(walkCycle * 4 + Math.PI) * 0.3;
        figure.joints.leftElbow.angle = Math.sin(walkCycle * 4) * 0.5;
        figure.joints.rightElbow.angle = Math.sin(walkCycle * 4 + Math.PI) * 0.5;
        figure.joints.leftHip.angle = Math.sin(walkCycle * 4) * 0.4;
        figure.joints.rightHip.angle = Math.sin(walkCycle * 4 + Math.PI) * 0.4;
        figure.joints.leftKnee.angle = Math.sin(walkCycle * 4) * 0.6;
        figure.joints.rightKnee.angle = Math.sin(walkCycle * 4 + Math.PI) * 0.6;
        
        figure.walkCycle += 0.1;
    }

    updateTouchingAnimation(figure) {
        // Slight stumble animation when touching object
        figure.joints.head.angle = Math.sin(this.simulationData.time * 10) * 0.1;
        figure.joints.torso.angle = Math.sin(this.simulationData.time * 8) * 0.2;
        figure.joints.leftShoulder.angle = Math.sin(this.simulationData.time * 6) * 0.3;
        figure.joints.rightShoulder.angle = Math.sin(this.simulationData.time * 6 + Math.PI) * 0.3;
    }

    updateSlippingAnimation(figure) {
        // Dramatic slipping animation
        figure.joints.head.angle = Math.sin(this.simulationData.time * 15) * 0.3;
        figure.joints.torso.angle = Math.sin(this.simulationData.time * 12) * 0.5;
        figure.joints.leftShoulder.angle = Math.sin(this.simulationData.time * 10) * 0.8;
        figure.joints.rightShoulder.angle = Math.sin(this.simulationData.time * 10 + Math.PI) * 0.8;
        figure.joints.leftElbow.angle = Math.sin(this.simulationData.time * 8) * 1.0;
        figure.joints.rightElbow.angle = Math.sin(this.simulationData.time * 8 + Math.PI) * 1.0;
        figure.joints.leftHip.angle = Math.sin(this.simulationData.time * 6) * 0.6;
        figure.joints.rightHip.angle = Math.sin(this.simulationData.time * 6 + Math.PI) * 0.6;
    }

    updateFallingAnimation(figure) {
        // Falling animation with flailing limbs
        figure.joints.head.angle = Math.sin(this.simulationData.time * 20) * 0.5;
        figure.joints.torso.angle = Math.sin(this.simulationData.time * 15) * 0.8;
        figure.joints.leftShoulder.angle = Math.sin(this.simulationData.time * 12) * 1.2;
        figure.joints.rightShoulder.angle = Math.sin(this.simulationData.time * 12 + Math.PI) * 1.2;
        figure.joints.leftElbow.angle = Math.sin(this.simulationData.time * 10) * 1.5;
        figure.joints.rightElbow.angle = Math.sin(this.simulationData.time * 10 + Math.PI) * 1.5;
        figure.joints.leftHip.angle = Math.sin(this.simulationData.time * 8) * 1.0;
        figure.joints.rightHip.angle = Math.sin(this.simulationData.time * 8 + Math.PI) * 1.0;
    }

    updateLandedAnimation(figure) {
        // Still animation when landed
        figure.joints.head.angle = 0;
        figure.joints.torso.angle = 0;
        figure.joints.leftShoulder.angle = 0;
        figure.joints.rightShoulder.angle = 0;
        figure.joints.leftElbow.angle = 0;
        figure.joints.rightElbow.angle = 0;
        figure.joints.leftHip.angle = 0;
        figure.joints.rightHip.angle = 0;
    }

    drawSimulation() {
        const ctx = this.ctx;
        const canvas = document.getElementById('simulationCanvas');
        const figure = this.simulationData.figure;
        const surfaceImage = this.simulationData.surfaceImage;
        const objectImage = this.simulationData.objectImage;
        
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw uploaded surface image as ground (long rectangle at bottom)
        if (surfaceImage) {
            // Draw the surface image stretched horizontally across the canvas as ground
            ctx.save();
            ctx.globalAlpha = 0.95;
            ctx.drawImage(surfaceImage, 0, 250, canvas.width, 50); // y=250, height=50
            ctx.restore();
        } else {
            // Fallback: draw default ground
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(0, 250, canvas.width, 50);
        }
        
        // Draw uploaded object image on the surface
        if (objectImage) {
            const objectWidth = 60;
            const objectHeight = 30;
            const objectX = 280; // Position object on the right side like Manim
            const objectY = 250 - objectHeight + 20;
            
            this.drawBackgroundImage(objectImage, objectX, objectY, objectWidth, objectHeight);
            
            // Store object position for collision detection
            this.simulationData.objectBounds = {
                x: objectX,
                y: objectY,
                width: objectWidth,
                height: objectHeight
            };
        }
        
        // Draw stick figure based on state
        ctx.save();
        ctx.translate(figure.x + 25, figure.y + 25);
        ctx.rotate(figure.rotation * Math.PI / 180); // Convert degrees to radians
        
        // Figure color based on state
        let color = '#fff';
        if (figure.state === 'walking') color = '#fff';
        else if (figure.state === 'falling') color = '#ff6b6b';
        else if (figure.state === 'injured') color = '#ff3838';
        
        this.drawStickFigureSprite(ctx, color, figure.state);
        ctx.restore();
        
        // Draw ghost soul if active
        if (this.simulationData.ghost.active) {
            this.drawGhostSoul();
        }
        
        // Draw impact effect if injured
        if (figure.state === 'injured') {
            this.drawImpactEffect(figure);
        }

        // Draw orbs
        this.drawOrbs();
    }

    drawBackgroundImage(img, x, y, width, height) {
        const ctx = this.ctx;
        
        // Create a pattern for tiling if needed
        const pattern = ctx.createPattern(img, 'repeat');
        
        // Draw the image with proper scaling
        ctx.save();
        ctx.globalAlpha = 0.8; // Slightly transparent so stick figure stands out
        ctx.drawImage(img, x, y, width, height);
        ctx.restore();
        
        // Add a subtle overlay to make stick figure more visible
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(x, y, width, height);
    }

    drawStickFigure(figure) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(figure.x, figure.y);
        ctx.rotate(figure.rotation);
        
        // Figure color based on state
        let color = '#fff';
        if (figure.state === 'walking') color = '#fff';
        else if (figure.state === 'touching') color = '#ffeb3b';
        else if (figure.state === 'slipping') color = '#ff6b6b';
        else if (figure.state === 'falling') color = '#ff4757';
        else if (figure.state === 'landed') color = '#ff3838';
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.fillStyle = color;
        
        // Draw articulated stick figure with joints
        this.drawArticulatedFigure(ctx, figure.joints);
        
        ctx.restore();
    }

    drawArticulatedFigure(ctx, joints) {
        // Draw head
        ctx.beginPath();
        ctx.arc(joints.head.x, joints.head.y, 8, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Eyes
        ctx.fillRect(joints.head.x - 3, joints.head.y - 2, 2, 2);
        ctx.fillRect(joints.head.x + 1, joints.head.y - 2, 2, 2);
        
        // Neck to torso
        ctx.beginPath();
        ctx.moveTo(joints.neck.x, joints.neck.y);
        ctx.lineTo(joints.torso.x, joints.torso.y);
        ctx.stroke();
        
        // Arms with joints
        ctx.beginPath();
        ctx.moveTo(joints.leftShoulder.x, joints.leftShoulder.y);
        ctx.lineTo(joints.leftElbow.x, joints.leftElbow.y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(joints.rightShoulder.x, joints.rightShoulder.y);
        ctx.lineTo(joints.rightElbow.x, joints.rightElbow.y);
        ctx.stroke();
        
        // Shoulders to torso
        ctx.beginPath();
        ctx.moveTo(joints.leftShoulder.x, joints.leftShoulder.y);
        ctx.lineTo(joints.torso.x, joints.torso.y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(joints.rightShoulder.x, joints.rightShoulder.y);
        ctx.lineTo(joints.torso.x, joints.torso.y);
        ctx.stroke();
        
        // Legs with joints
        ctx.beginPath();
        ctx.moveTo(joints.leftHip.x, joints.leftHip.y);
        ctx.lineTo(joints.leftKnee.x, joints.leftKnee.y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(joints.rightHip.x, joints.rightHip.y);
        ctx.lineTo(joints.rightKnee.x, joints.rightKnee.y);
        ctx.stroke();
        
        // Hips to torso
        ctx.beginPath();
        ctx.moveTo(joints.leftHip.x, joints.leftHip.y);
        ctx.lineTo(joints.torso.x, joints.torso.y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(joints.rightHip.x, joints.rightHip.y);
        ctx.lineTo(joints.torso.x, joints.torso.y);
        ctx.stroke();
        
        // Feet
        ctx.fillRect(joints.leftFoot.x - 4, joints.leftFoot.y, 8, 4);
        ctx.fillRect(joints.rightFoot.x - 4, joints.rightFoot.y, 8, 4);
        
        // Draw joint nodes
        ctx.fillStyle = '#00ff41';
        ctx.lineWidth = 1;
        Object.values(joints).forEach(joint => {
            ctx.beginPath();
            ctx.arc(joint.x, joint.y, 2, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    drawSlippingParticles(figure) {
        const ctx = this.ctx;
        
        ctx.fillStyle = '#ff6b6b';
        for (let i = 0; i < 5; i++) {
            const x = figure.x + Math.random() * 20 - 10;
            const y = figure.y + 30 + Math.random() * 10;
            ctx.fillRect(x, y, 2, 2);
        }
    }

    drawImpactEffect(figure) {
        const ctx = this.ctx;
        
        // Impact circle
        ctx.strokeStyle = '#ff3838';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(figure.x, figure.y + 30, 20, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Shock waves
        for (let i = 1; i <= 3; i++) {
            ctx.strokeStyle = `rgba(255, 56, 56, ${0.3 - i * 0.1})`;
            ctx.beginPath();
            ctx.arc(figure.x, figure.y + 30, 20 + i * 10, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }

    drawGhostSoul() {
        const ctx = this.ctx;
        const ghost = this.simulationData.ghost;
        if (ghost.x == null || ghost.y == null) return;
        
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = '#a0e9ff';
        ctx.fillStyle = 'rgba(160, 233, 255, 0.2)';
        ctx.lineWidth = 2;
        
        // Ghost circle
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Halo
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y, 14, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(160, 233, 255, 0.4)';
        ctx.stroke();
        
        // Tiny eyes
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#a0e9ff';
        ctx.fillRect(ghost.x - 3, ghost.y - 2, 2, 2);
        ctx.fillRect(ghost.x + 1, ghost.y - 2, 2, 2);
        
        ctx.restore();
    }

    addRetroEffect() {
        // Create particle effect
        const calculateBtn = document.getElementById('calculateBtn');
        const particles = calculateBtn.querySelector('.btn-particles');
        
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.style.position = 'absolute';
                particle.style.width = '4px';
                particle.style.height = '4px';
                particle.style.backgroundColor = '#00ff41';
                particle.style.borderRadius = '50%';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animation = 'particleFloat 1s ease-out forwards';
                
                particles.appendChild(particle);
                
                setTimeout(() => particle.remove(), 1000);
            }, i * 100);
        }
    }

    showError(message) {
        // Create retro-style error notification
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 0, 0, 0.9);
            border: 2px solid #ff0000;
            color: #fff;
            padding: 15px;
            font-family: 'Press Start 2P', cursive;
            font-size: 0.7rem;
            z-index: 1000;
            animation: slideInRight 0.5s ease-out;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.style.animation = 'slideOutRight 0.5s ease-in forwards';
            setTimeout(() => errorDiv.remove(), 500);
        }, 3000);
    }

    createOrb(x, y) {
        const orb = {
            id: this.simulationData.orbId++,
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2, // Random horizontal movement
            vy: -3, // Float upward
            size: 12 + Math.random() * 8, // Larger size for visibility
            alpha: 1,
            pulse: 0,
            targetX: 50 + Math.random() * 100, // Random position on left side
            targetY: 50 + Math.random() * 100,
            arrived: false
        };
        this.simulationData.orbs.push(orb);
        console.log(`🌟 Orb created! ID: ${orb.id}, Position: (${x}, ${y}), Target: (${orb.targetX}, ${orb.targetY})`);
    }

    updateOrbs() {
        const orbs = this.simulationData.orbs;
        for (let i = orbs.length - 1; i >= 0; i--) {
            const orb = orbs[i];
            
            if (!orb.arrived) {
                // Move towards target position
                const dx = orb.targetX - orb.x;
                const dy = orb.targetY - orb.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 5) {
                    orb.arrived = true;
                    orb.x = orb.targetX;
                    orb.y = orb.targetY;
                    console.log(`🌟 Orb ${orb.id} arrived at target!`);
                } else {
                    orb.x += dx * 0.05;
                    orb.y += dy * 0.05;
                }
            }
            
            // Pulse effect
            orb.pulse += 0.1;
        }
    }

    updateGhost() {
        const ghost = this.simulationData.ghost;
        const figure = this.simulationData.figure;
        const objectBounds = this.simulationData.objectBounds;

        if (ghost.active && !ghost.arrived) {
            // Move ghost towards the corner
            const dx = ghost.targetX - ghost.x;
            const dy = ghost.targetY - ghost.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 10) { // Move faster if not close to target
                ghost.vx = dx / 10;
                ghost.vy = dy / 10;
            } else {
                ghost.vx = 0;
                ghost.vy = 0;
                ghost.arrived = true;
            }

            ghost.x += ghost.vx;
            ghost.y += ghost.vy;
        }
    }

    drawOrbs() {
        const ctx = this.ctx;
        const orbs = this.simulationData.orbs;

        for (const orb of orbs) {
            ctx.save();
            ctx.globalAlpha = orb.alpha;
            ctx.strokeStyle = '#ffffff'; // Bright white outline
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Bright white fill
            ctx.lineWidth = 2;

            // Main orb circle
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.size + orb.pulse, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // Glowing halo
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.size + orb.pulse + 5, 0, 2 * Math.PI);
            ctx.stroke();

            // Tiny eyes
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#000000'; // Black eyes for contrast
            ctx.fillRect(orb.x - 2, orb.y - 2, 4, 4);
            ctx.fillRect(orb.x + 2, orb.y - 2, 4, 4);

            ctx.restore();
        }
    }

    handleCanvasClick(e) {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if any orb was clicked
        const orbs = this.simulationData.orbs;
        for (const orb of orbs) {
            const distance = Math.sqrt((x - orb.x) * (x - orb.x) + (y - orb.y) * (y - orb.y));
            if (distance < orb.size + 10) { // Click radius
                this.redirectToWebsite();
                return;
            }
        }
        
        // Check if ghost was clicked (if active)
        if (this.simulationData.ghost.active) {
            const ghost = this.simulationData.ghost;
            const distance = Math.sqrt((x - ghost.x) * (x - ghost.x) + (y - ghost.y) * (y - ghost.y));
            if (distance < 15) { // Ghost click radius
                this.redirectToWebsite();
                return;
            }
        }
    }

    redirectToWebsite() {
        // Add retro effect before redirect
        this.addRetroEffect();
        
        // Show redirect message
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid #00ff41;
            color: #00ff41;
            padding: 20px;
            font-family: 'Press Start 2P', cursive;
            font-size: 0.8rem;
            z-index: 1000;
            text-align: center;
            box-shadow: 0 0 30px rgba(0, 255, 65, 0.5);
            animation: pulse 0.5s ease-in-out;
        `;
        message.innerHTML = `
            <div style="margin-bottom: 10px;">🌐</div>
            <div>REDIRECTING...</div>
            <div style="font-size: 0.6rem; margin-top: 10px; color: #fff;">Clicking orb takes you to another dimension!</div>
        `;
        
        document.body.appendChild(message);
        
        // Redirect after 2 seconds
        setTimeout(() => {
            // You can change this URL to any website you want
            window.open('https://www.google.com', '_blank');
            message.remove();
        }, 2000);
    }

    getFatalityComment(rate) {
        if (rate <= 10) return "Barely scratched! You’ll walk it off… probably.";
        if (rate <= 20) return "Eh, just a flesh wound. Keep going!";
        if (rate <= 30) return "Ouch… might need more than a band-aid now.";
        if (rate <= 40) return "Starting to look like a bad day at the office.";
        if (rate <= 50) return "Halfway to haunting the living!";
        if (rate <= 60) return "Doctors are writing *very* concerned notes.";
        if (rate <= 70) return "You’re on first-name terms with the Grim Reaper.";
        if (rate <= 80) return "Reaper’s getting the paperwork ready…";
        if (rate <= 90) return "Don’t buy green bananas…";
        return "Game over, man! GAME OVER!";
    }
}

// Add CSS animations for particles and notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes particleFloat {
        0% {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translateY(-50px) scale(0);
            opacity: 0;
        }
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0% {
            transform: translate(-50%, -50%) scale(1);
        }
        50% {
            transform: translate(-50%, -50%) scale(1.1);
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
        }
    }
`;
document.head.appendChild(style);

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new SlipFallCalculator();
    
    // Add some retro startup effects
    const title = document.querySelector('.title');
    title.style.opacity = '0';
    title.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        title.style.transition = 'all 1s ease-out';
        title.style.opacity = '1';
        title.style.transform = 'translateY(0)';
    }, 500);
    
    // Make calculator globally available for API key setting
    window.calculator = calculator;
    
    // Add command to set Roboflow API key
    window.setRoboflowApiKey = function(apiKey) {
        calculator.aiHelper.setApiKey(apiKey);
        console.log('✅ Roboflow API key set successfully!');
        return 'API key configured. You can now upload images for AI analysis.';
    };
    
    console.log('🎮 Slip & Fall Calculator loaded!');
    console.log('💡 To enable AI analysis, run: setRoboflowApiKey("your-roboflow-api-key")');
});

// Camera/photo logic
let capturedPhotoDataURL = null;

// Add a hidden file input for camera capture
const cameraInput = document.createElement('input');
cameraInput.type = 'file';
cameraInput.accept = 'image/*';
cameraInput.capture = 'environment'; // Use rear camera if available
cameraInput.style.display = 'none';
document.body.appendChild(cameraInput);

// Add a button to trigger camera capture when setting a tombstone
function createTombstone(pos){
  const t = document.createElement('div');
  t.className = 'tombstone';
  t.style.cssText = `position:absolute;left:${pos.x}px;top:${pos.y}px;width:60px;height:80px;background:#222;border-radius:8px;padding:4px 8px;color:#fff;font-family:monospace;font-size:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(0,255,65,0.5);`;

  const nameEl = document.createElement('div');
  nameEl.className = 'tombstone-name';
  nameEl.textContent = "Unknown Hero";
  t.appendChild(nameEl);

  const dateEl = document.createElement('div');
  dateEl.className = 'tombstone-date';
  dateEl.textContent = "????-????";
  t.appendChild(dateEl);

  const msgEl = document.createElement('div');
  msgEl.className = 'tombstone-message';
  msgEl.textContent = "Slipped Away";
  t.appendChild(msgEl);

  // Camera/photo for this tombstone only
  let tombstonePhoto = null;

  // Camera button (visible inside tombstone)
  const cameraBtn = document.createElement('button');
  cameraBtn.textContent = "📸";
  cameraBtn.title = "Take Photo";
  cameraBtn.style.cssText = "margin-top:6px;font-size:16px;padding:2px 8px;border-radius:6px;border:none;background:#333;color:#fff;cursor:pointer;";
  t.appendChild(cameraBtn);

  // Hidden file input for camera
  const cameraInput = document.createElement('input');
  cameraInput.type = 'file';
  cameraInput.accept = 'image/*';
  cameraInput.capture = 'environment';
  cameraInput.style.display = 'none';
  t.appendChild(cameraInput);

  cameraBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    cameraInput.value = ""; // reset previous
    cameraInput.click();
  });

  cameraInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        tombstonePhoto = evt.target.result;
        cameraBtn.textContent = "✅";
        cameraBtn.style.background = "#1976d2";
      };
      reader.readAsDataURL(file);
    }
  });

  t.addEventListener('click', () => {
    // Show popup
    document.getElementById('popup').style.display = 'flex';
    const popupText = document.getElementById('popup-text');
    const popupImg = document.getElementById('popup-img');

    popupText.innerHTML = `<strong>${nameEl.textContent}</strong><br>${dateEl.textContent}<br><em>${msgEl.textContent}</em>`;

    // Show captured photo if available
    if (tombstonePhoto) {
      popupImg.src = tombstonePhoto;
      popupImg.style.display = 'block';
    } else {
      popupImg.style.display = 'none';
    }
  });

  return t;
}

// Simulation code for stickman and object
const canvas = document.getElementById("simulationCanvas");
const ctx = canvas.getContext("2d");

let stickmanX = 50;
let stickmanY = 0;
let stickmanAngle = 0;
let slipping = false;
let falling = false;
let stickmanSpeed = 2;

let surfaceImg = null;
let objectImg = null;

const groundHeight = 60;
const groundY = canvas.height - groundHeight;

let objectX = 250;
let objectWidth = 40;
let objectHeight = 30;
let objectY = groundY - objectHeight;

// Handle surface upload
document.getElementById("surfaceInput").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
        surfaceImg = new Image();
        surfaceImg.src = evt.target.result;
    };
    reader.readAsDataURL(file);
});

// Handle object upload
document.getElementById("objectInput").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
        objectImg = new Image();
        objectImg.src = evt.target.result;
    };
    reader.readAsDataURL(file);
});

// Start simulation
document.getElementById("runSimulation").addEventListener("click", () => {
    stickmanX = 50;
    stickmanY = groundY - 20;
    stickmanAngle = 0;
    slipping = false;
    falling = false;
    stickmanSpeed = 2;
    animate();
});

function drawGround() {
    if (surfaceImg) {
        ctx.drawImage(surfaceImg, 0, groundY, canvas.width, groundHeight);
    } else {
        ctx.fillStyle = "#555";
        ctx.fillRect(0, groundY, canvas.width, groundHeight);
    }
}

function drawStickman(x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;

    // Head
    ctx.beginPath();
    ctx.arc(0, -20, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Body
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 20);
    ctx.stroke();

    // Arms
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-15, 10);
    ctx.moveTo(0, 0);
    ctx.lineTo(15, 10);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(-10, 40);
    ctx.moveTo(0, 20);
    ctx.lineTo(10, 40);
    ctx.stroke();

    ctx.restore();
}

function drawObject() {
    if (objectImg) {
        ctx.drawImage(objectImg, objectX, objectY, objectWidth, objectHeight);
    } else {
        ctx.fillStyle = "red";
        ctx.fillRect(objectX, objectY, objectWidth, objectHeight);
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGround();
    drawObject();
    drawStickman(stickmanX, stickmanY, stickmanAngle);

    if (!slipping && !falling) {
        stickmanX += stickmanSpeed;

        // Collision detection
        if (
            stickmanX + 5 > objectX &&
            stickmanX - 5 < objectX + objectWidth
        ) {
            slipping = true;
        }
    } else if (slipping) {
        stickmanSpeed = Math.max(0, stickmanSpeed - 0.1);
        stickmanAngle += 0.05;

        if (stickmanAngle >= Math.PI / 2) { // 90 degrees
            stickmanAngle = Math.PI / 2;
            slipping = false;
            falling = true;
        }
    } else if (falling) {
        stickmanSpeed = 0;
        // Stickman stays lying down
    }

    stickmanY = groundY - 20; // Always on ground

    if (stickmanX < canvas.width + 50) {
        requestAnimationFrame(animate);
    }
}
