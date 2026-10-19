const emailAddress = 'axel.gomez.dev@gmail.com';
const copyButton = document.querySelector('.copy-email');
const copyStatus = document.querySelector('.copy-status');
let copyFeedbackTimer;

copyButton.addEventListener('click', async () => {
  clearTimeout(copyFeedbackTimer);
  try {
    await navigator.clipboard.writeText(emailAddress);
    copyStatus.textContent = 'Email address copied.';
  } catch {
    copyStatus.textContent = 'Copy unavailable. Use the email link or select the address.';
  }
  copyFeedbackTimer = setTimeout(() => { copyStatus.textContent = ''; }, 4500);
});

document.querySelector('#year').textContent = new Date().getFullYear();
window.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) window.lucide.createIcons();
});

const navigationLinks = [...document.querySelectorAll('.site-header nav a')];
const sectionObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      for (const link of navigationLinks) {
        const active = link.hash === `#${entry.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
  }
}, { rootMargin: '-10% 0px -65% 0px', threshold: 0 });

for (const link of navigationLinks) {
  const section = document.querySelector(link.hash);
  if (section) sectionObserver.observe(section);
}

