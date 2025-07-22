// content/form-detector.js
// Detects forms and input fields on the current web page.

class FormDetector {
  constructor() {
    this.forms = [];
    this.fields = [];
    this.observer = null;
    this.startMonitoring();
  }

  // Scan the DOM for all forms and standalone fields
  scanForms() {
    this.forms = [];
    this.fields = [];
    const formElements = Array.from(document.querySelectorAll('form'));
    formElements.forEach(form => {
      const formObj = this.processForm(form);
      this.forms.push(formObj);
    });
    // Standalone fields not inside forms
    const standaloneFields = Array.from(document.querySelectorAll('input, textarea, select'))
      .filter(el => !el.closest('form'));
    standaloneFields.forEach(field => {
      const fieldObj = this.processField(field, null);
      this.fields.push(fieldObj);
    });
    return {
      forms: this.forms,
      standaloneFields: this.fields
    };
  }

  // Process a form element and its fields
  processForm(form) {
    const fields = Array.from(form.querySelectorAll('input, textarea, select')).map(field =>
      this.processField(field, form)
    );
    return {
      id: this.generateFormFingerprint(form),
      element: form,
      fields,
      action: form.action,
      method: form.method,
      // Add more metadata as needed
    };
  }

  // Process a single field and classify it
  processField(field, form) {
    const classification = this.classifyField(field);
    return {
      id: field.id || field.name || this.generateFieldFingerprint(field, form),
      name: field.name || '',
      type: field.type || field.tagName.toLowerCase(),
      label: this.getFieldLabel(field),
      classification: classification.type,
      confidence: classification.confidence,
      element: field
    };
  }

  // Classify field type using attributes, name, label, and context
  classifyField(field) {
    // Placeholder: Use heuristics for classification
    const name = (field.name || '').toLowerCase();
    const id = (field.id || '').toLowerCase();
    const label = (this.getFieldLabel(field) || '').toLowerCase();
    let type = 'unknown';
    let confidence = 0.5;
    if (/email/.test(name) || /email/.test(id) || /email/.test(label)) {
      type = 'email';
      confidence = 0.95;
    } else if (/name/.test(name) || /name/.test(id) || /name/.test(label)) {
      type = 'name';
      confidence = 0.85;
    } else if (/phone|tel/.test(name) || /phone|tel/.test(id) || /phone|tel/.test(label)) {
      type = 'phone';
      confidence = 0.9;
    } else if (field.type === 'password') {
      type = 'password';
      confidence = 1.0;
    } else if (field.type === 'checkbox') {
      type = 'checkbox';
      confidence = 0.9;
    } else if (field.type === 'radio') {
      type = 'radio';
      confidence = 0.9;
    } else if (field.type === 'submit' || field.type === 'button') {
      type = 'button';
      confidence = 0.8;
    } else if (field.tagName.toLowerCase() === 'textarea') {
      type = 'textarea';
      confidence = 0.8;
    } else if (field.type === 'text') {
      type = 'text';
      confidence = 0.6;
    }
    return { type, confidence };
  }

  // Get the label for a field
  getFieldLabel(field) {
    try {
      // Check for <label for="...">
      if (field.id) {
        const label = document.querySelector(`label[for='${field.id}']`);
        if (label) return label.innerText.trim();
      }
      // Check parent label
      if (field.parentElement && field.parentElement.tagName.toLowerCase() === 'label') {
        return field.parentElement.innerText.trim();
      }
      // Check aria-label
      if (field.hasAttribute('aria-label')) {
        return field.getAttribute('aria-label').trim();
      }
      // Check placeholder
      if (field.hasAttribute('placeholder')) {
        return field.getAttribute('placeholder').trim();
      }
      return '';
    } catch (err) {
      console.error('[FormDetector] Error getting field label:', err);
      return '';
    }
  }

  // Generate a unique fingerprint for a form
  generateFormFingerprint(form) {
    // Simple fingerprint using action, method, and field names
    const fieldNames = Array.from(form.querySelectorAll('input, textarea, select'))
      .map(f => f.name || f.id || f.type)
      .join('-');
    return `form-${btoa(form.action + form.method + fieldNames).substr(0, 12)}`;
  }

  // Generate a unique fingerprint for a field
  generateFieldFingerprint(field, form) {
    const formId = form ? this.generateFormFingerprint(form) : 'standalone';
    return `field-${btoa((field.name || '') + (field.id || '') + formId).substr(0, 12)}`;
  }

  // Start monitoring the DOM for dynamic content
  startMonitoring() {
    this.scanForms(); // Initial scan
    if (this.observer) {
      this.observer.disconnect();
    }
    this.observer = new MutationObserver(() => {
      this.scanForms();
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  // Stop monitoring the DOM
  stopMonitoring() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Export for use in other scripts
window.FormDetector = FormDetector; 