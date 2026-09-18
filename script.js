(function(){
  "use strict";
  // always start at top on refresh/reload, instead of browser scroll restoration
  if('scrollRestoration' in history){ history.scrollRestoration = 'manual'; }
  window.scrollTo(0, 0);

  var root = document.documentElement;
  var toggle = document.getElementById('themeToggle');
  var STORAGE_KEY = 'nadet-theme';

  // loading screen
  var loader = document.getElementById('loader');
  var loaderStart = Date.now();
  var MIN_LOADER_MS = 1600;
  function hideLoader(){
    if(!loader) return;
    var elapsed = Date.now() - loaderStart;
    var wait = Math.max(0, MIN_LOADER_MS - elapsed);
    setTimeout(function(){
      loader.classList.add('hidden');
      loader.addEventListener('transitionend', function(){ loader.remove(); }, { once: true });
    }, wait);
  }
  if(document.readyState === 'complete'){ hideLoader(); }
  else{ window.addEventListener('load', hideLoader); }
  setTimeout(hideLoader, 3500); // safety net so it never gets stuck
  window.addEventListener('load', function(){ window.scrollTo(0, 0); });
  window.addEventListener('pageshow', function(e){ if(e.persisted){ window.scrollTo(0, 0); } });

  function applyTheme(t){
    if(t === 'light' || t === 'dark'){ root.setAttribute('data-theme', t); }
    else { root.removeAttribute('data-theme'); }
  }
  function currentEffectiveIsDark(){
    var explicit = root.getAttribute('data-theme');
    if(explicit === 'dark') return true;
    if(explicit === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  try{
    var saved = localStorage.getItem(STORAGE_KEY);
    if(saved){ applyTheme(saved); }
  }catch(e){ /* storage unavailable, fall back to system preference */ }

  toggle.addEventListener('click', function(){
    var next = currentEffectiveIsDark() ? 'light' : 'dark';
    applyTheme(next);
    try{ localStorage.setItem(STORAGE_KEY, next); }catch(e){}
    toggle.classList.remove('spin');
    void toggle.offsetWidth; // restart animation
    toggle.classList.add('spin');
  });

  // mobile nav
  var hamburger = document.getElementById('hamburger');
  var navLinks = document.getElementById('navLinks');
  hamburger.addEventListener('click', function(){
    var open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navLinks.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded','false');
    });
  });

  // scroll-spy
  var sections = ['home','about','skills','projects','contact'];
  var navA = document.querySelectorAll('.nav-link');

  // scroll progress bar
  var progress = document.createElement('div');
  progress.id = 'scrollProgress';
  document.body.appendChild(progress);

  function onScroll(){
    var pos = window.scrollY + 110;
    var current = sections[0];
    sections.forEach(function(id){
      var el = document.getElementById(id);
      if(el && el.offsetTop <= pos) current = id;
    });
    navA.forEach(function(a){
      a.classList.toggle('current', a.getAttribute('href') === '#' + current);
    });
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = pct + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // button ripple effect
  document.querySelectorAll('.btn').forEach(function(btn){
    btn.addEventListener('click', function(e){
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 1.4;
      var ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', function(){ ripple.remove(); });
    });
  });

  // id-card 3D tilt on pointer move
  var idCard = document.querySelector('.id-card');
  if(idCard && window.matchMedia('(hover:hover)').matches){
    idCard.addEventListener('mousemove', function(e){
      var rect = idCard.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      idCard.style.setProperty('--rx', (px * 10).toFixed(2) + 'deg');
      idCard.style.setProperty('--ry', (py * -10).toFixed(2) + 'deg');
    });
    idCard.addEventListener('mouseleave', function(){
      idCard.style.setProperty('--rx', '0deg');
      idCard.style.setProperty('--ry', '0deg');
    });
  }

  // animate skill percentages counting up alongside the bar fill
  var barRows = document.querySelectorAll('.bar-row');
  var countObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        var row = entry.target;
        var numEl = row.querySelector('.lbl span:last-child');
        var target = parseInt(row.querySelector('.bar-fill').getAttribute('data-w'), 10) || 0;
        if(numEl){
          var start = 0;
          var duration = 1100;
          var startTime = null;
          function step(ts){
            if(!startTime) startTime = ts;
            var t = Math.min((ts - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - t, 3);
            numEl.textContent = Math.round(start + (target - start) * eased) + '%';
            if(t < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        }
        countObserver.unobserve(row);
      }
    });
  }, { threshold: 0.4 });
  barRows.forEach(function(row){ countObserver.observe(row); });

  // skill bar reveal
  var bars = document.querySelectorAll('.bar-fill');
  var barsObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.style.width = entry.target.getAttribute('data-w') + '%';
        barsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  bars.forEach(function(b){ barsObserver.observe(b); });

  // scroll reveal for sections and cards
  var revealEls = document.querySelectorAll('.reveal');
  var revealObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(function(el){ revealObserver.observe(el); });
})();
