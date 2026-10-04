'use strict';

document.querySelectorAll('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));
document.querySelectorAll('select[data-nav]').forEach((s) => s.addEventListener('change', () => { window.location.href = s.value; }));
document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => window.history.back()));
