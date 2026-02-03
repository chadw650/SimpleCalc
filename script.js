// Simple calculator logic and theme toggle
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

  // Initialize calculator display
  clearAll();

  /* -----------------------
     Theme toggle / persistence
     ----------------------- */
  const themeToggleBtn = document.getElementById('theme-toggle');
  const THEME_KEY = 'calculator-theme'; // 'light' or 'dark'

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggleBtn.textContent = '☀️';
      themeToggleBtn.setAttribute('aria-pressed', 'true');
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeToggleBtn.textContent = '🌙';
      themeToggleBtn.setAttribute('aria-pressed', 'false');
    }
  }

  function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    // If no stored preference, respect system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  // Initialize theme on load
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  // Toggle handler
  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });

})();
