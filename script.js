// Simple calculator logic, animations and theme toggle
(function () {
  // Run after DOM is ready so elements always exist
  document.addEventListener('DOMContentLoaded', () => {
    const displayEl = document.getElementById('display');
    let buffer = ''; // expression buffer
    let prevDisplayText = displayEl.textContent || '';

    function updateDisplay() {
      const newText = buffer === '' ? '0' : buffer;
      const oldText = prevDisplayText;
      displayEl.textContent = newText;
      prevDisplayText = newText;

      // Animate display when a numeric value (contains digits) appears and text changed
      if (/\d/.test(newText) && newText !== oldText && !prefersReducedMotion()) {
        triggerDisplayPop();
      }
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
        // Evaluate expression in a minimal scope
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

    // Animation helpers
    function prefersReducedMotion() {
      try {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch (e) {
        return false;
      }
    }

    function triggerButtonAnimation(btn) {
      if (!btn || prefersReducedMotion()) return;
      // add class and remove after animationend (or fallback)
      btn.classList.add('btn-animate');
      const cleanup = () => {
        btn.classList.remove('btn-animate');
        btn.removeEventListener('animationend', cleanup);
      };
      btn.addEventListener('animationend', cleanup);
      // Fallback removal after 250ms
      setTimeout(() => btn.classList.remove('btn-animate'), 300);
    }

    function triggerDisplayPop() {
      if (prefersReducedMotion()) return;
      displayEl.classList.remove('display-pop');
      // Force reflow to replay animation
      // eslint-disable-next-line no-unused-expressions
      displayEl.offsetWidth;
      displayEl.classList.add('display-pop');

      const cleanup = () => {
        displayEl.classList.remove('display-pop');
        displayEl.removeEventListener('animationend', cleanup);
      };
      displayEl.addEventListener('animationend', cleanup);
      // Fallback removal after 400ms
      setTimeout(() => displayEl.classList.remove('display-pop'), 450);
    }

    // Button clicks (only .btn elements)
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // animate the clicked button
        triggerButtonAnimation(btn);

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

    // Keyboard support (also animate matching button)
    window.addEventListener('keydown', (e) => {
      // Try to find matching button so keyboard presses animate too
      const allButtons = Array.from(document.querySelectorAll('.btn'));
      const matchByValue = allButtons.find(b => b.getAttribute('data-value') === e.key);
      let matchByAction = null;
      if (e.key === 'Enter' || e.key === '=') {
        matchByAction = allButtons.find(b => b.getAttribute('data-action') === 'equals');
      } else if (e.key === 'Backspace') {
        matchByAction = allButtons.find(b => b.getAttribute('data-action') === 'delete');
      } else if (e.key === 'Escape') {
        matchByAction = allButtons.find(b => b.getAttribute('data-action') === 'clear');
      }

      const btnToAnimate = matchByValue || matchByAction;
      if (btnToAnimate) triggerButtonAnimation(btnToAnimate);

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
        if (themeToggleBtn) {
          themeToggleBtn.textContent = '☀️';
          themeToggleBtn.setAttribute('aria-pressed', 'true');
          themeToggleBtn.title = 'Switch to light mode';
        }
      } else {
        document.documentElement.removeAttribute('data-theme');
        if (themeToggleBtn) {
          themeToggleBtn.textContent = '🌙';
          themeToggleBtn.setAttribute('aria-pressed', 'false');
          themeToggleBtn.title = 'Switch to dark mode';
        }
      }
    }

    function getPreferredTheme() {
      try {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
      } catch (err) {
        // localStorage might be disabled — ignore and fall back to system preference
      }
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }

    // Initialize theme on load
    const initialTheme = getPreferredTheme();
    applyTheme(initialTheme);

    // Toggle handler (guard in case button is missing)
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch (err) {
          // ignore if storage unavailable
        }
      });
    } else {
      // eslint-disable-next-line no-console
      console.warn('Theme toggle button not found: #theme-toggle');
    }
  });
})();
