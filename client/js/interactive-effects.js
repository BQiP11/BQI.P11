// Parallax effect controller
class ParallaxController {
    constructor() {
        this.elements = document.querySelectorAll('.parallax-element');
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        // Also handle device orientation for mobile
        window.addEventListener('deviceorientation', (e) => this.handleDeviceOrientation(e));
    }

    handleMouseMove(e) {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        this.updateElements(
            (centerX - clientX) / centerX,
            (centerY - clientY) / centerY
        );
    }

    handleDeviceOrientation(e) {
        if (!e.gamma || !e.beta) return;
        
        // Convert angles to movement ratios
        const x = e.gamma / 45; // -1 to 1 for +/-45 degrees
        const y = (e.beta - 45) / 45; // -1 to 1 for 0 to 90 degrees
        
        this.updateElements(x, y);
    }

    updateElements(ratioX, ratioY) {
        this.elements.forEach(element => {
            const speed = element.getAttribute('data-speed') || 1;
            const depth = element.getAttribute('data-depth') || 1;
            const x = ratioX * speed * 50 * depth;
            const y = ratioY * speed * 50 * depth;
            
            element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        });
    }
}

// Scroll reveal controller
class ScrollRevealController {
    constructor(options = {}) {
        this.options = {
            threshold: options.threshold || 0.1,
            rootMargin: options.rootMargin || '0px',
            animationClass: options.animationClass || 'visible'
        };

        this.elements = document.querySelectorAll('.scroll-reveal');
        this.setupObserver();
    }

    setupObserver() {
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            this.options
        );

        this.elements.forEach(element => {
            // Set initial state
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            this.observer.observe(element);
        });
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add(this.options.animationClass);
                // Stop observing after animation
                this.observer.unobserve(entry.target);
            }
        });
    }
}

// Interactive effects controller
class InteractiveEffectsController {
    constructor() {
        this.setupRippleEffect();
        this.setupHoverEffects();
        this.setupImageEffects();
    }

    setupRippleEffect() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('ripple')) {
                this.createRipple(e);
            }
        });
    }

    createRipple(e) {
        const element = e.target;
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('span');
        
        ripple.className = 'ripple-effect';
        const size = Math.max(element.clientWidth, element.clientHeight);
        ripple.style.width = ripple.style.height = `${size}px`;
        
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        
        // Remove existing ripples
        const existingRipple = element.querySelector('.ripple-effect');
        if (existingRipple) {
            existingRipple.remove();
        }
        
        element.appendChild(ripple);
        
        // Remove ripple after animation
        ripple.addEventListener('animationend', () => ripple.remove());
    }

    setupHoverEffects() {
        const hoverElements = document.querySelectorAll('.hover-effect');
        
        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const effect = element.getAttribute('data-hover-effect');
                if (effect) {
                    element.style.animation = effect;
                }
            });
            
            element.addEventListener('mouseleave', (e) => {
                element.style.animation = 'none';
            });
        });
    }

    setupImageEffects() {
        const images = document.querySelectorAll('.image-effect');
        
        images.forEach(img => {
            img.addEventListener('mouseenter', (e) => {
                img.style.transform = 'scale(1.05)';
                img.style.filter = 'brightness(1.1)';
            });
            
            img.addEventListener('mouseleave', (e) => {
                img.style.transform = 'scale(1)';
                img.style.filter = 'brightness(1)';
            });
        });
    }
}

// Theme transition controller
class ThemeTransitionController {
    constructor() {
        this.setupThemeTransitions();
    }

    setupThemeTransitions() {
        const themeToggles = document.querySelectorAll('.theme-toggle');
        
        themeToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
                document.documentElement.classList.toggle('dark-theme');
                
                // Reset transition after it completes
                setTimeout(() => {
                    document.body.style.transition = '';
                }, 300);
            });
        });
    }
}

// Initialize all effects
document.addEventListener('DOMContentLoaded', () => {
    // Initialize parallax effect
    if (document.querySelectorAll('.parallax-element').length > 0) {
        window.parallaxController = new ParallaxController();
    }
    
    // Initialize scroll reveal
    if (document.querySelectorAll('.scroll-reveal').length > 0) {
        window.scrollRevealController = new ScrollRevealController();
    }
    
    // Initialize interactive effects
    window.interactiveEffectsController = new InteractiveEffectsController();
    
    // Initialize theme transitions
    window.themeTransitionController = new ThemeTransitionController();
});

// Export controllers
export const initializeEffects = () => {
    if (!window.parallaxController && document.querySelectorAll('.parallax-element').length > 0) {
        window.parallaxController = new ParallaxController();
    }
    
    if (!window.scrollRevealController && document.querySelectorAll('.scroll-reveal').length > 0) {
        window.scrollRevealController = new ScrollRevealController();
    }
    
    if (!window.interactiveEffectsController) {
        window.interactiveEffectsController = new InteractiveEffectsController();
    }
    
    if (!window.themeTransitionController) {
        window.themeTransitionController = new ThemeTransitionController();
    }
};