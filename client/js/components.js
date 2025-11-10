// Premium UI Components Library
class PremiumComponents {
    // Toast notification system
    static createToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `premium-toast ${type}`;
        
        const icon = document.createElement('i');
        icon.className = `fas fa-${this.getToastIcon(type)}`;
        
        const textContent = document.createElement('span');
        textContent.textContent = message;
        
        const progress = document.createElement('div');
        progress.className = 'toast-progress';
        
        toast.appendChild(icon);
        toast.appendChild(textContent);
        toast.appendChild(progress);
        
        document.body.appendChild(toast);
        
        // Start progress animation
        requestAnimationFrame(() => {
            progress.style.width = '0%';
            toast.style.transform = 'translateX(0)';
        });
        
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    static getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }

    // Modal dialog system
    static createModal(options = {}) {
        const modal = document.createElement('div');
        modal.className = 'premium-modal';
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        
        if (options.title) {
            const header = document.createElement('div');
            header.className = 'modal-header';
            header.innerHTML = `
                <h2>${options.title}</h2>
                <button class="modal-close">&times;</button>
            `;
            content.appendChild(header);
        }
        
        if (options.body) {
            const body = document.createElement('div');
            body.className = 'modal-body';
            body.innerHTML = options.body;
            content.appendChild(body);
        }
        
        if (options.footer) {
            const footer = document.createElement('div');
            footer.className = 'modal-footer';
            footer.innerHTML = options.footer;
            content.appendChild(footer);
        }
        
        modal.appendChild(overlay);
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Add animations
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            content.style.transform = 'translateY(0) scale(1)';
        });
        
        // Event handlers
        const close = () => {
            overlay.style.opacity = '0';
            content.style.transform = 'translateY(-20px) scale(0.95)';
            setTimeout(() => modal.remove(), 300);
        };
        
        modal.querySelector('.modal-close')?.addEventListener('click', close);
        overlay.addEventListener('click', close);
        
        return { modal, close };
    }

    // Loading spinner
    static createSpinner(container, type = 'default') {
        const spinner = document.createElement('div');
        spinner.className = `premium-spinner ${type}`;
        
        if (type === 'circular') {
            spinner.innerHTML = `
                <svg viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
                </svg>
            `;
        } else if (type === 'dots') {
            for (let i = 0; i < 3; i++) {
                spinner.appendChild(document.createElement('div'));
            }
        }
        
        if (container) {
            container.appendChild(spinner);
        }
        
        return spinner;
    }

    // Form validation
    static validateForm(form, rules = {}) {
        const errors = {};
        
        for (const [field, rule] of Object.entries(rules)) {
            const input = form.querySelector(`[name="${field}"]`);
            if (!input) continue;
            
            const value = input.value.trim();
            const error = this.validateField(value, rule);
            
            if (error) {
                errors[field] = error;
                this.showInputError(input, error);
            } else {
                this.clearInputError(input);
            }
        }
        
        return { isValid: Object.keys(errors).length === 0, errors };
    }
    
    static validateField(value, rule) {
        if (rule.required && !value) {
            return 'Trường này không được để trống';
        }
        
        if (rule.email && !this.isValidEmail(value)) {
            return 'Email không hợp lệ';
        }
        
        if (rule.minLength && value.length < rule.minLength) {
            return `Tối thiểu ${rule.minLength} ký tự`;
        }
        
        if (rule.pattern && !rule.pattern.test(value)) {
            return rule.message || 'Giá trị không hợp lệ';
        }
        
        return null;
    }
    
    static isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    static showInputError(input, error) {
        const container = input.parentElement;
        let errorDiv = container.querySelector('.input-error');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'input-error';
            container.appendChild(errorDiv);
        }
        
        errorDiv.textContent = error;
        input.classList.add('error');
    }
    
    static clearInputError(input) {
        const container = input.parentElement;
        const errorDiv = container.querySelector('.input-error');
        
        if (errorDiv) {
            errorDiv.remove();
        }
        
        input.classList.remove('error');
    }

    // Dropdown menu
    static createDropdown(options = {}) {
        const dropdown = document.createElement('div');
        dropdown.className = 'premium-dropdown';
        
        const button = document.createElement('button');
        button.className = 'dropdown-button';
        button.innerHTML = `
            ${options.label || 'Select'}
            <i class="fas fa-chevron-down"></i>
        `;
        
        const menu = document.createElement('div');
        menu.className = 'dropdown-menu';
        
        if (options.items) {
            options.items.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'dropdown-item';
                menuItem.innerHTML = item.label;
                menuItem.addEventListener('click', () => {
                    button.innerHTML = `
                        ${item.label}
                        <i class="fas fa-chevron-down"></i>
                    `;
                    menu.classList.remove('show');
                    if (item.onClick) item.onClick();
                });
                menu.appendChild(menuItem);
            });
        }
        
        dropdown.appendChild(button);
        dropdown.appendChild(menu);
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('show');
        });
        
        document.addEventListener('click', () => {
            menu.classList.remove('show');
        });
        
        return dropdown;
    }

    // Tab system
    static createTabs(options = {}) {
        const tabContainer = document.createElement('div');
        tabContainer.className = 'premium-tabs';
        
        const tabList = document.createElement('div');
        tabList.className = 'tab-list';
        
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        
        if (options.tabs) {
            options.tabs.forEach((tab, index) => {
                const tabButton = document.createElement('button');
                tabButton.className = 'tab-button';
                tabButton.textContent = tab.label;
                
                const tabPanel = document.createElement('div');
                tabPanel.className = 'tab-panel';
                tabPanel.innerHTML = tab.content;
                
                if (index === 0) {
                    tabButton.classList.add('active');
                    tabPanel.classList.add('active');
                }
                
                tabButton.addEventListener('click', () => {
                    tabList.querySelectorAll('.tab-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    tabContent.querySelectorAll('.tab-panel').forEach(panel => {
                        panel.classList.remove('active');
                    });
                    
                    tabButton.classList.add('active');
                    tabPanel.classList.add('active');
                });
                
                tabList.appendChild(tabButton);
                tabContent.appendChild(tabPanel);
            });
        }
        
        tabContainer.appendChild(tabList);
        tabContainer.appendChild(tabContent);
        
        return tabContainer;
    }

    // Image uploader with preview
    static createImageUploader(options = {}) {
        const uploader = document.createElement('div');
        uploader.className = 'premium-uploader';
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = options.multiple || false;
        input.style.display = 'none';
        
        const dropzone = document.createElement('div');
        dropzone.className = 'upload-dropzone';
        dropzone.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Kéo thả hoặc click để chọn ảnh</p>
        `;
        
        const preview = document.createElement('div');
        preview.className = 'upload-preview';
        
        uploader.appendChild(input);
        uploader.appendChild(dropzone);
        uploader.appendChild(preview);
        
        // Handle file selection
        const handleFiles = (files) => {
            if (!files.length) return;
            
            [...files].forEach(file => {
                if (!file.type.startsWith('image/')) return;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="${file.name}">
                        <button class="remove-image">&times;</button>
                    `;
                    
                    previewItem.querySelector('.remove-image').addEventListener('click', () => {
                        previewItem.remove();
                        if (options.onRemove) options.onRemove(file);
                    });
                    
                    preview.appendChild(previewItem);
                    if (options.onUpload) options.onUpload(file);
                };
                reader.readAsDataURL(file);
            });
        };
        
        // Event listeners
        dropzone.addEventListener('click', () => input.click());
        
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });
        
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });
        
        input.addEventListener('change', () => handleFiles(input.files));
        
        return uploader;
    }

    // Color picker
    static createColorPicker(options = {}) {
        const picker = document.createElement('div');
        picker.className = 'premium-color-picker';
        
        const input = document.createElement('input');
        input.type = 'color';
        input.value = options.initialColor || '#000000';
        
        const preview = document.createElement('div');
        preview.className = 'color-preview';
        preview.style.backgroundColor = input.value;
        
        const swatches = document.createElement('div');
        swatches.className = 'color-swatches';
        
        const defaultColors = [
            '#2c3e50', '#3498db', '#2ecc71', '#e74c3c', '#f1c40f',
            '#9b59b6', '#1abc9c', '#e67e22', '#95a5a6', '#34495e'
        ];
        
        defaultColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.addEventListener('click', () => {
                input.value = color;
                preview.style.backgroundColor = color;
                if (options.onChange) options.onChange(color);
            });
            swatches.appendChild(swatch);
        });
        
        input.addEventListener('input', (e) => {
            preview.style.backgroundColor = e.target.value;
            if (options.onChange) options.onChange(e.target.value);
        });
        
        preview.addEventListener('click', () => input.click());
        
        picker.appendChild(preview);
        picker.appendChild(input);
        picker.appendChild(swatches);
        
        return picker;
    }
}

// Export components
export { PremiumComponents };