// 3D Effects using Three.js
import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';

class ThreeJSEffects {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.models = new Map();
        this.animations = new Map();
        this.mixer = null;
        this.clock = new THREE.Clock();
    }

    async initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Setup renderer
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.z = 5;
        this.camera.position.y = 2;

        // Add controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Add lights
        this.setupLights();

        // Add event listeners
        window.addEventListener('resize', () => this.onWindowResize(container));

        // Start animation loop
        this.animate();

        // Load models
        await this.loadModels();
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x64ffda, 0.5);
        this.scene.add(ambientLight);

        // Directional light
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 5, 5);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        // Point lights
        const colors = [0x64ffda, 0xbd93f9, 0xff79c6];
        colors.forEach((color, index) => {
            const light = new THREE.PointLight(color, 1, 10);
            light.position.set(
                Math.cos(index * Math.PI * 2 / 3) * 3,
                2,
                Math.sin(index * Math.PI * 2 / 3) * 3
            );
            this.scene.add(light);
        });
    }

    async loadModels() {
        const loader = new GLTFLoader();

        try {
            // Load floating cubes
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshPhongMaterial({
                color: 0x64ffda,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });

            for (let i = 0; i < 10; i++) {
                const cube = new THREE.Mesh(geometry, material);
                cube.position.set(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10
                );
                cube.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                this.scene.add(cube);
                this.models.set(`cube_${i}`, cube);
            }

            // Add particles
            const particlesGeometry = new THREE.BufferGeometry();
            const particleCount = 1000;
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);

            for (let i = 0; i < particleCount * 3; i += 3) {
                // Positions
                positions[i] = (Math.random() - 0.5) * 20;
                positions[i + 1] = (Math.random() - 0.5) * 20;
                positions[i + 2] = (Math.random() - 0.5) * 20;

                // Colors
                colors[i] = Math.random();
                colors[i + 1] = Math.random();
                colors[i + 2] = Math.random();
            }

            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const particlesMaterial = new THREE.PointsMaterial({
                size: 0.1,
                vertexColors: true,
                transparent: true,
                opacity: 0.8
            });

            const particles = new THREE.Points(particlesGeometry, particlesMaterial);
            this.scene.add(particles);
            this.models.set('particles', particles);

        } catch (error) {
            console.error('Error loading models:', error);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update controls
        this.controls.update();

        // Rotate cubes
        this.models.forEach((model, key) => {
            if (key.startsWith('cube_')) {
                model.rotation.x += 0.01;
                model.rotation.y += 0.01;
            }
        });

        // Update animations
        if (this.mixer) {
            this.mixer.update(this.clock.getDelta());
        }

        // Update particles
        const particles = this.models.get('particles');
        if (particles) {
            particles.rotation.y += 0.001;
            
            const positions = particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += Math.sin(Date.now() * 0.001 + positions[i]) * 0.01;
            }
            particles.geometry.attributes.position.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize(container) {
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    // Add interactive elements
    addInteractiveElements() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        window.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.scene.children);

            this.scene.children.forEach(object => {
                if (object.material) {
                    object.material.emissive = new THREE.Color(0x000000);
                }
            });

            intersects.forEach(intersect => {
                if (intersect.object.material) {
                    intersect.object.material.emissive = new THREE.Color(0x64ffda);
                }
            });
        });
    }
}

export { ThreeJSEffects };