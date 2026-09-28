/* =========================================================
   Sítio Três Manhãs — efeitos modernos (JS puro, sem biblioteca)
   ========================================================= */
(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- barra de progresso + botão voltar ao topo ---------- */
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);

  const topBtn = document.createElement('button');
  topBtn.className = 'to-top';
  topBtn.setAttribute('aria-label', 'Voltar ao topo');
  topBtn.innerHTML =
    '<svg class="ring" viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" stroke-dasharray="132" stroke-dashoffset="132"/></svg>' +
    '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(topBtn);
  const ring = topBtn.querySelector('circle');
  topBtn.addEventListener('click', () => window.scrollTo({ top:0, behavior: reduce ? 'auto' : 'smooth' }));

  const timeline = document.querySelector('.timeline');
  const parallaxEls = document.querySelectorAll('[data-parallax]');

  function onScroll(){
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = 'scaleX(' + p + ')';
    ring.style.strokeDashoffset = 132 - 132 * p;
    topBtn.classList.toggle('show', window.scrollY > 600);

    if(timeline){
      const r = timeline.getBoundingClientRect();
      const prog = Math.min(1, Math.max(0, (window.innerHeight * 0.7 - r.top) / r.height));
      timeline.style.setProperty('--tl-progress', (prog * 100) + '%');
    }
    if(!reduce){
      parallaxEls.forEach(el => {
        const r = el.getBoundingClientRect();
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        const offset = (r.top + r.height / 2 - window.innerHeight / 2) * speed;
        el.style.translate = '0 ' + (-offset).toFixed(1) + 'px';
      });
    }
  }
  let ticking = false;
  window.addEventListener('scroll', () => {
    if(!ticking){ requestAnimationFrame(() => { onScroll(); ticking = false; }); ticking = true; }
  }, { passive:true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- reveal escalonado (irmãos aparecem em cascata) ---------- */
  const groups = new Map();
  document.querySelectorAll('.reveal').forEach(el => {
    const parent = el.parentElement;
    const i = groups.get(parent) || 0;
    groups.set(parent, i + 1);
    if(i > 0 && !reduce){
      el.style.transitionDelay = Math.min(i * 110, 440) + 'ms';
      el.addEventListener('transitionend', function clear(){ el.style.transitionDelay = ''; el.removeEventListener('transitionend', clear); });
    }
  });

  /* ---------- tilt 3D + brilho que segue o mouse ---------- */
  if(finePointer && !reduce){
    document.querySelectorAll('.product-card, .cert-card, .basket, .proc-step').forEach(card => {
      card.classList.add('tilt');
      const base = card.classList.contains('featured') ? ' translateY(-10px)' : '';
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (x * 100) + '%');
        card.style.setProperty('--my', (y * 100) + '%');
        card.style.transition = 'transform .12s ease-out, box-shadow .3s ease';
        card.style.transform = 'perspective(900px)' + base + ' translateY(-6px) rotateX(' + ((0.5 - y) * 8).toFixed(2) + 'deg) rotateY(' + ((x - 0.5) * 10).toFixed(2) + 'deg)';
      });
      card.addEventListener('pointerleave', () => {
        card.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1), box-shadow .3s ease';
        card.style.transform = '';
      });
    });
  }

  /* ---------- efeito ripple nos botões ---------- */
  document.addEventListener('pointerdown', e => {
    const btn = e.target.closest('.btn');
    if(!btn || reduce) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.width = s.style.height = size + 'px';
    s.style.left = (e.clientX - r.left - size / 2) + 'px';
    s.style.top = (e.clientY - r.top - size / 2) + 'px';
    btn.appendChild(s);
    setTimeout(() => s.remove(), 700);
  });

  /* ---------- contadores animados ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if(counters.length && 'IntersectionObserver' in window){
    const co = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if(!en.isIntersecting) return;
        const el = en.target; co.unobserve(el);
        const end = parseFloat(el.dataset.count);
        const dec = (el.dataset.count.split('.')[1] || '').length;
        const suffix = el.dataset.suffix || '';
        if(reduce){ el.textContent = end.toFixed(dec).replace('.', ',') + suffix; return; }
        const t0 = performance.now(), dur = 1400;
        (function step(t){
          const k = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - k, 3);
          el.textContent = (end * eased).toFixed(dec).replace('.', ',') + suffix;
          if(k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold:0.6 });
    counters.forEach(c => co.observe(c));
  }

  /* ---------- toast (aviso flutuante) ---------- */
  const stack = document.createElement('div');
  stack.className = 'toast-stack';
  stack.setAttribute('aria-live', 'polite');
  document.body.appendChild(stack);
  window.showToast = function(msg, icon){
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '<span class="t-ico">' + (icon || '🧺') + '</span><span></span>';
    t.lastChild.textContent = msg;
    stack.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 2600);
  };

  const ICONS = { ovos:'🥚', banana:'🍌', leite:'🥛', mel:'🍯' };
  window.productIcon = id => ICONS[id] || '🧺';

  document.querySelectorAll('.js-add-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('[data-id]');
      if(!card) return;
      showToast(card.dataset.name + ' foi para o carrinho', productIcon(card.dataset.id));
      const fab = document.getElementById('cartFab');
      if(fab){ fab.classList.remove('wiggle'); void fab.offsetWidth; fab.classList.add('wiggle'); }
    });
  });

  /* ---------- filtro de produtos com animação ---------- */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.products-grid > .product-card:not(.hide)').forEach(c => {
        c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
      });
    });
  });
  /* ---------- "Como é feito": abas por produto (página de produtos) ---------- */
  const procTabs = document.querySelectorAll('.proc-tab');
  function showProc(key){
    const btn = document.querySelector('.proc-tab[data-proc="' + key + '"]');
    if(!btn) return false;
    procTabs.forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', b === btn); });
    document.querySelectorAll('.proc-panel').forEach(p => p.classList.toggle('active', p.dataset.proc === key));
    return true;
  }
  procTabs.forEach(b => b.addEventListener('click', () => showProc(b.dataset.proc)));
  document.querySelectorAll('.how-link[data-goto]').forEach(a => a.addEventListener('click', () => showProc(a.dataset.goto)));

  // chegou com #ovos, #banana, #leite ou #mel na URL da página de produtos?
  const hash = location.hash.replace('#', '');
  if(procTabs.length && showProc(hash)){
    const sec = document.getElementById('como-e-feito');
    setTimeout(() => sec && sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 150);
  }

  /* ---------- menu fixo dos produtos (início): destaca a seção visível ---------- */
  const navLinks = document.querySelectorAll('.prod-nav a');
  if(navLinks.length && 'IntersectionObserver' in window){
    const no = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if(!en.isIntersecting) return;
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin:'-45% 0px -50% 0px' });
    document.querySelectorAll('.feature').forEach(f => no.observe(f));
  }

  /* ---------- contato: pré-seleciona o interesse vindo da página de produtos ---------- */
  const interesse = new URLSearchParams(location.search).get('interesse');
  const sel = document.getElementById('cesta');
  if(interesse && sel){
    const opt = Array.from(sel.options).find(o => o.value === interesse);
    if(opt){ sel.value = interesse; sel.classList.add('flash'); }
  }
})();
