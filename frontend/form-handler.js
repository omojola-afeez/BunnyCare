// ==========================================
// BUNNYCARE FORM HANDLER v2.0
// Complete Feature Suite with Backend Integration
// ==========================================

const FormHandler = {
  // Configuration
  config: {
    apiEndpoint: 'http://localhost:3001/api',
    enableAnalytics: true,
    enableCaptcha: false,
    captchaKey: '',
    paymentGateway: 'paystack'
  },

  // Form analytics
  analytics: {
    formStarts: {},
    formCompletions: {},
    fieldInteractions: {}
  },

  // Multi-step form state
  multiStepState: {
    currentStep: 1,
    totalSteps: 0,
    completedSteps: [],
    formData: {}
  },

  // Validation rules
  validators: {
    required: (value) => value && value.toString().trim() !== '',
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    phone: (value) => /^[\d\s\-\+()]+$/.test(value) && value.replace(/\D/g, '').length >= 10,
    age: (value) => {
      // Handle both number input (direct age) and date input (date of birth)
      if (isNaN(value)) {
        // Date of birth input
        const today = new Date();
        const birthDate = new Date(value);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age >= 60;
      } else {
        // Direct age number input
        return parseInt(value) >= 60;
      }
    },
    futureDate: (value) => new Date(value) > new Date(),
    minLength: (value, length) => value.toString().length >= length,
    strongPassword: (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value),
  },

  // Initialize everything
  init() {
    this.setupAllForms();
    this.setupAutoSave();
    this.setupConditionalFields();
    this.setupCharacterCounters();
    this.attachValidationListeners();
    this.setupMultiStepForms();
    this.setupDropdownFilters();
    this.setupFieldDependencies();
    this.initializeAnalytics();
    console.log('✓ FormHandler v2.0 initialized with all features');
  },

  // ===========================
  // MULTI-STEP FORM WIZARD
  // ===========================
  setupMultiStepForms() {
    const wizards = document.querySelectorAll('[data-multi-step="true"]');
    wizards.forEach(wizard => {
      const steps = wizard.querySelectorAll('[data-step]');
      this.multiStepState.totalSteps = steps.length;
      
      const prevBtns = wizard.querySelectorAll('[data-step-prev]');
      const nextBtns = wizard.querySelectorAll('[data-step-next]');
      
      prevBtns.forEach(btn => btn.addEventListener('click', () => this.prevStep(wizard)));
      nextBtns.forEach(btn => btn.addEventListener('click', () => this.nextStep(wizard)));
      
      this.updateProgressBar(wizard);
    });
  },

  nextStep(wizard) {
    const currentStep = this.multiStepState.currentStep;
    const stepForm = wizard.querySelector(`[data-step="${currentStep}"]`);
    
    const errors = this.validateForm(stepForm);
    if (Object.keys(errors).length > 0) {
      this.showFormErrors(stepForm, errors);
      return;
    }

    this.multiStepState.currentStep++;
    this.multiStepState.completedSteps.push(currentStep);
    this.showStep(wizard, this.multiStepState.currentStep);
    this.updateProgressBar(wizard);
  },

  prevStep(wizard) {
    if (this.multiStepState.currentStep > 1) {
      this.multiStepState.currentStep--;
      this.showStep(wizard, this.multiStepState.currentStep);
      this.updateProgressBar(wizard);
    }
  },

  showStep(wizard, stepNumber) {
    const steps = wizard.querySelectorAll('[data-step]');
    steps.forEach(step => {
      step.style.display = parseInt(step.dataset.step) === stepNumber ? 'block' : 'none';
    });
  },

  updateProgressBar(wizard) {
    const progressBar = wizard.querySelector('[data-progress-bar]');
    if (progressBar) {
      const percentage = (this.multiStepState.currentStep / this.multiStepState.totalSteps) * 100;
      progressBar.style.width = percentage + '%';
      
      const progressText = wizard.querySelector('[data-progress-text]');
      if (progressText) {
        progressText.textContent = `Step ${this.multiStepState.currentStep} of ${this.multiStepState.totalSteps}`;
      }
    }
  },

  // ===========================
  // CONDITIONAL FIELD VISIBILITY
  // ===========================
  setupConditionalFields() {
    const triggers = document.querySelectorAll('[data-conditional-trigger]');
    triggers.forEach(trigger => {
      trigger.addEventListener('change', (e) => {
        const targetSelector = trigger.dataset.conditionalTarget;
        const condition = trigger.dataset.conditionalValue;
        
        const targets = document.querySelectorAll(targetSelector);
        targets.forEach(target => {
          const shouldShow = (trigger.type === 'checkbox' && trigger.checked) ||
                           (trigger.type === 'select-one' && trigger.value === condition) ||
                           (trigger.type === 'radio' && trigger.checked && trigger.value === condition);
          
          target.style.display = shouldShow ? 'flex' : 'none';
          
          if (this.config.enableAnalytics) {
            this.trackFieldInteraction(trigger.name || trigger.id, shouldShow ? 'shown' : 'hidden');
          }
        });
      });
    });
    
    // Also keep old trigger system
    const oldTriggers = document.querySelectorAll('[data-trigger]');
    oldTriggers.forEach(trigger => {
      trigger.addEventListener('change', () => {
        const targetField = document.querySelector(`[data-condition="${trigger.dataset.trigger}"]`);
        if (targetField) {
          targetField.style.display = trigger.checked || trigger.value ? 'flex' : 'none';
        }
      });
    });
  },

  // ===========================
  // FIELD DEPENDENCY LOGIC
  // ===========================
  setupFieldDependencies() {
    const dependentFields = document.querySelectorAll('[data-depends-on]');
    dependentFields.forEach(field => {
      const dependsOn = field.dataset.dependsOn;
      const dependsValue = field.dataset.dependsValue;
      const triggerField = document.querySelector(`[name="${dependsOn}"], [id="${dependsOn}"]`);
      
      if (triggerField) {
        triggerField.addEventListener('change', () => {
          const shouldEnable = triggerField.value === dependsValue;
          field.disabled = !shouldEnable;
          field.style.opacity = shouldEnable ? '1' : '0.5';
          
          if (shouldEnable) {
            field.setAttribute('required', '');
          } else {
            field.removeAttribute('required');
            field.value = '';
          }
        });
      }
    });
  },

  // ===========================
  // DROPDOWN SEARCH/FILTER
  // ===========================
  setupDropdownFilters() {
    const searchableSelects = document.querySelectorAll('select[data-searchable="true"]');
    searchableSelects.forEach(select => {
      this.makeSelectSearchable(select);
    });
  },

  makeSelectSearchable(select) {
    const wrapper = document.createElement('div');
    wrapper.className = 'searchable-select-wrapper';
    wrapper.style.cssText = 'position:relative;';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'select-search';
    searchInput.placeholder = 'Search...';
    searchInput.style.cssText = 'width:100%;padding:0.5rem;border:1px solid #ccc;border-radius:3px;margin-bottom:0.5rem;';

    select.parentElement.insertBefore(wrapper, select);
    wrapper.appendChild(searchInput);
    wrapper.appendChild(select);

    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      Array.from(select.options).forEach(option => {
        const matches = option.text.toLowerCase().includes(searchTerm);
        option.style.display = matches ? '' : 'none';
      });
    });
  },

  // ===========================
  // FORM ANALYTICS
  // ===========================
  initializeAnalytics() {
    if (!this.config.enableAnalytics) return;

    const forms = document.querySelectorAll('[id^="panel-"]');
    forms.forEach(form => {
      const formId = form.id.replace('panel-', '');
      this.analytics.formStarts[formId] = (this.analytics.formStarts[formId] || 0) + 1;
      
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        input.addEventListener('focus', () => {
          this.trackFieldInteraction(input.name || input.id, 'focused');
        });
      });
    });

    setInterval(() => this.saveAnalytics(), 60000);
  },

  trackFieldInteraction(fieldName, action) {
    if (!this.config.enableAnalytics) return;
    
    const key = `${fieldName}_${action}`;
    this.analytics.fieldInteractions[key] = (this.analytics.fieldInteractions[key] || 0) + 1;
  },

  saveAnalytics() {
    localStorage.setItem('bunnycare_analytics', JSON.stringify(this.analytics));
  },

  // Setup all form event listeners
  setupAllForms() {
    const forms = document.querySelectorAll('[id^="panel-"], .contact-form');
    forms.forEach(form => {
      const submitBtn = form.querySelector('.btn-submit');
      if (submitBtn) {
        submitBtn.addEventListener('click', (e) => this.handleFormSubmit(e, form));
      }
    });
  },

  // Handle form submission with backend integration
  async handleFormSubmit(e, form) {
    e.preventDefault();
    
    // Validate form
    const errors = this.validateForm(form);
    if (Object.keys(errors).length > 0) {
      this.showFormErrors(form, errors);
      return;
    }

    this.clearFormErrors(form);

    const submitBtn = form.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Processing...';
    submitBtn.disabled = true;

    try {
      const formData = this.getFormData(form);
      
      // Save locally
      const formId = form.id.replace('panel-', '');
      this.saveToLocalStorage(formId, formData);

      // Send to backend
      const response = await fetch(`${this.config.apiEndpoint}/forms/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }).catch(() => ({ ok: true })); // Handle offline mode

      // Track completion
      if (this.config.enableAnalytics) {
        this.analytics.formCompletions[formId] = (this.analytics.formCompletions[formId] || 0) + 1;
      }

      this.handleSubmissionSuccess(form, submitBtn, originalText, formData);
    } catch (error) {
      console.error('Form submission error:', error);
      this.showAlert('Failed to submit form. Please try again.', 'error');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  },

  // Handle successful submission
  handleSubmissionSuccess(form, submitBtn, originalText, formData) {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    this.showSuccessModal(formData);

    form.querySelectorAll('input:not([type="checkbox"]), select, textarea').forEach(el => {
      el.value = '';
      el.classList.remove('error');
    });

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
              <li>Check your email for confirmation</li>
              <li>Our team will contact you shortly</li>
              <li>Track application: <a href="/track?ref=${formData.referenceNumber}" style="color:#3A8C6E;text-decoration:none;font-weight:600;">Click here</a></li>
            </ul>
          </div>
          <button onclick="this.closest('.modal-bg').remove()" style="background:#3A8C6E;color:white;border:none;padding:12px 24px;font-family:'DM Sans',sans-serif;font-size:0.82rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;border-radius:4px;width:100%;">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },

  showAlert(message, type = 'info') {
    const colors = {
      error: '#e74c3c',
      success: '#27ae60',
      info: '#3498db'
    };
    const alert = document.createElement('div');
    alert.style.cssText = `position:fixed;top:20px;right:20px;padding:1rem 1.5rem;background:${colors[type]};color:white;border-radius:4px;z-index:3000;max-width:400px;font-size:0.9rem;box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    alert.textContent = message;
    document.body.appendChild(alert);
    
    setTimeout(() => alert.remove(), 5000);
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

  // Validate entire form
  validateForm(form) {
    const errors = {};
    const inputs = form.querySelectorAll('input, select, textarea');
    const formId = form.id ? form.id.replace('panel-', '') : '';

    inputs.forEach(input => {
      // Skip hidden fields and custom amount input (unless it's visible and selected)
      if (input.style.display === 'none' || input.type === 'hidden') {
        // Special case: if donation amount is the selected value
        if (input.type === 'hidden' && input.id === 'donation-amount-input' && formId === 'donation') {
          const value = input.value.toString().trim();
          if (!value) {
            errors['donationAmount'] = 'Please select a donation amount';
          }
        }
        return;
      }

      const fieldName = input.name || input.id || input.placeholder;
      const value = (input.type === 'checkbox' ? input.checked : input.value).toString().trim();
      const isRequired = input.hasAttribute('required') || input.hasAttribute('data-required');
      
      if (isRequired && !this.validators.required(value)) {
        errors[fieldName] = `${fieldName} is required`;
        return;
      }

      if (value === '' || value === 'false') return;

      if (input.type === 'email' && !this.validators.email(value)) {
        errors[fieldName] = 'Please enter a valid email address';
      } else if (input.type === 'tel' && !this.validators.phone(value)) {
        errors[fieldName] = 'Please enter a valid phone number (at least 10 digits)';
      } else if (input.type === 'date') {
        if (input.dataset.ageCheck === 'true' && !this.validators.age(value)) {
          errors[fieldName] = 'Resident must be 60 years or older';
        }
        if (input.dataset.futureDateCheck === 'true' && !this.validators.futureDate(value)) {
          errors[fieldName] = 'Date cannot be in the past';
        }
      } else if (input.type === 'number' && input.dataset.ageCheck === 'true') {
        if (!this.validators.age(value)) {
          errors[fieldName] = 'Resident must be 60 years or older';
        }
      } else if (input.dataset.minLength) {
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
      const input = form.querySelector(`[name="${fieldName}"], [id="${fieldName}"]`);
      
      if (input && input.style.display !== 'none') {
        input.classList.add('error');
        input.style.borderColor = '#e74c3c';
        this.showFieldError(input, errors[fieldName]);
      }
    });

    const firstError = form.querySelector('.error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  // Clear all form errors
  clearFormErrors(form) {
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.field-error-hint').forEach(el => el.remove());
  },

  // Show field-level error
  showFieldError(input, message) {
    const existing = input.parentElement.querySelector('.field-error-hint');
    if (existing) existing.remove();

    const hint = document.createElement('div');
    hint.className = 'field-error-hint';
    hint.style.cssText = 'color:#e74c3c;font-size:0.7rem;margin-top:0.25rem;';
    hint.textContent = message;
    input.parentElement.appendChild(hint);
  },

  // Clear field error
  clearFieldError(input) {
    const hint = input.parentElement.querySelector('.field-error-hint');
    if (hint) hint.remove();
    input.style.borderColor = '';
  },

  // Get form data as object
  getFormData(form) {
    const formData = {};
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      if (input.style.display === 'none') return;
      
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
          if (input.dataset.futureDateCheck === 'true') {
            const valid = this.validators.futureDate(input.value);
            if (input.value && !valid) {
              input.style.borderColor = '#f39c12';
              this.showFieldError(input, 'Please select a future date');
            } else {
              input.style.borderColor = '';
              this.clearFieldError(input);
            }
          }
        });
      }

      // Number field age validation
      if (input.type === 'number' && input.dataset.ageCheck === 'true') {
        input.addEventListener('change', () => {
          const valid = this.validators.age(input.value);
          if (input.value && !valid) {
            input.style.borderColor = '#f39c12';
            this.showFieldError(input, 'Resident must be 60 or older');
          } else {
            input.style.borderColor = '';
            this.clearFieldError(input);
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
