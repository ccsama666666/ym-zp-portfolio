/**
 * Portfolio v3 — Apple-style Interactions
 * Spring-animated lightbox, swipe gestures, scroll reveals, smooth filtering.
 */
(function () {
  'use strict';

  // ── Spring animation helper ──────────────────────────────────
  // CSS custom spring curve via keyframes (no JS animation lib needed)
  const SPRING = 'cubic-bezier(0.22, 0.98, 0.33, 1.01)';
  const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';

  // ── DOM refs ──────────────────────────────────────────────────
  const lb = document.getElementById('lb');
  const lbImg = document.getElementById('lbImg');
  const lbIdx = document.getElementById('lbIdx');
  const lbClose = document.getElementById('lbClose');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');

  // ── Lightbox State ───────────────────────────────────────────
  let items = [];
  let currentIdx = 0;
  let isOpen = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoved = false;

  // ── Build gallery from current visible items ──────────────────
  function gatherItems() {
    const links = document.querySelectorAll('.g-item:not(.hidden) .g-link');
    return Array.from(links);
  }

  // ── Open lightbox ────────────────────────────────────────────
  function open(idx) {
    if (isOpen) return;
    items = gatherItems();
    if (items.length === 0) return;
    currentIdx = Math.max(0, Math.min(idx, items.length - 1));
    isOpen = true;

    // Load image first
    const src = items[currentIdx].href;
    lbImg.src = src;
    lbImg.style.opacity = '0';
    lbImg.style.transform = 'scale(0.92)';
    lbImg.onload = () => {
      lbImg.style.opacity = '1';
      lbImg.style.transform = 'scale(1)';
    };

    // Show lightbox
    lb.classList.add('on');
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    updateCounter();

    // Focus trap
    lbClose.focus();
  }

  // ── Close lightbox ───────────────────────────────────────────
  function close() {
    if (!isOpen) return;
    isOpen = false;
    lbImg.style.opacity = '0';
    lbImg.style.transform = 'scale(0.95)';
    lb.classList.add('lb-closing');
    setTimeout(() => {
      lb.classList.remove('on', 'lb-closing');
      lbImg.src = '';
      lbImg.style.opacity = '';
      lbImg.style.transform = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }, 280);
  }

  // ── Navigate ─────────────────────────────────────────────────
  function goTo(idx) {
    if (!isOpen || items.length === 0) return;
    currentIdx = ((idx % items.length) + items.length) % items.length;

    // Crossfade: fade out → swap → fade in
    lbImg.style.transition = 'opacity 0.12s ease, transform 0.12s ease';
    lbImg.style.opacity = '0';
    lbImg.style.transform = idx > currentIdx ? 'translateX(20px)' : 'translateX(-20px)';

    setTimeout(() => {
      lbImg.src = items[currentIdx].href;
      lbImg.style.transition = 'opacity 0.3s ' + EASE_OUT + ', transform 0.35s ' + SPRING;
      lbImg.style.transform = 'translateX(0)';
      lbImg.style.opacity = '1';
      updateCounter();
    }, 120);
  }

  function next() { goTo(currentIdx + 1); }
  function prev() { goTo(currentIdx - 1); }

  function updateCounter() {
    lbIdx.textContent = (currentIdx + 1) + ' / ' + items.length;
  }

  // ── Click handlers ───────────────────────────────────────────
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.g-link');
    if (link && !isOpen) {
      e.preventDefault();
      const allLinks = gatherItems();
      const idx = allLinks.indexOf(link);
      if (idx >= 0) open(idx);
    }
  });

  lbClose.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });

  lbPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen) prev();
  });

  lbNext.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen) next();
  });

  // Click backdrop to close (only if not after a swipe)
  lb.addEventListener('click', (e) => {
    if (e.target === lb && !touchMoved) close();
    touchMoved = false;
  });

  // ── Keyboard ─────────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    switch (e.key) {
      case 'Escape': close(); break;
      case 'ArrowLeft': prev(); break;
      case 'ArrowRight': next(); break;
    }
  });

  // ── Touch: swipe + pinch (unified handler) ────────────────────
  let initialPinchDist = 0;
  let initialScale = 1;
  let swipeStartTime = 0;
  let swipeDeltaY = 0;
  let swipeDeltaX = 0;

  lb.addEventListener('touchstart', (e) => {
    if (e.target === lbPrev || e.target === lbNext || e.target === lbClose) return;
    if (e.touches.length === 2) {
      // Pinch start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDist = Math.hypot(dx, dy);
      const cs = parseFloat(lbImg.style.transform?.match(/scale\(([\d.]+)\)/)?.[1] || '1');
      initialScale = cs || 1;
    } else {
      // Swipe start
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchMoved = false;
      swipeStartTime = Date.now();
      swipeDeltaY = 0;
      swipeDeltaX = 0;
    }
  }, { passive: true });

  lb.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      swipeDeltaX = e.touches[0].clientX - touchStartX;
      swipeDeltaY = e.touches[0].clientY - touchStartY;
      if (Math.abs(swipeDeltaX) > 8 || Math.abs(swipeDeltaY) > 8) {
        touchMoved = true;
      }
    }
    if (e.touches.length === 2 && initialPinchDist > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = Math.min(3, Math.max(0.8, initialScale * (dist / initialPinchDist)));
      lbImg.style.transform = 'scale(' + scale + ')';
    }
  }, { passive: true });

  lb.addEventListener('touchend', () => {
    initialPinchDist = 0;
    // Snap back to scale 1 if < 1.2
    setTimeout(() => {
      const currentScale = parseFloat(lbImg.style.transform?.match(/scale\(([\d.]+)\)/)?.[1] || '1');
      if (currentScale && currentScale < 1.2) {
        lbImg.style.transform = 'scale(1)';
      }
    }, 100);

    // Swipe navigation: left/right to switch, down to close
    const elapsed = Date.now() - swipeStartTime;
    if (elapsed < 500 && touchMoved) {
      // Fast horizontal swipe → navigate
      if (Math.abs(swipeDeltaX) > 60 && Math.abs(swipeDeltaX) > Math.abs(swipeDeltaY) * 1.2) {
        if (swipeDeltaX < 0) next();
        else prev();
      }
      // Downward swipe → close
      else if (swipeDeltaY > 80 && Math.abs(swipeDeltaY) > Math.abs(swipeDeltaX) * 1.2) {
        close();
      }
    }
  });

  // Double-click/tap to zoom
  lb.addEventListener('dblclick', (e) => {
    if (!isOpen || e.target === lbPrev || e.target === lbNext) return;
    const scale = parseFloat(lbImg.style.transform?.match(/scale\(([\d.]+)\)/)?.[1] || '1');
    const newScale = scale > 1.2 ? 1 : 2;
    lbImg.style.transform = 'scale(' + newScale + ')';
    lbImg.style.transition = 'transform 0.35s ' + SPRING;
  });

  // Mouse wheel zoom (trackpad pinch)
  lb.addEventListener('wheel', (e) => {
    if (!isOpen || !e.ctrlKey) return;  // ctrl+scroll = zoom
    e.preventDefault();
    const scale = parseFloat(lbImg.style.transform?.match(/scale\(([\d.]+)\)/)?.[1] || '1');
    const newScale = Math.min(3, Math.max(0.5, scale - e.deltaY * 0.005));
    lbImg.style.transform = 'scale(' + newScale + ')';
    lbImg.style.transition = 'none';
  }, { passive: false });

  // ── Combined filters (category + device) ──────────────────────
  let curF = 'all';
  let curD = 'all';

  function updateFilters() {
    const items = document.querySelectorAll('.g-item');
    items.forEach((item) => {
      let show = true;
      if (curF !== 'all' && item.dataset.cat !== curF) show = false;
      if (curD !== 'all' && item.dataset.device !== curD) show = false;
      if (show) {
        item.classList.remove('hidden');
        // Staggered reveal
        item.style.animation = 'none';
        item.offsetHeight; // reflow
        item.style.animation = '';
      } else {
        item.classList.add('hidden');
      }
    });
    // Reset lightbox items on filter change
    if (isOpen) close();
  }

  // Category filter buttons
  document.querySelectorAll('.fb:not(.fb-dev)').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fb:not(.fb-dev)').forEach((b) => b.classList.remove('on'));
      btn.classList.add('on');
      curF = btn.dataset.f;
      updateFilters();
    });
  });

  // Device filter buttons
  document.querySelectorAll('.fb-dev').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fb-dev').forEach((b) => b.classList.remove('on'));
      btn.classList.add('on');
      curD = btn.dataset.d;
      updateFilters();
    });
  });

  // ── Scroll spy for nav ───────────────────────────────────────
  const secs = document.querySelectorAll('.sec');
  const nls = document.querySelectorAll('.nav-link[data-filter]');
  if (secs.length && nls.length) {
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          let cur = '';
          secs.forEach((s) => {
            if (window.scrollY >= s.offsetTop - 120) {
              cur = s.id.replace('sec-', '');
            }
          });
          nls.forEach((l) => l.classList.toggle('active', l.dataset.filter === cur));
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });
  }

  // ── Scroll-triggered image reveal + blur-up ───────────────────
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            // Blur-up: add loaded class to <img> inside
            const img = entry.target.querySelector('img');
            if (img) {
              img.classList.add('l-loaded');
            }
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '150px 0px', threshold: 0.03 }
    );

    document.querySelectorAll('.g-item').forEach((item, i) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(16px)';
      item.style.transition = 'opacity 0.5s ' + EASE_OUT + ' ' + (i % 10) * 0.03 + 's, transform 0.5s ' + SPRING + ' ' + (i % 10) * 0.03 + 's';
      revealObserver.observe(item);
    });
    requestAnimationFrame(() => {
      document.querySelectorAll('.g-item').forEach((item) => {
        const rect = item.getBoundingClientRect();
        if (rect.top < window.innerHeight + 150) {
          item.style.opacity = '1';
          item.style.transform = 'translateY(0)';
          const img = item.querySelector('img');
          if (img) img.classList.add('l-loaded');
        }
      });
    });
  }

  // ── Scroll-to-top button ────────────────────────────────────
  const scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) {
    let scrollTickingTop = false;
    window.addEventListener('scroll', () => {
      if (!scrollTickingTop) {
        requestAnimationFrame(() => {
          if (window.scrollY > 600) {
            scrollTopBtn.classList.add('visible');
          } else {
            scrollTopBtn.classList.remove('visible');
          }
          scrollTickingTop = false;
        });
        scrollTickingTop = true;
      }
    }, { passive: true });
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── Smooth nav scroll ────────────────────────────────────────
  document.querySelectorAll('.nav-link[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  console.log('Portfolio v3 — Apple-style interactions ready');
})();
