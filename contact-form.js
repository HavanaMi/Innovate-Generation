/* Contact forms use FormSubmit; recipient must activate the destination mailbox. */
document.querySelectorAll('.ig-ajax-contact').forEach(form => {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('[type="submit"]');
    const status = form.nextElementSibling;
    if (!button || !status) return;
    const original = button.textContent;
    button.disabled = true;
    button.textContent = 'Sending…';
    status.textContent = 'Sending your message…';

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      // FormSubmit's documented AJAX fetch interface uses JSON.
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      const accepted = response.ok && (result.success === true || result.success === 'true');
      if (!accepted) {
        const reason = typeof result.message === 'string' ? result.message : '';
        if (/activat|confirm.*email/i.test(reason)) {
          status.textContent = 'The contact form needs email activation by Innovate Generation. Please contact igclientrelations@gmail.com directly until it is activated.';
        } else {
          status.textContent = 'Message not sent. Please email igclientrelations@gmail.com directly.';
        }
        return;
      }
      status.textContent = 'Your message was accepted by the form service. Thank you!';
      form.reset();
    } catch (error) {
      status.textContent = 'Message not sent. Please email igclientrelations@gmail.com directly.';
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  });
});
