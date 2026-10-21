/* Non-transactional contact forms. Requires one-time FormSubmit email activation. */
document.querySelectorAll('.ig-ajax-contact').forEach(form => {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('[type="submit"]');
    const status = form.nextElementSibling;
    button.disabled = true;
    const original = button.textContent;
    button.textContent = 'Sending…';
    status.textContent = 'Sending your message…';
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });
      const result = await response.json();
      if (!response.ok || result.success === false || result.success === 'false') {
        throw new Error('The form service could not accept the message.');
      }
      status.textContent = 'Your message has been submitted. Thank you!';
      form.reset();
    } catch (error) {
      status.textContent = 'Your message could not be sent. Please email igclientrelations@gmail.com directly.';
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  });
});
