// Synthesised audio (Web Audio API). No audio files, nothing streamed.
// The AudioContext is only created after the first user gesture.
import { store, num, toast } from "./core.js";
export const Snd={ctx:null,master:null,fx:null,vol:num(store.get("vol",60),60,0,100)/100,sfx:store.get("sfx",true)!==false,ch:{},timers:{},on:{hum:false,rain:false,lofi:false}};
function sndInit(){ if(Snd.ctx) return Snd.ctx; if(!Snd.armed) return null; try{ const C=window.AudioContext||window.webkitAudioContext; if(!C) return null; Snd.ctx=new C();
  Snd.master=Snd.ctx.createGain(); Snd.master.gain.value=Snd.vol; Snd.master.connect(Snd.ctx.destination);
  Snd.fx=Snd.ctx.createGain(); Snd.fx.gain.value=.7; Snd.fx.connect(Snd.master); return Snd.ctx; }catch(e){ return null; } }
function noiseBuf(kind,secs){ const c=Snd.ctx, b=c.createBuffer(1,c.sampleRate*secs,c.sampleRate), d=b.getChannelData(0); let l=0,p=[0,0,0];
  for(let i=0;i<d.length;i++){ const w=Math.random()*2-1;
    if(kind==="brown"){ l=(l+0.02*w)/1.02; d[i]=l*3.5; } else if(kind==="pink"){ p[0]=.99*p[0]+w*.05; p[1]=.96*p[1]+w*.2; p[2]=.57*p[2]+w*.7; d[i]=(p[0]+p[1]+p[2]+w*.1)*.25; } else d[i]=w; }
  return b; }
function env(g,t,a,peak,dec){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec); }
function tone(type,f0,f1,dur,peak,dest,when){ const c=Snd.ctx, t=(when||c.currentTime), o=c.createOscillator(), g=c.createGain();
  o.type=type; o.frequency.setValueAtTime(f0,t); if(f1) o.frequency.exponentialRampToValueAtTime(f1,t+dur); env(g,t,.005,peak,dur); o.connect(g).connect(dest||Snd.fx); o.start(t); o.stop(t+dur+.05); }
function burst(freq,q,dur,peak,dest,when,type){ const c=Snd.ctx, t=(when||c.currentTime), s=c.createBufferSource(); s.buffer=Snd.white||(Snd.white=noiseBuf("white",1));
  const f=c.createBiquadFilter(); f.type=type||"bandpass"; f.frequency.value=freq; f.Q.value=q; const g=c.createGain(); env(g,t,.002,peak,dur);
  s.connect(f).connect(g).connect(dest||Snd.fx); s.start(t,Math.random()*.5); s.stop(t+dur+.03); }
export function sfx(name){ if(!Snd.sfx||!sndInit()) return; const c=Snd.ctx; if(c.state==="suspended") c.resume(); const t=c.currentTime;
  switch(name){
    case "tick": burst(3200,1.2,.018,.25); break;
    case "pop": tone("sine",700,170,.08,.35); burst(1800,2,.02,.12); break;
    case "chime": tone("sine",880,null,.25,.18); tone("sine",1318.5,null,.35,.14,null,t+.08); break;
    case "thud": tone("sine",150,55,.18,.45); burst(400,1,.06,.2,null,null,"lowpass"); break;
    case "coin": tone("triangle",987.8,null,.08,.16); tone("triangle",1318.5,null,.22,.16,null,t+.07); break;
    case "pager": for(let i=0;i<2;i++){ tone("square",2350,null,.09,.05,null,t+i*.16); } break;
    case "clack": burst(1700+Math.random()*900,3,.012,.18); break;
    case "whoosh": { const s=c.createBufferSource(); s.buffer=Snd.white||(Snd.white=noiseBuf("white",1)); const f=c.createBiquadFilter(); f.type="bandpass"; f.Q.value=1.4;
      f.frequency.setValueAtTime(300,t); f.frequency.exponentialRampToValueAtTime(2400,t+.22); const g=c.createGain(); env(g,t,.05,.18,.2); s.connect(f).connect(g).connect(Snd.fx); s.start(t); s.stop(t+.3); break; }
    case "smash": tone("sawtooth",120,40,.25,.25); burst(900,.7,.25,.4); break;
  } }
export function clatter(ms){ if(!Snd.sfx||!sndInit()) return; const c=Snd.ctx, t0=c.currentTime, n=Math.min(90,Math.round(ms/14));
  for(let i=0;i<n;i++) burst(1500+Math.random()*1400,3,.01,.06+Math.random()*.08,null,t0+i*(ms/1000/n)+Math.random()*.01); }
function blip(f=660){ sfx(f>=850?"chime":f<=260?"thud":"pop"); }

function chGain(name){ if(!Snd.ch[name]){ const g=Snd.ctx.createGain(); g.gain.value=0.0001; g.connect(Snd.master); Snd.ch[name]={g,started:false}; } return Snd.ch[name]; }
function startHum(ch){ const c=Snd.ctx, s=c.createBufferSource(); s.buffer=noiseBuf("brown",6); s.loop=true; const lp=c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=360;
  s.connect(lp).connect(ch.g); s.start(); const o=c.createOscillator(), og=c.createGain(); o.frequency.value=100; og.gain.value=.025; o.connect(og).connect(ch.g); o.start(); }
function startRain(ch){ const c=Snd.ctx, s=c.createBufferSource(); s.buffer=noiseBuf("pink",6); s.loop=true; const bp=c.createBiquadFilter(); bp.type="highpass"; bp.frequency.value=500;
  const lp=c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=5200; const g=c.createGain(); g.gain.value=.55; s.connect(bp).connect(lp).connect(g).connect(ch.g); s.start();
  Snd.timers.rain=setInterval(()=>{ if(!Snd.on||!Snd.on.rain) return; const t=c.currentTime; for(let i=0;i<3;i++) if(Math.random()<.7) burst(2500+Math.random()*4000,6,.008,.05+Math.random()*.09,ch.g,t+Math.random()*.1); },110); }
const LOFI_CHORDS=[[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]]; // Fmaj7, Em7, Dm7, Cmaj7 (MIDI)
const mtof=m=>440*Math.pow(2,(m-69)/12);
function startLofi(ch){ const c=Snd.ctx, beat=60/72; let next=c.currentTime+.1, step=0;
  const lp=c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=1100; lp.Q.value=.5; lp.connect(ch.g);
  const crack=c.createBufferSource(); crack.buffer=noiseBuf("white",3); crack.loop=true; const cf=c.createBiquadFilter(); cf.type="highpass"; cf.frequency.value=3000; const cg=c.createGain(); cg.gain.value=.012; crack.connect(cf).connect(cg).connect(ch.g); crack.start();
  Snd.timers.lofi=setInterval(()=>{ while(next<c.currentTime+.4){ const bar=Math.floor(step/8), ch8=step%8, chord=LOFI_CHORDS[bar%4];
      if(ch8===0) chord.forEach((m,i)=>{ ["triangle","sine"].forEach((ty,k)=>{ const o=c.createOscillator(), g=c.createGain(); o.type=ty; o.frequency.value=mtof(m); o.detune.value=k?7:-5;
        g.gain.setValueAtTime(0.0001,next+i*.03); g.gain.exponentialRampToValueAtTime(.05,next+i*.03+.25); g.gain.exponentialRampToValueAtTime(.0001,next+beat*7.6); o.connect(g).connect(lp); o.start(next+i*.03); o.stop(next+beat*8); }); });
      if(ch8%4===0) tone("sine",110,45,.25,.32,ch.g,next);
      if(ch8%2===1) burst(8000,1,.04,.05,ch.g,next+.02,"highpass");
      if(ch8===4||ch8===7&&Math.random()<.5){ const m=chord[Math.floor(Math.random()*4)]+12; tone("sine",mtof(m),null,.5,.03,lp,next); }
      if(Math.random()<.3) burst(1800,8,.004,.04,ch.g,next+Math.random()*beat);
      next+=beat; step++; } },100); }
Snd.on={hum:false,rain:false,lofi:false};
export function sfx2(name){ if(!Snd.sfx||!sndInit()) return; const c=Snd.ctx; if(c.state==="suspended") c.resume(); const t=c.currentTime;
  const nz=(f,q,d,p,w,type)=>burst(f,q,d,p,null,w,type);
  switch(name){
    case "boss": { // muffled angry boss through the office wall: wah-wah syllables
      const n=5+Math.floor(Math.random()*4); let tt=t;
      for(let i=0;i<n;i++){ const dur=.11+Math.random()*.16, o=c.createOscillator(), f1=c.createBiquadFilter(), f2=c.createBiquadFilter(), g=c.createGain();
        o.type="sawtooth"; const p=120+Math.random()*70; o.frequency.setValueAtTime(p*1.25,tt); o.frequency.exponentialRampToValueAtTime(p,tt+dur);
        f1.type="bandpass"; f1.Q.value=5; f1.frequency.setValueAtTime(500,tt); f1.frequency.linearRampToValueAtTime(900+Math.random()*500,tt+dur*.5); f1.frequency.linearRampToValueAtTime(400,tt+dur);
        f2.type="lowpass"; f2.frequency.value=1800; env(g,tt,.02,.32,dur); o.connect(f1).connect(f2).connect(g).connect(Snd.fx); o.start(tt); o.stop(tt+dur+.05); tt+=dur+.04+Math.random()*.05; }
      break; }
    case "coffee": { // grinder, then steam, then drips
      const s=c.createBufferSource(); s.buffer=Snd.white||(Snd.white=noiseBuf("white",1)); s.loop=true; const bp=c.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=900; bp.Q.value=1.2;
      const am=c.createOscillator(), amg=c.createGain(), g=c.createGain(); am.frequency.value=34; amg.gain.value=.12; am.connect(amg).connect(g.gain); g.gain.value=.15;
      s.connect(bp).connect(g).connect(Snd.fx); s.start(t); s.stop(t+1.4); am.start(t); am.stop(t+1.4);
      const st=c.createBufferSource(); st.buffer=Snd.white; st.loop=true; const hp=c.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=3500; const sg=c.createGain(); env(sg,t+1.5,.3,.12,1.4);
      st.connect(hp).connect(sg).connect(Snd.fx); st.start(t+1.5); st.stop(t+3.3);
      for(let i=0;i<5;i++) tone("sine",1400+Math.random()*500,600,.09,.12,null,t+3.3+i*.22); break; }
    case "ring": for(let r=0;r<2;r++){ [440,480].forEach(f=>{ const o=c.createOscillator(), g=c.createGain(), lfo=c.createOscillator(), lg=c.createGain(); o.frequency.value=f; lfo.frequency.value=20; lg.gain.value=.03; lfo.connect(lg).connect(g.gain); g.gain.setValueAtTime(.0001,t+r*.9); g.gain.linearRampToValueAtTime(.04,t+r*.9+.02); g.gain.setValueAtTime(.04,t+r*.9+.55); g.gain.linearRampToValueAtTime(.0001,t+r*.9+.6); o.connect(g).connect(Snd.fx); o.start(t+r*.9); o.stop(t+r*.9+.62); lfo.start(t+r*.9); lfo.stop(t+r*.9+.62); }); } break;
    case "knock": for(let i=0;i<3;i++){ tone("sine",160,70,.09,.45,null,t+i*.16); nz(700,2,.03,.25,t+i*.16); } break;
    case "ping": tone("sine",1046.5,null,.12,.14); tone("sine",1568,null,.2,.12,null,t+.09); break;
    case "bleep": tone("sine",1000,null,.32,.12); break;
    case "key": nz(2500+Math.random()*1500,2,.012,.14); break;
    case "jam": tone("sawtooth",70,55,.5,.12); nz(300,1,.5,.15,null,"lowpass"); break;
  } }

/* ---------- people ---------- */
["pointerdown","keydown"].forEach(ev=>window.addEventListener(ev,()=>{ Snd.armed=true; },{once:true,capture:true}));
export function setChannel(name,on){ if(!sndInit()) { toast("Audio isn't available in this browser."); return false; } if(Snd.ctx.state==="suspended") Snd.ctx.resume();
  const ch=chGain(name); if(on&&!ch.started){ ({hum:startHum,rain:startRain,lofi:startLofi})[name](ch); ch.started=true; }
  Snd.on[name]=on; const lvl={hum:.5,rain:.35,lofi:.6}[name]; ch.g.gain.setTargetAtTime(on?lvl:0.0001,Snd.ctx.currentTime,.6); return true; }
export function setVolume(v){ Snd.vol=v; store.set("vol",Math.round(v*100)); if(Snd.master) Snd.master.gain.setTargetAtTime(v,Snd.ctx.currentTime,.1); }
export function setSfx(on){ Snd.sfx=on; store.set("sfx",on); }
/** Short melodic sting for wins, levels and combos. */
export function sting(kind){ if(!Snd.sfx||!sndInit()) return; const c=Snd.ctx; if(c.state==="suspended") c.resume(); const t=c.currentTime;
  const seq={win:[523.3,659.3,784,1046.5],level:[392,523.3,659.3,784,1046.5],fail:[392,330,262],combo:[880,1174.7],alert:[988,740,988,740]}[kind]||[660];
  seq.forEach((f,i)=>tone(kind==="fail"?"sawtooth":"triangle",f,null,kind==="alert"?.09:.12,kind==="fail"?.06:.12,null,t+i*(kind==="alert"?.11:.085))); }
