(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const config = window.AI_DIGITAL_PRIME_CONFIG || {};

  const header = $('.site-header');
  const toggle = $('#menu-toggle');
  const mobileNav = $('#mobile-menu');
  function closeMenu() { toggle?.setAttribute('aria-expanded', 'false'); toggle?.setAttribute('aria-label', 'Open navigation'); if (mobileNav) mobileNav.hidden = true; }
  toggle?.addEventListener('click', () => {
    const opening = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(opening));
    toggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
    mobileNav.hidden = !opening;
  });
  $$('a', mobileNav).forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('scroll', () => header?.classList.toggle('scrolled', scrollY > 15), { passive: true });
  window.addEventListener('resize', () => { if (innerWidth > 840) closeMenu(); });
  $('#year').textContent = new Date().getFullYear();

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
    }, { threshold: .06, rootMargin: '0px 0px -26px 0px' });
    $$('.reveal').forEach(el => observer.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('visible'));

  const scripts = {
    studio: [
      { who: 'customer', text: 'Hi, are you taking tattoo appointments next week?' },
      { who: 'alex', text: 'Hi there! I can help with general booking enquiries. What style of tattoo are you interested in?' },
      { who: 'customer', text: 'Fine-line. Do you open on Saturdays?' },
      { who: 'alex', text: 'If the studio has Saturday hours, I can tell you those and explain how to request an appointment.' }
    ],
    trades: [
      { who: 'customer', text: 'Hello, do you cover Bishop’s Stortford?' },
      { who: 'alex', text: 'Hi! I can check the business’s approved service areas. What type of work do you need help with?' },
      { who: 'customer', text: 'A leaking kitchen tap.' },
      { who: 'alex', text: 'Thanks. I can collect the details and explain the next step your business has configured.' }
    ],
    salon: [
      { who: 'customer', text: 'Hi, can I ask about colour appointments?' },
      { who: 'alex', text: 'Of course! I can help with the salon’s services and general appointment questions.' },
      { who: 'customer', text: 'Do you do patch tests?' },
      { who: 'alex', text: 'I can share your salon’s approved patch-test guidance, then direct you to the right next step.' }
    ]
  };

  const conversation = $('#conversation');
  let activeTimeouts = [];
  let selected = 'studio';
  function setConversation(key) {
    selected = key;
    activeTimeouts.forEach(clearTimeout); activeTimeouts = [];
    conversation.replaceChildren();
    $$('.industry').forEach(el => { el.classList.toggle('active', el.dataset.industry === key); el.setAttribute('aria-pressed', String(el.dataset.industry === key)); });
    const messages = scripts[key];
    messages.forEach((msg, i) => {
      const outer = document.createElement('div'); outer.className = `message ${msg.who}`;
      const icon = document.createElement('div'); icon.className = 'message-avatar'; icon.textContent = msg.who === 'alex' ? '✳' : 'Y';
      const inner = document.createElement('div');
      const label = document.createElement('strong'); label.textContent = msg.who === 'alex' ? 'Alex · AI assistant' : 'Customer';
      const line = document.createElement('p'); line.textContent = msg.text;
      inner.append(label, line); outer.append(icon, inner);
      outer.style.opacity = '0'; outer.style.transform = 'translateY(10px)';
      conversation.append(outer);
      activeTimeouts.push(setTimeout(() => { outer.style.opacity = '1'; outer.style.transform = 'translateY(0)'; }, 90 + i * 430));
    });
  }
  $$('.industry').forEach(btn => btn.addEventListener('click', () => setConversation(btn.dataset.industry)));
  $('#restart-example')?.addEventListener('click', () => setConversation(selected));
  setConversation(selected);

  $('#try-alex')?.addEventListener('click', () => {
    $('#your-demo')?.scrollIntoView({behavior:'smooth', block:'start'});
    setTimeout(() => $('#demo-business-name')?.focus({preventScroll:true}), 300);
  });

  const toast = $('#toast'); let toastTimer;
  function notify(message) { if (!toast) return; toast.textContent = message; toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 5000); }

  const form = $('#enquiry-form');
  const enquiryButton = form?.querySelector('button[type="submit"]');
  const formNote = $('#form-note');
  if (enquiryButton?.firstChild) enquiryButton.firstChild.textContent = 'Send enquiry ';
  if (formNote) formNote.textContent = 'Your enquiry is sent securely to AI Digital Prime. We will contact you after reviewing it.';

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity() || enquiryButton?.disabled) return;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const business = String(data.get('business') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const followup = String(data.get('followup') || 'Callback');
    const service = String(data.get('service') || 'AI Voice Assistant');
    const message = String(data.get('message') || '').trim();
    if (followup === 'Callback' && !phone) {
      notify('Please enter your phone number or choose Email as your preferred contact method.');
      form.querySelector('[name="phone"]')?.focus();
      return;
    }
    if (enquiryButton) enquiryButton.disabled = true;
    if (formNote) formNote.textContent = 'Sending your enquiry securely…';
    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, business, phone, followup, service, message,
          consent: data.get('consent') === 'on',
          website: String(data.get('website') || '')
        }),
        signal: AbortSignal.timeout(15000)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'We could not send your enquiry. Please try again.');
      form.reset();
      if (formNote) formNote.textContent = 'Enquiry sent successfully. Thank you — we will contact you soon.';
      notify('Thank you! Your enquiry has been sent to AI Digital Prime.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Contact form temporarily unavailable.';
      if (formNote) formNote.textContent = 'Not sent: ' + message + ' Please try again.';
      notify('Unable to send your enquiry right now. Please try again.');
    } finally {
      if (enquiryButton) enquiryButton.disabled = false;
    }
  });
})();
