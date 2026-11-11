const dialog = document.querySelector('.offer-dialog');
const form = document.querySelector('#offer-form');
const toast = document.querySelector('.toast');
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('#main-nav');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 4200);
}

document.querySelectorAll('.js-open-dialog').forEach((button) => {
  button.addEventListener('click', () => dialog.showModal());
});

document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  mainNav.classList.toggle('is-open', !isOpen);
});

mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('.faq-item').forEach((item) => {
  const summary = item.querySelector('summary');
  let closeTimer;

  const finishClose = () => {
    if (!item.classList.contains('is-closing')) return;
    item.open = false;
    item.classList.remove('is-closing');
    window.clearTimeout(closeTimer);
  };

  summary.setAttribute('aria-expanded', String(item.open));
  summary.addEventListener('click', (event) => {
    event.preventDefault();
    window.clearTimeout(closeTimer);

    if (item.classList.contains('is-closing')) {
      item.classList.remove('is-closing');
      summary.setAttribute('aria-expanded', 'true');
      return;
    }

    if (item.open) {
      item.classList.add('is-closing');
      summary.setAttribute('aria-expanded', 'false');
      closeTimer = window.setTimeout(finishClose, 500);
      return;
    }

    item.open = true;
    summary.setAttribute('aria-expanded', 'true');
  });

  item.addEventListener('transitionend', (event) => {
    if (event.propertyName === 'grid-template-rows') finishClose();
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const fields = new FormData(form);
  const lines = [
    'Привет! Хочу предложить подарок Telegram на покупку.',
    `Подарок: ${fields.get('gift').trim()}`,
  ];
  const model = fields.get('model').trim();
  const price = fields.get('price').trim();
  const link = fields.get('link').trim();
  const comment = fields.get('comment').trim();

  if (model) lines.push(`Модель / номер: ${model}`);
  if (price) lines.push(`Желаемая цена: ${price}`);
  if (link) lines.push(`Ссылка: ${link}`);
  if (comment) lines.push(`Комментарий: ${comment}`);

  const shareUrl = new URL('https://t.me/share/url');
  shareUrl.searchParams.set('text', lines.join('\n'));
  if (window.location.protocol === 'https:' || window.location.protocol === 'http:') {
    shareUrl.searchParams.set('url', window.location.href.split('#')[0]);
  }

  window.open(shareUrl.toString(), '_blank', 'noopener,noreferrer');
  dialog.close();
  showToast('Черновик готов. Проверь сообщение и выбери получателя в Telegram.');
});
