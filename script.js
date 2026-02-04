// Simple calculator logic, animations, theme toggle, and extra functions (memory, sqrt, square, reciprocal, negate)
(function () {
  // Run after DOM is ready so elements always exist
  document.addEventListener('DOMContentLoaded', () => {
    const displayEl = document.getElementById('display');
    let buffer = ''; // expression buffer
    let prevDisplayText = displayEl.textContent || '';
    const MEMORY_KEY = 'calculator-memory-v1';

    /* -----------------------
       Utility / preprocessing
       ----------------------- */
    function prefersReducedMotion() {
      try {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch (e) {
        return false;
      }
    }

    // Normalize expression before evaluating:
    // - convert ×/÷ to * and /
    // - convert ^ to **
    // - interpret % as /100 (simple postfix percent handling)
    function preprocessExpression(expr) {
      if (!expr) return '';
      return expr
        .replace(/��/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**')
        .replace(/%/g, '/100');
    }

    // Allow only safe characters after preprocessing (digits, operators, parens, decimal, whitespace)
    function sanitizeExpression(expr) {
      const allowed = /^[0-9+\-*/().\s]+$/;
      return allowed.test(expr);
    }

    /* -----------------------
       Display / Buffer
       ----------------------- */
    function updateDisplay() {
      const newText = buffer === '' ? '0' : buffer;
      const oldText = prevDisplayText;
      displayEl.textContent = newText;
      prevDisplayText = newText;

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

    /* -----------------------
       Evaluation
       ----------------------- */
    function evaluateExpression() {
      const raw = buffer.trim();
      if (!raw) return;
      const pre = preprocessExpression(raw);
      if (!sanitizeExpression(pre)) {
        buffer = 'Error';
        updateDisplay();
        return;
      }

      try {
        // Evaluate in isolated scope
        const result = new Function('return ' + pre)();
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

    /* -----------------------
       Scientific-like functions (operate on whole expression/current value)
       ----------------------- */
    function applyFunction(fn) {
      const raw = buffer.trim();
      if (!raw) return;
      const pre = preprocessExpression(raw);
      if (!sanitizeExpression(pre)) {
        buffer = 'Error';
        updateDisplay();
        return;
      }

      try {
        const value = new Function('return ' + pre)();
        let out;
        switch (fn) {
          case 'sqrt': out = Math.sqrt(value); break;
          case 'square': out = value * value; break;
          case 'reciprocal': out = value === 0 ? NaN : 1 / value; break;
          case 'negate': out = -value; break;
          default: return;
        }
        if (typeof out === 'number' && !Number.isInteger(out)) {
          buffer = parseFloat(out.toPrecision(12)).toString();
        } else {
          buffer = String(out);
        }
      } catch (e) {
        buffer = 'Error';
      }
      updateDisplay();
    }

    /* -----------------------
       Memory operations
       ----------------------- */
    function memoryGet() {
      try {
        const raw = localStorage.getItem(MEMORY_KEY);
        if (raw == null) return 0;
        const n = parseFloat(raw);
        return Number.isFinite(n) ? n : 0;
      } catch (e) {
        return 0;
      }
    }

    function memorySet(value) {
      try {
        localStorage.setItem(MEMORY_KEY, String(value));
      } catch (e) { /* ignore */ }
    }

    function memoryClear() {
      try {
        localStorage.removeItem(MEMORY_KEY);
      } catch (e) { /* ignore */ }
    }

    function memoryAdd() {
      const val = evaluateForMemory();
      if (val == null) return;
      memorySet(memoryGet() + val);
    }

    function memorySub() {
      const val = evaluateForMemory();
      if (val == null) return;
      memorySet(memoryGet() - val);
    }

    function memoryRecall() {
      const val = memoryGet();
      buffer = String(val);
      updateDisplay();
    }

    function evaluateForMemory() {
      const raw = buffer.trim();
      if (!raw) return null;
      const pre = preprocessExpression(raw);
      if (!sanitizeExpression(pre)) return null;
      try {
        const val = new Function('return ' + pre)();
        return typeof val === 'number' ? val : parseFloat(val);
      } catch (e) {
        return null;
      }
    }

    /* -----------------------
       Animations
       ----------------------- */
    function triggerButtonAnimation(btn) {
      if (!btn || prefersReducedMotion()) return;
      btn.classList.remove('btn-animate');
      // force reflow
      void btn.offsetWidth;
      btn.classList.add('btn-animate');

      const cleanup = () => {
        btn.classList.remove('btn-animate');
        btn.removeEventListener('animationend', cleanup);
      };
      btn.addEventListener('animationend', cleanup);
      setTimeout(() => btn.classList.remove('btn-animate'), 350);
    }

    function triggerDisplayPop() {
      if (prefersReducedMotion()) return;
      displayEl.classList.remove('display-pop');
      void displayEl.offsetWidth;
      displayEl.classList.add('display-pop');

      const cleanup = () => {
        displayEl.classList.remove('display-pop');
        displayEl.removeEventListener('animationend', cleanup);
      };
      displayEl.addEventListener('animationend', cleanup);
      setTimeout(() => displayEl.classList.remove('display-pop'), 450);
    }

    /* -----------------------
       Button wiring (clicks)
       ----------------------- */
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', () => {
        triggerButtonAnimation(btn);

        const val = btn.getAttribute('data-value');
        const action = btn.getAttribute('data-action');
        const func = btn.getAttribute('data-func');

        if (action === 'clear') { clearAll(); return; }
        if (action === 'delete') { del(); return; }
        if (action === 'equals') { evaluateExpression(); return; }

        if (action && action.startsWith('mem-')) {
          switch (action) {
            case 'mem-clear': memoryClear(); break;
            case 'mem-recall': memoryRecall(); break;
            case 'mem-add': memoryAdd(); break;
            case 'mem-sub': memorySub(); break;
          }
          return;
        }

        if (func) { applyFunction(func); return; }

        if (val) { append(val); return; }
      });
    });

    /* -----------------------
       Keyboard wiring (with animation)
       ----------------------- */
    window.addEventListener('keydown', (e) => {
      const allButtons = Array.from(document.querySelectorAll('.btn'));
      // try match by data-value (single character)
      const matchByValue = allButtons.find(b => b.getAttribute('data-value') === e.key);
      // map some keys to actions
      let matchByAction = null;
      if (e.key === 'Enter' || e.key === '=') matchByAction = allButtons.find(b => b.getAttribute('data-action') === 'equals');
      else if (e.key === 'Backspace') matchByAction = allButtons.find(b => b.getAttribute('data-action') === 'delete');
      else if (e.key === 'Escape') matchByAction = allButtons.find(b => b.getAttribute('data-action') === 'clear');
      else if (e.key === '^') {
        // add caret support -- insert ^ which will be preprocessed to **
        // try to animate a close visual button (none exists) — skip
      }

      const btnToAnimate = matchByValue || matchByAction;
      if (btnToAnimate) triggerButtonAnimation(btnToAnimate);

      // Actual input handling
      if ((e.key >= '0' && e.key <= '9') || '+-*/().%'.includes(e.key) || e.key === '^') {
        e.preventDefault();
        // Insert ^ as caret (will be preprocessed into **)
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

      if (e.key === ',') {
        e.preventDefault();
        append('.');
        return;
      }
    });

    // Initialize
    clearAll();

    /* -----------------------
       Theme toggle / persistence
       ----------------------- */
    const themeToggleBtn = document.getElementById('theme-toggle');
    const THEME_KEY = 'calculator-theme';

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
      } catch (err) {}
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }

    const initialTheme = getPreferredTheme();
    applyTheme(initialTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      });
    }
  });
})();
