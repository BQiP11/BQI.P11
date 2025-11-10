// Performance Optimization Module
class PerformanceOptimizer {
    constructor() {
        this.metrics = {
            fps: 0,
            memory: {},
            network: {},
            resources: []
        };
        this.observers = new Map();
        this.initialize();
    }

    initialize() {
        // Start monitoring
        this.monitorFPS();
        this.monitorMemory();
        this.monitorNetwork();
        this.monitorResources();
        this.setupLazyLoading();
        this.setupCodeSplitting();
    }

    // FPS Monitoring
    monitorFPS() {
        let frameCount = 0;
        let lastTime = performance.now();

        const measureFPS = () => {
            const currentTime = performance.now();
            frameCount++;

            if (currentTime - lastTime >= 1000) {
                this.metrics.fps = frameCount;
                frameCount = 0;
                lastTime = currentTime;
                this.notifyObservers('fps');
            }

            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);
    }

    // Memory Monitoring
    monitorMemory() {
        if (performance.memory) {
            setInterval(() => {
                this.metrics.memory = {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
                this.notifyObservers('memory');
            }, 1000);
        }
    }

    // Network Monitoring
    monitorNetwork() {
        if (window.navigator.connection) {
            const connection = window.navigator.connection;
            this.metrics.network = {
                type: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt
            };

            connection.addEventListener('change', () => {
                this.metrics.network = {
                    type: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt
                };
                this.notifyObservers('network');
            });
        }
    }

    // Resource Monitoring
    monitorResources() {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            this.metrics.resources = entries.map(entry => ({
                name: entry.name,
                type: entry.initiatorType,
                duration: entry.duration,
                size: entry.transferSize
            }));
            this.notifyObservers('resources');
        });

        observer.observe({ entryTypes: ['resource'] });
    }

    // Lazy Loading
    setupLazyLoading() {
        // Images
        const lazyImages = document.querySelectorAll('[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));

        // Components
        const lazyComponents = document.querySelectorAll('[data-component]');
        const componentObserver = new IntersectionObserver((entries) => {
            entries.forEach(async (entry) => {
                if (entry.isIntersecting) {
                    const component = entry.target;
                    const modulePath = component.dataset.component;
                    try {
                        const module = await import(modulePath);
                        module.default(component);
                        componentObserver.unobserve(component);
                    } catch (error) {
                        console.error('Error loading component:', error);
                    }
                }
            });
        });

        lazyComponents.forEach(component => componentObserver.observe(component));
    }

    // Code Splitting
    setupCodeSplitting() {
        // Route-based code splitting
        document.addEventListener('click', async (e) => {
            const link = e.target.closest('a[data-route]');
            if (link) {
                e.preventDefault();
                const route = link.dataset.route;
                try {
                    const module = await import(`./routes/${route}.js`);
                    module.default();
                } catch (error) {
                    console.error('Error loading route:', error);
                }
            }
        });
    }

    // Resource Preloading
    preloadResources(resources) {
        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.url;
            link.as = resource.type;
            if (resource.crossorigin) {
                link.crossOrigin = resource.crossorigin;
            }
            document.head.appendChild(link);
        });
    }

    // Cache Management
    async cacheResources(resources) {
        if ('caches' in window) {
            try {
                const cache = await caches.open('app-cache-v1');
                await cache.addAll(resources);
            } catch (error) {
                console.error('Caching failed:', error);
            }
        }
    }

    // Performance Optimization
    optimizePerformance() {
        // Debounce scroll and resize events
        const debounce = (func, wait) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        };

        // Optimize scroll handlers
        const scrollHandler = debounce(() => {
            // Handle scroll events
        }, 16);

        window.addEventListener('scroll', scrollHandler, { passive: true });

        // Optimize animations
        document.querySelectorAll('.animated').forEach(element => {
            element.style.willChange = 'transform';
        });

        // Remove unnecessary event listeners
        const cleanup = () => {
            window.removeEventListener('scroll', scrollHandler);
        };

        return cleanup;
    }

    // Observer Pattern Implementation
    addObserver(metric, callback) {
        if (!this.observers.has(metric)) {
            this.observers.set(metric, new Set());
        }
        this.observers.get(metric).add(callback);
    }

    removeObserver(metric, callback) {
        if (this.observers.has(metric)) {
            this.observers.get(metric).delete(callback);
        }
    }

    notifyObservers(metric) {
        if (this.observers.has(metric)) {
            this.observers.get(metric).forEach(callback => {
                callback(this.metrics[metric]);
            });
        }
    }

    // Get Performance Metrics
    getMetrics() {
        return this.metrics;
    }

    // Check if optimization is needed
    needsOptimization() {
        return (
            this.metrics.fps < 30 ||
            (this.metrics.memory.usedJSHeapSize / this.metrics.memory.jsHeapSizeLimit) > 0.8 ||
            this.metrics.network.type === '4g' ||
            this.metrics.resources.some(r => r.duration > 1000)
        );
    }
}

// Export Performance Optimizer
export { PerformanceOptimizer };