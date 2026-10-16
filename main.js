import { gift } from './config.js';

const $ = (selector) => document.querySelector(selector);
const storyCard = $('#storyCard');
const petalTarget = $('#petalTarget');
const letterBackdrop = $('#letterBackdrop');
const seasonToolbar = $('#seasonToolbar');
const seasonTabs = $('#seasonTabs');
const seasonPrev = $('#seasonPrev');
const seasonNext = $('#seasonNext');
const toast = $('#toast');
const soundToggle = $('#soundToggle');
const soundLabel = $('#soundLabel');
const seasonNames = ['spring','summer','autumn','winter'];
const seasonLabels = { spring:'Spring', summer:'Summer', autumn:'Autumn', winter:'Winter' };
const seasonShort = { spring:'SPR', summer:'SUM', autumn:'AUT', winter:'WIN' };
const order = ['intro', 'sakura', ...seasonNames, 'cosmos', 'aligned', 'letter', 'end'];
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const friend = escapeHtml(gift.friendName || 'you');
const sender = escapeHtml(gift.senderName || 'your friend');
let phase = 'intro';
let busy = false;
let soundOn = false;
let musicPreferenceSet = false;
let audioCtx;

// Royalty-free tracks downloaded by the sender from BGMer (https://bgmer.net/).
// All files are local assets, so the soundtrack works on GitHub Pages.
const soundtrack = {
  warm: new Audio(new URL('./assets/audio/for-you.mp3', import.meta.url)),
  cosmos: new Audio(new URL('./assets/audio/planetarium.mp3', import.meta.url)),
  letter: new Audio(new URL('./assets/audio/letter.mp3', import.meta.url)),
};
const MUSIC_VOLUME = 0.28;
let musicFade = 0;
let musicFadeFrame = null;
let currentlyPlaying = null;
for (const track of Object.values(soundtrack)) {
  track.loop = true;
  track.preload = 'none';
  track.volume = 0;
  track.playsInline = true;
}
function musicForScene(next) {
  if (next === 'cosmos' || next === 'aligned') return 'cosmos';
  if (next === 'letter' || next === 'end') return 'letter';
  return 'warm';
}
function updateMusicToggle() {
  soundToggle.setAttribute('aria-pressed', String(soundOn));
  soundToggle.setAttribute('aria-label', soundOn ? 'Mute background music' : 'Play background music');
  soundToggle.title = soundOn ? 'Mute background music' : 'Play background music';
  soundLabel.textContent = soundOn ? 'Music · On' : 'Music · Off';
}
// The previous crossfade is always cancelled before a new one starts, to avoid
// multiple tracks competing during quick chapter changes or repeated taps.
function fadeMusicTo(key, seconds = 1.65) {
  if (musicFadeFrame) cancelAnimationFrame(musicFadeFrame);
  const ticket = ++musicFade;
  const target = soundOn && !document.hidden ? key : null;
  const targetAudio = target ? soundtrack[target] : null;
  const sources = Object.values(soundtrack);
  if (targetAudio && targetAudio.paused) {
    targetAudio.volume = 0;
    targetAudio.play().catch((error) => {
      if (ticket !== musicFade) return;
      console.info('Playback needs a tap on the music button.', error);
      soundOn = false;
      updateMusicToggle();
    });
  }
  currentlyPlaying = target;
  const start = performance.now();
  const initial = sources.map((audio) => audio.volume);
  const end = sources.map((audio) => audio === targetAudio ? MUSIC_VOLUME : 0);
  function tick(now) {
    if (ticket !== musicFade) return;
    const t = Math.min(1, (now - start) / (seconds * 1000));
    const smooth = t * t * (3 - 2 * t);
    sources.forEach((audio, index) => {
      audio.volume = Math.max(0, Math.min(1, initial[index] + (end[index] - initial[index]) * smooth));
      if (t === 1 && audio !== targetAudio && !audio.paused) audio.pause();
    });
    if (t < 1) musicFadeFrame = requestAnimationFrame(tick);
    else musicFadeFrame = null;
  }
  musicFadeFrame = requestAnimationFrame(tick);
}
function setMusicEnabled(enabled, {explicit = false} = {}) {
  if (explicit) musicPreferenceSet = true;
  soundOn = enabled;
  updateMusicToggle();
  fadeMusicTo(musicForScene(phase), enabled ? 1.15 : 0.5);
}

let scene3D = null;
let touchStart = null;
let lastWheel = 0;
let toastTimer;

const page = {
  intro: {
    eyebrow:'PROLOGUE · 小さな贈りもの',
    title:'From Blossom<br>to <span class="highlight">Starlight.</span>',
    subtitle:'THROUGH EVERY SEASON, BEYOND THE STARS',
    copy:`<p>Hey, ${friend}! 🌸</p><p>So... you got married!<br>That definitely deserves a little celebration.</p><p>I made you something small.<br>Although it's been a few months ago, hahahahaha, <br> just to wish you well~</p>`,
    actions:'<span class="inline-hint">✧ Follow a petal to begin</span>',
    vertical:'花だより',
    footer:'Some beautiful stories begin with the smallest things.'
  },
  sakura: {
    eyebrow:'ACT I · AN ENCOUNTER',
    title:'When Paths<br><span class="highlight">Cross.</span>',
    subtitle:'出会いは、きっと偶然。',
    copy:'<p>There are so many people in this world.</p><p>Some paths cross for only a moment.<br>Others quietly change the days that follow.</p><p>Maybe it begins with easy conversations,<br>or laughing at the same silly things.</p><p>Meeting may be chance.<br><strong>Choosing a future together is something wonderful!</strong></p><p>And now, a new chapter begins.</p>',
    actions:'<button class="pill-button" data-go="spring">Into the seasons <span>↗</span></button>',
    vertical:'花ひらく',
    footer:'A little blossom. A lovely beginning.'
  },
  spring: {
    eyebrow:'ACT II · THROUGH THE SEASONS',
    title:'The First<br><span class="highlight">Bloom.</span>',
    subtitle:'SPRING / 春',
    copy:'<p>May your days always hold a little spring:<br>new plans, tiny surprises,<br>and reasons to look forward to tomorrow.</p><p class="large-quote">Here’s to all the lovely things<br>that haven’t happened yet.</p>',
    actions:'<span class="inline-hint">← Swipe to let the seasons turn →</span>',
    vertical:'春',
    footer:'Every new season brings something to look forward to.'
  },
  summer: {
    eyebrow:'ACT II · THROUGH THE SEASONS',
    title:'Summer<br><span class="highlight">Evenings.</span>',
    subtitle:'SUMMER / 夏',
    copy:'<p>May there be long summer evenings,<br>little adventures, and stories worth retelling.</p><p>And, of course, the very serious question:<br>“What should we eat tonight?” ☺</p><p class="large-quote">May being together feel just as good<br>on the quiet days.</p>',
    actions:'<span class="inline-hint">← Swipe to follow the falling leaves →</span>',
    vertical:'夏',
    footer:'A little laughter goes a long way.'
  },
  autumn: {
    eyebrow:'ACT II · THROUGH THE SEASONS',
    title:'A Gentle<br><span class="highlight">Rhythm.</span>',
    subtitle:'AUTUMN / 秋',
    copy:'<p>With every passing year, may you collect<br>memories, inside jokes, and a little more understanding.</p><p>You don’t have to walk at exactly the same speed.</p><p class="large-quote">Just keep making room<br>for each other’s pace.</p><p class="jp-line" lang="ja">歩幅を合わせて。</p>',
    actions:'<span class="inline-hint">← Swipe and let autumn become winter →</span>',
    vertical:'秋',
    footer:'Even different footsteps can find a shared rhythm.'
  },
  winter: {
    eyebrow:'ACT II · THROUGH THE SEASONS',
    title:'A Little<br><span class="highlight">Warmth.</span>',
    subtitle:'WINTER / 冬',
    copy:'<p>Not every day will feel like sunshine.<br>Some days will be tiring or a little messy.</p><p>May you keep listening, looking out for<br>one another, and figuring things out together.</p><p class="large-quote">One season becomes another.<br>And there are so many more to come.</p><p class="jp-line" lang="ja">二人で、無数の季節を共に過ごす。。</p>',
    actions:'<button class="pill-button" data-go="cosmos">Beyond the seasons <span>↗</span></button>',
    vertical:'冬',
    footer:'May there always be somewhere warm to return to.'
  },
  cosmos: {
    eyebrow:'ACT III · BEYOND THE STARS',
    title:'Under the<br><span class="highlight">Same Sky.</span>',
    subtitle:'星空の下で。',
    copy:'<p>The universe is vast.<br>Countless stars, countless possibilities.</p><p>And somewhere in all that space,<br>two people found each other.</p><p>Not because they were exactly alike,<br>but because they chose to keep<br>discovering life together.</p><p class="large-quote">Now, touch a star.<br>There’s one more wish to make. ✦</p>',
    actions:'<span class="inline-hint">✧ Tap either glowing star</span>',
    vertical:'星空',
    footer:'Even across the stars, two lights can answer each other.'
  },
  aligned: {
    eyebrow:'ACT III · TWO LIGHTS',
    title:'Your Own<br><span class="highlight">Light.</span>',
    subtitle:'TWO STARS / ONE SHARED SKY',
    copy:'<p>Two stars. Two different lights.<br>Neither has to fade for the other to shine.</p><p>Being in sync doesn’t mean becoming the same.<br>It means making space for both of you.</p><p class="jp-line" lang="ja">それぞれの光を持ったまま。</p><p class="large-quote">May you both keep your own light,<br>and still brighten the same sky.</p><p>There’s one last little note for you.</p>',
    actions:'<button class="pill-button" data-go="letter">Open your letter <span>✉</span></button>',
    vertical:'ふたり',
    footer:'Together, without losing your own light.'
  },
  end: {
    eyebrow:'THE END · ふたりの歩幅で。',
    title:'Side by<br><span class="highlight">Side.</span>',
    subtitle:'AT YOUR OWN PACE, TOGETHER',
    copy:`<p>Here’s to all the seasons still ahead,<br>and all the ordinary days<br>that turn into wonderful memories.</p><p class="large-quote">Congratulations to you both. ✿</p><p>— ${sender}</p>`,
    actions:'<button class="pill-button" data-ps="true">One tiny P.S. <span>✦</span></button><button class="text-action" data-go="intro">Start again ↺</button>',
    vertical:'祝福',
    footer:'May you walk into many more seasons, together.'
  }
};

function seeded(seed) { let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296; }; }
function createDecorations() {
  const rnd = seeded(420);
  const canopy = $('#tree-canopy');
  const spots = [[167,197,73],[251,143,105],[351,199,81],[422,268,53],[123,284,63],[249,270,77],[315,316,62]];
  let circles = '';
  for (let i=0;i<510;i++) {
    const [x,y,r] = spots[Math.floor(rnd()*spots.length)];
    const a = rnd()*Math.PI*2, d = Math.sqrt(rnd())*r;
    const cx=x+Math.cos(a)*d, cy=y+Math.sin(a)*d*.72;
    const rad=2.9+rnd()*9.4;
    circles += `<circle class="${i%3===0?'soft-pink':i%5===0?'light-pink':''}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad.toFixed(1)}" opacity="${(.54+rnd()*.39).toFixed(2)}" />`;
  }
  canopy.innerHTML = circles;
  const petals = $('#fallingPetals');
  for(let i=0;i<35;i++) {
    const dot=document.createElement('i');dot.className='css-falling-petal';
    dot.style.cssText=`left:${(rnd()*100).toFixed(1)}%;top:${(rnd()*110-50).toFixed(1)}%;--delay:${(-rnd()*15).toFixed(1)}s;--duration:${(9+rnd()*11).toFixed(1)}s;--drift:${(rnd()*180-90).toFixed(0)}px;`;
    petals.appendChild(dot);
  }
  const bugs=$('#cssFireflies');
  for(let i=0;i<32;i++) { const dot=document.createElement('i');dot.className='firefly';const size=2+rnd()*4;dot.style.cssText=`left:${(30+rnd()*64).toFixed(1)}%;top:${(20+rnd()*65).toFixed(1)}%;width:${size}px;height:${size}px;--delay:${(-rnd()*8).toFixed(1)}s;--duration:${(4+rnd()*5).toFixed(1)}s;`;bugs.appendChild(dot);}
  const stars=$('#cssStars');
  for(let i=0;i<235;i++) {const dot=document.createElement('i');dot.className='css-star';const s=.6+rnd()*2.2;dot.style.cssText=`left:${(rnd()*100).toFixed(2)}%;top:${(rnd()*94).toFixed(2)}%;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;--duration:${(2+rnd()*5).toFixed(1)}s;--delay:${(-rnd()*6).toFixed(1)}s;`;stars.appendChild(dot);}
}

function actIndex(key) { return key==='intro' ? 0 : key==='sakura'?0:seasonNames.includes(key)?1:2; }
function setText(key) {
  const content = page[key] || page.aligned;
  storyCard.classList.remove('entering');
  void storyCard.offsetWidth;
  storyCard.innerHTML = `<span class="eyebrow">${content.eyebrow}</span><h1 class="story-title">${content.title}</h1><div class="story-subtitle">${content.subtitle}</div><div class="story-copy">${content.copy}</div><div class="story-actions">${content.actions}</div><span class="vertical-word">${content.vertical}</span>`;
  storyCard.classList.add('entering');
  $('#chapterRail').textContent = key==='intro'?'PROLOGUE':key==='sakura'?'ACT I · SAKURA':seasonNames.includes(key)?'ACT II · SEASONS':'ACT III · STARS';
  $('#chapterNumber').textContent = `${String(actIndex(key)+(key==='intro'?0:1)).padStart(2,'0')} / 03`;
  $('#bottomNote').textContent = content.footer;
  $('#journeyCurrent').textContent = key==='intro'?'Welcome':key==='sakura'?'Sakura':seasonNames.includes(key)?seasonLabels[key]:key==='end'?'A little wish':'Starlight';
  $('#journeySegments').querySelectorAll('i').forEach((item,i)=>item.classList.toggle('active',i<=actIndex(key)));
  seasonToolbar.hidden = !seasonNames.includes(key);
  if(seasonNames.includes(key)) {
    seasonTabs.innerHTML=seasonNames.map(k=>`<button class="season-tab" type="button" role="tab" aria-selected="${k===key}" data-go="${k}" aria-label="${seasonLabels[k]}">${seasonShort[k]}</button>`).join('');
    seasonPrev.disabled=key==='spring';
    seasonNext.disabled=key==='winter';
  }
}

function chooseScene(next, {immediate=false} = {}) {
  if(!order.includes(next)) return;
  if(busy && !immediate) return;
  const old = phase;
  if(old===next && !immediate) return;
  phase = next;
  document.body.dataset.scene = next;
  document.title=`${next==='end'?'A Little Wish · ':''}From Blossom to Starlight`;
  setText(next==='letter'?'aligned':next);
  if(next==='letter') openLetter(); else closeLetter(false);
  if (next==='sakura' || (next==='spring' && old==='sakura')) chime(440);
  if (seasonNames.includes(next)) chime([520,610,460,370][seasonNames.indexOf(next)]);
  if(next==='cosmos') chime(740);
  if(next==='aligned') chime(880);
  fadeMusicTo(musicForScene(next));
  if(scene3D) scene3D.setPhase(next);
  if(next==='end') setTimeout(()=>showToast('Wish delivered. Happiness updates encouraged. ✦',4200), 1200);
}
function openLetter() {
  toast.classList.remove('show');
  document.querySelectorAll('[data-friend-name]').forEach(el=>el.textContent=gift.friendName||'you');
  document.querySelectorAll('[data-sender-name]').forEach(el=>el.textContent=gift.senderName||'your friend');
  letterBackdrop.hidden=false;
  setTimeout(()=>$('#letterClose').focus(),150);
  chime(660);
}
function closeLetter(changePhase=true) {
  letterBackdrop.hidden=true;
  if(changePhase && phase==='letter') chooseScene('aligned',{immediate:true});
}
function alignStars() {
  if(phase!=='cosmos') return;
  chooseScene('aligned');
  showToast('✦ A little more in sync',2600);
}
function showToast(message,ms=4500) {
  clearTimeout(toastTimer);toast.textContent=message;toast.classList.add('show');
  toastTimer=setTimeout(()=>toast.classList.remove('show'),ms);
}
function chime(freq) {
  if(!soundOn)return;
  try {
    audioCtx ??= new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended')audioCtx.resume();
    const t=audioCtx.currentTime;
    [1,1.5,2].forEach((ratio,i)=>{
      const osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
      osc.type='sine';osc.frequency.value=freq*ratio;
      gain.gain.setValueAtTime(.00001,t);
      gain.gain.exponentialRampToValueAtTime(.016/(i+1),t+.038);
      gain.gain.exponentialRampToValueAtTime(.00001,t+1.9);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);osc.stop(t+2);
    });
  } catch(e) { console.warn('Audio unavailable:',e); }
}

// Interaction handlers are delegated so they keep working after a chapter rerenders.
document.addEventListener('click',(event)=>{
  const btn=event.target.closest('[data-go]');
  if(btn) { chooseScene(btn.dataset.go); return; }
  if(event.target.closest('[data-align]')) { alignStars(); return; }
  if(event.target.closest('[data-ps]')) { showToast('P.S. Getting married does NOT get you out of our next dinner plan. 😂',6300); chime(523); }
});
petalTarget.addEventListener('click', () => {
  // An intentional first tap unlocks music on mobile Safari and Chrome.
  // If they have already muted it manually, respect that choice.
  if (!musicPreferenceSet) setMusicEnabled(true);
  chooseScene('sakura');
});
seasonPrev.addEventListener('click',()=>moveSeason(-1));
seasonNext.addEventListener('click',()=>moveSeason(1));
function moveSeason(direction) {const idx=seasonNames.indexOf(phase);if(idx<0)return;const next=seasonNames[idx+direction];if(next)chooseScene(next);}
$('#letterClose').addEventListener('click',()=>closeLetter());
$('#letterFinish').addEventListener('click',()=>chooseScene('end'));
letterBackdrop.addEventListener('click',(e)=>{if(e.target===letterBackdrop)closeLetter();});
$('#brandHome').addEventListener('click',(e)=>{e.preventDefault();chooseScene('intro');});
window.addEventListener('keydown',e=>{
  if(e.key==='Escape' && phase==='letter')closeLetter();
  if(seasonNames.includes(phase)&& !e.target.closest('button')){
    if(e.key==='ArrowRight'){e.preventDefault();moveSeason(1);}
    if(e.key==='ArrowLeft'){e.preventDefault();moveSeason(-1);}
  }
});
window.addEventListener('touchstart',e=>{
  if(!seasonNames.includes(phase) || e.target.closest('button'))return;
  if(e.touches.length===1)touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};
},{passive:true});
window.addEventListener('touchend',e=>{
  if(!touchStart || !seasonNames.includes(phase))return;
  const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;
  touchStart=null;
  if(Math.abs(dx)>55 && Math.abs(dx)>Math.abs(dy)*.9)moveSeason(dx<0?1:-1);
},{passive:true});
window.addEventListener('wheel',(e)=>{
  if(!seasonNames.includes(phase))return;
  if(Math.abs(e.deltaY)<17 && Math.abs(e.deltaX)<17)return;
  if(Date.now()-lastWheel<900)return;
  lastWheel=Date.now();moveSeason((e.deltaX || e.deltaY)>0?1:-1);
},{passive:true});
const starPair=$('#starPair');
starPair.querySelectorAll('.interactive-star').forEach(el=>{
  let sx=0,sy=0;
  el.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;el.setPointerCapture?.(e.pointerId);});
  el.addEventListener('pointerup',e=>{if(Math.hypot(e.clientX-sx,e.clientY-sy)>24)alignStars();});
});
soundToggle.addEventListener('click', () => {
  setMusicEnabled(!soundOn, {explicit: true});
});
document.addEventListener('visibilitychange', () => {
  // No music from a forgotten background tab; restore softly on return.
  if (document.hidden) {
    if (musicFadeFrame) cancelAnimationFrame(musicFadeFrame);
    ++musicFade;
    for (const track of Object.values(soundtrack)) { track.pause(); track.volume = 0; }
  } else if (soundOn) {
    fadeMusicTo(musicForScene(phase), 1.1);
  }
});

createDecorations();
setText('intro');
updateMusicToggle();

// Three.js is loaded only after the essential HTML/CSS experience is ready.
// On restrictive networks its local CSS/SVG fallback remains usable.
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js')
    .catch(()=>import('https://unpkg.com/three@0.180.0/build/three.module.js'))
    .then(async THREE=>{
      const { createScene }=await import('./scene.js');
      scene3D=createScene(THREE,$('#three-mount'));
      scene3D.setPhase(phase);
      document.body.classList.add('three-active');
      $('#three-mount').classList.add('ready');
    })
    .catch(error=>{console.info('3D scene unavailable; using built-in illustrated experience.',error);});
}
