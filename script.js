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
    slides.forEach(s => { s.style.opacity='1'; s.style.position='static'; s.style.display='flex'; });
    let max = 0;
    slides.forEach(s => { max = Math.max(max, s.offsetHeight); });
    slides.forEach(s => { s.style.opacity=''; s.style.position=''; s.style.display=''; });
    if (max > 0) track.style.height = max + 'px';
  }

  const imgs = el.querySelectorAll('img');
  let loaded = 0;
  if (!imgs.length) setTimeout(lockHeight, 50);
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
  el.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive:true });
  el.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 40) dx < 0 ? goTo(cur + 1) : goTo(cur - 1);
  });
}
document.querySelectorAll('.cluster-carousel').forEach(makeClusterCarousel);


/* ════════════════════════════════════════
   THE QUESTION — Single unified carousel
   Photos (left) + text panels (right) sync together.
   One set of controls: prev · dots · next.
════════════════════════════════════════ */
(function () {
  const photoSlides = document.querySelectorAll('.ask-photo-slide');
  const textPanels  = document.querySelectorAll('.ask-text-panel');
  const dots        = document.querySelectorAll('.ask-dot');
  const prevBtn     = document.getElementById('askPrev');
  const nextBtn     = document.getElementById('askNext');
  const photoTrack  = document.getElementById('askPhotoTrack');
  if (!photoSlides.length) return;

  let cur = 0;

  /* Lock photo track height to tallest slide after images load */
  function lockHeight() {
    photoSlides.forEach(s => { s.style.opacity='1'; s.style.position='static'; s.style.display='flex'; });
    let max = 0;
    photoSlides.forEach(s => { max = Math.max(max, s.offsetHeight); });
    photoSlides.forEach(s => { s.style.opacity=''; s.style.position=''; s.style.display=''; });
    if (max > 0 && photoTrack) photoTrack.style.height = max + 'px';
    // Also lock text track height from tallest panel
    const textPanelEls = document.querySelectorAll('.ask-text-panel');
    const textTrackEl  = document.getElementById('askTextTrack');
    if (textTrackEl && textPanelEls.length) {
      textPanelEls.forEach(p => { p.style.position='static'; p.style.opacity='1'; p.style.display='flex'; });
      let tmax = 0;
      textPanelEls.forEach(p => { tmax = Math.max(tmax, p.offsetHeight); });
      textPanelEls.forEach(p => { p.style.position=''; p.style.opacity=''; p.style.display=''; });
      if (tmax > 0) textTrackEl.style.minHeight = tmax + 'px';
    }
  }
  const imgs = document.querySelectorAll('.ask-photo-slide img');
  let loaded = 0;
  if (!imgs.length) setTimeout(lockHeight, 50);
  else {
    imgs.forEach(img => {
      if (img.complete) { loaded++; if (loaded === imgs.length) lockHeight(); }
      else img.addEventListener('load', () => { loaded++; if (loaded === imgs.length) lockHeight(); });
    });
    setTimeout(lockHeight, 900);
  }
  window.addEventListener('resize', lockHeight);

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

  /* Touch swipe on the photo area */
  const photoSide = document.querySelector('.ask-photo-side');
  if (photoSide) {
    let tx = 0;
    photoSide.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive:true });
    photoSide.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 40) dx < 0 ? goTo(cur + 1) : goTo(cur - 1);
    });
  }
})();


/* ════════════════════════════════════════
   BEFORE US — Crossfade + photo-top / text-bottom
   Crossfade transition (no sliding — cleaner on a stacked layout).
   Multi-photo: auto-rotate + manual prev/next + dots.
════════════════════════════════════════ */
(function () {
  const nodes    = document.querySelectorAll('.proj-node');
  const idle     = document.getElementById('projectorIdle');
  const viewport = document.getElementById('projSlideViewport');
  const railFill = document.getElementById('projRailFill');
  const navPrev  = document.getElementById('projNavPrev');
  const navNext  = document.getElementById('projNavNext');
  const counter  = document.getElementById('projCounter');
  if (!nodes.length || !viewport) return;

  let activeIndex = -1;
  let animating   = false;
  let ppcTimers   = [];
  const FADE_MS   = 550;

  function buildPhotoHTML(node) {
    const single = (node.dataset.photo || '').trim();
    const multi  = (node.dataset.photos || '').trim();
    const ph = `<div class="proj-photo-placeholder"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg><span>Add photo</span></div>`;

    if (multi) {
      let paths; try { paths = JSON.parse(multi); } catch { paths = []; }
      paths = paths.filter(Boolean);
      if (!paths.length) return ph;
      const slides = paths.map((p, i) =>
        `<div class="ppc-slide${i===0?' active':''}">${p ? `<img src="${p}" alt="">` : ph}</div>`
      ).join('');
      const dotHtml = paths.length > 1
        ? `<div class="ppc-dots">${paths.map((_,i) => `<button class="ppc-dot${i===0?' active':''}" data-i="${i}"></button>`).join('')}</div>` : '';
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

    const pw = panel.querySelector('.proj-photo-wrap');
    if (pw) {
      let tx = 0;
      pw.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive:true });
      pw.addEventListener('touchend',   e => {
        const dx = e.changedTouches[0].clientX - tx;
        if (Math.abs(dx) > 35) dx < 0 ? go(cur + 1) : go(cur - 1);
      });
    }
  }

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

  function updateRail(i) {
    if (!railFill) return;
    const nodesWrap = document.getElementById('projNodes');
    if (!nodesWrap) return;
    const rr = nodesWrap.getBoundingClientRect();
    const nr = nodes[i].getBoundingClientRect();
    const pct = Math.max(0, Math.min(100,
      ((nr.left + nr.width/2 - rr.left) / rr.width) * 100
    ));
    railFill.style.width = pct + '%';
  }

  function transition(toIndex) {
    if (animating || toIndex === activeIndex) return;
    animating = true;

    ppcTimers.forEach(clearInterval);
    ppcTimers = [];

    /* Fade out old panel */
    const old = viewport.querySelector('.proj-panel');
    if (old) {
      old.classList.add('fade-exit');
      setTimeout(() => old.remove(), 350);
    }

    /* Build and fade in new panel */
    const panel = buildPanel(nodes[toIndex]);
    viewport.appendChild(panel);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.classList.add('fade-enter');
        setTimeout(() => panel.classList.add('stagger-text'), 80);
      });
    });

    setTimeout(() => startPPC(panel), 60);

    const vBtn = panel.querySelector('.proj-video-btn');
    if (vBtn) vBtn.addEventListener('click', () => openVideoModal(vBtn.dataset.video));

    nodes.forEach(n => n.classList.remove('active'));
    nodes[toIndex].classList.add('active');
    activeIndex = toIndex;

    updateRail(toIndex);

    if (navPrev) navPrev.classList.add('visible');
    if (navNext) navNext.classList.add('visible');
    if (idle)    idle.classList.add('hidden');

    if (counter) {
      counter.textContent = `${toIndex + 1} / ${nodes.length}`;
      counter.classList.add('visible');
    }

    setTimeout(() => { animating = false; }, FADE_MS);
  }

  nodes.forEach((node, i) => node.addEventListener('click', () => transition(i)));
  if (navPrev) navPrev.addEventListener('click', () => { if (activeIndex > 0) transition(activeIndex - 1); });
  if (navNext) navNext.addEventListener('click', () => { if (activeIndex < nodes.length - 1) transition(activeIndex + 1); });

  document.addEventListener('keydown', e => {
    const s = document.getElementById('beforeUs');
    if (!s) return;
    const r = s.getBoundingClientRect();
    if (r.top > window.innerHeight || r.bottom < 0) return;
    if (e.key === 'ArrowLeft'  && activeIndex > 0)                transition(activeIndex - 1);
    if (e.key === 'ArrowRight' && activeIndex < nodes.length - 1) transition(activeIndex + 1);
  });

  setTimeout(() => { if (nodes[0]) transition(0); }, 500);
})();


/* ════════════════════════════════════════
   THE ANSWER — Click to reveal
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
    cover.style.opacity = '0';
    cover.style.transform = 'scale(1.03)';
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
  const notePh   = document.getElementById('lolaNotePlaceholder');
  if (!btn || !modal) return;

  const CORRECT = ['yellow', 'purple'];

  if (noteImg) {
    noteImg.addEventListener('load',  () => { if (notePh) notePh.style.display = 'none'; });
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
          {transform:'translateX(-5px)'},{transform:'translateX(5px)'},
          {transform:'translateX(-4px)'},{transform:'translateX(4px)'},
          {transform:'translateX(0)'}
        ], {duration:380});
      }
      setTimeout(() => {
        wrongMsg.classList.remove('show');
        if (input) input.style.borderColor = '';
      }, 1400);
    }
  }

  if (submit) submit.addEventListener('click', checkAnswer);
  if (input)  input.addEventListener('keydown', e => { if (e.key === 'Enter') checkAnswer(); });
})();


/* ════════════════════════════════════════
   SHARED VIDEO MODAL
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
   FLIP CARDS + PHOTO MODAL
   Works on both static and dynamically added cards.
   Uses event delegation on .folder-body so newly
   added cards (All tab clones) are always handled.
════════════════════════════════════════ */
const photoModal       = document.getElementById('photoModal');
const modalBackdrop    = document.getElementById('modalBackdrop');
const modalClose       = document.getElementById('modalClose');
const modalCaption     = document.getElementById('modalCaption');
const modalStory       = document.getElementById('modalStory');
const modalImg         = document.getElementById('modalImg');
const modalImgPh       = document.getElementById('modalImgPlaceholder');

const isTouch = window.matchMedia('(hover: none)').matches;

function openPhotoModal(card) {
  const caption = card.dataset.caption || '';
  const story   = card.dataset.story   || '';

  // Find the image inside this card's flip-front
  const imgEl = card.querySelector('.flip-front img');
  const src   = imgEl ? imgEl.src : '';

  if (modalCaption) modalCaption.textContent = caption;
  if (modalStory)   modalStory.textContent   = story;

  // Show image or placeholder
  if (src && modalImg && modalImgPh) {
    modalImg.src     = src;
    modalImg.style.display  = 'block';
    modalImgPh.style.display = 'none';
    // If img fails, show placeholder
    modalImg.onerror = () => {
      modalImg.style.display  = 'none';
      modalImgPh.style.display = 'flex';
    };
  } else if (modalImgPh && modalImg) {
    modalImg.style.display   = 'none';
    modalImgPh.style.display = 'flex';
  }

  if (photoModal) photoModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePhotoModal() {
  if (photoModal) photoModal.classList.remove('open');
  document.body.style.overflow = '';
  // Reset img src after close to avoid flash
  setTimeout(() => { if (modalImg) modalImg.src = ''; }, 300);
}

// Event delegation — listen on the whole folder-body so cloned cards work too
const folderBodyEl = document.querySelector('.folder-body');
if (folderBodyEl) {
  folderBodyEl.addEventListener('click', e => {
    const card = e.target.closest('.flip-card');
    if (!card) return;

    if (isTouch) {
      if (!card.classList.contains('flipped')) {
        card.classList.add('flipped');
      } else {
        openPhotoModal(card);
      }
    } else {
      openPhotoModal(card);
    }
  });
}

if (modalClose)    modalClose.addEventListener('click',    closePhotoModal);
if (modalBackdrop) modalBackdrop.addEventListener('click', closePhotoModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePhotoModal(); });


/* ════════════════════════════════════════
   OUR MEMORIES — Folder tabs
════════════════════════════════════════ */
document.querySelectorAll('.folder-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const key = tab.dataset.folder;
    document.querySelectorAll('.flip-card.flipped').forEach(c => c.classList.remove('flipped'));
    document.querySelectorAll('.folder-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.folder-pane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const pane = document.querySelector(`.folder-pane[data-folder="${key}"]`);
    if (pane) pane.classList.add('active');
  });
});


/* Love notes: now using .flip-envelope — handled below */


/* ════════════════════════════════════════
   MY NOTE — Hide placeholder when image loads
════════════════════════════════════════ */
const noteImg  = document.getElementById('noteImg');
const notePh   = document.getElementById('notePlaceholder');
if (noteImg && notePh) {
  noteImg.addEventListener('load',  () => { notePh.style.display = 'none'; });
  noteImg.addEventListener('error', () => { noteImg.style.display = 'none'; });
}


/* ════════════════════════════════════════
   MUSIC PLAYER
   Autoplay on first visit (sessionStorage flag).
   On reload: respects browser autoplay policy.
   
   Songs array — edit freely:
   { title, artist, src, duration }
════════════════════════════════════════ */
(function () {
  const SONGS = [
    { title: "Can't Help Falling in Love", artist: 'Kiana Ledé',    src: 'assets/cant-help-falling.mp3', duration: '3:22' },
    { title: 'Love Is A Stillness',        artist: 'Sam Smith',      src: 'assets/love-is-a-stillness.mp3', duration: '1:54' },
    { title: 'Ito Lamang',                 artist: 'Project Romeo',  src: 'assets/ito-lamang.mp3',         duration: '3:19' },
    { title: 'Pinipili',                   artist: 'Mateo',          src: 'assets/pinipili.mp3',           duration: '3:00' },
  ];
  const DEFAULT_VOLUME = 0.2;
  const SESSION_KEY    = 'jsShanMusicPlayed'; // set on first play attempt

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
  const playIcon     = playPauseBtn ? playPauseBtn.querySelector('.play-icon')  : null;
  const pauseIcon    = playPauseBtn ? playPauseBtn.querySelector('.pause-icon') : null;
  if (!audio || !toggleBtn) return;

  let curIdx    = 0;
  let isPlaying = false;
  let panelOpen = false;

  /* Build playlist UI */
  SONGS.forEach((song, i) => {
    const item = document.createElement('div');
    item.className = 'music-playlist-item' + (i === 0 ? ' active' : '');
    item.innerHTML = `<span class="music-item-num">${i+1}</span>
      <span class="music-item-name">${song.title}</span>
      <span class="music-item-dur">${song.duration||''}</span>`;
    item.addEventListener('click', () => loadSong(i, true));
    if (playlistEl) playlistEl.appendChild(item);
  });

  function updatePlaylistUI(idx) {
    document.querySelectorAll('.music-playlist-item').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });
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
    if (autoplay) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  function setPlaying(state) {
    isPlaying = state;
    if (playIcon)  playIcon.style.display  = state ? 'none'  : 'block';
    if (pauseIcon) pauseIcon.style.display = state ? 'block' : 'none';
    if (vinyl)     vinyl.classList.toggle('spinning', state);
    if (toggleBtn) toggleBtn.classList.toggle('playing', state);
  }

  function togglePlay() {
    if (isPlaying) {
      audio.pause(); setPlaying(false);
    } else {
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

  function openPanel()  { panel.classList.add('open'); panelOpen = true; }
  function closePanel() { panel.classList.remove('open'); panelOpen = false; }
  toggleBtn.addEventListener('click', () => panelOpen ? closePanel() : openPanel());
  if (panelClose) panelClose.addEventListener('click', closePanel);

  /* Load first song info */
  loadSong(0, false);

  /*
   * AUTOPLAY ON FIRST VISIT ONLY.
   * sessionStorage resets when the tab is closed — so:
   *   - First time the page opens in a new tab: tries to autoplay
   *   - Page reload (same tab): does NOT restart from top
   *   - New tab: starts fresh (sessionStorage is per-tab)
   * 
   * We use a flag to track "has this tab already tried to play".
   * If yes → skip autoplay on reload.
   * If no  → attempt autoplay (browsers may block it silently).
   */
  const alreadyPlayed = sessionStorage.getItem(SESSION_KEY);
  if (!alreadyPlayed) {
    /* Mark this session as "started" */
    sessionStorage.setItem(SESSION_KEY, '1');
    /* Attempt autoplay after a short delay (let page settle) */
    setTimeout(() => {
      audio.play()
        .then(() => { setPlaying(true); openPanel(); })
        .catch(() => {
          /* Browser blocked autoplay — silently wait for user interaction */
        });
    }, 800);
  }
})();


/* ════════════════════════════════════════
   HAMBURGER
════════════════════════════════════════ */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
if (hamburger) {
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
}


/* ════ ACTIVE NAV ON SCROLL ════ */
const sections   = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
const sectionObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navAnchors.forEach(a => a.classList.remove('active-link'));
      const m = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
      if (m) m.classList.add('active-link');
    }
  });
}, { rootMargin:'-40% 0px -55% 0px', threshold:0 });
sections.forEach(s => sectionObs.observe(s));


/* ════ SCROLL REVEAL ════ */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('revealed'); revealObs.unobserve(e.target); }
  });
}, { threshold:0.08 });
document.querySelectorAll('.section-header, .cluster-carousel, .chapter-text').forEach(el => {
  if (!el.classList.contains('reveal-hidden')) el.classList.add('reveal-hidden');
  revealObs.observe(el);
});
// Plan cards: only animate if not already visible
document.querySelectorAll('.plan-card').forEach(el => {
  el.classList.add('reveal-hidden');
  revealObs.observe(el);
});


/* ════ MY NOTE QUIZ ════ */
(function () {
  const quizWrap   = document.getElementById('noteQuizWrap');
  const letterWrap = document.getElementById('noteLetterWrap');
  const input      = document.getElementById('noteQuizInput');
  const submit     = document.getElementById('noteQuizSubmit');
  const wrongMsg   = document.getElementById('noteQuizWrong');
  const noteImg    = document.getElementById('noteImg');
  const notePh     = document.getElementById('notePlaceholder');
  if (!quizWrap || !letterWrap) return;

  // Accepted answers (case-insensitive, trimmed)
  const CORRECT = ['rewrite the stars'];

  // Handle letter image load/error
  if (noteImg) {
    noteImg.addEventListener('load',  () => { if (notePh) notePh.style.display = 'none'; });
    noteImg.addEventListener('error', () => { noteImg.style.display = 'none'; });
  }

  function checkAnswer() {
    const val = (input ? input.value : '').trim().toLowerCase();
    const ok  = CORRECT.some(a => val === a);
    if (ok) {
      // Correct — hide quiz, show letter
      quizWrap.style.opacity = '0';
      quizWrap.style.transition = 'opacity .4s ease';
      setTimeout(() => {
        quizWrap.style.display = 'none';
        letterWrap.style.display = 'block';
        letterWrap.classList.add('quiz-revealed');
        letterWrap.scrollIntoView({ behavior:'smooth', block:'center' });
      }, 420);
    } else {
      wrongMsg.classList.add('show');
      if (input) {
        input.style.borderColor = 'var(--rose-dark)';
        input.animate([
          {transform:'translateX(-5px)'},{transform:'translateX(5px)'},
          {transform:'translateX(-4px)'},{transform:'translateX(4px)'},
          {transform:'translateX(0)'}
        ], {duration:380});
      }
      setTimeout(() => {
        wrongMsg.classList.remove('show');
        if (input) input.style.borderColor = '';
      }, 1600);
    }
  }

  if (submit) submit.addEventListener('click', checkAnswer);
  if (input)  input.addEventListener('keydown', e => { if (e.key === 'Enter') checkAnswer(); });
})();


/* ════ NAVBAR SHADOW ════ */
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 10);
}, { passive:true });


/* ════════════════════════════════════════
   FLIP ENVELOPES — card flip on click
   No grid movement. Fixed height. Click once
   to reveal the letter, click again to flip back.
════════════════════════════════════════ */
document.querySelectorAll('.flip-envelope').forEach(env => {
  env.addEventListener('click', () => {
    env.classList.toggle('flipped');
  });
});


/* ════════════════════════════════════════
   LETTER BOOK — 3-page page-turn
   Page model:
     Page 1 front = letter-1.jpg   (page 1 of reading)
     Page 1 back  = letter-2.jpg   (page 2 of reading — revealed when leaf turns)
     Page 2 front = letter-3.jpg   (page 3 of reading — visible once page 1 turns)
     Page 2 back  = blank

   State machine:
     view=1 → show page 1 front  (reading page 1)
     view=2 → turn page1 leaf → show page 1 back  (reading page 2)
     view=3 → turn page2 leaf (z-index swap) → show page 2 front  (reading page 3)
════════════════════════════════════════ */
(function () {
  const page1   = document.getElementById('letterPage1');
  const page2   = document.getElementById('letterPage2');
  const prevBtn = document.getElementById('letterPrev');
  const nextBtn = document.getElementById('letterNext');
  const counter = document.getElementById('letterCounter');
  if (!page1 || !page2) return;

  let view = 1; // 1, 2, or 3
  const TOTAL = 3;

  function updateState() {
    // Page 1 leaf: turned when viewing pages 2 or 3
    if (view >= 2) {
      page1.classList.add('turned');
    } else {
      page1.classList.remove('turned');
    }

    // Page 2 z-index: bring to front when on page 3
    page1.style.zIndex = view <= 1 ? '2' : '1';
    page2.style.zIndex = view >= 2 ? '2' : '1';

    // Page 2 leaf: turned when viewing beyond page 3 (not possible, but consistent)
    if (view >= 4) {
      page2.classList.add('turned');
    } else {
      page2.classList.remove('turned');
    }

    if (counter) counter.textContent = `Page ${view} of ${TOTAL}`;
    if (prevBtn) prevBtn.disabled = view <= 1;
    if (nextBtn) nextBtn.disabled = view >= TOTAL;
  }

  if (prevBtn) prevBtn.addEventListener('click', () => {
    if (view > 1) { view--; updateState(); }
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    if (view < TOTAL) { view++; updateState(); }
  });

  updateState(); // initialise
})();

/* ════════════════════════════════════════
   IMAGE LIGHTBOX — Global full-screen viewer
   Opens when clicking any <img> that has a
   data-lightbox-src or is inside .flip-front,
   .proj-photo-wrap, .ask-photo-inner, etc.
════════════════════════════════════════ */
(function () {
  /* Build the lightbox DOM */
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

  const lbImg    = document.getElementById('lbImg');
  const lbCap    = document.getElementById('lbCaption');
  const lbClose  = document.getElementById('lbClose');
  const lbBack   = document.getElementById('lbBackdrop');
  const lbPrev   = document.getElementById('lbPrev');
  const lbNext   = document.getElementById('lbNext');

  /* Gallery context — for prev/next arrows */
  let galleryImages = [];
  let galleryIdx    = -1;

  function collectGallery(clickedImg) {
    /* Collect all visible images in the same folder-pane or section */
    const pane = clickedImg.closest('.folder-pane.active, .gallery-grid, section');
    if (!pane) return [];
    return Array.from(pane.querySelectorAll('img[src]:not([src=""])'))
      .filter(img => img.offsetParent !== null && img.src && !img.src.endsWith('#'));
  }

  function openLightbox(src, alt, gallery, idx) {
    lbImg.src  = src;
    lbImg.alt  = alt || '';
    lbCap.textContent = alt || '';
    galleryImages = gallery || [];
    galleryIdx    = idx ?? -1;

    const multi = galleryImages.length > 1;
    lbPrev.classList.toggle('hidden', !multi || galleryIdx <= 0);
    lbNext.classList.toggle('hidden', !multi || galleryIdx >= galleryImages.length - 1);

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
    const alt = img.closest('.flip-card')?.dataset.caption
             || img.closest('[data-caption]')?.dataset.caption
             || img.alt || '';
    galleryIdx = newIdx;
    lbImg.src  = img.src;
    lbImg.alt  = alt;
    lbCap.textContent = alt;
    lbPrev.classList.toggle('hidden', galleryIdx <= 0);
    lbNext.classList.toggle('hidden', galleryIdx >= galleryImages.length - 1);
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

  /* Touch swipe on lightbox */
  let ltx = 0;
  lbImg.addEventListener('touchstart', e => { ltx = e.touches[0].clientX; }, { passive: true });
  lbImg.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - ltx;
    if (Math.abs(dx) > 40) navigateLightbox(dx < 0 ? 1 : -1);
  });

  /* ── Attach to all images via delegation ──
     Listen on document for clicks on IMG elements inside:
     - .flip-front (gallery cards)
     - .proj-photo-wrap (before us timeline)
     - .ask-photo-inner (the question)
     - .answer-reveal-photo (the answer)
     - .lola-note-img (lola modal)
     - .letter-page-frame (letter pages)
  */
  const LIGHTBOX_SELECTORS = [
    '.flip-front img',
    '.proj-photo-wrap img',
    '.ask-photo-inner img',
    '.answer-reveal-photo img',
    '.lola-note-img',
    '.letter-page-frame img',
    '.plan-hover-img img',
  ].join(', ');

  document.addEventListener('click', e => {
    const img = e.target.closest('img');
    if (!img) return;
    if (!img.matches(LIGHTBOX_SELECTORS.split(', ').map(s => s.replace(' img', '')).join(', ') + ', ' + LIGHTBOX_SELECTORS)) {
      // Check manually
      const isTarget = img.closest('.flip-front, .proj-photo-wrap, .ask-photo-inner, .answer-reveal-photo, .lola-note-img, .letter-page-frame, .plan-hover-img');
      if (!isTarget) return;
    }

    /* Don't open if clicking a video button child */
    if (e.target.closest('.watch-video-btn, .proj-video-btn')) return;

    const src = img.src;
    if (!src || src.endsWith('#') || src === window.location.href) return;

    const alt = img.closest('.flip-card')?.dataset.caption
             || img.closest('[data-caption]')?.dataset.caption
             || img.alt || '';

    /* Build gallery from same context */
    const gallery = collectGallery(img);
    const idx = gallery.indexOf(img);

    openLightbox(src, alt, gallery, idx);
    e.stopPropagation();
  }, true); /* useCapture so we intercept before flip-card click */

  /* Expose for use by modal opener etc */
  window.openImgLightbox = openLightbox;
})();


/* ════════════════════════════════════════
   FIX: PHOTO MODAL — Use lightbox instead
   The old photo modal is replaced by the lightbox.
   We redirect the click handler.
════════════════════════════════════════ */
(function () {
  /* Override openPhotoModal to use new lightbox */
  const folderBodyEl = document.querySelector('.folder-body');
  if (!folderBodyEl) return;

  const isTouch = window.matchMedia('(hover: none)').matches;

  folderBodyEl.addEventListener('click', e => {
    const card = e.target.closest('.flip-card');
    if (!card) return;

    if (isTouch) {
      if (!card.classList.contains('flipped')) {
        /* First tap: flip to show story */
        card.classList.add('flipped');
        e.stopPropagation();
        return;
      }
      /* Second tap on back: open lightbox */
    }

    /* Desktop: open lightbox on any click */
    const imgEl = card.querySelector('.flip-front img');
    if (!imgEl || !imgEl.src || imgEl.src.endsWith('#')) return;

    const alt = card.dataset.caption || '';
    /* Collect all visible cards in same pane for gallery navigation */
    const pane = card.closest('.folder-pane');
    const allImgs = pane
      ? Array.from(pane.querySelectorAll('.flip-front img[src]')).filter(i => i.src && !i.src.endsWith('#'))
      : [imgEl];
    const idx = allImgs.indexOf(imgEl);
    window.openImgLightbox(imgEl.src, alt, allImgs, idx);
  });
})();


/* ════════════════════════════════════════
   FIX: MY NOTE LETTER — single page view
   Replace the page-turn book with a simple
   one-page-at-a-time slide transition.
════════════════════════════════════════ */
(function () {
  const wrap = document.getElementById('noteLetterWrap');
  if (!wrap) return;

  /* Rebuild the letter book HTML into simple slide pages */
  const book = document.getElementById('letterBook');
  if (!book) return;

  /* Collect existing pages data */
  const pages = [
    { img: 'assets/letter-1.jpg', alt: 'Letter page 1', tapes: true },
    { img: 'assets/letter-2.jpg', alt: 'Letter page 2', tapes: false },
    { img: 'assets/letter-3.jpg', alt: 'Letter page 3', tapes: false },
  ];

  /* Replace book HTML with slide-based structure */
  const viewport = document.createElement('div');
  viewport.className = 'letter-pages-viewport';
  viewport.style.position = 'relative';
  viewport.style.minHeight = '200px'; /* will stretch with content */

  pages.forEach((p, i) => {
    const slide = document.createElement('div');
    slide.className = 'letter-page-slide' + (i === 0 ? ' active' : '');
    slide.dataset.pageIdx = i;

    if (p.blank) {
      slide.innerHTML = `<div class="letter-page-frame" style="transform:none;">
        <div class="letter-page-blank"><span class="letter-blank-text">✦ with all my love ✦</span></div>
      </div>`;
    } else {
      const tapesHtml = p.tapes
        ? `<div class="letter-page-frame-tape letter-tape-tl"></div>
           <div class="letter-page-frame-tape letter-tape-tr"></div>` : '';
      slide.innerHTML = `<div class="letter-page-frame">
        ${tapesHtml}
        <img src="${p.img}" alt="${p.alt}" draggable="false">
      </div>`;
    }
    viewport.appendChild(slide);
  });

  book.parentNode.replaceChild(viewport, book);

  /* Wire nav buttons */
  const prevBtn = document.getElementById('letterPrev');
  const nextBtn = document.getElementById('letterNext');
  const counter = document.getElementById('letterCounter');
  const slides  = viewport.querySelectorAll('.letter-page-slide');
  const TOTAL   = slides.length;
  let cur = 0;

  function goTo(newIdx) {
    if (newIdx < 0 || newIdx >= TOTAL || newIdx === cur) return;
    const dir = newIdx > cur ? 1 : -1;
    slides[cur].classList.remove('active');
    slides[cur].style.transform = dir > 0 ? 'translateX(-40px)' : 'translateX(40px)';
    slides[cur].style.opacity = '0';
    slides[cur].style.position = 'absolute';
    slides[cur].style.inset = '0';

    cur = newIdx;
    slides[cur].style.transform = dir > 0 ? 'translateX(40px)' : 'translateX(-40px)';
    slides[cur].style.opacity = '0';
    slides[cur].style.position = 'relative';
    slides[cur].style.inset = '';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        slides[cur].style.transition = 'opacity .45s ease, transform .45s cubic-bezier(.22,1,.36,1)';
        slides[cur].style.transform = 'translateX(0)';
        slides[cur].style.opacity = '1';
        slides[cur].classList.add('active');
      });
    });

    if (counter) counter.textContent = `Page ${cur + 1} of ${TOTAL}`;
    if (prevBtn) prevBtn.disabled = cur <= 0;
    if (nextBtn) nextBtn.disabled = cur >= TOTAL - 1;
  }

  /* Init styles on all slides */
  slides.forEach((s, i) => {
    if (i !== 0) {
      s.style.position = 'absolute';
      s.style.inset = '0';
      s.style.opacity = '0';
    }
  });

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(cur - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(cur + 1));

  if (counter) counter.textContent = `Page 1 of ${TOTAL}`;
  if (prevBtn) prevBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = TOTAL <= 1;
})();

/* ════════════════════════════════════════
   SCRIPT PATCH — Jigs & Shan Anniversary
   Functional additions only — no content changes
════════════════════════════════════════ */

/* ════════════════════════════════════════
   HOW WE MET — Lightbox on image click
   Opens the lightbox when clicking any
   mini-photo inside the How We Met section.
════════════════════════════════════════ */
(function () {
  const howWeMet = document.getElementById('howWeMet');
  if (!howWeMet) return;

  /* Wait for main lightbox to be ready */
  function attachHowWeMetLightbox() {
    if (!window.openImgLightbox) {
      setTimeout(attachHowWeMetLightbox, 200);
      return;
    }

    howWeMet.addEventListener('click', function (e) {
      const img = e.target.closest('.mini-photo img') || (e.target.tagName === 'IMG' && e.target.closest('.mini-placeholder') ? e.target : null);
      if (!img) return;
      if (!img.src || img.src.endsWith('#') || img.src === window.location.href) return;

      /* Collect all images in this chapter's carousel for gallery navigation */
      const carousel = img.closest('.cluster-carousel');
      const allImgs = carousel
        ? Array.from(carousel.querySelectorAll('.mini-photo img[src]')).filter(i => i.src && !i.src.endsWith('#') && i.src !== window.location.href)
        : [img];
      const idx = allImgs.indexOf(img);

      const caption = '';
      window.openImgLightbox(img.src, caption, allImgs, idx);
      e.stopPropagation();
    }, true);
  }

  attachHowWeMetLightbox();
})();



/* ════════════════════════════════════════
   THE QUESTION — Auto-size text track
   Make the text panel container match the
   tallest panel so cards don't jump height.
════════════════════════════════════════ */
(function () {
  function sizeTextTrack() {
    const track = document.getElementById('askTextTrack');
    if (!track) return;
    const panels = track.querySelectorAll('.ask-text-panel');
    if (!panels.length) return;

    /* Temporarily make all panels static to measure */
    panels.forEach(p => {
      p.style.position = 'static';
      p.style.opacity  = '1';
      p.style.transform = 'none';
      p.style.display   = 'flex';
    });

    let max = 0;
    panels.forEach(p => { max = Math.max(max, p.offsetHeight); });

    /* Restore */
    panels.forEach(p => {
      p.style.position  = '';
      p.style.opacity   = '';
      p.style.transform = '';
      p.style.display   = '';
    });

    if (max > 0) track.style.minHeight = (max + 16) + 'px';
  }

  /* Run after images load */
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
})();


/* ════════════════════════════════════════
   MY NOTE LETTER — Single-page slide viewer
   Replace the page-turn book with a simple
   one-page-at-a-time slide transition.
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
  viewport.style.position = 'relative';
  viewport.style.minHeight = '200px';

  pages.forEach((p, i) => {
    const slide = document.createElement('div');
    slide.className = 'letter-page-slide' + (i === 0 ? ' active' : '');
    slide.dataset.pageIdx = i;

    const tapesHtml = p.tapes
      ? `<div class="letter-page-frame-tape letter-tape-tl"></div>
         <div class="letter-page-frame-tape letter-tape-tr"></div>` : '';

    slide.innerHTML = `<div class="letter-page-frame">
      ${tapesHtml}
      <img src="${p.img}" alt="${p.alt}" draggable="false">
    </div>`;

    viewport.appendChild(slide);
  });

  book.parentNode.replaceChild(viewport, book);

  const prevBtn = document.getElementById('letterPrev');
  const nextBtn = document.getElementById('letterNext');
  const counter = document.getElementById('letterCounter');
  const slides  = viewport.querySelectorAll('.letter-page-slide');
  const TOTAL   = slides.length;
  let cur = 0;

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

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        slides[cur].style.transition = 'opacity .45s ease, transform .45s cubic-bezier(.22,1,.36,1)';
        slides[cur].style.transform  = 'translateX(0)';
        slides[cur].style.opacity    = '1';
        slides[cur].classList.add('active');
      });
    });

    if (counter) counter.textContent = `Page ${cur + 1} of ${TOTAL}`;
    if (prevBtn) prevBtn.disabled = cur <= 0;
    if (nextBtn) nextBtn.disabled = cur >= TOTAL - 1;
  }

  /* Init non-active slides */
  slides.forEach((s, i) => {
    if (i !== 0) {
      s.style.position = 'absolute';
      s.style.inset    = '0';
      s.style.opacity  = '0';
    }
  });

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(cur - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(cur + 1));

  if (counter) counter.textContent = `Page 1 of ${TOTAL}`;
  if (prevBtn) prevBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = TOTAL <= 1;
})();

/* ════════════════════════════════════════
   SCRIPT PATCH — Jigs & Shan Anniversary
   Functional additions only — no content changes
════════════════════════════════════════ */

/* ════════════════════════════════════════
   AMBIENT BACKGROUND — Falling petals + stars
   Very subtle: low opacity, slow movement,
   pauses when tab is hidden to save CPU.
════════════════════════════════════════ */
(function () {
  /* ── Canvas setup ── */
  const canvas = document.createElement('canvas');
  canvas.id = 'ambientCanvas';
  document.body.insertBefore(canvas, document.body.firstChild);
  const ctx = canvas.getContext('2d');

  let W, H, dpr;
  function resize() {
    dpr    = Math.min(window.devicePixelRatio || 1, 2);
    W      = window.innerWidth;
    H      = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener('resize', () => { resize(); });

  /* ── Colour palette — drawn from site variables ── */
  const GOLD  = 'rgba(201,168,76,';
  const CREAM = 'rgba(253,246,238,';
  const ROSE  = 'rgba(212,128,138,';

  /* ══════════════════════════════════════
     STARS — twinkling dots in three sizes:
     tiny background field + mid sparkles +
     a handful of bright accent stars
  ══════════════════════════════════════ */

  function makeStar() {
    const tier = Math.random();
    return {
      x:     Math.random(),
      y:     Math.random(),
      /* three size tiers */
      r:     tier < 0.6
               ? Math.random() * 0.6 + 0.2          // tiny  (60%)
               : tier < 0.88
                 ? Math.random() * 0.9 + 0.7         // mid   (28%)
                 : Math.random() * 1.1 + 1.4,        // bright (12%)
      /* each star has its own rhythm */
      speed: Math.random() * 0.006 + 0.002,
      phase: Math.random() * Math.PI * 2,
      /* occasional rose-tinted stars */
      color: Math.random() < 0.12 ? ROSE
           : Math.random() < 0.5  ? GOLD
           : CREAM,
      /* base opacity band — dimmer for tiny, brighter for large */
      minA:  tier < 0.6 ? 0.04 : tier < 0.88 ? 0.08 : 0.18,
      maxA:  tier < 0.6 ? 0.28 : tier < 0.88 ? 0.50 : 0.80,
    };
  }

  const STAR_COUNT = 220;
  const stars = Array.from({ length: STAR_COUNT }, makeStar);

  /* ── Draw a star; brightest ones get a soft glow halo ── */
  function drawStar(s, t) {
    const x = s.x * W;
    const y = s.y * H;
    const progress = Math.sin(t * s.speed * 60 + s.phase) * 0.5 + 0.5;
    const a = s.minA + progress * (s.maxA - s.minA);

    /* Glow for larger stars */
    if (s.r > 1.4) {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, s.r * 3.5);
      grad.addColorStop(0,   s.color + (a * 0.7) + ')');
      grad.addColorStop(1,   s.color + '0)');
      ctx.beginPath();
      ctx.arc(x, y, s.r * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    /* Core dot */
    ctx.beginPath();
    ctx.arc(x, y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = s.color + a + ')';
    ctx.fill();
  }

  /* ── Animation loop ── */
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

/* ════════════════════════════════════════
   HOW WE MET — Lightbox on image click
   Opens the lightbox when clicking any
   mini-photo inside the How We Met section.
════════════════════════════════════════ */
(function () {
  const howWeMet = document.getElementById('howWeMet');
  if (!howWeMet) return;

  /* Wait for main lightbox to be ready */
  function attachHowWeMetLightbox() {
    if (!window.openImgLightbox) {
      setTimeout(attachHowWeMetLightbox, 200);
      return;
    }

    howWeMet.addEventListener('click', function (e) {
      const img = e.target.closest('.mini-photo img') || (e.target.tagName === 'IMG' && e.target.closest('.mini-placeholder') ? e.target : null);
      if (!img) return;
      if (!img.src || img.src.endsWith('#') || img.src === window.location.href) return;

      /* Collect all images in this chapter's carousel for gallery navigation */
      const carousel = img.closest('.cluster-carousel');
      const allImgs = carousel
        ? Array.from(carousel.querySelectorAll('.mini-photo img[src]')).filter(i => i.src && !i.src.endsWith('#') && i.src !== window.location.href)
        : [img];
      const idx = allImgs.indexOf(img);

      const caption = '';
      window.openImgLightbox(img.src, caption, allImgs, idx);
      e.stopPropagation();
    }, true);
  }

  attachHowWeMetLightbox();
})();


  
/* ════════════════════════════════════════
   THE QUESTION — Auto-size text track
   Make the text panel container match the
   tallest panel so cards don't jump height.
════════════════════════════════════════ */
(function () {
  function sizeTextTrack() {
    const track = document.getElementById('askTextTrack');
    if (!track) return;
    const panels = track.querySelectorAll('.ask-text-panel');
    if (!panels.length) return;

    /* Temporarily make all panels static to measure */
    panels.forEach(p => {
      p.style.position = 'static';
      p.style.opacity  = '1';
      p.style.transform = 'none';
      p.style.display   = 'flex';
    });

    let max = 0;
    panels.forEach(p => { max = Math.max(max, p.offsetHeight); });

    /* Restore */
    panels.forEach(p => {
      p.style.position  = '';
      p.style.opacity   = '';
      p.style.transform = '';
      p.style.display   = '';
    });

    if (max > 0) track.style.minHeight = (max + 16) + 'px';
  }

  /* Run after images load */
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
})();


/* ════════════════════════════════════════
   MY NOTE LETTER — Single-page slide viewer
   Replace the page-turn book with a simple
   one-page-at-a-time slide transition.
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
  viewport.style.position = 'relative';
  viewport.style.minHeight = '200px';

  pages.forEach((p, i) => {
    const slide = document.createElement('div');
    slide.className = 'letter-page-slide' + (i === 0 ? ' active' : '');
    slide.dataset.pageIdx = i;

    const tapesHtml = p.tapes
      ? `<div class="letter-page-frame-tape letter-tape-tl"></div>
         <div class="letter-page-frame-tape letter-tape-tr"></div>` : '';

    slide.innerHTML = `<div class="letter-page-frame">
      ${tapesHtml}
      <img src="${p.img}" alt="${p.alt}" draggable="false">
    </div>`;

    viewport.appendChild(slide);
  });

  book.parentNode.replaceChild(viewport, book);

  const prevBtn = document.getElementById('letterPrev');
  const nextBtn = document.getElementById('letterNext');
  const counter = document.getElementById('letterCounter');
  const slides  = viewport.querySelectorAll('.letter-page-slide');
  const TOTAL   = slides.length;
  let cur = 0;

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

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        slides[cur].style.transition = 'opacity .45s ease, transform .45s cubic-bezier(.22,1,.36,1)';
        slides[cur].style.transform  = 'translateX(0)';
        slides[cur].style.opacity    = '1';
        slides[cur].classList.add('active');
      });
    });

    if (counter) counter.textContent = `Page ${cur + 1} of ${TOTAL}`;
    if (prevBtn) prevBtn.disabled = cur <= 0;
    if (nextBtn) nextBtn.disabled = cur >= TOTAL - 1;
  }

  /* Init non-active slides */
  slides.forEach((s, i) => {
    if (i !== 0) {
      s.style.position = 'absolute';
      s.style.inset    = '0';
      s.style.opacity  = '0';
    }
  });

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(cur - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(cur + 1));

  if (counter) counter.textContent = `Page 1 of ${TOTAL}`;
  if (prevBtn) prevBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = TOTAL <= 1;
})();