class SessionManager {
    constructor() {
        this.storageKey = 'mojicode_session';
        this.timeoutKey = 'mojicode_timeout';
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    }

    // Create new session
    createSession(userData) {
        const session = {
            user: userData,
            token: this.generateToken(),
            createdAt: Date.now(),
            expiresAt: Date.now() + this.sessionTimeout
        };

        localStorage.setItem(this.storageKey, JSON.stringify(session));
        this.setSessionTimeout(session.expiresAt);
    }

    // Get current session
    getSession() {
        const sessionData = localStorage.getItem(this.storageKey);
        if (!sessionData) return null;

        const session = JSON.parse(sessionData);
        if (Date.now() > session.expiresAt) {
            this.clearSession();
            return null;
        }

        return session;
    }

    // Check if user is logged in
    isLoggedIn() {
        const session = this.getSession();
        return session !== null;
    }

    // Get current user
    getCurrentUser() {
        const session = this.getSession();
        return session ? session.user : null;
    }

    // Clear session
    clearSession() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.timeoutKey);
        clearTimeout(this.timeout);
    }

    // Extend session
    extendSession() {
        const session = this.getSession();
        if (session) {
            session.expiresAt = Date.now() + this.sessionTimeout;
            localStorage.setItem(this.storageKey, JSON.stringify(session));
            this.setSessionTimeout(session.expiresAt);
        }
    }

    // Set session timeout
    setSessionTimeout(expiresAt) {
        const timeoutDuration = expiresAt - Date.now();
        clearTimeout(this.timeout);
        
        this.timeout = setTimeout(() => {
            this.clearSession();
            window.dispatchEvent(new CustomEvent('sessionExpired'));
        }, timeoutDuration);

        localStorage.setItem(this.timeoutKey, expiresAt.toString());
    }

    // Generate session token
    generateToken() {
        return Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Handle activity to extend session
    setupActivityTracking() {
        ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(event => {
            window.addEventListener(event, () => this.extendSession());
        });
    }
}

// Export session manager instance
export const sessionManager = new SessionManager();