const main = document.querySelector('#contenido');

if (main && window.location.hash === '#contenido') {
  main.focus();
}

document.querySelectorAll('[data-writing-monitor]').forEach((form) => {
  const startedInput = form.querySelector('input[name="writingStartedAt"]');
  const endedInput = form.querySelector('input[name="writingEndedAt"]');
  const entryTimeInput = form.querySelector('input[name="entryTime"]');
  const watchedFields = form.querySelectorAll('input[type="text"], input[type="date"], input[type="time"], textarea');

  if (!startedInput || !endedInput) return;

  const nowForInput = () => {
    const date = new Date();
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  };

  const markActivity = () => {
    const now = nowForInput();

    if (!startedInput.value) {
      startedInput.value = now;
    }

    endedInput.value = now;

    if (entryTimeInput && !entryTimeInput.value) {
      entryTimeInput.value = now.slice(11, 16);
    }
  };

  watchedFields.forEach((field) => {
    field.addEventListener('focus', markActivity, { passive: true });
    field.addEventListener('input', markActivity, { passive: true });
    field.addEventListener('keydown', markActivity, { passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && startedInput.value) {
      endedInput.value = nowForInput();
    }
  });

  window.addEventListener('blur', () => {
    if (startedInput.value) {
      endedInput.value = nowForInput();
    }
  });

  form.addEventListener('submit', markActivity);
});
