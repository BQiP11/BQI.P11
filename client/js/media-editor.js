// Rich media editor with Markdown support and media embedding
class MediaEditor {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            placeholder: 'Start typing...',
            initialValue: '',
            autosave: true,
            autosaveInterval: 5000, // 5 seconds
            maxFileSize: 5 * 1024 * 1024, // 5MB
            allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
            ...options
        };

        this.content = this.options.initialValue;
        this.mediaFiles = new Map();
        this.undoStack = [];
        this.redoStack = [];

        this.init();
    }

    init() {
        this.createEditorUI();
        this.setupEventListeners();
        this.setupToolbar();
        if (this.options.autosave) {
            this.setupAutosave();
        }
    }

    createEditorUI() {
        this.container.innerHTML = `
            <div class="media-editor">
                <div class="editor-toolbar"></div>
                <div class="editor-content" contenteditable="true"></div>
                <div class="editor-statusbar">
                    <span class="word-count">0 words</span>
                    <span class="char-count">0 characters</span>
                </div>
            </div>
        `;

        // Add editor styles
        const style = document.createElement('style');
        style.textContent = `
            .media-editor {
                border: 1px solid #ccc;
                border-radius: 4px;
                overflow: hidden;
            }

            .editor-toolbar {
                padding: 8px;
                border-bottom: 1px solid #eee;
                background: #f8f9fa;
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
            }

            .editor-toolbar button {
                padding: 6px 12px;
                border: none;
                background: transparent;
                cursor: pointer;
                border-radius: 4px;
                transition: background-color 0.2s;
            }

            .editor-toolbar button:hover {
                background: #e9ecef;
            }

            .editor-content {
                min-height: 200px;
                padding: 16px;
                outline: none;
                overflow-y: auto;
            }

            .editor-statusbar {
                padding: 8px;
                border-top: 1px solid #eee;
                background: #f8f9fa;
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                color: #666;
            }

            .media-preview {
                max-width: 100%;
                margin: 8px 0;
                position: relative;
            }

            .media-preview img,
            .media-preview video {
                max-width: 100%;
                border-radius: 4px;
            }

            .media-preview .remove-media {
                position: absolute;
                top: 8px;
                right: 8px;
                background: rgba(0, 0, 0, 0.5);
                color: white;
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .media-preview .remove-media:hover {
                background: rgba(0, 0, 0, 0.7);
            }

            .editor-content:empty:before {
                content: attr(data-placeholder);
                color: #999;
            }
        `;
        document.head.appendChild(style);

        this.editorContent = this.container.querySelector('.editor-content');
        this.editorContent.setAttribute('data-placeholder', this.options.placeholder);
    }

    setupToolbar() {
        const toolbar = this.container.querySelector('.editor-toolbar');
        
        const tools = [
            { icon: '𝗕', command: 'bold', title: 'Bold' },
            { icon: '𝘐', command: 'italic', title: 'Italic' },
            { icon: '̲U̲', command: 'underline', title: 'Underline' },
            { icon: '≋', command: 'strikethrough', title: 'Strikethrough' },
            { type: 'separator' },
            { icon: '1.', command: 'heading-1', title: 'Heading 1' },
            { icon: '2.', command: 'heading-2', title: 'Heading 2' },
            { icon: '3.', command: 'heading-3', title: 'Heading 3' },
            { type: 'separator' },
            { icon: '•', command: 'bullet-list', title: 'Bullet List' },
            { icon: '1', command: 'number-list', title: 'Number List' },
            { type: 'separator' },
            { icon: '⚓', command: 'link', title: 'Insert Link' },
            { icon: '📷', command: 'image', title: 'Insert Image' },
            { icon: '🎥', command: 'video', title: 'Insert Video' },
            { type: 'separator' },
            { icon: '↩', command: 'undo', title: 'Undo' },
            { icon: '↪', command: 'redo', title: 'Redo' }
        ];

        tools.forEach(tool => {
            if (tool.type === 'separator') {
                toolbar.appendChild(document.createElement('span'));
                return;
            }

            const button = document.createElement('button');
            button.textContent = tool.icon;
            button.title = tool.title;
            button.dataset.command = tool.command;
            button.addEventListener('click', () => this.executeCommand(tool.command));
            toolbar.appendChild(button);
        });
    }

    setupEventListeners() {
        // Handle content changes
        this.editorContent.addEventListener('input', () => {
            this.saveToHistory();
            this.updateWordCount();
            this.content = this.editorContent.innerHTML;
            this.triggerChange();
        });

        // Handle keyboard shortcuts
        this.editorContent.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.executeCommand('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.executeCommand('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.executeCommand('underline');
                        break;
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.executeCommand('redo');
                        } else {
                            this.executeCommand('undo');
                        }
                        break;
                }
            }
        });

        // Handle paste events
        this.editorContent.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        });

        // Handle drag and drop
        this.editorContent.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.editorContent.classList.add('dragover');
        });

        this.editorContent.addEventListener('dragleave', () => {
            this.editorContent.classList.remove('dragover');
        });

        this.editorContent.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.editorContent.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });
    }

    setupAutosave() {
        setInterval(() => {
            if (this.content !== this.lastSavedContent) {
                localStorage.setItem('editor-autosave', this.content);
                this.lastSavedContent = this.content;
            }
        }, this.options.autosaveInterval);

        // Restore autosaved content
        const savedContent = localStorage.getItem('editor-autosave');
        if (savedContent) {
            this.setContent(savedContent);
        }
    }

    executeCommand(command) {
        this.saveToHistory();

        switch (command) {
            case 'undo':
                this.undo();
                break;
            case 'redo':
                this.redo();
                break;
            case 'link':
                this.insertLink();
                break;
            case 'image':
                this.openMediaPicker('image');
                break;
            case 'video':
                this.openMediaPicker('video');
                break;
            case 'heading-1':
                document.execCommand('formatBlock', false, 'h1');
                break;
            case 'heading-2':
                document.execCommand('formatBlock', false, 'h2');
                break;
            case 'heading-3':
                document.execCommand('formatBlock', false, 'h3');
                break;
            case 'bullet-list':
                document.execCommand('insertUnorderedList');
                break;
            case 'number-list':
                document.execCommand('insertOrderedList');
                break;
            default:
                document.execCommand(command);
        }

        this.triggerChange();
    }

    insertLink() {
        const url = prompt('Enter URL:');
        if (url) {
            document.execCommand('createLink', false, url);
        }
    }

    openMediaPicker(type) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = type === 'image' 
            ? 'image/jpeg,image/png,image/gif' 
            : 'video/mp4';
        
        input.onchange = () => this.handleFiles(input.files);
        input.click();
    }

    async handleFiles(files) {
        for (const file of files) {
            if (!this.options.allowedFileTypes.includes(file.type)) {
                alert('File type not supported');
                continue;
            }

            if (file.size > this.options.maxFileSize) {
                alert('File too large');
                continue;
            }

            const id = Date.now().toString();
            this.mediaFiles.set(id, file);

            const preview = this.createMediaPreview(file, id);
            this.insertMediaPreview(preview);
        }
    }

    createMediaPreview(file, id) {
        const container = document.createElement('div');
        container.className = 'media-preview';
        container.dataset.mediaId = id;

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-media';
        removeButton.textContent = '×';
        removeButton.onclick = () => {
            container.remove();
            this.mediaFiles.delete(id);
            this.triggerChange();
        };

        let media;
        if (file.type.startsWith('image/')) {
            media = document.createElement('img');
        } else {
            media = document.createElement('video');
            media.controls = true;
        }

        media.src = URL.createObjectURL(file);
        container.appendChild(media);
        container.appendChild(removeButton);

        return container;
    }

    insertMediaPreview(preview) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        range.insertNode(preview);
        range.collapse(false);
    }

    saveToHistory() {
        this.undoStack.push(this.editorContent.innerHTML);
        if (this.undoStack.length > 100) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length > 0) {
            const current = this.editorContent.innerHTML;
            this.redoStack.push(current);
            const previous = this.undoStack.pop();
            this.editorContent.innerHTML = previous;
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const current = this.editorContent.innerHTML;
            this.undoStack.push(current);
            const next = this.redoStack.pop();
            this.editorContent.innerHTML = next;
        }
    }

    updateWordCount() {
        const text = this.editorContent.textContent || '';
        const words = text.trim().split(/\s+/).length;
        const chars = text.length;

        this.container.querySelector('.word-count').textContent = `${words} words`;
        this.container.querySelector('.char-count').textContent = `${chars} characters`;
    }

    getContent() {
        return {
            html: this.editorContent.innerHTML,
            text: this.editorContent.textContent,
            media: Array.from(this.mediaFiles.entries()).map(([id, file]) => ({
                id,
                file,
                type: file.type
            }))
        };
    }

    setContent(html) {
        this.editorContent.innerHTML = html;
        this.content = html;
        this.updateWordCount();
        this.triggerChange();
    }

    clear() {
        this.editorContent.innerHTML = '';
        this.content = '';
        this.mediaFiles.clear();
        this.undoStack = [];
        this.redoStack = [];
        this.updateWordCount();
        this.triggerChange();
    }

    triggerChange() {
        const event = new CustomEvent('editor-change', {
            detail: this.getContent()
        });
        this.container.dispatchEvent(event);
    }

    destroy() {
        // Clean up
        this.mediaFiles.forEach((file, id) => {
            URL.revokeObjectURL(document.querySelector(`[data-media-id="${id}"] img, [data-media-id="${id}"] video`)?.src);
        });
        this.container.innerHTML = '';
        this.mediaFiles.clear();
    }
}

// Export the editor class
export { MediaEditor };