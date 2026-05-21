/* ════════════════════════════════════════
   CLUSTER CAROUSELS — How We Met
════════════════════════════════════════ */
function makeClusterCarousel(el) {
  const track  = el.querySelector('.cluster-track');
  const slides = el.querySelectorAll('.cluster-slide');
  const dots   = el.querySelectorAll('.cluster-dot');
  const prev   = el.querySelector('.cluster-prev');
  const next   = el.querySelector('.cluster-next');
  if (!slides.length || !track) return;
  let cur = 0;

  function lockHeight() {
    slides.forEach(s => { s.style.opacity = '1'; s.style.position = 'static'; s.style.display = 'flex'; });
    let max = 0;
    slides.forEach(s => { max = Math.max(max, s.offsetHeight); });
    slides.forEach(s => { s.style.opacity = ''; s.style.position = ''; s.style.display = ''; });
    if (max > 0) track.style.height = max + 'px';
  }

  const imgs = el.querySelectorAll('img');
  let loaded = 0;
  if (!imgs.length) { setTimeout(lockHeight, 50); }
  else {
    imgs.forEach(img => {
      if (img.complete) { loaded++; if (loaded === imgs.length) lockHeight(); }
      else img.addEventListener('load', () => { loaded++; if (loaded === imgs.length) lockHeight(); });
    });
    setTimeout(lockHeight, 900);
  }
  window.addEventListener('resize', lockHeight);

  function goTo(i) {
    slides[cur].classList.remove('active');
    if (dots[cur]) dots[cur].classList.remove('active');
    cur = (i + slides.length) % slides.length;
    slides[cur].classList.add('active');
    if (dots[cur]) dots[cur].classList.add('active');
  }

  if (prev) prev.addEventListener('click', e => { e.stopPropagation(); goTo(cur - 1); });
  if (next) next.addEventListener('click', e => { e.stopPropagation(); goTo(cur + 1); });
  dots.forEach(d => d.addEventListener('click', e => { e.stopPropagation(); goTo(+d.dataset.idx); }));

  let tx = 0;
  el.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 40) dx < 0 ? goTo(cur + 1) : goTo(cur - 1);
  });
}
document.querySelectorAll('.cluster-carousel').forEach(makeClusterCarousel);


/* ════════════════════════════════════════
   THE QUESTION — Unified photo + text carousel
════════════════════════════════════════ */
(function () {
  const photoSlides = document.querySelectorAll('.ask-photo-slide');
  const textPanels  = document.querySelectorAll('.ask-text-panel');
  const dots        = document.querySelectorAll('.ask-dot');
  const prevBtn     = document.getElementById('askPrev');
  const nextBtn     = document.getElementById('askNext');
  const textTrack   = document.getElementById('askTextTrack');
  if (!photoSlides.length) return;

  let cur = 0;

  function sizeTextTrack() {
    if (!textTrack) return;
    textPanels.forEach(p => { p.style.position = 'static'; p.style.opacity = '1'; p.style.display = 'flex'; });
    let max = 0;
    textPanels.forEach(p => { max = Math.max(max, p.offsetHeight); });
    textPanels.forEach(p => { p.style.position = ''; p.style.opacity = ''; p.style.display = ''; });
    if (max > 0) textTrack.style.minHeight = (max + 16) + 'px';
  }

  const imgs = document.querySelectorAll('.ask-photo-slide img');
  let loaded = 0;
  const run = () => { loaded++; if (loaded >= imgs.length) sizeTextTrack(); };
  if (!imgs.length) { setTimeout(sizeTextTrack, 100); }
  else {
    imgs.forEach(img => {
      if (img.complete) run();
      else { img.addEventListener('load', run); img.addEventListener('error', run); }
    });
    setTimeout(sizeTextTrack, 800);
  }
  window.addEventListener('resize', sizeTextTrack);

  function goTo(i) {
    photoSlides[cur].classList.remove('active');
    if (textPanels[cur]) textPanels[cur].classList.remove('active');
    if (dots[cur])       dots[cur].classList.remove('active');
    cur = (i + photoSlides.length) % photoSlides.length;
    photoSlides[cur].classList.add('active');
    if (textPanels[cur]) textPanels[cur].classList.add('active');
    if (dots[cur])       dots[cur].classList.add('active');
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(cur - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(cur + 1));
  dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.step)));

  const photoSide = document.querySelector('.ask-photo-side');
  if (photoSide) {
    let tx = 0;
    photoSide.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    photoSide.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 40) dx < 0 ? goTo(cur + 1) : goTo(cur - 1);
    });
  }
})();


/* ════════════════════════════════════════
   BEFORE US — Crossfade projector
   Mobile: select dropdown + text card below scene
   Desktop: timeline strip + text inside scene
════════════════════════════════════════ */
(function () {
  const nodes    = document.querySelectorAll('.proj-node');
  const idle     = document.getElementById('projectorIdle');
  const viewport = document.getElementById('projSlideViewport');
  const railFill = document.getElementById('projRailFill');
  const navPrev  = document.getElementById('projNavPrev');
  const navNext  = document.getElementById('projNavNext');
  const counter  = document.getElementById('projCounter');
  const section  = document.getElementById('beforeUs');
  if (!nodes.length || !viewport || !section) return;

  let activeIndex = -1;
  let animating   = false;
  let ppcTimers   = [];
  const FADE_MS   = 550;

  function isMobile() { return window.innerWidth <= 680; }

  /* ── Inject mobile select ABOVE the proj-scene ── */
  const projScene = section.querySelector('.proj-scene');

  const mobileSelectWrap = document.createElement('div');
  mobileSelectWrap.className = 'proj-tl-mobile-select';
  mobileSelectWrap.innerHTML = `
    <span class="proj-tl-mobile-select-label">✦ choose a moment</span>
    <select id="projMobileSelect">
      ${Array.from(nodes).map((n, i) =>
        `<option value="${i}">${n.dataset.date || 'Moment ' + (i+1)} — ${n.dataset.title || ''}</option>`
      ).join('')}
    </select>`;

  if (projScene) {
    projScene.parentNode.insertBefore(mobileSelectWrap, projScene);
  }

  /* ── Inject mobile text card BELOW the proj-scene ── */
  const mobileCard = document.createElement('div');
  mobileCard.className = 'proj-mobile-text-card';
  mobileCard.id = 'projMobileTextCard';

  if (projScene && projScene.nextSibling) {
    projScene.parentNode.insertBefore(mobileCard, projScene.nextSibling);
  } else if (projScene) {
    projScene.parentNode.appendChild(mobileCard);
  }

  /* Force display based on viewport — overrides CSS specificity issues */
  function syncMobileDisplay() {
    const mobile = isMobile();
    mobileSelectWrap.style.display = mobile ? 'block' : 'none';
    mobileCard.style.display       = mobile ? 'block' : 'none';
    const strip = section.querySelector('.proj-timeline-strip');
    if (strip) strip.style.display = mobile ? 'none' : 'block';
  }
  syncMobileDisplay();
  window.addEventListener('resize', syncMobileDisplay);

  const mobileSelect = document.getElementById('projMobileSelect');

  /* ── Photo HTML builder ── */
  function buildPhotoHTML(node) {
    const single = (node.dataset.photo  || '').trim();
    const multi  = (node.dataset.photos || '').trim();
    const ph = `<div class="proj-photo-placeholder"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>`;
    if (multi) {
      let paths; try { paths = JSON.parse(multi); } catch { paths = []; }
      paths = paths.filter(Boolean);
      if (!paths.length) return ph;
      const slides = paths.map((p, i) =>
        `<div class="ppc-slide${i === 0 ? ' active' : ''}">${p ? `<img src="${p}" alt="">` : ph}</div>`
      ).join('');
      const dotHtml = paths.length > 1
        ? `<div class="ppc-dots">${paths.map((_, i) => `<button class="ppc-dot${i === 0 ? ' active' : ''}" data-i="${i}"></button>`).join('')}</div>` : '';
      const arrows = paths.length > 1
        ? `<button class="ppc-arrow ppc-prev"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg></button>
           <button class="ppc-arrow ppc-next"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg></button>` : '';
      return `<div class="ppc-wrap">${slides}${arrows}${dotHtml}</div>`;
    }
    if (single) return `<img src="${single}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">`;
    return ph;
  }

  function startPPC(panel) {
    const wrap = panel.querySelector('.ppc-wrap');
    if (!wrap) return;
    const slides = wrap.querySelectorAll('.ppc-slide');
    const dots   = wrap.querySelectorAll('.ppc-dot');
    const prev   = wrap.querySelector('.ppc-prev');
    const next   = wrap.querySelector('.ppc-next');
    if (slides.length <= 1) return;
    let cur = 0;
    function go(i) {
      slides[cur].classList.remove('active');
      if (dots[cur]) dots[cur].classList.remove('active');
      cur = (i + slides.length) % slides.length;
      slides[cur].classList.add('active');
      if (dots[cur]) dots[cur].classList.add('active');
    }
    const t = setInterval(() => go(cur + 1), 2800);
    ppcTimers.push(t);
    if (prev) prev.addEventListener('click', e => { e.stopPropagation(); go(cur - 1); });
    if (next) next.addEventListener('click', e => { e.stopPropagation(); go(cur + 1); });
    dots.forEach(d => d.addEventListener('click', e => { e.stopPropagation(); go(+d.dataset.i); }));
  }

  /* ── Build scene panel (photo + desktop text inside) ── */
  function buildPanel(node) {
    const videoSrc = (node.dataset.video || '').trim();
    const vBtn = videoSrc
      ? `<button class="proj-video-btn" data-video="${videoSrc}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg> Watch video</button>` : '';
    const panel = document.createElement('div');
    panel.className = 'proj-panel';
    panel.innerHTML = `
      <div class="proj-photo-wrap">${buildPhotoHTML(node)}</div>
      <div class="proj-text">
        <span class="proj-date">${node.dataset.date || ''}</span>
        <h3 class="proj-title">${node.dataset.title || ''}</h3>
        <p class="proj-body">${node.dataset.body || ''}</p>
        <p class="proj-note">${node.dataset.note || ''}</p>
        ${vBtn}
      </div>`;
    return panel;
  }

  /* ── Update mobile text card below scene ── */
  function updateMobileCard(node) {
    const videoSrc = (node.dataset.video || '').trim();
    const vBtn = videoSrc
      ? `<button class="proj-video-btn" data-video="${videoSrc}">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
          Watch the video
        </button>` : '';

    /* Fade out → update → fade in */
    mobileCard.style.opacity = '0';
    setTimeout(() => {
      mobileCard.innerHTML = `
        <span class="proj-date">${node.dataset.date || ''}</span>
        <h3 class="proj-title">${node.dataset.title || ''}</h3>
        <p class="proj-body">${node.dataset.body || ''}</p>
        <p class="proj-note">${node.dataset.note || ''}</p>
        ${vBtn}`;

      const vBtnEl = mobileCard.querySelector('.proj-video-btn');
      if (vBtnEl) vBtnEl.addEventListener('click', () => openVideoModal(vBtnEl.dataset.video));

      mobileCard.style.opacity = '1';
    }, 180);
  }

  function updateRail(i) {
    if (!railFill) return;
    const nodesWrap = document.getElementById('projNodes');
    if (!nodesWrap) return;
    const rr = nodesWrap.getBoundingClientRect();
    const nr = nodes[i].getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((nr.left + nr.width / 2 - rr.left) / rr.width) * 100));
    railFill.style.width = pct + '%';
  }

  function transition(toIndex) {
    if (animating || toIndex === activeIndex) return;
    animating = true;
    ppcTimers.forEach(clearInterval);
    ppcTimers = [];

    const old = viewport.querySelector('.proj-panel');
    if (old) { old.classList.add('fade-exit'); setTimeout(() => old.remove(), 350); }

    const panel = buildPanel(nodes[toIndex]);
    viewport.appendChild(panel);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      panel.classList.add('fade-enter');
      setTimeout(() => panel.classList.add('stagger-text'), 80);
    }));
    setTimeout(() => startPPC(panel), 60);

    const vBtn = panel.querySelector('.proj-video-btn');
    if (vBtn) vBtn.addEventListener('click', () => openVideoModal(vBtn.dataset.video));

    nodes.forEach(n => n.classList.remove('active'));
    nodes[toIndex].classList.add('active');
    activeIndex = toIndex;

    updateRail(toIndex);

    /* Always update mobile card (harmless if hidden) */
    updateMobileCard(nodes[toIndex]);

    /* Sync select */
    if (mobileSelect) mobileSelect.value = String(toIndex);

    if (navPrev) navPrev.classList.add('visible');
    if (navNext) navNext.classList.add('visible');
    if (idle)    idle.classList.add('hidden');
    if (counter) { counter.textContent = `${toIndex + 1} / ${nodes.length}`; counter.classList.add('visible'); }

    setTimeout(() => { animating = false; }, FADE_MS);
  }

  /* Desktop: node clicks */
  nodes.forEach((node, i) => node.addEventListener('click', () => transition(i)));

  /* Prev/Next arrows */
  if (navPrev) navPrev.addEventListener('click', () => { if (activeIndex > 0) transition(activeIndex - 1); });
  if (navNext) navNext.addEventListener('click', () => { if (activeIndex < nodes.length - 1) transition(activeIndex + 1); });

  /* Mobile select */
  if (mobileSelect) mobileSelect.addEventListener('change', () => transition(+mobileSelect.value));

  /* Keyboard nav */
  document.addEventListener('keydown', e => {
    const r = section.getBoundingClientRect();
    if (r.top > window.innerHeight || r.bottom < 0) return;
    if (e.key === 'ArrowLeft'  && activeIndex > 0)                transition(activeIndex - 1);
    if (e.key === 'ArrowRight' && activeIndex < nodes.length - 1) transition(activeIndex + 1);
  });

  /* Init */
  setTimeout(() => { if (nodes[0]) transition(0); }, 500);
})();


/* ════════════════════════════════════════
   THE ANSWER — Reveal
════════════════════════════════════════ */
(function () {
  const revealBtn = document.getElementById('answerRevealBtn');
  const cover     = document.getElementById('answerCover');
  const reveal    = document.getElementById('answerReveal');
  if (!revealBtn || !cover || !reveal) return;
  let opened = false;
  revealBtn.addEventListener('click', () => {
    if (opened) return;
    opened = true;
    cover.style.opacity   = '0';
    cover.style.transform = 'scale(1.03)';
    cover.style.transition = 'opacity .56s ease, transform .56s ease';
    setTimeout(() => {
      cover.style.display = 'none';
      reveal.classList.add('open');
    }, 560);
  });
})();


/* ════════════════════════════════════════
   LOLA NOTE QUIZ MODAL
════════════════════════════════════════ */
(function () {
  const btn      = document.getElementById('lolaNoteBtn');
  const modal    = document.getElementById('lolaModal');
  const backdrop = document.getElementById('lolaBackdrop');
  const closeBtn = document.getElementById('lolaModalClose');
  const step1    = document.getElementById('lolaStep1');
  const step2    = document.getElementById('lolaStep2');
  const wrongMsg = document.getElementById('lolaWrongMsg');
  const input    = document.getElementById('lolaTypeInput');
  const submit   = document.getElementById('lolaTypeSubmit');
  const noteImg  = document.getElementById('lolaNoteFallback');
  if (!btn || !modal) return;

  const CORRECT = ['yellow', 'purple'];

  if (noteImg) {
    noteImg.addEventListener('error', () => { noteImg.style.display = 'none'; });
  }

  function openModal()  { modal.classList.add('open');    document.body.style.overflow = 'hidden'; }
  function closeModal() { modal.classList.remove('open'); document.body.style.overflow = ''; }

  btn.addEventListener('click', openModal);
  if (closeBtn)  closeBtn.addEventListener('click',  closeModal);
  if (backdrop)  backdrop.addEventListener('click',  closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  function checkAnswer() {
    const val = (input ? input.value : '').trim().toLowerCase();
    if (CORRECT.some(color => val.includes(color))) {
      if (input)  input.disabled  = true;
      if (submit) submit.disabled = true;
      setTimeout(() => {
        step1.classList.add('lola-step-hidden');
        step2.classList.remove('lola-step-hidden');
      }, 350);
    } else {
      wrongMsg.classList.add('show');
      if (input) {
        input.style.borderColor = 'var(--rose-dark)';
        input.animate([
          { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' },
          { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' },
          { transform: 'translateX(0)' }
        ], { duration: 380 });
      }
      setTimeout(() => { wrongMsg.classList.remove('show'); if (input) input.style.borderColor = ''; }, 1400);
    }
  }

  if (submit) submit.addEventListener('click', checkAnswer);
  if (input)  input.addEventListener('keydown', e => { if (e.key === 'Enter') checkAnswer(); });
})();


/* ════════════════════════════════════════
   VIDEO MODAL — Shared
════════════════════════════════════════ */
const videoModal         = document.getElementById('videoModal');
const videoModalBackdrop = document.getElementById('videoModalBackdrop');
const videoModalClose    = document.getElementById('videoModalClose');
const videoModalPlayer   = document.getElementById('videoModalPlayer');

function openVideoModal(src) {
  if (!videoModal || !videoModalPlayer) return;
  videoModalPlayer.src = src || '';
  videoModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (src) videoModalPlayer.play().catch(() => {});
}
function closeVideoModal() {
  if (!videoModal) return;
  videoModalPlayer.pause();
  videoModalPlayer.src = '';
  videoModal.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.watch-video-btn').forEach(btn => {
  btn.addEventListener('click', () => openVideoModal(btn.dataset.video));
});
if (videoModalClose)    videoModalClose.addEventListener('click',    closeVideoModal);
if (videoModalBackdrop) videoModalBackdrop.addEventListener('click', closeVideoModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeVideoModal(); });


/* ════════════════════════════════════════
   IMAGE LIGHTBOX — Global fullscreen viewer
════════════════════════════════════════ */
(function () {
  const lb = document.createElement('div');
  lb.className = 'img-lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.innerHTML = `
    <div class="img-lightbox-backdrop" id="lbBackdrop"></div>
    <div class="img-lightbox-box">
      <button class="img-lightbox-close" id="lbClose" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <button class="img-lightbox-nav img-lightbox-prev hidden" id="lbPrev" aria-label="Previous">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <img class="img-lightbox-img" id="lbImg" src="" alt="">
      <button class="img-lightbox-nav img-lightbox-next hidden" id="lbNext" aria-label="Next">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>
      <p class="img-lightbox-caption" id="lbCaption"></p>
    </div>`;
  document.body.appendChild(lb);

  const lbImg  = document.getElementById('lbImg');
  const lbCap  = document.getElementById('lbCaption');
  const lbClose = document.getElementById('lbClose');
  const lbBack  = document.getElementById('lbBackdrop');
  const lbPrev  = document.getElementById('lbPrev');
  const lbNext  = document.getElementById('lbNext');

  let galleryImages = [];
  let galleryIdx    = -1;

  function collectGallery(clickedImg) {
    const pane = clickedImg.closest('.folder-pane.active, .gallery-grid, section');
    if (!pane) return [];
    return Array.from(pane.querySelectorAll('img[src]:not([src=""])'))
      .filter(img => img.offsetParent !== null && img.src && !img.src.endsWith('#'));
  }

  function openLightbox(src, data, gallery, idx) {
    const caption = typeof data === 'object'
    ? data.caption || ''
    : data || '';

  const story = typeof data === 'object'
    ? data.story || ''
    : '';

  lbImg.src = src;
  lbImg.alt = caption;

  lbCap.innerHTML = `
    ${caption ? `<strong>${caption}</strong>` : ''}
    ${story ? `<span>${story}</span>` : ''}
  `;

  galleryImages = gallery || [];
  galleryIdx = idx ?? -1;

  const multi = galleryImages.length > 1;

  lbPrev.classList.toggle(
    'hidden',
    !multi || galleryIdx <= 0
  );

  lbNext.classList.toggle(
    'hidden',
    !multi || galleryIdx >= galleryImages.length - 1
  );

  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

  function closeLightbox() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { lbImg.src = ''; }, 300);
  }

  function navigateLightbox(dir) {
    const newIdx = galleryIdx + dir;

  if (newIdx < 0 || newIdx >= galleryImages.length) return;

  const img = galleryImages[newIdx];

  const card = img.closest('.flip-card');

  const caption =
    card?.dataset.caption ||
    img.closest('[data-caption]')?.dataset.caption ||
    img.alt ||
    '';

  const story =
    card?.dataset.story ||
    img.closest('[data-story]')?.dataset.story ||
    '';

  galleryIdx = newIdx;

  lbImg.src = img.src;
  lbImg.alt = caption;

  lbCap.innerHTML = `
    ${caption ? `<strong>${caption}</strong>` : ''}
    ${story ? `<span>${story}</span>` : ''}
  `;

  lbPrev.classList.toggle(
    'hidden',
    galleryIdx <= 0
  );

  lbNext.classList.toggle(
    'hidden',
    galleryIdx >= galleryImages.length - 1
  );
}

  lbClose.addEventListener('click', closeLightbox);
  lbBack.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', e => { e.stopPropagation(); navigateLightbox(-1); });
  lbNext.addEventListener('click', e => { e.stopPropagation(); navigateLightbox(1); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft')  navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });

  let ltx = 0;
  lbImg.addEventListener('touchstart', e => { ltx = e.touches[0].clientX; }, { passive: true });
  lbImg.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - ltx;
    if (Math.abs(dx) > 40) navigateLightbox(dx < 0 ? 1 : -1);
  });

  /* Click delegation — images outside flip-cards open lightbox directly */
  document.addEventListener('click', e => {
    if (e.target.closest('.watch-video-btn, .proj-video-btn')) return;
    const img = e.target.closest('img');
    if (!img) return;
    /* Skip flip-card images — handled by the flip cards IIFE below */
    if (img.closest('.flip-card')) return;
    const container = img.closest('.proj-photo-wrap, .ask-photo-inner, .answer-reveal-photo, .lola-note-img-wrap, .letter-page-frame, .plan-hover-img, .mini-photo');
    if (!container) return;
    const src = img.src;
    if (!src || src.endsWith('#') || src === window.location.href) return;
    const alt = img.closest('[data-caption]')?.dataset.caption || img.alt || '';
    const gallery = collectGallery(img);
    const idx = gallery.indexOf(img);
    openLightbox(src, alt, gallery, idx);
    e.stopPropagation();
  }, true);

  window.openImgLightbox = openLightbox;
})();


/* ════════════════════════════════════════
   FLIP CARDS + GALLERY
════════════════════════════════════════ */
(function () {
const folderBody = document.querySelector('.folder-body');
  if (!folderBody) return;

  const isTouch = window.matchMedia('(hover: none)').matches;

  function openCardLightbox(card) {
    const imgEl = card.querySelector('.flip-front img');

    if (!imgEl || !imgEl.src || imgEl.src.endsWith('#')) return;

    const caption =
      card.dataset.caption ||
      imgEl.alt ||
      '';

    const story =
      card.dataset.story ||
      '';

    const pane = card.closest('.folder-pane');

    const allImgs = pane
      ? Array.from(
          pane.querySelectorAll('.flip-front img[src]')
        ).filter(i => i.src && !i.src.endsWith('#'))
      : [imgEl];

    const idx = allImgs.indexOf(imgEl);

    window.openImgLightbox(
      imgEl.src,
      {
        caption,
        story
      },
      allImgs,
      idx
    );
  }

  /* TOUCH DEVICES ONLY */
  if (isTouch) {
    folderBody.addEventListener(
      'click',
      e => {
        const card = e.target.closest('.flip-card');
        if (!card) return;

        openCardLightbox(card);

        e.preventDefault();
        e.stopPropagation();
      },
      true
    );
  }

  /* DESKTOP CLICK = OPEN MODAL */
  else {
    folderBody.addEventListener(
      'click',
      e => {
        const card = e.target.closest('.flip-card');
        if (!card) return;

        openCardLightbox(card);

        e.preventDefault();
        e.stopPropagation();
      },
      true
    );
  }
})();


/* ════════════════════════════════════════
   OUR MEMORIES — Folder tabs
════════════════════════════════════════ */
document.querySelectorAll('.folder-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const key = tab.dataset.folder;
    /* Unflip all cards when switching tabs */
    document.querySelectorAll('.flip-card.flipped').forEach(c => c.classList.remove('flipped'));
    document.querySelectorAll('.folder-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.folder-pane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const pane = document.querySelector(`.folder-pane[data-folder="${key}"]`);
    if (pane) pane.classList.add('active');
  });
});


/* ════════════════════════════════════════
   MY NOTE QUIZ
════════════════════════════════════════ */
(function () {
  document.querySelectorAll('.note-quiz-wrap').forEach(quizWrap => {

    const input = quizWrap.querySelector('.note-quiz-input');
    const submit = quizWrap.querySelector('.note-quiz-submit');
    const wrongMsg = quizWrap.querySelector('.note-quiz-wrong');

    const letterWrap = quizWrap.nextElementSibling;

    if (!input || !submit || !letterWrap) return;

    const answers = (
      submit.dataset.answer || ''
    )
      .split('|')
      .map(a => a.trim().toLowerCase());

    function unlockLetter() {
      const val = input.value.trim().toLowerCase();

      if (answers.includes(val)) {

        quizWrap.style.opacity = '0';
        quizWrap.style.transition = 'opacity .4s ease';

        setTimeout(() => {
          quizWrap.style.display = 'none';

          letterWrap.style.display = 'block';
          letterWrap.classList.add('quiz-revealed');

          letterWrap.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

        }, 420);

      } else {

        wrongMsg.classList.add('show');

        input.style.borderColor = 'var(--rose-dark)';

        input.animate([
          { transform: 'translateX(-5px)' },
          { transform: 'translateX(5px)' },
          { transform: 'translateX(-4px)' },
          { transform: 'translateX(4px)' },
          { transform: 'translateX(0)' }
        ], {
          duration: 380
        });

        setTimeout(() => {
          wrongMsg.classList.remove('show');
          input.style.borderColor = '';
        }, 1600);
      }
    }

    submit.addEventListener('click', unlockLetter);

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        unlockLetter();
      }
    });

  });

})();


/* ════════════════════════════════════════
   LETTER VIEWER — Single page slide
════════════════════════════════════════ */
(function () {
  const wrap = document.getElementById('noteLetterWrap');
  if (!wrap) return;
  const book = document.getElementById('letterBook');
  if (!book) return;

  const pages = [
    { img: 'assets/letter-1.jpg', alt: 'Letter page 1', tapes: true },
    { img: 'assets/letter-2.jpg', alt: 'Letter page 2', tapes: false },
    { img: 'assets/letter-3.jpg', alt: 'Letter page 3', tapes: false },
  ];

  const viewport = document.createElement('div');
  viewport.className = 'letter-pages-viewport';

  pages.forEach((p, i) => {
    const slide = document.createElement('div');
    slide.className = 'letter-page-slide' + (i === 0 ? ' active' : '');
    slide.dataset.pageIdx = i;
    const tapesHtml = p.tapes
      ? `<div class="letter-page-frame-tape letter-tape-tl"></div><div class="letter-page-frame-tape letter-tape-tr"></div>` : '';
    slide.innerHTML = `<div class="letter-page-frame">${tapesHtml}<img src="${p.img}" alt="${p.alt}" draggable="false"></div>`;
    viewport.appendChild(slide);
  });

  book.parentNode.replaceChild(viewport, book);

  const prevBtn = document.getElementById('letterPrev');
  const nextBtn = document.getElementById('letterNext');
  const counter = document.getElementById('letterCounter');
  const slides  = viewport.querySelectorAll('.letter-page-slide');
  const TOTAL   = slides.length;
  let cur = 0;

  slides.forEach((s, i) => {
    if (i !== 0) { s.style.position = 'absolute'; s.style.inset = '0'; s.style.opacity = '0'; }
  });

  function goTo(newIdx) {
    if (newIdx < 0 || newIdx >= TOTAL || newIdx === cur) return;
    const dir = newIdx > cur ? 1 : -1;
    slides[cur].classList.remove('active');
    slides[cur].style.transform = dir > 0 ? 'translateX(-40px)' : 'translateX(40px)';
    slides[cur].style.opacity   = '0';
    slides[cur].style.position  = 'absolute';
    slides[cur].style.inset     = '0';
    cur = newIdx;
    slides[cur].style.transform = dir > 0 ? 'translateX(40px)' : 'translateX(-40px)';
    slides[cur].style.opacity   = '0';
    slides[cur].style.position  = 'relative';
    slides[cur].style.inset     = '';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      slides[cur].style.transition = 'opacity .45s ease, transform .45s cubic-bezier(.22,1,.36,1)';
      slides[cur].style.transform  = 'translateX(0)';
      slides[cur].style.opacity    = '1';
      slides[cur].classList.add('active');
    }));
    if (counter) counter.textContent = `Page ${cur + 1} of ${TOTAL}`;
    if (prevBtn) prevBtn.disabled = cur <= 0;
    if (nextBtn) nextBtn.disabled = cur >= TOTAL - 1;
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(cur - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(cur + 1));
  if (counter) counter.textContent = `Page 1 of ${TOTAL}`;
  if (prevBtn) prevBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = TOTAL <= 1;
})();


/* ════════════════════════════════════════
   FLIP ENVELOPES
════════════════════════════════════════ */
document.querySelectorAll('.flip-envelope').forEach(env => {
  env.addEventListener('click', () => env.classList.toggle('flipped'));
});


/* ════════════════════════════════════════
   HAMBURGER NAV
════════════════════════════════════════ */
(function () {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!hamburger) return;
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('active');
    hamburger.classList.remove('open');
  }));
  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('active');
      hamburger.classList.remove('open');
    }
  });
})();


/* ════════════════════════════════════════
   ACTIVE NAV ON SCROLL
════════════════════════════════════════ */
(function () {
  const sections   = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navAnchors.forEach(a => a.classList.remove('active-link'));
        const m = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
        if (m) m.classList.add('active-link');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  sections.forEach(s => obs.observe(s));
})();


/* ════════════════════════════════════════
   NAVBAR SHADOW ON SCROLL
════════════════════════════════════════ */
(function () {
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
})();


/* ════════════════════════════════════════
   SCROLL REVEAL
════════════════════════════════════════ */
(function () {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.section-header, .cluster-carousel, .chapter-text, .plan-card').forEach(el => {
    el.classList.add('reveal-hidden');
    obs.observe(el);
  });
})();


/* ════════════════════════════════════════
   HOW WE CELEBRATED — Film Strip
════════════════════════════════════════ */
(function () {
  /* Build sprocket holes */
  function buildSprockets(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    for (let i = 0; i < 34; i++) {
      const h = document.createElement('div');
      h.className = 'reel-sprocket-hole';
      el.appendChild(h);
    }
  }
  buildSprockets('reelSprockTop');
  buildSprockets('reelSprockBot');

  /* Drag-to-scroll */
  const scrollEl = document.getElementById('reelScroll');
  if (scrollEl) {
    let isDown = false, startX = 0, scrollLeft = 0;
    scrollEl.addEventListener('mousedown', e => { isDown = true; scrollEl.classList.add('grabbing'); startX = e.pageX - scrollEl.offsetLeft; scrollLeft = scrollEl.scrollLeft; });
    scrollEl.addEventListener('mouseleave', () => { isDown = false; scrollEl.classList.remove('grabbing'); });
    scrollEl.addEventListener('mouseup',    () => { isDown = false; scrollEl.classList.remove('grabbing'); });
    scrollEl.addEventListener('mousemove',  e => {
      if (!isDown) return;
      e.preventDefault();
      scrollEl.scrollLeft = scrollLeft - (e.pageX - scrollEl.offsetLeft - startX) * 1.25;
    });
    let tx = 0;
    scrollEl.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    scrollEl.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 10) scrollEl.scrollLeft -= dx * 0.8;
    });
  }

  /* Arrow buttons */
  const arrL = document.getElementById('reelArrL');
  const arrR = document.getElementById('reelArrR');
  function updateArrows() {
    if (!arrL || !arrR || !scrollEl) return;
    arrL.classList.toggle('hide', scrollEl.scrollLeft < 20);
    arrR.classList.toggle('hide', scrollEl.scrollLeft + scrollEl.clientWidth >= scrollEl.scrollWidth - 20);
  }
  if (arrL) arrL.addEventListener('click', () => scrollEl.scrollBy({ left: -270, behavior: 'smooth' }));
  if (arrR) arrR.addEventListener('click', () => scrollEl.scrollBy({ left:  270, behavior: 'smooth' }));
  if (scrollEl) scrollEl.addEventListener('scroll', updateArrows, { passive: true });
  updateArrows();

  /* Expanded panel */
  const panel     = document.getElementById('reelExpanded');
  const mainPhoto = document.getElementById('rexMainPhoto');
  const thumbsEl  = document.getElementById('rexThumbs');
  const textCol   = document.getElementById('rexTextCol');
  const closeBtn  = document.getElementById('rexClose');

  let activeFrameId   = null;
  let sealBroken      = false;
  let currentPhotos   = [];
  let currentPhotoIdx = 0;

  function openPanelLightbox(idx) {
    if (!window.openImgLightbox || !currentPhotos.length) return;
    const imgs = Array.from(mainPhoto.querySelectorAll('img'));
    window.openImgLightbox(currentPhotos[idx], '', imgs, idx);
  }

  function setActivePhoto(i) {
    const imgs   = mainPhoto.querySelectorAll('img');
    const thumbs = thumbsEl.querySelectorAll('.rex-thumb');
    imgs.forEach((img, j)     => img.classList.toggle('rex-active', j === i));
    thumbs.forEach((thumb, j) => thumb.classList.toggle('rex-thumb-active', j === i));
    currentPhotoIdx = i;
  }

  function renderPanel(frame) {
    const d = frame.dataset;
    let photos = [];
    try { photos = JSON.parse(d.photos || '[]'); } catch (e) {}
    photos = photos.filter(Boolean);
    currentPhotos   = photos;
    currentPhotoIdx = 0;

    mainPhoto.innerHTML = photos.map((src, i) =>
      `<img src="${src}" alt="" loading="lazy" class="${i === 0 ? 'rex-active' : ''}">`
    ).join('');
    mainPhoto.style.cursor = 'zoom-in';
    mainPhoto.onclick = () => openPanelLightbox(currentPhotoIdx);

    thumbsEl.innerHTML = '';
    if (photos.length > 1) {
      photos.forEach((src, i) => {
        const t = document.createElement('div');
        t.className = 'rex-thumb' + (i === 0 ? ' rex-thumb-active' : '');
        t.innerHTML = `<img src="${src}" alt="" loading="lazy">`;
        t.addEventListener('click', () => setActivePhoto(i));
        t.addEventListener('dblclick', e => { e.stopPropagation(); openPanelLightbox(i); });
        thumbsEl.appendChild(t);
      });
    }

    let html = `
      <span class="rex-chapter">${d.chapter || ''}</span>
      <span class="rex-date">${d.date || ''}</span>
      <h3 class="rex-title">${d.title || ''}</h3>`;
    html += `<p class="rex-body">${d.body || ''}</p><p class="rex-note">${d.note || ''}</p>`;
    if (d.gift === 'true') {
      html += `<div class="rex-ring-note"><p>💍 You've always wanted mabigyan ng ring, I hope you like it hehe.</p></div>`;
    }
    if (d.gift === 'true') {
      html += `<div class="rex-ring-note"><p>👟 I've wanted to receive a pair of shoes. Thank you so much baby hehehe.</p></div>`;
    }
    html += `<div class="rex-actions">`;
    if (d.video) {
      html += `<button class="rex-vid-btn" data-video="${d.video}">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
        Watch the moment</button>`;
    }

    textCol.innerHTML = html;

    const vBtn  = textCol.querySelector('.rex-vid-btn');
    const exBtn = textCol.querySelector('.rex-expand-btn');
    if (vBtn)  vBtn.addEventListener('click', () => openVideoModal(vBtn.dataset.video));
    if (exBtn) exBtn.addEventListener('click', () => openPanelLightbox(currentPhotoIdx));
  }

  function openPanel(frame) {
    renderPanel(frame);
    panel.classList.add('open');
    setTimeout(() => { frame.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }, 60);
    setTimeout(() => { panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 180);
  }

  function closePanel() {
    panel.classList.remove('open');
    if (activeFrameId) {
      const old = document.getElementById('reelFrame' + activeFrameId);
      if (old) old.classList.remove('reel-frame-active');
      activeFrameId = null;
    }
  }

  if (closeBtn) closeBtn.addEventListener('click', closePanel);

  document.querySelectorAll('.reel-frame').forEach(frame => {
    frame.addEventListener('click', e => {
      if (e.target.closest('.reel-wax-overlay')) return;
      const id = frame.dataset.id;
      if (frame.dataset.gift === 'true' && !sealBroken) return;
      if (activeFrameId === id) { closePanel(); return; }
      if (activeFrameId) {
        const old = document.getElementById('reelFrame' + activeFrameId);
        if (old) old.classList.remove('reel-frame-active');
      }
      frame.classList.add('reel-frame-active');
      activeFrameId = id;
      openPanel(frame);
    });
  });

  /* Wax seal */
  const waxSeal    = document.getElementById('reelWaxSeal');
  const waxOverlay = document.getElementById('reelWaxOverlay');
  if (waxSeal && waxOverlay) {
    waxSeal.addEventListener('click', e => {
      e.stopPropagation();
      if (sealBroken) return;
      waxSeal.style.animation = 'reelSealCrack .42s cubic-bezier(.36,.07,.19,.97) forwards';
      setTimeout(() => { waxOverlay.classList.add('broken'); sealBroken = true; }, 400);
    });
  }

  /* Compiled video button */
  document.querySelectorAll('.celeb-video-play-btn').forEach(btn => {
    btn.addEventListener('click', () => openVideoModal(btn.dataset.video));
  });
})();


/* ════════════════════════════════════════
   MUSIC PLAYER
════════════════════════════════════════ */
(function () {
  const SONGS = [
    { title: "Can't Help Falling in Love", artist: 'Kiana Ledé',   src: 'assets/cant-help-falling.mp3', duration: '3:22' },
    { title: 'Ito Lamang',                 artist: 'Project Romeo', src: 'assets/ito-lamang.mp3',        duration: '3:19' },
  ];
  const DEFAULT_VOLUME = 0.2;
  const SESSION_KEY    = 'jsShanMusicPlayed';

  const audio        = document.getElementById('bgAudio');
  const toggleBtn    = document.getElementById('musicToggle');
  const panel        = document.getElementById('musicPanel');
  const panelClose   = document.getElementById('musicPanelClose');
  const playPauseBtn = document.getElementById('musicPlayPause');
  const prevBtn      = document.getElementById('musicPrev');
  const nextBtn      = document.getElementById('musicNext');
  const volumeSlider = document.getElementById('musicVolume');
  const playlistEl   = document.getElementById('musicPlaylist');
  const trackName    = document.getElementById('musicTrackName');
  const trackArtist  = document.getElementById('musicTrackArtist');
  const vinyl        = document.getElementById('musicVinyl');
  const playIcon     = playPauseBtn?.querySelector('.play-icon');
  const pauseIcon    = playPauseBtn?.querySelector('.pause-icon');
  if (!audio || !toggleBtn) return;

  let curIdx    = 0;
  let isPlaying = false;
  let panelOpen = false;

  SONGS.forEach((song, i) => {
    const item = document.createElement('div');
    item.className = 'music-playlist-item' + (i === 0 ? ' active' : '');
    item.innerHTML = `<span class="music-item-num">${i + 1}</span>
      <span class="music-item-name">${song.title}</span>
      <span class="music-item-dur">${song.duration || ''}</span>`;
    item.addEventListener('click', () => loadSong(i, true));
    if (playlistEl) playlistEl.appendChild(item);
  });

  function updatePlaylistUI(idx) {
    document.querySelectorAll('.music-playlist-item').forEach((el, i) => el.classList.toggle('active', i === idx));
  }

  function loadSong(idx, autoplay = false) {
    curIdx = idx;
    const song = SONGS[idx];
    audio.src    = song.src;
    audio.volume = DEFAULT_VOLUME;
    if (volumeSlider) volumeSlider.value = DEFAULT_VOLUME;
    if (trackName)   trackName.textContent   = song.title;
    if (trackArtist) trackArtist.textContent = song.artist;
    updatePlaylistUI(idx);
    if (autoplay) audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  function setPlaying(state) {
    isPlaying = state;
    if (playIcon)  playIcon.style.display  = state ? 'none'  : 'block';
    if (pauseIcon) pauseIcon.style.display = state ? 'block' : 'none';
    if (vinyl)     vinyl.classList.toggle('spinning', state);
    if (toggleBtn) toggleBtn.classList.toggle('playing', state);
  }

  function togglePlay() {
    if (isPlaying) { audio.pause(); setPlaying(false); }
    else {
      if (!audio.src || audio.src === window.location.href) loadSong(curIdx);
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  audio.addEventListener('ended', () => { curIdx = (curIdx + 1) % SONGS.length; loadSong(curIdx, true); });
  audio.addEventListener('pause', () => setPlaying(false));
  audio.addEventListener('play',  () => setPlaying(true));

  if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlay);
  if (prevBtn) prevBtn.addEventListener('click', () => { curIdx = (curIdx - 1 + SONGS.length) % SONGS.length; loadSong(curIdx, isPlaying); });
  if (nextBtn) nextBtn.addEventListener('click', () => { curIdx = (curIdx + 1) % SONGS.length; loadSong(curIdx, isPlaying); });
  if (volumeSlider) {
    volumeSlider.value = DEFAULT_VOLUME;
    volumeSlider.addEventListener('input', () => { audio.volume = +volumeSlider.value; });
  }

  function openPanel()  { panel.classList.add('open');    panelOpen = true; }
  function closePanel() { panel.classList.remove('open'); panelOpen = false; }
  toggleBtn.addEventListener('click', () => panelOpen ? closePanel() : openPanel());
  if (panelClose) panelClose.addEventListener('click', closePanel);

  loadSong(0, false);

  if (!sessionStorage.getItem(SESSION_KEY)) {
    sessionStorage.setItem(SESSION_KEY, '1');
    setTimeout(() => {
      audio.play().then(() => { setPlaying(true); openPanel(); }).catch(() => {});
    }, 800);
  }
})();


/* ════════════════════════════════════════
   AMBIENT BACKGROUND — Twinkling stars
════════════════════════════════════════ */
(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'ambientCanvas';
  document.body.insertBefore(canvas, document.body.firstChild);
  const ctx = canvas.getContext('2d');

  let W, H, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W   = window.innerWidth;
    H   = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const GOLD  = 'rgba(201,168,76,';
  const CREAM = 'rgba(253,246,238,';
  const ROSE  = 'rgba(212,128,138,';

  function makeStar() {
    const tier = Math.random();
    return {
      x:     Math.random(),
      y:     Math.random(),
      r:     tier < 0.6  ? Math.random() * 0.6 + 0.2
           : tier < 0.88 ? Math.random() * 0.9 + 0.7
           :                Math.random() * 1.1 + 1.4,
      speed: Math.random() * 0.006 + 0.002,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() < 0.12 ? ROSE : Math.random() < 0.5 ? GOLD : CREAM,
      minA:  tier < 0.6  ? 0.04 : tier < 0.88 ? 0.08 : 0.18,
      maxA:  tier < 0.6  ? 0.28 : tier < 0.88 ? 0.50 : 0.80,
    };
  }

  const STAR_COUNT = 220;
  const stars = Array.from({ length: STAR_COUNT }, makeStar);

  function drawStar(s, t) {
    const x = s.x * W;
    const y = s.y * H;
    const progress = Math.sin(t * s.speed * 60 + s.phase) * 0.5 + 0.5;
    const a = s.minA + progress * (s.maxA - s.minA);
    if (s.r > 1.4) {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, s.r * 3.5);
      grad.addColorStop(0, s.color + (a * 0.7) + ')');
      grad.addColorStop(1, s.color + '0)');
      ctx.beginPath(); ctx.arc(x, y, s.r * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = grad; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = s.color + a + ')'; ctx.fill();
  }

  let lastT = 0;
  let paused = false;
  let rafId;

  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused && !rafId) loop(lastT);
  });

  function loop(t) {
    if (paused) { rafId = null; return; }
    rafId = requestAnimationFrame(loop);
    lastT = t;
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => drawStar(s, t * 0.001));
  }
  requestAnimationFrame(loop);
})();