/* script.js
   Responsibilities:
   - generate floating bubbles at random positions/sizes
   - animate subtle float motion
   - handle click => pop animation => navigate to target panel
   - allow nav buttons to focus panels with smooth transition
*/

const BUBBLE_CONFIG = [
  { id: 'home', label: 'Home', variant: 'purple', size: 92 },
  { id: 'services', label: 'Services', variant: 'turq', size: 120 },
  { id: 'projects', label: 'Projects', variant: 'soft', size: 100 },
  { id: 'Contact Us', label: 'Contact Us', variant: 'purple', size: 78 },
  // additional small decorative bubbles:
  { id: 'mini-1', label: '', variant: 'turq', size: 42 },
  { id: 'mini-2', label: '', variant: 'purple', size: 34 },
];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  createBubbles();
  attachNavButtons();
});

/* Create bubble DOM nodes and floating animation */
function createBubbles(){
  const container = document.getElementById('bubbles');
  const rect = container.getBoundingClientRect();
  const w = rect.width || window.innerWidth;
  const h = rect.height || (window.innerHeight * 0.6);

  BUBBLE_CONFIG.forEach((cfg, i) => {
    const bubble = document.createElement('button');
    bubble.className = `bubble ${cfg.variant}`;
    bubble.style.width = `${cfg.size}px`;
    bubble.style.height = `${cfg.size}px`;
    bubble.dataset.target = cfg.id;
    bubble.setAttribute('aria-label', cfg.label || 'decorative bubble');

    // place randomly with some margins
    const padding = 24;
    const left = Math.floor(Math.random() * (w - cfg.size - padding*2)) + padding;
    const top = Math.floor(Math.random() * (h - cfg.size - padding*2)) + padding;
    bubble.style.left = left + 'px';
    bubble.style.top = top + 'px';

    // inner content
    const span = document.createElement('span');
    span.textContent = cfg.label;
    bubble.appendChild(span);

    // subtle float animation via CSS transform using JS loop (requestAnimationFrame)
    floatBubble(bubble, i);

    // click handler
    bubble.addEventListener('click', (e) => {
      const target = bubble.dataset.target;
      popBubble(bubble, () => {
        // navigate to panel if panel exists
        if (document.getElementById(target)) {
          showPanel(target);
        }
      });
    });

    container.appendChild(bubble);
  });
}

/* Float behaviour using requestAnimationFrame — gentle per-bubble phase offsets */
function floatBubble(el, seed=0){
  const amplitude = 8 + (Math.random()*10); // px
  const frequency = 0.6 + Math.random()*0.9; // speed
  const start = performance.now() + seed * 150;

  function frame(t){
    const time = (t - start) / 1000;
    // vertical bob and slight x sway
    const y = Math.sin(time * frequency + seed) * amplitude;
    const x = Math.cos(time * (frequency/1.6) + seed) * (amplitude/2);
    el.style.transform = `translate(${x}px, ${y}px)`;
    el._raf = requestAnimationFrame(frame);
  }
  el._raf = requestAnimationFrame(frame);
}

/* Pop animation and removal (visual only). We'll temporarily animate and restore for reusability. */
function popBubble(el, onComplete){
  // disable pointer while popping
  el.style.pointerEvents = 'none';
  el.style.transition = 'transform .22s ease, opacity .22s linear';
  // run keyframe like pop (scale up and collapse)
  el.animate([
    { transform: el.style.transform + ' scale(1)', opacity: 1 },
    { transform: el.style.transform + ' scale(1.28)', opacity: 1, offset: 0.6 },
    { transform: el.style.transform + ' scale(0.02)', opacity: 0 }
  ], { duration: 420, easing: 'cubic-bezier(.2,.9,.25,1)' })
  .onfinish = () => {
    if (typeof onComplete === 'function') onComplete();
    // do a gentle re-appearance so the playground isn't emptied (create a pulse)
    el.style.opacity = 0;
    setTimeout(() => {
      el.style.transition = 'opacity .5s ease';
      el.style.opacity = 1;
      el.style.pointerEvents = '';
    }, 280);
  };
}

/* SPA panels control */
function showPanel(id){
  const panels = document.querySelectorAll('.panel');
  panels.forEach(p => p.classList.remove('active'));
  const target = document.getElementById(id);
  if (!target) return;
  // animate panels: we add active; CSS handles transition
  target.classList.add('active');

  // scroll into view smoothly on small screens
  target.scrollIntoView({behavior:'smooth', block:'center'});
  // update document title
  const t = target.dataset.title || id;
  document.title = `${t} — Aurora & Co.`;
  // update URL hash for share / back button
  history.pushState({panel:id}, '', `#${id}`);
}

/* Navigation toolbar attach */
function attachNavButtons(){
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tgt = btn.dataset.target;
      const bubble = findBubbleForTarget(tgt);
      if (bubble) {
        // pop the bubble visually then open the panel
        popBubble(bubble, () => showPanel(tgt));
      } else {
        showPanel(tgt);
      }
    });
  });

  // respond to back/forward
  window.addEventListener('popstate', (ev) => {
    const state = ev.state;
    if (state && state.panel) {
      showPanel(state.panel);
    } else {
      // fallback to hash
      const hash = location.hash.replace('#','');
      if (hash) showPanel(hash);
    }
  });

  // open panel from hash on load
  const hash = location.hash.replace('#','');
  if (hash && document.getElementById(hash)) {
    // small delay for visuals
    setTimeout(()=> showPanel(hash), 240);
  }
}

/* helper: find bubble button for given target */
function findBubbleForTarget(target){
  return document.querySelector(`.bubble[data-target="${target}"]`);
}
