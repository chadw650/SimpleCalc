// Simple calculator logic
(function () {
  const displayEl = document.getElementById('display');
  let buffer = ''; // expression buffer

  function updateDisplay() {
    displayEl.textContent = buffer === '' ? '0' : buffer;
  }

  function append(char) {
    // Prevent multiple leading zeros like "00"
    if (buffer === '0' && char >= '0' && char <= '9') {
      buffer = char;
    } else {
      buffer += char;
    }
    updateDisplay();
  }

  function clearAll() {
    buffer = '';
    updateDisplay();
  }

  function del() {
    buffer = buffer.slice(0, -1);
    updateDisplay();
  }

  function sanitizeExpression(expr) {
    // Allow only digits, operators, parentheses, decimal point, percent sign, whitespace
    // This prevents insertion of letters or other harmful tokens.
    const allowed = /^[0-9+\-*/().%\s]+$/;
    return allowed.test(expr);
  }

  function evaluateExpression() {
    const expr = buffer.trim();
    if (!expr) return;
    if (!sanitizeExpression(expr)) {
      buffer = 'Error';
      updateDisplay();
      return;
    }

    try {
      // Use Function constructor to evaluate expression in isolated scope
      // Note: still rely on sanitizeExpression for safety.
      const result = new Function('return ' + expr)();
      // Format result to avoid long floats
      if (typeof result === 'number' && !Number.isInteger(result)) {
        buffer = parseFloat(result.toPrecision(12)).toString();
      } else {
        buffer = String(result);
      }
    } catch (e) {
      buffer = 'Error';
    }
    updateDisplay();
  }

  // Button clicks
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-value');
      const action = btn.getAttribute('data-action');

      if (action === 'clear') {
        clearAll();
        return;
      }
      if (action === 'delete') {
        del();
        return;
      }
      if (action === 'equals') {
        evaluateExpression();
        return;
      }
      if (val) {
        append(val);
      }
    });
  });

  // Keyboard support
  window.addEventListener('keydown', (e) => {
    // Allow digits, operators, parentheses, decimal point
    if ((e.key >= '0' && e.key <= '9') || '+-*/().%'.includes(e.key)) {
      e.preventDefault();
      append(e.key);
      return;
    }

    if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      evaluateExpression();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      del();
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      clearAll();
      return;
    }

    // Allow comma as decimal for some keyboard layouts — translate to dot
    if (e.key === ',') {
      e.preventDefault();
      append('.');
      return;
    }
  });

  // Initialize
  clearAll();
})();