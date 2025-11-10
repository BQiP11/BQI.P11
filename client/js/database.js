// Database manager for client-side storage
class Database {
    constructor() {
        this.dbName = 'mojiCodeDB';
        this.dbVersion = 1;
        this.initDatabase();
    }

    // Initialize database
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                reject('Database error: ' + event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create users store
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'email' });
                    userStore.createIndex('name', ['firstName', 'lastName'], { unique: false });
                    userStore.createIndex('email', 'email', { unique: true });
                }

                // Create posts store
                if (!db.objectStoreNames.contains('posts')) {
                    const postStore = db.createObjectStore('posts', { keyPath: 'id', autoIncrement: true });
                    postStore.createIndex('author', 'authorEmail', { unique: false });
                    postStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Create media store
                if (!db.objectStoreNames.contains('media')) {
                    const mediaStore = db.createObjectStore('media', { keyPath: 'id', autoIncrement: true });
                    mediaStore.createIndex('owner', 'ownerEmail', { unique: false });
                    mediaStore.createIndex('type', 'type', { unique: false });
                }

                // Create comments store
                if (!db.objectStoreNames.contains('comments')) {
                    const commentStore = db.createObjectStore('comments', { keyPath: 'id', autoIncrement: true });
                    commentStore.createIndex('post', 'postId', { unique: false });
                    commentStore.createIndex('author', 'authorEmail', { unique: false });
                }

                // Create likes store
                if (!db.objectStoreNames.contains('likes')) {
                    const likeStore = db.createObjectStore('likes', { keyPath: 'id', autoIncrement: true });
                    likeStore.createIndex('post', 'postId', { unique: false });
                    likeStore.createIndex('user', 'userEmail', { unique: false });
                }

                // Create followers store
                if (!db.objectStoreNames.contains('followers')) {
                    const followerStore = db.createObjectStore('followers', { keyPath: 'id', autoIncrement: true });
                    followerStore.createIndex('follower', 'followerEmail', { unique: false });
                    followerStore.createIndex('following', 'followingEmail', { unique: false });
                }
            };
        });
    }

    // User operations
    async createUser(userData) {
        // Hash password before storing
        const hashedPassword = await this.hashPassword(userData.password);
        
        const user = {
            ...userData,
            password: hashedPassword,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        return this.addToStore('users', user);
    }

    async authenticateUser(email, password) {
        const user = await this.getFromStore('users', email);
        if (!user) {
            throw new Error('User not found');
        }

        const isValid = await this.verifyPassword(password, user.password);
        if (!isValid) {
            throw new Error('Invalid password');
        }

        // Remove password from returned user object
        delete user.password;
        return user;
    }

    async updateUser(email, updates) {
        const user = await this.getFromStore('users', email);
        if (!user) {
            throw new Error('User not found');
        }

        const updatedUser = {
            ...user,
            ...updates,
            updatedAt: Date.now()
        };

        return this.updateInStore('users', email, updatedUser);
    }

    // Post operations
    async createPost(postData) {
        const post = {
            ...postData,
            timestamp: Date.now(),
            likes: 0,
            comments: []
        };

        return this.addToStore('posts', post);
    }

    async getPosts(authorEmail = null) {
        const posts = await this.getAllFromStore('posts');
        if (authorEmail) {
            return posts.filter(post => post.authorEmail === authorEmail);
        }
        return posts;
    }

    async updatePost(postId, updates) {
        const post = await this.getFromStore('posts', postId);
        if (!post) {
            throw new Error('Post not found');
        }

        const updatedPost = {
            ...post,
            ...updates,
            updatedAt: Date.now()
        };

        return this.updateInStore('posts', postId, updatedPost);
    }

    async deletePost(postId) {
        return this.deleteFromStore('posts', postId);
    }

    // Media operations
    async storeMedia(blob, ownerEmail) {
        const media = {
            blob,
            ownerEmail,
            type: blob.type,
            size: blob.size,
            timestamp: Date.now()
        };

        return this.addToStore('media', media);
    }

    async getMedia(mediaId) {
        return this.getFromStore('media', mediaId);
    }

    async deleteMedia(mediaId) {
        return this.deleteFromStore('media', mediaId);
    }

    // Comment operations
    async addComment(comment) {
        const newComment = {
            ...comment,
            timestamp: Date.now()
        };

        return this.addToStore('comments', newComment);
    }

    async getComments(postId) {
        const comments = await this.getAllFromIndex('comments', 'post', postId);
        return comments;
    }

    // Like operations
    async toggleLike(postId, userEmail) {
        const existingLike = await this.getLike(postId, userEmail);
        
        if (existingLike) {
            await this.deleteFromStore('likes', existingLike.id);
            return false; // Unliked
        } else {
            await this.addToStore('likes', { postId, userEmail, timestamp: Date.now() });
            return true; // Liked
        }
    }

    async getLike(postId, userEmail) {
        const likes = await this.getAllFromStore('likes');
        return likes.find(like => like.postId === postId && like.userEmail === userEmail);
    }

    // Follow operations
    async toggleFollow(followerEmail, followingEmail) {
        const existingFollow = await this.getFollow(followerEmail, followingEmail);
        
        if (existingFollow) {
            await this.deleteFromStore('followers', existingFollow.id);
            return false; // Unfollowed
        } else {
            await this.addToStore('followers', {
                followerEmail,
                followingEmail,
                timestamp: Date.now()
            });
            return true; // Followed
        }
    }

    async getFollow(followerEmail, followingEmail) {
        const follows = await this.getAllFromStore('followers');
        return follows.find(f => 
            f.followerEmail === followerEmail && 
            f.followingEmail === followingEmail
        );
    }

    async getFollowers(userEmail) {
        return this.getAllFromIndex('followers', 'following', userEmail);
    }

    async getFollowing(userEmail) {
        return this.getAllFromIndex('followers', 'follower', userEmail);
    }

    // Generic store operations
    async addToStore(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getFromStore(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllFromStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllFromIndex(storeName, indexName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateInStore(storeName, key, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteFromStore(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Password hashing (using Web Crypto API)
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async verifyPassword(password, hash) {
        const hashedInput = await this.hashPassword(password);
        return hashedInput === hash;
    }
}

// Export database instance
export const db = new Database();