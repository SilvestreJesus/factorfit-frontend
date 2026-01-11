document.addEventListener('DOMContentLoaded', () => {
  let paused = false;

  const container = document.getElementById('events');

  if (container) {
    container.addEventListener('mouseenter', () => paused = true);
    container.addEventListener('mouseleave', () => paused = false);
  }

  setInterval(() => {
    if (paused) return;

    const btnNext = document.getElementById('btn-next');
    if (btnNext) {
      btnNext.click();
    }
  }, 3500);
});
