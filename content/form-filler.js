// content/form-filler.js
// Fills detected forms with user profile data or voice input, with animation and visual feedback.

class FormFiller {
  constructor() {
    this.filledFields = [];
    this.rollbackStack = [];
    this.injectStyles();
  }

  // Fill fields progressively with animation
  async fillFields(mappings, { delay = 600 } = {}) {
    this.rollbackStack = [];
    for (const mapping of mappings) {
      const { field, value } = mapping;
      if (!field || !field.element) continue;
      await this.animateFill(field.element, value, delay);
      this.filledFields.push({ field, previousValue: this.getFieldValue(field.element) });
    }
  }

  // Animate filling a single field
  async animateFill(element, value, delay) {
    this.highlightField(element);
    await this.smoothInsert(element, value);
    this.showFeedback(element, 'Filled!');
    await this.wait(delay);
    this.unhighlightField(element);
  }

  // Smoothly insert value into field
  async smoothInsert(element, value) {
    if (element.disabled || element.readOnly) return;
    if (element.tagName === 'SELECT') {
      for (const option of element.options) {
        if (option.value === value || option.text === value) {
          element.value = option.value;
          option.selected = true;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    } else if (element.type === 'checkbox' || element.type === 'radio') {
      element.checked = Boolean(value === true || value === 'on' || value === 'yes' || value === element.value);
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // Animate typing for text fields
      element.value = '';
      for (let i = 0; i <= value.length; i++) {
        element.value = value.slice(0, i);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        await this.wait(30 + Math.random() * 30);
      }
    }
    // Validation
    if (element.required && !element.value) {
      this.showFeedback(element, 'Required!', true);
    }
  }

  // Highlight a field
  highlightField(element) {
    element.classList.add('form-filler-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Remove highlight
  unhighlightField(element) {
    element.classList.remove('form-filler-highlight');
  }

  // Show visual feedback (e.g., checkmark or error)
  showFeedback(element, message, isError = false) {
    let feedback = document.createElement('div');
    feedback.className = 'form-filler-feedback' + (isError ? ' error' : '');
    feedback.textContent = message;
    element.parentElement.appendChild(feedback);
    setTimeout(() => feedback.remove(), 1200);
  }

  // Get current value of a field
  getFieldValue(element) {
    if (element.type === 'checkbox' || element.type === 'radio') {
      return element.checked;
    }
    return element.value;
  }

  // Rollback filled fields
  async rollback() {
    for (const { field, previousValue } of this.filledFields.reverse()) {
      if (!field || !field.element) continue;
      await this.animateFill(field.element, previousValue, 200);
    }
    this.filledFields = [];
  }

  // Utility: wait for ms
  wait(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  // Inject highlight and feedback styles
  injectStyles() {
    if (document.getElementById('form-filler-style')) return;
    const style = document.createElement('style');
    style.id = 'form-filler-style';
    style.textContent = `
      .form-filler-highlight {
        outline: 3px solid #f39c12 !important;
        box-shadow: 0 0 8px 2px #f1c40f55 !important;
        transition: outline 0.3s, box-shadow 0.3s;
        background: #fffbe6 !important;
      }
      .form-filler-feedback {
        position: absolute;
        left: 105%;
        top: 50%;
        transform: translateY(-50%);
        background: #2ecc40;
        color: #fff;
        padding: 2px 10px;
        border-radius: 6px;
        font-size: 0.95em;
        box-shadow: 0 2px 8px #0001;
        z-index: 9999;
        opacity: 0.95;
        pointer-events: none;
        animation: form-filler-fadein 0.3s;
      }
      .form-filler-feedback.error {
        background: #e74c3c;
      }
      @keyframes form-filler-fadein {
        from { opacity: 0; transform: translateY(-60%); }
        to { opacity: 0.95; transform: translateY(-50%); }
      }
    `;
    document.head.appendChild(style);
  }
}

// Export for use in other scripts
window.FormFiller = FormFiller; 