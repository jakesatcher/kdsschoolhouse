'use strict';

document.querySelectorAll('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));
document.querySelectorAll('select[data-nav]').forEach((s) => s.addEventListener('change', () => { window.location.href = s.value; }));
document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => window.history.back()));

// Show/hide the parts of a form that depend on a radio choice: data-show-if="field:value".
function syncShowIf() {
  document.querySelectorAll('[data-show-if]').forEach((el) => {
    const [name, value] = el.dataset.showIf.split(':');
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    el.hidden = !(checked && checked.value === value);
  });
}
document.addEventListener('change', syncShowIf);
syncShowIf();

// Slow forms (AI writing): show progress and block double-submits.
document.querySelectorAll('form[data-busy]').forEach((f) => f.addEventListener('submit', () => {
  const b = f.querySelector('button[type=submit]');
  if (b) { b.disabled = true; b.textContent = f.dataset.busy; }
}));
