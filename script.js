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

  // ---------- grade checker (contact section) ----------
  var GRADE_API = 'http://class-grades-it.mywebcommunity.org/grades_api.php/';
  var gradeForm = document.getElementById('gradeForm');
  if(gradeForm){
    var gradeId = document.getElementById('gradeId');
    var gradeName = document.getElementById('gradeName');
    var gradeSubmit = document.getElementById('gradeSubmit');
    var gradeClear = document.getElementById('gradeClear');
    var gradeResult = document.getElementById('gradeResult');
    var gradeBusy = false;

    function prettyKey(k){
      return String(k).replace(/[_-]/g, ' ').trim().replace(/\b\w/g, function(c){ return c.toUpperCase(); });
    }
    function el(tag, cls, text){
      var n = document.createElement(tag);
      if(cls) n.className = cls;
      if(text !== undefined) n.textContent = text;
      return n;
    }
    // Build DOM from the API's JSON using textContent only (never innerHTML),
    // so nothing returned by the server can inject markup.
    function renderData(data, parent){
      if(Array.isArray(data)){
        data.forEach(function(item, i){
          if(item !== null && typeof item === 'object'){
            if(i) parent.appendChild(el('hr', 'grade-sep'));
            renderData(item, parent);
          } else {
            var li = el('div', 'grade-row');
            li.appendChild(el('span', 'grade-bullet', '\u2022'));
            li.appendChild(el('span', 'grade-v', String(item)));
            parent.appendChild(li);
          }
        });
      } else if(data !== null && typeof data === 'object'){
        Object.keys(data).forEach(function(k){
          var v = data[k];
          if(v !== null && typeof v === 'object'){
            parent.appendChild(el('div', 'grade-k grade-group', prettyKey(k)));
            var inner = el('div', 'grade-nested');
            renderData(v, inner);
            parent.appendChild(inner);
          } else {
            var row = el('div', 'grade-row');
            row.appendChild(el('span', 'grade-k', prettyKey(k)));
            row.appendChild(el('span', 'grade-v', v === null ? '\u2014' : String(v)));
            parent.appendChild(row);
          }
        });
      } else {
        parent.appendChild(el('div', 'grade-v', String(data)));
      }
    }
    function showResult(node){
      gradeResult.textContent = '';
      gradeResult.appendChild(node);
    }
    function showMuted(msg){ showResult(el('p', 'grade-muted', msg)); }
    function showError(msg, detail){
      var wrap = el('div', 'grade-error');
      wrap.appendChild(el('strong', null, msg));
      if(detail) wrap.appendChild(el('p', 'grade-muted', detail));
      showResult(wrap);
    }
    function setBusy(b){
      gradeBusy = b;
      gradeSubmit.disabled = b;
      gradeSubmit.classList.toggle('loading', b);
      gradeSubmit.textContent = b ? 'Checking\u2026' : 'Check Grade';
      gradeResult.setAttribute('aria-busy', b ? 'true' : 'false');
      if(b){
        var wait = el('div', 'grade-loading');
        wait.appendChild(el('span', 'grade-spin'));
        wait.appendChild(el('span', null, 'Fetching grade\u2026'));
        showResult(wait);
      }
    }

    gradeForm.addEventListener('submit', function(e){
      e.preventDefault();
      if(gradeBusy) return;
      var id = gradeId.value.trim();
      var last = gradeName.value.trim();
      if(!id || !last){
        showError('Missing information', 'Please enter both your ID number and last name.');
        (id ? gradeName : gradeId).focus();
        return;
      }

      // An https page can't call a plain-http API (mixed content), so upgrade when needed.
      var base = GRADE_API;
      if(location.protocol === 'https:') base = base.replace(/^http:/, 'https:');
      var url = base + '?' + new URLSearchParams({ id: id, lastName: last }).toString();

      setBusy(true);
      var ctrl = ('AbortController' in window) ? new AbortController() : null;
      var timer = setTimeout(function(){ if(ctrl) ctrl.abort(); }, 15000);

      fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
        .then(function(res){
          if(!res.ok) throw new Error('HTTP ' + res.status + (res.statusText ? ' ' + res.statusText : ''));
          return res.text();
        })
        .then(function(text){
          clearTimeout(timer);
          setBusy(false);
          var box = el('div', 'grade-data');
          var parsed;
          try{ parsed = JSON.parse(text); }catch(err){ parsed = undefined; }
          if(parsed === undefined){
            box.appendChild(el('div', 'grade-v', text.trim() || 'No data returned.'));
          } else {
            renderData(parsed, box);
          }
          showResult(box);
        })
        .catch(function(err){
          clearTimeout(timer);
          setBusy(false);
          var timedOut = err && err.name === 'AbortError';
          showError('Could not fetch grade.',
            timedOut ? 'The request timed out. Please try again.'
                     : 'The grades server could not be reached or blocked the request (' + (err && err.message ? err.message : 'network error') + ').');
        });
    });

    gradeClear.addEventListener('click', function(){
      if(gradeBusy) return;
      gradeId.value = '';
      gradeName.value = '';
      showMuted('Your grade will appear here.');
      gradeId.focus();
    });
  }
})();
