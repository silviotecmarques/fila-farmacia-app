// Pequenas travas anti-cópia/print no renderer
window.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('dragstart', e => e.preventDefault());
  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && ['s','p','u'].includes(k)) e.preventDefault(); // Ctrl+S/P/U
    if (e.key === 'PrintScreen') e.preventDefault();
  });
});
