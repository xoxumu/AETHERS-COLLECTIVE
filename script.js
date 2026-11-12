const saleDialog = document.querySelector('#sale-dialog');
const welcomeDialog = document.querySelector('#welcome-dialog');
const saleForm = document.querySelector('#sale-form');
const contactInput = document.querySelector('#contact-value');
const contactLabel = document.querySelector('#contact-label');
const saleBotLink = document.querySelector('.sale-bot-link');
const sellerUsernameField = document.querySelector('.seller-username-field');
const sellerUsernameInput = document.querySelector('#seller-username');
const buyerUsernameInput = document.querySelector('#buyer-username');
const nftNameInput = document.querySelector('#nft-name');
const nftModelInput = document.querySelector('#nft-model');
const nftPriceInput = document.querySelector('#nft-price');
const proposalMessage = document.querySelector('#proposal-message');
const copyProposalButton = document.querySelector('#copy-proposal');
const copyStatus = document.querySelector('#copy-status');
const collectionDetailDialog = document.querySelector('#collection-detail-dialog');
const collectionDetailTitle = document.querySelector('#collection-detail-title');
const collectionDetailDescription = document.querySelector('#collection-detail-description');
const collectionDetailImage = document.querySelector('#collection-detail-image');
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('#main-nav');
let contactMethod = 'telegram';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('motion-ready');

const revealTargets = document.querySelectorAll(
  '.section-heading, .collection-card, .step-card, .process-note, .cta-panel, .faq-item, .support-panel'
);
revealTargets.forEach((element) => element.classList.add('reveal'));
const activeFaqTransitions = new Set();
const supportPanel = document.querySelector('.support-panel');
let revealObserver = null;
let supportRevealNeedsSync = false;

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealTargets.forEach((element) => element.classList.add('is-visible'));
} else {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const target = entry.target;
      if (target === supportPanel && activeFaqTransitions.size > 0) {
        supportRevealNeedsSync = true;
        return;
      }

      if (entry.isIntersecting) {
        target.classList.remove('is-exiting-up', 'is-exiting-down');
        target.classList.add('is-visible');
      } else if (target.classList.contains('is-visible')) {
        target.classList.remove('is-visible');
        const bounds = entry.boundingClientRect;
        const leftAbove = bounds.top + bounds.height / 2 < window.innerHeight / 2;
        target.classList.add(leftAbove ? 'is-exiting-up' : 'is-exiting-down');
      }
    });
  }, { threshold: 0.02, rootMargin: '0px' });
  revealTargets.forEach((element) => revealObserver.observe(element));
}

const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const tiltTargets = document.querySelectorAll(
  '.collection-card, .step-card, .process-note, .cta-panel, .support-panel, .featured-gift'
);
if (!reduceMotion) {
  let activeTouchTilt = null;

  tiltTargets.forEach((card) => {
    let frame = 0;
    let bounds = null;
    let active = false;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let lastFrameTime = 0;
    const angle = card.classList.contains('featured-gift') || card.classList.contains('collection-card') || card.classList.contains('step-card') ? 24 : 8;

    const animateTilt = (time) => {
      frame = 0;
      const frameDelta = lastFrameTime ? Math.min(time - lastFrameTime, 32) : 16;
      lastFrameTime = time;
      const smoothingTime = active ? 170 : 420;
      const blend = 1 - Math.exp(-frameDelta / smoothingTime);
      currentX += (targetX - currentX) * blend;
      currentY += (targetY - currentY) * blend;

      if (Math.abs(targetX - currentX) < 0.015) currentX = targetX;
      if (Math.abs(targetY - currentY) < 0.015) currentY = targetY;

      card.style.setProperty('--tilt-x', `${currentX.toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${currentY.toFixed(2)}deg`);

      const settled = Math.abs(currentX) < 0.015 && Math.abs(currentY) < 0.015 && !active;
      if (settled) {
        currentX = 0;
        currentY = 0;
        card.style.removeProperty('--tilt-x');
        card.style.removeProperty('--tilt-y');
        card.classList.remove('is-tilting');
        bounds = null;
      } else if (Math.abs(targetX - currentX) >= 0.015 || Math.abs(targetY - currentY) >= 0.015) {
        frame = window.requestAnimationFrame(animateTilt);
      }
    };

    const queueTilt = () => {
      if (!frame) frame = window.requestAnimationFrame(animateTilt);
    };

    const trackPointer = (event) => {
      if (event.pointerType === 'touch' && activeTouchTilt !== card) return;
      if (event.pointerType !== 'touch' && !finePointer) return;
      if (!active) {
        bounds = card.getBoundingClientRect();
        active = true;
        card.classList.add('is-tilting');
      }

      const x = Math.max(-0.5, Math.min(0.5, (event.clientX - bounds.left) / bounds.width - 0.5));
      const y = Math.max(-0.5, Math.min(0.5, (event.clientY - bounds.top) / bounds.height - 0.5));
      targetX = x * angle;
      targetY = -y * angle;
      queueTilt();
    };

    const releaseTilt = () => {
      if (!active) return;
      active = false;
      targetX = 0;
      targetY = 0;
      queueTilt();
    };

    card.addEventListener('pointermove', trackPointer);
    card.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'touch') releaseTilt();
    });
    card.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch') return;
      activeTouchTilt = card;
      trackPointer(event);
    });

    card.addEventListener('aethers:release-tilt', releaseTilt);
  });

  const releaseTouchTilt = (event) => {
    if (event.pointerType !== 'touch' || !activeTouchTilt) return;
    activeTouchTilt.dispatchEvent(new Event('aethers:release-tilt'));
    activeTouchTilt = null;
  };
  window.addEventListener('pointerup', releaseTouchTilt);
  window.addEventListener('pointercancel', releaseTouchTilt);

  document.querySelectorAll('.js-open-dialog, .support-action').forEach((button) => {
    let frame = 0;
    let latestEvent;

    button.addEventListener('pointermove', (event) => {
      latestEvent = event;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const bounds = button.getBoundingClientRect();
        const x = (latestEvent.clientX - bounds.left) / bounds.width - 0.5;
        const y = (latestEvent.clientY - bounds.top) / bounds.height - 0.5;
        button.style.setProperty('--mag-x', `${(x * 6).toFixed(2)}px`);
        button.style.setProperty('--mag-y', `${(y * 4).toFixed(2)}px`);
        button.classList.add('is-magnetic');
      });
    });

    button.addEventListener('pointerleave', () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      button.classList.remove('is-magnetic');
      button.style.removeProperty('--mag-x');
      button.style.removeProperty('--mag-y');
    });
  });
}

if (window.matchMedia('(min-width: 851px)').matches && !reduceMotion) {
  const heroImage = document.querySelector('.hero-nft-image');
  let parallaxFrame = 0;
  heroImage.classList.add('is-parallax');

  const updateHeroParallax = () => {
    if (parallaxFrame) return;
    parallaxFrame = window.requestAnimationFrame(() => {
      parallaxFrame = 0;
      const bounds = heroImage.getBoundingClientRect();
      const offset = (bounds.top + bounds.height / 2 - window.innerHeight / 2) / window.innerHeight;
      const y = Math.max(-10, Math.min(10, offset * -12));
      heroImage.style.setProperty('--parallax-y', `${y.toFixed(2)}px`);
    });
  };

  window.addEventListener('scroll', updateHeroParallax, { passive: true });
  updateHeroParallax();
}

function openSaleDialog() {
  if (collectionDetailDialog.open) collectionDetailDialog.close();
  if (!saleDialog.open) saleDialog.showModal();
}

document.querySelectorAll('.js-open-dialog, .js-open-sale').forEach((trigger) => {
  trigger.addEventListener('click', openSaleDialog);
});

document.querySelectorAll('.js-open-sale').forEach((trigger) => {
  trigger.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openSaleDialog();
  });
});

const collectionCards = [...document.querySelectorAll('.collection-card[data-category]')];
document.querySelectorAll('.collection-filter').forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('.collection-filter').forEach((filterButton) => {
      const selected = filterButton === button;
      filterButton.classList.toggle('is-active', selected);
      filterButton.setAttribute('aria-pressed', String(selected));
    });
    collectionCards.forEach((card) => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
    });
  });
});

function openCollectionDetails(card) {
  const image = card.querySelector('.collectible img');
  collectionDetailTitle.textContent = card.querySelector('h3').textContent;
  collectionDetailDescription.textContent = card.dataset.details || '';
  if (image) {
    collectionDetailImage.src = image.currentSrc || image.src;
    collectionDetailImage.alt = image.alt;
  }
  if (!collectionDetailDialog.open) collectionDetailDialog.showModal();
}

document.querySelectorAll('.js-open-details').forEach((card) => {
  card.addEventListener('click', () => openCollectionDetails(card));
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openCollectionDetails(card);
  });
});

document.querySelectorAll('.dialog-close').forEach((button) => {
  button.addEventListener('click', () => button.closest('dialog').close());
});

document.querySelectorAll('.offer-dialog').forEach((currentDialog) => {
  currentDialog.addEventListener('click', (event) => {
    if (event.target === currentDialog) currentDialog.close();
  });
});

function isValidTonAddress(value) {
  if (!/^[A-Za-z0-9_-]{48}$/.test(value)) return false;

  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    if (bytes.length !== 36) return false;

    const tag = bytes[0] & 0x7f;
    if (tag !== 0x11 && tag !== 0x51) return false;

    let checksum = 0;
    for (let index = 0; index < 34; index += 1) {
      checksum ^= bytes[index] << 8;
      for (let bit = 0; bit < 8; bit += 1) {
        checksum = checksum & 0x8000 ? (checksum << 1) ^ 0x1021 : checksum << 1;
      }
      checksum &= 0xffff;
    }

    return bytes[34] === (checksum >> 8) && bytes[35] === (checksum & 0xff);
  } catch {
    return false;
  }
}

function setContactMethod(method) {
  contactMethod = method;
  document.querySelectorAll('.sale-method-button').forEach((button) => {
    const isSelected = button.dataset.contactMethod === method;
    button.classList.toggle('is-active', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });

  const isTelegram = method === 'telegram';
  const isSbp = method === 'sbp';
  contactLabel.textContent = isTelegram ? 'Юзернейм продавца Telegram' : isSbp ? 'Телефон продавца для СБП' : 'Крипто-адрес TON';
  contactInput.placeholder = isTelegram ? '@username' : isSbp ? '+7 900 123-45-67' : 'TON-адрес, 48 символов';
  contactInput.autocomplete = isTelegram ? 'username' : isSbp ? 'tel' : 'off';
  contactInput.inputMode = isSbp ? 'tel' : 'text';
  contactInput.value = '';
  contactInput.setCustomValidity('');
  sellerUsernameField.hidden = isTelegram;
  sellerUsernameInput.required = !isTelegram;
  sellerUsernameInput.value = '';
  sellerUsernameInput.setCustomValidity('');
}

document.querySelectorAll('.sale-method-button').forEach((button) => {
  button.addEventListener('click', () => setContactMethod(button.dataset.contactMethod));
});

saleDialog.addEventListener('close', () => {
  saleForm.reset();
  setContactMethod('telegram');
});

saleForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = contactInput.value.trim();
  const normalizedPhone = value.replace(/[\s()-]/g, '');
  contactInput.value = contactMethod === 'sbp' ? normalizedPhone : value;
  contactInput.setCustomValidity('');
  sellerUsernameInput.setCustomValidity('');
  buyerUsernameInput.setCustomValidity('');

  const buyerUsername = buyerUsernameInput.value.trim();
  const sellerUsername = contactMethod === 'telegram' ? value : sellerUsernameInput.value.trim();
  const usernamePattern = /^@?[A-Za-z0-9_]{5,32}$/;

  if (!value) {
    contactInput.setCustomValidity(contactMethod === 'telegram' ? 'Введи Telegram-юзернейм продавца.' : 'Введи реквизиты продавца.');
  } else if (contactMethod === 'telegram' && !/^@?[A-Za-z0-9_]{5,32}$/.test(value)) {
    contactInput.setCustomValidity('Юзернейм должен содержать от 5 до 32 латинских букв, цифр или подчёркиваний.');
  } else if (contactMethod === 'wallet' && !isValidTonAddress(value)) {
    contactInput.setCustomValidity('Введи корректный крипто-адрес TON.');
  } else if (contactMethod === 'sbp' && !/^(?:89\d{9}|\+79\d{9})$/.test(normalizedPhone)) {
    contactInput.setCustomValidity('Введи корректный номер для СБП, начинающийся с 89 или +79.');
  }

  if (!usernamePattern.test(buyerUsername)) {
    buyerUsernameInput.setCustomValidity('Введи юзернейм покупателя: 5–32 латинских буквы, цифры или подчёркивания.');
  }
  if (contactMethod !== 'telegram' && !usernamePattern.test(sellerUsername)) {
    sellerUsernameInput.setCustomValidity('Введи свой Telegram-юзернейм: 5–32 латинских буквы, цифры или подчёркивания.');
  }

  if (!saleForm.reportValidity()) return;

  const methodLabels = {
    telegram: 'Telegram',
    wallet: 'TON-криптоадрес',
    sbp: 'СБП',
  };
  const normalizedSeller = sellerUsername.startsWith('@') ? sellerUsername : `@${sellerUsername}`;
  const normalizedBuyer = buyerUsername.startsWith('@') ? buyerUsername : `@${buyerUsername}`;
  const messageLines = [
    'Заявка на сделку AETHERS COLLECTIVE',
    `NFT: ${nftNameInput.value.trim()}`,
    `Модель/ссылка: ${nftModelInput.value.trim() || 'не указана'}`,
    `Желаемая цена: ${nftPriceInput.value.trim()} Telegram Stars`,
    `Продавец: ${normalizedSeller}`,
    `Покупатель: ${normalizedBuyer}`,
    `Контакт или реквизиты продавца (${methodLabels[contactMethod]}): ${contactMethod === 'telegram' ? normalizedSeller : contactInput.value.trim()}`,
  ];
  proposalMessage.value = messageLines.join('\n');
  copyStatus.textContent = '';
  saleBotLink.href = 'https://t.me/AethersCollective';

  saleDialog.close();
  window.requestAnimationFrame(() => welcomeDialog.showModal());
});

document.querySelectorAll('.flow-tab').forEach((tabButton) => {
  tabButton.addEventListener('click', () => {
    const target = tabButton.dataset.flowTab;
    document.querySelectorAll('.flow-tab').forEach((button) => {
      const selected = button === tabButton;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll('.flow-panel').forEach((panel) => {
      panel.hidden = panel.dataset.flowPanel !== target;
    });
  });
});

copyProposalButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(proposalMessage.value);
  } catch {
    proposalMessage.focus();
    proposalMessage.select();
    document.execCommand('copy');
  }
  copyStatus.textContent = 'Заявка скопирована';
});

function setMenuOpen(isOpen) {
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
  mainNav.classList.toggle('is-open', isOpen);
}

menuToggle.addEventListener('click', () => {
  setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
});

mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    setMenuOpen(false);
  });
});

document.addEventListener('click', (event) => {
  if (menuToggle.getAttribute('aria-expanded') === 'true' && !event.target.closest('.site-header')) {
    setMenuOpen(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenuOpen(false);
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 620) setMenuOpen(false);
});

const faqItems = [...document.querySelectorAll('.faq-item')];
const faqTransitionMs = 880;

function finishFaqMotion(item) {
  activeFaqTransitions.delete(item);
  if (activeFaqTransitions.size || !supportRevealNeedsSync || !revealObserver) return;
  supportRevealNeedsSync = false;
  revealObserver.unobserve(supportPanel);
  revealObserver.observe(supportPanel);
}

faqItems.forEach((item) => {
  const summary = item.querySelector('summary');
  let closeTimer;

  const finishClose = () => {
    if (!item.classList.contains('is-closing')) return;
    item.open = false;
    item.classList.remove('is-closing');
    window.clearTimeout(closeTimer);
    finishFaqMotion(item);
  };

  summary.setAttribute('aria-expanded', String(item.open));
  summary.addEventListener('click', (event) => {
    event.preventDefault();
    window.clearTimeout(closeTimer);
    activeFaqTransitions.add(item);

    if (item.classList.contains('is-closing')) {
      item.classList.remove('is-closing');
      summary.setAttribute('aria-expanded', 'true');
      return;
    }

    if (item.open) {
      item.classList.add('is-closing');
      summary.setAttribute('aria-expanded', 'false');
      closeTimer = window.setTimeout(finishClose, reduceMotion ? 0 : faqTransitionMs + 120);
      return;
    }

    item.open = true;
    summary.setAttribute('aria-expanded', 'true');
    if (reduceMotion) finishFaqMotion(item);
  });

  item.addEventListener('transitionend', (event) => {
    if (event.target !== item.querySelector('.faq-answer') || event.propertyName !== 'grid-template-rows') return;
    if (item.classList.contains('is-closing')) finishClose();
    else finishFaqMotion(item);
  });
});

