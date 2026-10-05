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

// Phonics: choosing a type reveals a second dropdown with just that type's sub-types.
document.querySelectorAll('[data-phonics-pick]').forEach((box) => {
  const subs = JSON.parse(box.dataset.subs);
  const cat = box.querySelector('select[name=category]');
  const wrap = box.querySelector('[data-sub-wrap]');
  const sub = wrap.querySelector('select');
  cat.addEventListener('change', () => {
    sub.replaceChildren(...(subs[cat.value] || []).map(([value, label]) => new Option(label, value)));
    wrap.hidden = !subs[cat.value];
  });
});

// Top menus behave like an accordion: opening one closes the others; a click elsewhere or Escape closes them all.
const menus = [...document.querySelectorAll('.topbar details.menu')];
menus.forEach((d) => d.addEventListener('toggle', () => {
  if (d.open) menus.forEach((o) => { if (o !== d) o.open = false; });
}));
document.addEventListener('click', (e) => { if (!e.target.closest('details.menu')) menus.forEach((o) => { o.open = false; }); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') menus.forEach((o) => { o.open = false; }); });
