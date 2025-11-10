// Advanced Animations Module
class AnimationController {
    constructor() {
        this.animations = new Map();
        this.initialize();
    }

    initialize() {
        this.setupIntersectionObserver();
        this.setupScrollAnimations();
        this.setupHoverEffects();
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const animation = element.dataset.animate;
                    if (animation) {
                        this.playAnimation(element, animation);
                    }
                }
            });
        }, options);

        document.querySelectorAll('[data-animate]').forEach(element => {
            observer.observe(element);
        });
    }

    setupScrollAnimations() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        window.addEventListener('scroll', () => {
            requestAnimationFrame(() => {
                parallaxElements.forEach(element => {
                    const speed = element.dataset.parallax || 0.5;
                    const rect = element.getBoundingClientRect();
                    const scrolled = window.pageYOffset;
                    
                    element.style.transform = `translate3d(0, ${scrolled * speed}px, 0)`;
                });
            });
        });
    }

    setupHoverEffects() {
        document.querySelectorAll('[data-hover]').forEach(element => {
            element.addEventListener('mouseenter', () => {
                const effect = element.dataset.hover;
                this.playHoverEffect(element, effect);
            });

            element.addEventListener('mouseleave', () => {
                this.removeHoverEffect(element);
            });
        });
    }

    playAnimation(element, animationType) {
        const animations = {
            fadeIn: {
                keyframes: [
                    { opacity: 0, transform: 'translateY(20px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ],
                options: {
                    duration: 800,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    fill: 'forwards'
                }
            },
            scale: {
                keyframes: [
                    { transform: 'scale(0.8)', opacity: 0 },
                    { transform: 'scale(1)', opacity: 1 }
                ],
                options: {
                    duration: 600,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    fill: 'forwards'
                }
            },
            slideIn: {
                keyframes: [
                    { transform: 'translateX(-100px)', opacity: 0 },
                    { transform: 'translateX(0)', opacity: 1 }
                ],
                options: {
                    duration: 700,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    fill: 'forwards'
                }
            }
        };

        const animation = animations[animationType];
        if (animation) {
            element.animate(animation.keyframes, animation.options);
        }
    }

    playHoverEffect(element, effectType) {
        const effects = {
            glow: {
                keyframes: [
                    { boxShadow: '0 0 0 rgba(52, 152, 219, 0)' },
                    { boxShadow: '0 0 20px rgba(52, 152, 219, 0.5)' }
                ],
                options: {
                    duration: 300,
                    fill: 'forwards'
                }
            },
            pulse: {
                keyframes: [
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.05)' }
                ],
                options: {
                    duration: 200,
                    fill: 'forwards'
                }
            },
            shimmer: {
                keyframes: [
                    { backgroundPosition: '200% 0' },
                    { backgroundPosition: '-200% 0' }
                ],
                options: {
                    duration: 1500,
                    iterations: Infinity
                }
            }
        };

        const effect = effects[effectType];
        if (effect) {
            const animation = element.animate(effect.keyframes, effect.options);
            this.animations.set(element, animation);
        }
    }

    removeHoverEffect(element) {
        const animation = this.animations.get(element);
        if (animation) {
            animation.cancel();
            this.animations.delete(element);
        }
    }
}

export { AnimationController };