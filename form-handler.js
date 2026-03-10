// ==========================================
// BUNNYCARE FORM HANDLER & VALIDATION
// ==========================================

const FormHandler = {
  // Validation rules
  validators: {
    required: (value) => value && value.toString().trim() !== '',
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    phone: (value) => /^[\d\s\-\+()]+$/.test(value) && value.replace(/\D/g, '').length >= 10,
    age: (value) => {
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 60;
    },
    futureDate: (value) => new Date(value) > new Date(),
    minLength: (value, length) => value.toString().length >= length,
  },

  // Initialize form handlers
  init() {
    this.setupAllForms();
    this.setupAutoSave();
    this.setupConditionalFields();
    this.setupCharacterCounters();
    this.attachValidationListeners();
  },

  // Setup all form event listeners
  setupAllForms() {
    const forms = document.querySelectorAll('[id^="panel-"]');
    forms.forEach(form => {
      const submitBtn = form.querySelector('.btn-submit');
      if (submitBtn) {
        submitBtn.addEventListener('click', (e) => this.handleFormSubmit(e, form));
      }
    });
  },

  // Handle form submission
  handleFormSubmit(e, form) {
    e.preventDefault();
    
    // Validate form
    const errors = this.validateForm(form);
    if (Object.keys(errors).length > 0) {
      this.showFormErrors(form, errors);
      return;
    }

    // Clear previous errors
    this.clearFormErrors(form);

    // Show loading state
    const submitBtn = form.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Processing...';
    submitBtn.disabled = true;

    // Get form data
    const formData = this.getFormData(form);
    
    // Save to localStorage
    const formId = form.id.replace('panel-', '');
    this.saveToLocalStorage(formId, formData);

    // Simulate API call
    setTimeout(() => {
      this.handleSubmissionSuccess(form, submitBtn, originalText, formData);
    }, 1500);
  },

  // Validate entire form
  validateForm(form) {
    const errors = {};
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      const fieldName = input.name || input.id || input.placeholder;
      const value = input.value.trim();
      const isRequired = input.hasAttribute('required') || input.hasAttribute('data-required');
      
      // Check required
      if (isRequired && !this.validators.required(value)) {
        errors[fieldName] = `${fieldName} is required`;
        return;
      }

      if (value === '') return; // Skip empty non-required fields

      // Type-specific validation
      if (input.type === 'email') {
        if (!this.validators.email(value)) {
          errors[fieldName] = 'Please enter a valid email address';
        }
      } else if (input.type === 'tel') {
        if (!this.validators.phone(value)) {
          errors[fieldName] = 'Please enter a valid phone number (at least 10 digits)';
        }
      } else if (input.type === 'date') {
        if (input.dataset.ageCheck === 'true' && !this.validators.age(value)) {
          errors[fieldName] = 'Resident must be 60 years or older';
        }
        if (input.dataset.futureDateCheck === 'true' && !this.validators.futureDate(value)) {
          errors[fieldName] = 'Date cannot be in the past';
        }
      }

      // Custom data validation
      if (input.dataset.minLength) {
        if (!this.validators.minLength(value, parseInt(input.dataset.minLength))) {
          errors[fieldName] = `Minimum ${input.dataset.minLength} characters required`;
        }
      }
    });

    return errors;
  },

  // Show validation errors
  showFormErrors(form, errors) {
    this.clearFormErrors(form);
    
    Object.keys(errors).forEach(fieldName => {
      const input = form.querySelector(`[name="${fieldName}"], [id="${fieldName}"], [placeholder*="${fieldName}"]`) ||
                    form.querySelector(`input, select, textarea`);
      
      if (input) {
        input.classList.add('error');
        input.style.borderColor = '#e74c3c';
        
        // Create error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.style.cssText = 'color:#e74c3c;font-size:0.75rem;margin-top:0.25rem;';
        errorMsg.textContent = errors[fieldName];
        
        const fgroup = input.closest('.fgroup');
        if (fgroup) {
          fgroup.appendChild(errorMsg);
        }
      }
    });

    // Scroll to first error
    const firstError = form.querySelector('.error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  // Clear all form errors
  clearFormErrors(form) {
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.error-message').forEach(el => el.remove());
  },

  // Get form data as object
  getFormData(form) {
    const formData = {};
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      if (input.type === 'checkbox') {
        formData[input.name || input.id] = input.checked;
      } else if (input.value) {
        formData[input.name || input.id || input.placeholder] = input.value;
      }
    });

    formData.timestamp = new Date().toISOString();
    formData.referenceNumber = this.generateReferenceNumber();
    return formData;
  },

  // Generate unique reference number
  generateReferenceNumber() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'BC';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Handle successful submission
  handleSubmissionSuccess(form, submitBtn, originalText, formData) {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    // Show success modal
    this.showSuccessModal(formData);

    // Reset form
    form.querySelectorAll('input:not([type="checkbox"]), select, textarea').forEach(el => {
      el.value = '';
      el.classList.remove('error');
    });

    // Clear localStorage for this form
    const formId = form.id.replace('panel-', '');
    localStorage.removeItem(`form_${formId}`);
  },

  // Show success confirmation modal
  showSuccessModal(formData) {
    const modal = document.createElement('div');
    modal.className = 'modal-bg open';
    modal.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(26,74,58,0.7);z-index:2000;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
    
    modal.innerHTML = `
      <div class="modal" style="background:#FBF6EE;width:min(500px,92vw);border-radius:6px;overflow:hidden;position:relative;max-height:90vh;overflow-y:auto;">
        <div style="background:#3A8C6E;padding:2rem 2.5rem;display:flex;align-items:center;justify-content:space-between;">
          <h3 style="font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;color:white;margin:0;">✓ Application Sent Successfully</h3>
          <button onclick="this.closest('.modal-bg').remove()" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:1.5rem;cursor:pointer;line-height:1;">×</button>
        </div>
        <div style="padding:2.5rem;color:#1E2A26;line-height:1.8;">
          <p style="margin-bottom:1.5rem;"><strong>Reference Number:</strong> ${formData.referenceNumber}</p>
          <p style="margin-bottom:1.5rem;font-size:0.95rem;color:#3A4A42;">Thank you for your submission. We have received your application and will respond within 24 hours.</p>
          <div style="background:#E8F5EF;padding:1rem;border-left:4px solid #3A8C6E;border-radius:3px;margin-bottom:1rem;font-size:0.9rem;">
            <p style="margin:0;"><strong>Next Steps:</strong></p>
            <ul style="margin:0.5rem 0 0 1.2rem;padding-left:0;">
              <li>Check your email for confirmation (may take a few minutes)</li>
              <li>Our team will contact you shortly</li>
              <li>Keep your reference number for future inquiries</li>
            </ul>
          </div>
          <button onclick="this.closest('.modal-bg').remove()" style="background:#3A8C6E;color:white;border:none;padding:12px 24px;font-family:'DM Sans',sans-serif;font-size:0.82rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;border-radius:4px;width:100%;">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },

  // Setup auto-save with localStorage
  setupAutoSave() {
    const forms = document.querySelectorAll('[id^="panel-"]');
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select, textarea');
      
      inputs.forEach(input => {
        input.addEventListener('change', () => {
          const formId = form.id.replace('panel-', '');
          const formData = this.getFormData(form);
          this.saveToLocalStorage(formId, formData);
        });
      });
    });

    // Restore form data on page load
    forms.forEach(form => {
      const formId = form.id.replace('panel-', '');
      this.restoreFromLocalStorage(formId, form);
    });
  },

  // Save to localStorage
  saveToLocalStorage(formId, data) {
    localStorage.setItem(`form_${formId}`, JSON.stringify(data));
  },

  // Restore from localStorage
  restoreFromLocalStorage(formId, form) {
    const saved = localStorage.getItem(`form_${formId}`);
    if (saved) {
      const data = JSON.parse(saved);
      Object.keys(data).forEach(key => {
        const input = form.querySelector(`[name="${key}"], [id="${key}"]`);
        if (input) {
          if (input.type === 'checkbox') {
            input.checked = data[key];
          } else {
            input.value = data[key];
          }
        }
      });
    }
  },

  // Setup conditional field visibility
  setupConditionalFields() {
    const triggers = document.querySelectorAll('[data-trigger]');
    triggers.forEach(trigger => {
      trigger.addEventListener('change', () => {
        const targetField = document.querySelector(`[data-condition="${trigger.dataset.trigger}"]`);
        if (targetField) {
          targetField.style.display = trigger.checked || trigger.value ? 'flex' : 'none';
        }
      });
    });
  },

  // Setup character counters
  setupCharacterCounters() {
    const textareas = document.querySelectorAll('textarea[data-maxlength]');
    textareas.forEach(textarea => {
      const maxLength = parseInt(textarea.dataset.maxlength);
      const counter = document.createElement('div');
      counter.className = 'char-counter';
      counter.style.cssText = 'font-size:0.7rem;color:#7A8A82;margin-top:0.25rem;text-align:right;';
      counter.textContent = `0 / ${maxLength}`;
      
      textarea.parentElement.appendChild(counter);
      textarea.maxLength = maxLength;

      textarea.addEventListener('input', () => {
        counter.textContent = `${textarea.value.length} / ${maxLength}`;
        const percentage = (textarea.value.length / maxLength) * 100;
        if (percentage > 90) {
          counter.style.color = '#e74c3c';
        } else if (percentage > 70) {
          counter.style.color = '#f39c12';
        } else {
          counter.style.color = '#7A8A82';
        }
      });
    });
  },

  // Attach real-time validation listeners
  attachValidationListeners() {
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      // Email validation
      if (input.type === 'email') {
        input.addEventListener('blur', () => {
          if (input.value && !this.validators.email(input.value)) {
            input.style.borderColor = '#f39c12';
            this.showFieldError(input, 'Invalid email format');
          } else {
            input.style.borderColor = '';
            this.clearFieldError(input);
          }
        });
      }

      // Phone formatting and validation
      if (input.type === 'tel') {
        input.addEventListener('input', (e) => {
          this.formatPhoneNumber(e.target);
        });
        input.addEventListener('blur', () => {
          if (input.value && !this.validators.phone(input.value)) {
            input.style.borderColor = '#f39c12';
            this.showFieldError(input, 'Please enter at least 10 digits');
          } else {
            input.style.borderColor = '';
            this.clearFieldError(input);
          }
        });
      }

      // Date validation
      if (input.type === 'date') {
        input.addEventListener('change', () => {
          if (input.dataset.ageCheck === 'true') {
            const valid = this.validators.age(input.value);
            if (input.value && !valid) {
              input.style.borderColor = '#f39c12';
              this.showFieldError(input, 'Resident must be 60 or older');
            } else {
              input.style.borderColor = '';
              this.clearFieldError(input);
            }
          }
        });
      }
    });
  },

  // Format phone number as user types
  formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    let formatted = '';

    if (value.length > 0) {
      if (value.length <= 3) {
        formatted = value;
      } else if (value.length <= 6) {
        formatted = value.substring(0, 3) + ' ' + value.substring(3);
      } else {
        formatted = value.substring(0, 3) + ' ' + value.substring(3, 6) + ' ' + value.substring(6, 10);
      }
    }

    input.value = formatted;
  },

  // Show field-level error
  showFieldError(input, message) {
    const existing = input.parentElement.querySelector('.field-error-hint');
    if (existing) existing.remove();

    const hint = document.createElement('div');
    hint.className = 'field-error-hint';
    hint.style.cssText = 'color:#f39c12;font-size:0.7rem;margin-top:0.25rem;';
    hint.textContent = message;
    input.parentElement.appendChild(hint);
  },

  // Clear field error
  clearFieldError(input) {
    const hint = input.parentElement.querySelector('.field-error-hint');
    if (hint) hint.remove();
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  FormHandler.init();
});

// Also update the original openTab function to work with our validation
const originalOpenTab = window.openTab;
window.openTab = function(name) {
  if (originalOpenTab) originalOpenTab(name);
  // Re-initialize form handlers when tab is opened
  setTimeout(() => {
    FormHandler.setupAllForms();
  }, 100);
};
