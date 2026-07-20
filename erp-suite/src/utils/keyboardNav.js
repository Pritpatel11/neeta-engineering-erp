export const handleFormKeyboardNav = (e) => {
  // If Enter key is pressed
  if (e.key === 'Enter') {
    const isButton = e.target.tagName === 'BUTTON';
    const isTextarea = e.target.tagName === 'TEXTAREA';
    const isSubmitInput = e.target.tagName === 'INPUT' && e.target.type === 'submit';
    
    // We don't want to prevent Enter on buttons or textareas
    if (!isButton && !isTextarea && !isSubmitInput) {
      e.preventDefault();
      
      const form = e.target.form;
      if (form) {
        const focusableElements = Array.from(form.querySelectorAll('input, select, button, textarea'))
          .filter(el => !el.disabled && el.tabIndex !== -1 && el.type !== 'hidden');
        
        const index = focusableElements.indexOf(e.target);
        if (index > -1 && index < focusableElements.length - 1) {
          focusableElements[index + 1].focus();
        }
      }
    }
  }

  // Optional: Up/Down arrows to move focus
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    // Only apply if it's an input field (not a select, as arrows are used to change options in select)
    if (e.target.tagName === 'INPUT' && e.target.type !== 'date') {
      e.preventDefault();
      const form = e.target.form;
      if (form) {
        const focusableElements = Array.from(form.querySelectorAll('input, select, button, textarea'))
          .filter(el => !el.disabled && el.tabIndex !== -1 && el.type !== 'hidden');
        
        const index = focusableElements.indexOf(e.target);
        
        if (e.key === 'ArrowUp' && index > 0) {
          focusableElements[index - 1].focus();
        } else if (e.key === 'ArrowDown' && index < focusableElements.length - 1) {
          focusableElements[index + 1].focus();
        }
      }
    }
  }
};
