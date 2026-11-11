/* Prime Assistant web-chat UI. No credentials live in the browser. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  // Same-origin server endpoint; do not depend on stale client-side config.
  const endpoint = '/api/prime-chat';
  const live = true;
  const launcher = $('prime-chat-launch'), panel = $('prime-chat-panel'), closeBtn = $('prime-chat-close');
  const log = $('prime-chat-messages'), form = $('prime-chat-form'), input = $('prime-chat-input');
  const chips = $('prime-chat-chips'), submit = $('prime-chat-send');
  const status = $('prime-chat-context');
  if (!launcher || !panel || !log || !form || !input) return;
  // The server enforces the actual daily quota when AI is enabled.
  // Local quota also keeps the guided offline preview from becoming an unlimited chat.
  const key='prime-chat-day-quota-v2';
  const today=()=>new Date().toISOString().slice(0,10);
  const getUsage=()=>{try{const v=JSON.parse(localStorage.getItem(key)||'{}');return v.day===today()?Number(v.used)||0:0;}catch{return 0;}};
  const usedToday=()=>getUsage()>=10;
  const consume=()=>{try{localStorage.setItem(key,JSON.stringify({day:today(),used:getUsage()+1}));}catch{ /* backend still enforces live usage */ }};
  let busy = false;
  let messages = [];
  let pendingController = null;
  status.textContent = 'Live AI mode · type a message to connect.';

  function addMessage(role, text) {
    const node = document.createElement('div');
    node.className = `prime-chat-msg ${role === 'user' ? 'from-visitor' : 'from-prime'}`;
    const label = document.createElement('span');
    label.className = 'prime-chat-msg-label';
    label.textContent = role === 'assistant' ? 'PRIME ASSISTANT' : role === 'system' ? 'CONNECTION NOTICE' : 'YOU';
    const body = document.createElement('p');
    body.textContent = text;
    node.append(label, body);
    log.append(node);
    log.scrollTop = log.scrollHeight;
    return node;
  }

  function openChat() {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    launcher.classList.add('is-open');
    if (!messages.length) {
      const welcome = "Hello! I'm Prime, AI Digital Prime's virtual assistant. What kind of business do you run?";
      addMessage('assistant', welcome);
      messages.push({role: 'assistant', content: welcome});
    }
    input.focus();
  }
  function closeChat() {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.classList.remove('is-open');
    launcher.focus();
  }
  launcher.addEventListener('click', () => panel.hidden ? openChat() : closeChat());
  closeBtn.addEventListener('click', closeChat);
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !panel.hidden) closeChat(); });

  async function send(text) {
    const question = String(text || '').trim().slice(0, 600);
    if (!question || busy) return;
    if (usedToday()) {
      status.textContent = 'The 10-message demo limit has been reached today. Please send an enquiry.';
      input.disabled = true;
      submit.disabled = true;
      return;
    }
    busy = true;
    submit.disabled = true;
    input.disabled = true;
    chips.classList.add('has-chatted');
    addMessage('user', question);
    messages.push({role: 'user', content: question});
    input.value = '';
    const typing = addMessage('assistant', 'Thinking…');
    typing.classList.add('is-typing');
    let succeeded = false;
    let reply = '';
    pendingController = new AbortController();
    const timeout = setTimeout(() => pendingController?.abort(), 19000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ messages: messages.slice(-10) }),
        signal: pendingController.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'The AI is temporarily unavailable.');
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('No AI response received.');
      reply = data.reply.trim().slice(0, 1500);
      consume();
      succeeded = true;
      status.textContent = 'Live AI chat · replies may contain mistakes.';
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Connection error.';
      reply = 'The live AI could not respond: ' + detail + ' Please try again in a moment.';
      status.textContent = 'Live AI connection error · please try again.';
      messages.pop();
    } finally {
      clearTimeout(timeout);
      pendingController = null;
      typing.remove();
      addMessage(succeeded ? 'assistant' : 'system', reply);
      if (succeeded) {
        messages.push({role: 'assistant', content: reply});
        messages = messages.slice(-12);
      }
      busy = false;
      if (usedToday()) {
        status.textContent = 'The 10-message demo limit has been reached. You can send an enquiry below.';
        submit.disabled = true;
        input.disabled = true;
      } else {
        submit.disabled = false;
        input.disabled = false;
        input.focus();
      }
    }
  }
  if(usedToday()){status.textContent='Today’s 10-message demo has been used. Request a callback below.';input.disabled=true;submit.disabled=true;}
  form.addEventListener('submit', event => {
    event.preventDefault();
    send(input.value);
  });
  chips.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => send(btn.dataset.chatPrompt || btn.textContent)));
  $('prime-chat-enquire').addEventListener('click', () => {
    closeChat();
    const lead = document.getElementById('enquiry-form');
    if (lead) {
      const field = lead.querySelector('textarea[name="message"]');
      if (field && !field.value.trim()) field.value = 'I would like to learn more about AI Digital Prime and arrange a short introductory chat.';
      document.getElementById('contact')?.scrollIntoView({behavior:'smooth'});
      setTimeout(() => lead.querySelector('input[name="name"]')?.focus({preventScroll: true}), 350);
    }
  });
})();
