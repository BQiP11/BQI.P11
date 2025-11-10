// WebGL background animation controller
class BackgroundController {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'background-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            pointer-events: none;
        `;
        document.body.appendChild(this.canvas);

        this.gl = this.canvas.getContext('webgl');
        this.particles = [];
        this.numParticles = 100;
        
        this.initShaders();
        this.initParticles();
        this.resize();
        this.animate();

        window.addEventListener('resize', () => this.resize());
    }

    // Initialize WebGL shaders
    initShaders() {
        // Vertex shader
        const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vertexShader, `
            attribute vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
                gl_PointSize = 2.0;
            }
        `);
        this.gl.compileShader(vertexShader);

        // Fragment shader
        const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(fragmentShader, `
            precision mediump float;
            void main() {
                gl_FragColor = vec4(1.0, 1.0, 1.0, 0.5);
            }
        `);
        this.gl.compileShader(fragmentShader);

        // Create program
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        this.gl.useProgram(this.program);
    }

    // Initialize particles
    initParticles() {
        for (let i = 0; i < this.numParticles; i++) {
            this.particles.push({
                x: Math.random() * 2 - 1,
                y: Math.random() * 2 - 1,
                vx: (Math.random() - 0.5) * 0.01,
                vy: (Math.random() - 0.5) * 0.01
            });
        }

        this.positionBuffer = this.gl.createBuffer();
    }

    // Update particle positions
    updateParticles() {
        for (let particle of this.particles) {
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Bounce off walls
            if (particle.x > 1 || particle.x < -1) particle.vx *= -1;
            if (particle.y > 1 || particle.y < -1) particle.vy *= -1;
        }

        // Update buffer data
        const positions = new Float32Array(this.particles.flatMap(p => [p.x, p.y]));
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
    }

    // Render frame
    render() {
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        const positionLocation = this.gl.getAttribLocation(this.program, 'position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.drawArrays(this.gl.POINTS, 0, this.numParticles);
    }

    // Animation loop
    animate() {
        this.updateParticles();
        this.render();
        requestAnimationFrame(() => this.animate());
    }

    // Handle resize
    resize() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

// Audio visualization controller
class AudioController {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'audio-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100px;
            pointer-events: none;
        `;
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    // Connect audio source
    async connectAudio(source) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioSource = this.audioContext.createMediaStreamSource(stream);
            audioSource.connect(this.analyser);
            this.startVisualization();
        } catch (error) {
            console.error('Audio initialization failed:', error);
        }
    }

    // Start visualization
    startVisualization() {
        const draw = () => {
            this.analyser.getByteFrequencyData(this.dataArray);
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            const barWidth = this.canvas.width / this.analyser.frequencyBinCount;
            const barHeight = this.canvas.height;
            
            this.ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
            
            for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
                const x = i * barWidth;
                const height = (this.dataArray[i] / 255) * barHeight;
                
                this.ctx.fillRect(x, this.canvas.height - height, barWidth - 1, height);
            }
            
            requestAnimationFrame(draw);
        };
        
        draw();
    }

    // Handle resize
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = 100;
    }
}

// Gesture controller for touch interactions
class GestureController {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.initialPinchDistance = 0;
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }

    // Handle touch start
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            this.initialPinchDistance = this.getPinchDistance(e);
        }
    }

    // Handle touch move
    handleTouchMove(e) {
        if (e.touches.length === 1) {
            const deltaX = e.touches[0].clientX - this.touchStartX;
            const deltaY = e.touches[0].clientY - this.touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 50) {
                    this.emit('swipeRight');
                } else if (deltaX < -50) {
                    this.emit('swipeLeft');
                }
            } else {
                // Vertical swipe
                if (deltaY > 50) {
                    this.emit('swipeDown');
                } else if (deltaY < -50) {
                    this.emit('swipeUp');
                }
            }
        } else if (e.touches.length === 2) {
            const currentDistance = this.getPinchDistance(e);
            const scale = currentDistance / this.initialPinchDistance;
            
            if (scale > 1.1) {
                this.emit('pinchOut');
            } else if (scale < 0.9) {
                this.emit('pinchIn');
            }
        }
    }

    // Handle touch end
    handleTouchEnd(e) {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.initialPinchDistance = 0;
    }

    // Calculate pinch distance
    getPinchDistance(e) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Emit gesture event
    emit(eventName, detail = {}) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
}

// Export controllers
export const backgroundController = new BackgroundController();
export const audioController = new AudioController();
export const gestureController = new GestureController();