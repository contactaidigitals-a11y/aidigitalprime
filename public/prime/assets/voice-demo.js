/* Business-personalised AI receptionist demo. All secrets and real quotas stay on server. */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const form = get('business-demo-form');
  if (!form) return;
  const startButton=get('start-voice-demo'), status=get('demo-voice-status'), callCard=get('demo-call-card');
  const endButton=get('end-voice-demo'), timeText=get('demo-call-timer'), callState=get('demo-call-state');
  const config=window.AI_DIGITAL_PRIME_CONFIG||{};
  const endpoint=typeof config.voiceApiUrl==='string'?config.voiceApiUrl.trim():'';
  const live=endpoint.startsWith('https://')||(endpoint.startsWith('/')&&!endpoint.startsWith('//'));
  let widget=null, timer=null, callStartedAt=0, pending=false, active=false;

  const setStatus=(message,error=false)=>{status.textContent=message;status.classList.toggle('is-error',error);};
  const values=()=>Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,String(value).trim()]));
  const formatTimer = seconds => `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  const clearClock = () => {clearInterval(timer);timer=null;};
  const showCall=business=>{callCard.hidden=false;get('demo-call-business').textContent=business;callState.textContent='Connecting…';timeText.textContent='02:00';};
  function stopCall(reason='Your demo has ended.') {
    clearClock();
    if(widget) {try{widget.endConversation()}catch{ /* disconnected already */ } widget.remove();widget=null;}
    active=false;pending=false;callCard.hidden=true;startButton.disabled=false;
    setStatus(reason);
  }
  function startClock(){
    clearClock();active=true;pending=false;startButton.disabled=true;
    callStartedAt=Date.now();callState.textContent='Live · ask about your opening hours or prices';
    setStatus('You are speaking to a receptionist trained on the details you entered.');
    timer=setInterval(()=>{
      const remaining=Math.max(0,120-Math.floor((Date.now()-callStartedAt)/1000));
      timeText.textContent=formatTimer(remaining);
      if(remaining<=0)stopCall('Thanks for trying your AI receptionist. Would you like a callback?');
    },350);
  }
  function loadWidget(){
    if(customElements.get('elevenlabs-convai'))return Promise.resolve();
    return new Promise((resolve,reject)=>{
      let script=document.querySelector('script[data-prime-elevenlabs-widget]');
      if(!script){script=document.createElement('script');script.src='https://unpkg.com/@elevenlabs/convai-widget-embed';script.async=true;script.dataset.primeElevenlabsWidget='1';document.head.append(script);}
      script.addEventListener('error',()=>reject(new Error('The voice widget could not load.')), {once:true});
      // A network stall should not leave the visitor indefinitely waiting.
      Promise.race([customElements.whenDefined('elevenlabs-convai'),new Promise((_,fail)=>setTimeout(()=>fail(new Error('Voice widget timed out.')),12000))]).then(resolve,reject);
    });
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!form.reportValidity()||pending||active)return;
    const business=values();
    if(!live){
      setStatus(`Preview greeting: “Hello, thanks for calling ${business.business_name}. How can I help you today?” Live microphone demo will activate when secure API access is connected.`);
      return;
    }
    pending=true;startButton.disabled=true;setStatus('Preparing your private demo session…');showCall(business.business_name);
    try{
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(business),signal:AbortSignal.timeout(14000)});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.signedUrl)throw new Error(data.error||'Demo session not available.');
      await loadWidget();
      widget=document.createElement('elevenlabs-convai');
      widget.id='personalised-receptionist-widget';
      widget.setAttribute('signed-url',data.signedUrl);
      widget.setAttribute('dynamic-variables',JSON.stringify(business));
      widget.setAttribute('action-text','Speak with your receptionist');
      widget.setAttribute('start-call-text','Start demo call');
      widget.setAttribute('end-call-text','Finish call');
      // The external widget handles the microphone and audio, our button drives the call.
      widget.style.display='none';
      widget.addEventListener('conversationStarted',()=>{if(widget)startClock();});
      widget.addEventListener('conversationEnded',()=>{if(active||pending)stopCall('Demo ended. You can request a callback to discuss your own setup.');});
      document.body.append(widget);
      callState.textContent='Waiting for microphone permission…';
      // The widget starts the session after the signed URL and business variables are attached.
      await widget.startConversation();
      // Fail-safe if the expected event is not emitted by a future widget version.
      if(pending && widget)startClock();
    }catch(error){stopCall(error instanceof Error?error.message:'Unable to start the demo.');status.classList.add('is-error');}
  });
  endButton?.addEventListener('click',()=>stopCall('Your demo ended. Request a callback if you would like a tailored version.'));
  window.addEventListener('pagehide',()=>{clearClock();if(widget)try{widget.endConversation()}catch{/* ignore */}});
  get('demo-request-callback')?.addEventListener('click',()=>{
    const lead=get('enquiry-form');
    if(lead){
      const details=values();
      const name=lead.querySelector('[name="business"]');
      const service=lead.querySelector('[name="service"]');
      const message=lead.querySelector('[name="message"]');
      if(name&&!name.value.trim())name.value=details.business_name||'';
      if(service)service.value='AI Voice Assistant';
      const followup=lead.querySelector('[name="followup"]');
      if(followup)followup.value='Callback';
      if(message&&!message.value.trim())message.value='Please contact me about an AI receptionist for '+(details.business_name||'my business')+'. My preferred next step is a callback.';
    }
    get('contact')?.scrollIntoView({behavior:'smooth'});
    setTimeout(()=>lead?.querySelector('[name="phone"]')?.focus({preventScroll:true}),450);
  });
})();
