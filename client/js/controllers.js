// Theme controller for dynamic UI customization
class ThemeController {
    constructor() {
        this.themes = {
            light: {
                '--primary-color': '#3498db',
                '--secondary-color': '#2ecc71',
                '--background-color': '#f8f9fa',
                '--text-color': '#2c3e50',
                '--border-color': '#ddd',
                '--gradient-start': '#3498db',
                '--gradient-end': '#2ecc71',
                '--card-bg': '#ffffff',
                '--shadow-color': 'rgba(0,0,0,0.1)'
            },
            dark: {
                '--primary-color': '#3498db',
                '--secondary-color': '#2ecc71',
                '--background-color': '#1a1a1a',
                '--text-color': '#ffffff',
                '--border-color': '#333',
                '--gradient-start': '#2c3e50',
                '--gradient-end': '#3498db',
                '--card-bg': '#2c2c2c',
                '--shadow-color': 'rgba(0,0,0,0.3)'
            },
            custom: {}
        };
        
        this.currentTheme = 'light';
        this.loadTheme();
        this.setupThemeListener();
    }

    // Apply theme
    applyTheme(theme) {
        const root = document.documentElement;
        const themeColors = this.themes[theme];
        
        for (const [property, value] of Object.entries(themeColors)) {
            root.style.setProperty(property, value);
        }
        
        this.currentTheme = theme;
        localStorage.setItem('preferred-theme', theme);
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    // Toggle between light and dark themes
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    // Load saved theme
    loadTheme() {
        const savedTheme = localStorage.getItem('preferred-theme');
        if (savedTheme) {
            this.applyTheme(savedTheme);
        } else {
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.applyTheme('dark');
            }
        }
    }

    // Listen for system theme changes
    setupThemeListener() {
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)')
                .addEventListener('change', e => {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                });
        }
    }

    // Create custom theme
    createCustomTheme(colors) {
        this.themes.custom = {
            ...this.themes.light,
            ...colors
        };
        this.applyTheme('custom');
    }

    // Get current theme
    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Animation controller for advanced animations
class AnimationController {
    constructor() {
        this.setupIntersectionObserver();
        this.setupScrollAnimations();
        this.setupParallaxEffects();
    }

    // Setup intersection observer for scroll animations
    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    if (entry.target.dataset.animation) {
                        this.playCustomAnimation(entry.target);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '20px'
        });

        // Observe elements
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            this.observer.observe(el);
        });
    }

    // Setup scroll-based animations
    setupScrollAnimations() {
        window.addEventListener('scroll', () => {
            requestAnimationFrame(() => {
                this.updateParallax();
                this.updateProgressBars();
                this.updateScrollIndicators();
            });
        });
    }

    // Setup parallax effects
    setupParallaxEffects() {
        this.parallaxElements = document.querySelectorAll('.parallax');
        this.updateParallax();
    }

    // Update parallax elements
    updateParallax() {
        this.parallaxElements.forEach(el => {
            const speed = el.dataset.speed || 0.5;
            const rect = el.getBoundingClientRect();
            const inView = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (inView) {
                const yPos = -(window.pageYOffset * speed);
                el.style.transform = `translate3d(0, ${yPos}px, 0)`;
            }
        });
    }

    // Update progress bars
    updateProgressBars() {
        document.querySelectorAll('.progress-bar').forEach(bar => {
            const rect = bar.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const progress = bar.dataset.progress || '0';
                bar.style.width = `${progress}%`;
            }
        });
    }

    // Update scroll indicators
    updateScrollIndicators() {
        const scrolled = window.pageYOffset;
        const height = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrolled / height) * 100;

        document.querySelectorAll('.scroll-indicator').forEach(indicator => {
            indicator.style.width = `${progress}%`;
        });
    }

    // Play custom animation
    playCustomAnimation(element) {
        const animation = element.dataset.animation;
        const duration = element.dataset.duration || '0.5s';
        const delay = element.dataset.delay || '0s';

        element.style.animation = `${animation} ${duration} ${delay}`;
    }

    // Add hover animation
    addHoverAnimation(element, type = 'scale') {
        const animations = {
            scale: {
                enter: 'transform: scale(1.05)',
                leave: 'transform: scale(1)'
            },
            glow: {
                enter: 'box-shadow: 0 0 20px var(--primary-color)',
                leave: 'box-shadow: none'
            },
            lift: {
                enter: 'transform: translateY(-5px)',
                leave: 'transform: translateY(0)'
            }
        };

        element.addEventListener('mouseenter', () => {
            element.style.cssText = animations[type].enter;
        });

        element.addEventListener('mouseleave', () => {
            element.style.cssText = animations[type].leave;
        });
    }

    // Add click animation
    addClickAnimation(element) {
        element.addEventListener('click', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            element.appendChild(ripple);
            setTimeout(() => ripple.remove(), 1000);
        });
    }

    // Add scroll animation
    addScrollAnimation(element, options = {}) {
        const defaults = {
            animation: 'fadeIn',
            duration: '0.5s',
            delay: '0s',
            threshold: 0.1
        };

        const config = { ...defaults, ...options };

        element.classList.add('animate-on-scroll');
        element.dataset.animation = config.animation;
        element.dataset.duration = config.duration;
        element.dataset.delay = config.delay;

        this.observer.observe(element);
    }
}

// Export controllers
export const themeController = new ThemeController();
export const animationController = new AnimationController();