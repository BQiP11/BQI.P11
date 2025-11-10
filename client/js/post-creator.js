// Post creation module with AI assistance
class PostCreator {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            autoSave: true,
            aiAssist: true,
            maxImageSize: 5 * 1024 * 1024, // 5MB
            maxVideoSize: 50 * 1024 * 1024, // 50MB
            ...options
        };

        this.editor = null;
        this.currentPost = {
            id: null,
            title: '',
            content: '',
            media: [],
            tags: [],
            analysis: null
        };

        this.init();
    }

    init() {
        this.createUI();
        this.setupEditor();
        this.setupEventListeners();
        if (this.options.autoSave) {
            this.setupAutoSave();
        }
    }

    createUI() {
        this.container.innerHTML = `
            <div class="post-creator">
                <div class="post-header">
                    <input type="text" class="post-title" placeholder="Post title...">
                    <div class="post-actions">
                        <button class="btn-draft">Save Draft</button>
                        <button class="btn-publish">Publish</button>
                    </div>
                </div>
                
                <div class="editor-container"></div>
                
                <div class="post-footer">
                    <div class="tags-container">
                        <input type="text" class="tag-input" placeholder="Add tags...">
                        <div class="tags-list"></div>
                    </div>
                    
                    <div class="ai-suggestions" style="display: none">
                        <h3>AI Suggestions</h3>
                        <div class="suggestion-content"></div>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .post-creator {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }

            .post-header {
                margin-bottom: 20px;
                display: flex;
                gap: 20px;
                align-items: center;
            }

            .post-title {
                flex: 1;
                font-size: 24px;
                padding: 10px;
                border: none;
                border-bottom: 2px solid #eee;
                outline: none;
                transition: border-color 0.3s;
            }

            .post-title:focus {
                border-color: var(--primary-color);
            }

            .post-actions {
                display: flex;
                gap: 10px;
            }

            .post-actions button {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s;
            }

            .btn-draft {
                background: #f8f9fa;
                color: #333;
            }

            .btn-publish {
                background: var(--primary-color);
                color: white;
            }

            .btn-draft:hover {
                background: #e9ecef;
            }

            .btn-publish:hover {
                opacity: 0.9;
            }

            .editor-container {
                margin-bottom: 20px;
                border-radius: 4px;
                overflow: hidden;
            }

            .post-footer {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .tags-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .tag-input {
                padding: 8px;
                border: 1px solid #eee;
                border-radius: 4px;
                outline: none;
            }

            .tags-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .tag {
                background: #f8f9fa;
                padding: 4px 8px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .tag button {
                border: none;
                background: none;
                color: #666;
                cursor: pointer;
                padding: 0;
                font-size: 14px;
            }

            .ai-suggestions {
                background: #f8f9fa;
                padding: 16px;
                border-radius: 4px;
            }

            .suggestion-content {
                font-size: 14px;
                color: #666;
            }

            .suggestion-item {
                margin: 8px 0;
                padding: 8px;
                background: white;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .suggestion-item:hover {
                background: #f1f3f5;
            }

            @media (max-width: 768px) {
                .post-header {
                    flex-direction: column;
                    gap: 10px;
                }

                .post-actions {
                    width: 100%;
                }

                .post-actions button {
                    flex: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupEditor() {
        const editorContainer = this.container.querySelector('.editor-container');
        editorContainer.id = 'post-editor-' + Date.now();
        
        this.editor = new MediaEditor(editorContainer.id, {
            placeholder: 'Write your post...',
            autosave: true
        });
    }

    setupEventListeners() {
        // Title input
        const titleInput = this.container.querySelector('.post-title');
        titleInput.addEventListener('input', () => {
            this.currentPost.title = titleInput.value;
            this.handleContentChange();
        });

        // Tags input
        const tagInput = this.container.querySelector('.tag-input');
        tagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && tagInput.value.trim()) {
                this.addTag(tagInput.value.trim());
                tagInput.value = '';
            }
        });

        // Editor changes
        this.container.addEventListener('editor-change', (e) => {
            this.currentPost.content = e.detail.html;
            this.currentPost.media = e.detail.media;
            this.handleContentChange();
        });

        // Action buttons
        this.container.querySelector('.btn-draft').addEventListener('click', () => {
            this.saveDraft();
        });

        this.container.querySelector('.btn-publish').addEventListener('click', () => {
            this.publish();
        });
    }

    setupAutoSave() {
        setInterval(() => {
            if (this.hasUnsavedChanges) {
                this.saveDraft();
            }
        }, 30000); // Auto-save every 30 seconds
    }

    async handleContentChange() {
        this.hasUnsavedChanges = true;

        if (this.options.aiAssist) {
            // Debounce AI analysis
            clearTimeout(this.analysisTimeout);
            this.analysisTimeout = setTimeout(() => {
                this.analyzeContent();
            }, 1000);
        }
    }

    async analyzeContent() {
        const content = this.currentPost.content;
        if (!content) {
            this.hideSuggestions();
            return;
        }

        try {
            // Get AI analysis
            const analysis = await ai.analyzeContent(content);
            this.currentPost.analysis = analysis;

            // Get suggestions
            const suggestions = await ai.getSuggestions(content);
            
            // Update UI
            this.showSuggestions(suggestions);
        } catch (error) {
            console.error('Content analysis failed:', error);
            this.hideSuggestions();
        }
    }

    showSuggestions(suggestions) {
        const suggestionsContainer = this.container.querySelector('.ai-suggestions');
        const suggestionsContent = suggestionsContainer.querySelector('.suggestion-content');
        
        suggestionsContent.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item">
                ${suggestion}
            </div>
        `).join('');

        suggestionsContainer.style.display = 'block';

        // Make suggestions clickable
        suggestionsContent.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.applySuggestion(item.textContent);
            });
        });
    }

    hideSuggestions() {
        this.container.querySelector('.ai-suggestions').style.display = 'none';
    }

    applySuggestion(suggestion) {
        // Implement suggestion application logic
        // This could modify the title, content, or tags based on the suggestion
    }

    addTag(tag) {
        if (!this.currentPost.tags.includes(tag)) {
            this.currentPost.tags.push(tag);
            this.updateTagsUI();
        }
    }

    removeTag(tag) {
        const index = this.currentPost.tags.indexOf(tag);
        if (index > -1) {
            this.currentPost.tags.splice(index, 1);
            this.updateTagsUI();
        }
    }

    updateTagsUI() {
        const tagsList = this.container.querySelector('.tags-list');
        tagsList.innerHTML = this.currentPost.tags.map(tag => `
            <div class="tag">
                ${tag}
                <button onclick="this.closest('.tag').remove(); postCreator.removeTag('${tag}')">×</button>
            </div>
        `).join('');
    }

    async saveDraft() {
        try {
            // Save to IndexedDB
            const draftId = await db.create('drafts', {
                ...this.currentPost,
                updatedAt: Date.now()
            });

            this.currentPost.id = draftId;
            this.hasUnsavedChanges = false;

            // Show success message
            this.showNotification('Draft saved successfully');
        } catch (error) {
            console.error('Failed to save draft:', error);
            this.showNotification('Failed to save draft', 'error');
        }
    }

    async publish() {
        try {
            // Validate post
            if (!this.validatePost()) {
                return;
            }

            // Process media files
            const mediaUrls = await this.processMediaFiles();

            // Create post in database
            const post = {
                ...this.currentPost,
                media: mediaUrls,
                publishedAt: Date.now(),
                status: 'published'
            };

            const postId = await db.create('posts', post);

            // Delete draft if it exists
            if (this.currentPost.id) {
                await db.delete('drafts', this.currentPost.id);
            }

            this.hasUnsavedChanges = false;
            this.showNotification('Post published successfully');
            this.clear();
        } catch (error) {
            console.error('Failed to publish post:', error);
            this.showNotification('Failed to publish post', 'error');
        }
    }

    validatePost() {
        if (!this.currentPost.title.trim()) {
            this.showNotification('Please add a title', 'error');
            return false;
        }

        if (!this.currentPost.content.trim()) {
            this.showNotification('Please add some content', 'error');
            return false;
        }

        return true;
    }

    async processMediaFiles() {
        const mediaUrls = [];

        for (const media of this.currentPost.media) {
            try {
                // Upload to storage and get URL
                const url = await this.uploadMedia(media.file);
                mediaUrls.push({
                    id: media.id,
                    url,
                    type: media.type
                });
            } catch (error) {
                console.error('Failed to process media:', error);
                throw error;
            }
        }

        return mediaUrls;
    }

    async uploadMedia(file) {
        // Implement media upload logic
        // This could upload to a server or store in IndexedDB
        return URL.createObjectURL(file); // Temporary solution
    }

    showNotification(message, type = 'success') {
        // Implement notification display logic
        console.log(`${type}: ${message}`);
    }

    clear() {
        this.currentPost = {
            id: null,
            title: '',
            content: '',
            media: [],
            tags: [],
            analysis: null
        };

        this.container.querySelector('.post-title').value = '';
        this.editor.clear();
        this.updateTagsUI();
        this.hideSuggestions();
    }

    destroy() {
        if (this.hasUnsavedChanges) {
            this.saveDraft();
        }
        this.editor.destroy();
        this.container.innerHTML = '';
    }
}

// Export post creator
export { PostCreator };