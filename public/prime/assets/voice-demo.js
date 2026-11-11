/* AI Digital Prime — private, personalised ElevenLabs voice demo.
   The ElevenLabs client SDK starts the audio session; API keys stay server-side. */
(() => {
  'use strict';

  const get = id => document.getElementById(id);
  const form = get('business-demo-form');
  if (!form) return;

  const startButton = get('start-voice-demo');
  const status = get('demo-voice-status');
  const callCard = get('demo-call-card');
  const endButton = get('end-voice-demo');
  const timeText = get('demo-call-timer');
  const callState = get('demo-call-state');

  // Always use our own protected endpoint, regardless of a cached configuration.
  const endpoint = '/api/voice-session';
  const MAX_SECONDS = 120;

  let conversation = null;
  let sdkPromise = null;
  let timer = null;
  let callStartedAt = 0;
  let pending = false;
  let active = false;
  let nonce = 0;

  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.classList.toggle('is-error', error);
  };
  const values = () => Object.fromEntries(
    [...new FormData(form)].map(([key, value]) => [key, String(value).trim()])
  );
  const formatTimer = seconds =>
    String(Math.floor(seconds / 60)).padStart(2, '0') + ':' +
    String(seconds % 60).padStart(2, '0');

  function clearClock() {
    if (timer) clearInterval(timer);
    timer = null;
  }
  function showCall(businessName) {
    callCard.hidden = false;
    get('demo-call-business').textContent = businessName;
    callState.textContent = 'Connecting securely…';
    timeText.textContent = '02:00';
  }
  function stopCall(message = 'Your demo has ended.', error = false) {
    nonce += 1;
    clearClock();
    const oldConversation = conversation;
    conversation = null;
    active = false;
    pending = false;
    callCard.hidden = true;
    startButton.disabled = false;
    setStatus(message, error);
    if (oldConversation) {
      try { Promise.resolve(oldConversation.endSession()).catch(() => {}); }
      catch { /* Session already closed. */ }
    }
  }
  function startClock() {
    if (active) return;
    pending = false;
    active = true;
    startButton.disabled = true;
    callStartedAt = Date.now();
    callState.textContent = 'Live — try asking about opening hours or prices';
    setStatus('You are speaking to your AI receptionist. End the demo whenever you like.');
    clearClock();
    timer = setInterval(() => {
      const remaining = Math.max(0, MAX_SECONDS -
        Math.floor((Date.now() - callStartedAt) / 1000));
      timeText.textContent = formatTimer(remaining);
      if (remaining === 0) stopCall('The two-minute demo has ended. Request a callback to discuss your setup.');
    }, 350);
  }

  // The authenticated ElevenLabs widget does not expose a reliable
  // programmatic startConversation() method. Use the official browser SDK.
  async function loadVoiceSdk() {
    if (!sdkPromise) {
      sdkPromise = (async () => {
        let module;
        try {
          module = await import('https://esm.run/@elevenlabs/client@1.36.0');
        } catch {
          module = await import('https://esm.sh/@elevenlabs/client@1.36.0?bundle');
        }
        const client = module.Conversation || module.default?.Conversation;
        if (!client || typeof client.startSession !== 'function') {
          throw new Error('Voice engine did not initialise.');
        }
        return client;
      })().catch(error => {
        sdkPromise = null;
        throw error;
      });
    }
    return sdkPromise;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity() || pending || active) return;
    const business = values();
    const requestId = ++nonce;
    pending = true;
    startButton.disabled = true;
    showCall(business.business_name);
    setStatus('Loading secure voice connection…');

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone access requires HTTPS and a modern browser.');
      }
      // Request microphone permission before creating a billable session.
      const permission = await navigator.mediaDevices.getUserMedia({ audio: true });
      permission.getTracks().forEach(track => track.stop());

      // Load the browser SDK before using one of today's limited demo slots.
      const Conversation = await loadVoiceSdk();
      if (requestId !== nonce) return;

      callState.textContent = 'Authorising your private demo…';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(business),
        signal: AbortSignal.timeout(14000)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.signedUrl !== 'string') {
        throw new Error(data.error || 'The private voice session could not be authorised.');
      }
      if (requestId !== nonce) return;

      callState.textContent = 'Starting your receptionist…';
      const connected = await Conversation.startSession({
        signedUrl: data.signedUrl,
        connectionType: 'websocket',
        dynamicVariables: business,
        onConnect: () => {
          if (requestId === nonce) startClock();
        },
        onDisconnect: () => {
          if (requestId === nonce) stopCall('The call has ended. You can try another day or request a callback.');
        },
        onError: () => {
          if (requestId === nonce) {
            setStatus('There was an audio connection problem. End the call and try again.', true);
          }
        }
      });
      if (requestId !== nonce) {
        await connected.endSession();
        return;
      }
      conversation = connected;
      if (!active) startClock();
    } catch (error) {
      if (requestId !== nonce) return;
      let message = 'Unable to start the voice conversation. Please try again.';
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        message = 'Microphone access was denied. Allow microphone access and retry.';
      } else if (error?.name === 'NotFoundError') {
        message = 'No microphone was found on this device.';
      } else if (error?.message?.includes('Microphone access')) {
        message = error.message;
      } else if (error?.message?.includes('Voice engine')) {
        message = error.message + ' Please reload and try again.';
      } else if (error?.message?.includes('voice session') || error?.message?.includes('ElevenLabs')) {
        message = error.message;
      }
      stopCall(message, true);
    }
  });

  endButton?.addEventListener('click', () => {
    stopCall('Demo ended. Request a callback if you would like your own AI receptionist.');
  });
  window.addEventListener('pagehide', () => {
    clearClock();
    if (conversation) {
      try { Promise.resolve(conversation.endSession()).catch(() => {}); }
      catch { /* Page is unloading. */ }
    }
  });

  get('demo-request-callback')?.addEventListener('click', () => {
    const lead = get('enquiry-form');
    if (!lead) return;
    const details = values();
    const businessField = lead.querySelector('[name="business"]');
    const serviceField = lead.querySelector('[name="service"]');
    const messageField = lead.querySelector('[name="message"]');
    const followupField = lead.querySelector('[name="followup"]');
    if (businessField && !businessField.value.trim()) businessField.value = details.business_name || '';
    if (serviceField) serviceField.value = 'AI Voice Assistant';
    if (followupField) followupField.value = 'Callback';
    if (messageField && !messageField.value.trim()) {
      messageField.value = 'Please contact me about an AI receptionist for ' +
        (details.business_name || 'my business') + '. I would like to arrange a callback.';
    }
    get('contact')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => lead.querySelector('[name="phone"]')?.focus({ preventScroll: true }), 450);
  });
})();
