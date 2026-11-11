/* Prime Assistant web-chat UI. No credentials live in the browser. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const config = window.AI_DIGITAL_PRIME_CONFIG || {};
  const endpoint = typeof config.chatApiUrl === 'string' ? config.chatApiUrl.trim() : '';
  const live = endpoint.startsWith('https://') || endpoint.startsWith('/');
  const launcher = $('prime-chat-launch'), panel = $('prime-chat-panel'), closeBtn = $('prime-chat-close');
  const log = $('prime-chat-messages'), form = $('prime-chat-form'), input = $('prime-chat-input');
  const chips = $('prime-chat-chips'), submit = $('prime-chat-send');
  const status = $('prime-chat-context');
  if (!launcher || !panel || !log || !form || !input) return;
  // The server enforces the actual daily quota when AI is enabled.
  // Local quota also keeps the guided offline preview from becoming an unlimited chat.
  const key='prime-chat-day-quota';
  const today=()=>new Date().toISOString().slice(0,10);
  const getUsage=()=>{try{const v=JSON.parse(localStorage.getItem(key)||'{}');return v.day===today()?Number(v.used)||0:0;}catch{return 0;}};
  const usedToday=()=>getUsage()>=10;
  const consume=()=>{try{localStorage.setItem(key,JSON.stringify({day:today(),used:getUsage()+1}));}catch{ /* backend still enforces live usage */ }};
  let busy = false;
  let messages = [];
  let pendingController = null;
  status.textContent = live ? 'AI assistant connected · replies may contain mistakes.' : 'Guided preview · live AI replies can be enabled at launch.';

  function addMessage(role, text) {
    const node = document.createElement('div');
    node.className = `prime-chat-msg ${role === 'assistant' ? 'from-prime' : 'from-visitor'}`;
    const label = document.createElement('span');
    label.className = 'prime-chat-msg-label';
    label.textContent = role === 'assistant' ? 'PRIME ASSISTANT' : 'YOU';
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
      const welcome = "Hi there! I'm Prime Assistant, AI Digital Prime's website chatbot. What can I help you explore today?";
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

  const answers = [
    {match: /(?:price|pricing|cost|fee|charge|how much|expensive|quote|budget|pound|£)/i,
      reply: "Every business needs a slightly different setup, so we don't quote a fixed price here. Tell us what you need and we can discuss a tailored quote in a short conversation."},
    {match: /(?:booking|bookings|schedule|calendar|appointment|reserve|book a)/i,
      reply: "AI assistants can potentially support bookings when connected to a compatible calendar. We haven't enabled live scheduling in this website chat. Would you like to send an enquiry for a 15-minute introductory discussion?"},
    {match: /(?:15.minute|15 minute|demo|meeting|call back|callback|contact|talk to|human|speak to|enquiry)/i,
      reply: "We'd be happy to discuss your business in a short 15-minute introduction. Use 'Send an enquiry' below to prepare your contact details — we'll arrange a time after you send it. Nothing is booked automatically."},
    {match: /(?:voice|receptionist|phone|telephone|missed call|after.hours|out of hours|24.?7|alex)/i,
      reply: "An AI voice assistant can welcome callers, answer approved FAQs and help with enquiries when you're busy or closed. You choose its voice, tone and business information. Alex is our voice-agent example — explore the Meet Alex section to see an illustrative conversation."},
    {match: /(?:website|site|design|web|ecommerce|online shop|landing page|seo)/i,
      reply: "We build tailored, mobile-friendly business websites designed to make a great first impression and help visitors take the next step. Tell us your business type and what you'd like your site to do."},
    {match: /(?:chatbot|chat bot|web chat|chat assistant|messag)/i,
      reply: "We create website chatbots that can answer approved business questions, guide visitors and encourage enquiries. This chat is a guided preview — live AI replies can be added when the secure backend is connected."},
    {match: /(?:where|location|uk|england|based|company|registered|calinescu|prime)/i,
      reply: "AI Digital Prime is a UK-focused brand operated by CALINESCU TECHNOLOGIES LTD. We help businesses explore AI voice assistants, websites and chatbots."},
    {match: /(?:hi|hello|hey|morning|evening|good afternoon|thanks|thank you)/i,
      reply: "Lovely to hear from you! Would you like to know more about AI voice assistants, our website services or our chatbots?"}
  ];
  function guidedReply(message) {
    const answer = answers.find(a => a.match.test(message));
    return answer?.reply || "I can help with our AI voice assistants, business websites and website chatbots. For something specific to your business, please choose 'Send an enquiry' and tell us what you need.";
  }

  async function send(text) {
    const question = String(text || '').trim().slice(0, 600);
    if (!question || busy) return;
    if (usedToday()) {status.textContent='10-message demo limit reached for today. Request a callback below.';input.disabled=true;submit.disabled=true;return;}
    consume();
    busy = true; submit.disabled = true; input.disabled = true;
    chips.classList.add('has-chatted');
    addMessage('user', question);
    messages.push({role: 'user', content: question});
    input.value = '';
    const typing = addMessage('assistant', 'One moment…');
    typing.classList.add('is-typing');
    let reply;
    if (live) {
      pendingController = new AbortController();
      try {
        const timer = setTimeout(() => pendingController.abort(), 12000);
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({messages: messages.slice(-10)}),
            signal: pendingController.signal
          });
          if (response.status===429) {
            status.textContent='Today’s free AI chat limit has been reached. Please request a callback.';
            input.disabled=true;submit.disabled=true;
            throw new Error('Your free AI chat demo limit has been reached. Please request a callback.');
          }
          if (!response.ok) throw new Error(`Chat unavailable (${response.status})`);
          const data = await response.json();
          if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('Empty AI reply');
          reply = data.reply.trim().slice(0, 1500);
        } finally {clearTimeout(timer);}
      } catch {
        reply = "I'm having trouble connecting to live chat just now. I can still help with basic information: " + guidedReply(question);
      } finally {pendingController = null;}
    } else {
      await new Promise(r => setTimeout(r, 300));
      reply = guidedReply(question);
    }
    typing.remove();
    addMessage('assistant', reply);
    messages.push({role: 'assistant', content: reply});
    messages = messages.slice(-12);
    busy = false;
    if(usedToday()) {status.textContent='10-message demo limit reached. You can request a callback below.';submit.disabled=true;input.disabled=true;}
    else {submit.disabled=false;input.disabled=false;input.focus();}
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
