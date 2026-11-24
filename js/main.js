/* Shoaib Shakeel — portfolio interactions. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var year = $('#year'); if (year) year.textContent = new Date().getFullYear();

  /* ---------- Toast ---------- */
  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  /* ---------- Scroll progress + active nav ---------- */
  var root = document.documentElement;
  var navLinks = $$('.nav a[href^="#"]');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
  function onScroll() {
    var max = root.scrollHeight - innerHeight;
    root.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
    var current = null;
    sections.forEach(function (s) { if (s.getBoundingClientRect().top < innerHeight * 0.35) current = s.id; });
    navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + current); });
    fillTimeline();
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Cursor spotlight ---------- */
  if (fine && !reduce) {
    addEventListener('pointermove', function (e) {
      root.style.setProperty('--mx', e.clientX + 'px');
      root.style.setProperty('--my', e.clientY + 'px');
    }, { passive: true });
  }

  /* ---------- Reveal on scroll + counters ---------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0), suf = el.dataset.suffix || '';
    if (reduce) return;
    var t0 = performance.now(), dur = 1600;
    (function step(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = (target * e).toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        $$('[data-count]', en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Timeline fill ---------- */
  var tl = $('.timeline');
  function fillTimeline() {
    if (!tl) return;
    var r = tl.getBoundingClientRect(), mid = innerHeight * 0.6;
    var pct = Math.max(0, Math.min(100, ((mid - r.top) / r.height) * 100));
    tl.style.setProperty('--fill', pct + '%');
    $$('.timeline > li', tl).forEach(function (li) { li.classList.toggle('lit', li.getBoundingClientRect().top < mid); });
  }

  /* ---------- Typewriter ---------- */
  var typed = $('.typed');
  if (typed && !reduce) {
    var words = typed.dataset.words.split('|'), wi = 0, ci = words[0].length, del = true;
    setTimeout(function tick() {
      var w = words[wi];
      ci += del ? -1 : 1;
      typed.textContent = w.slice(0, ci);
      var wait = del ? 35 : 70;
      if (!del && ci === w.length) { del = true; wait = 1800; }
      else if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; wait = 300; }
      setTimeout(tick, wait);
    }, 2200);
  }

  /* ---------- Hero particle field ---------- */
  var cv = $('#field');
  if (cv) {
    var ctx = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
    var W, H, pts = [], mouse = { x: -9999, y: -9999, down: false }, running = true;
    var colors = ['124,92,255', '34,211,238', '255,79,163'];
    function size() {
      var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(140, (W * H) / 9000));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, r: Math.random() * 1.8 + .6, c: colors[i % 3] });
    }
    function burst(x, y) {
      pts.forEach(function (p) {
        var dx = p.x - x, dy = p.y - y, d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d < 260) { var f = (260 - d) / 260 * 9; p.vx += dx / d * f; p.vy += dy / d * f; }
      });
    }
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      var LINK = 120;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
        if (d2 < 200 * 200) { var d = Math.sqrt(d2) || 1; p.vx += dx / d * .06; p.vy += dy / d * .06; }
        p.vx *= .985; p.vy *= .985;
        p.vx += (Math.random() - .5) * .02; p.vy += (Math.random() - .5) * .02;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) { p.x = 0; p.vx *= -1; } if (p.x > W) { p.x = W; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; } if (p.y > H) { p.y = H; p.vy *= -1; }
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], ex = p.x - q.x, ey = p.y - q.y, e2 = ex * ex + ey * ey;
          if (e2 < LINK * LINK) {
            ctx.strokeStyle = 'rgba(' + p.c + ',' + (1 - Math.sqrt(e2) / LINK) * .35 + ')';
            ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        if (d2 < 160 * 160) {
          ctx.strokeStyle = 'rgba(34,211,238,' + (1 - Math.sqrt(d2) / 160) * .6 + ')';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(' + p.c + ',.9)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    size();
    addEventListener('resize', size);
    var hero = cv.parentElement;
    hero.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
    hero.addEventListener('click', function (e) { if (e.target.closest('a,button')) return; var r = cv.getBoundingClientRect(); burst(e.clientX - r.left, e.clientY - r.top); });
    if (reduce) {
      frame(); running = false; // draw one still frame
    } else {
      new IntersectionObserver(function (en) { var was = running; running = en[0].isIntersecting; if (running && !was) frame(); }).observe(cv);
      frame();
    }
  }

  /* ---------- 3D tilt + glare ---------- */
  if (fine && !reduce) {
    $$('.tilt').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.transform = 'rotateX(' + ((.5 - y) * 10) + 'deg) rotateY(' + ((x - .5) * 12) + 'deg) translateZ(0)';
        card.style.setProperty('--gx', x * 100 + '%'); card.style.setProperty('--gy', y * 100 + '%');
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });

    /* Magnetic buttons */
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * .25 + 'px,' + (e.clientY - r.top - r.height / 2) * .35 + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- Project filter ---------- */
  var filterBtns = $$('.filter button');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.dataset.filter;
      filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', b === btn); });
      $$('#projects .card').forEach(function (c) {
        var show = f === 'all' || (' ' + c.dataset.cat + ' ').indexOf(' ' + f + ' ') > -1;
        c.classList.toggle('hidden-by-filter', !show);
        if (show) c.classList.add('in');
      });
    });
  });

  /* ---------- Skills ↔ experience/projects highlight ---------- */
  var tip = $('.skill-tip');
  var targets = $$('.job[data-tech], #projects .card[data-tech]');
  function where(skill) {
    return targets.filter(function (t) { return (' ' + t.dataset.tech + ' ').indexOf(' ' + skill + ' ') > -1; });
  }
  function showSkill(li) {
    var s = li.textContent.trim(), hits = where(s);
    $$('.skill-group li').forEach(function (x) { x.classList.toggle('on', x === li); });
    if (!tip) return;
    if (!hits.length) { tip.innerHTML = '<b>' + s + '</b>: used in coursework and side projects.'; return; }
    var names = hits.map(function (h) { var t = $('h3', h).textContent; var o = $('.org', h); return o ? o.textContent.split('·')[0].trim() : t; });
    tip.innerHTML = '<b>' + s + '</b> → ' + names.join(' · ');
  }
  $$('.skill-group li').forEach(function (li) {
    li.addEventListener('mouseenter', function () { showSkill(li); });
    li.addEventListener('focus', function () { showSkill(li); });
    li.addEventListener('click', function () {
      showSkill(li);
      var hits = where(li.textContent.trim());
      targets.forEach(function (t) { t.classList.toggle('match', hits.indexOf(t) > -1); });
      if (hits[0]) { hits[0].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); setTimeout(function () { targets.forEach(function (t) { t.classList.remove('match'); }); }, 2600); }
    });
    li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); } });
  });

  /* ---------- Pizza rain (easter egg) ---------- */
  var cf = $('#confetti');
  function pizzaRain(emoji) {
    if (!cf || reduce) { toast('🍕🍕🍕'); return; }
    var c = cf.getContext('2d'); cf.width = innerWidth; cf.height = innerHeight;
    var items = [], set = emoji || ['🍕', '🍕', '🧀', '🍅', '🌶️'];
    for (var i = 0; i < 90; i++) items.push({ x: Math.random() * innerWidth, y: -Math.random() * innerHeight, v: 2 + Math.random() * 4, r: Math.random() * 6, s: 20 + Math.random() * 22, e: set[i % set.length] });
    var t0 = performance.now();
    (function f(t) {
      c.clearRect(0, 0, cf.width, cf.height);
      items.forEach(function (p) { p.y += p.v; p.r += .03; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.font = p.s + 'px serif'; c.fillText(p.e, -p.s / 2, p.s / 2); c.restore(); });
      if (t - t0 < 4500) requestAnimationFrame(f); else c.clearRect(0, 0, cf.width, cf.height);
    })(t0);
  }
  var konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], kp = 0;
  addEventListener('keydown', function (e) {
    kp = (e.key === konami[kp] || e.key.toLowerCase() === konami[kp]) ? kp + 1 : (e.key === konami[0] ? 1 : 0);
    if (kp === konami.length) { kp = 0; pizzaRain(); toast('🍕 Konami code unlocked: free pizza for everyone!'); }
  });

  /* ---------- Terminal ---------- */
  var tin = $('#term-in'), tout = $('#term-out'), tbody = $('#term-body');
  var hist = [], hi = 0;
  function line(html, cls) { var d = document.createElement('div'); d.className = 'line ' + (cls || ''); d.innerHTML = html; tout.appendChild(d); }
  var cmds = {
    help: function () { /* defined below */ },
    whoami: function () { line('<span class="vio">Shoaib Shakeel</span>, software developer @ Fisheries and Oceans Canada. Ex-2K Games (PGA 2K25). Dalhousie CS \'24.'); },
    about: function () { line('I build web apps for scientists, automate cloud infrastructure, and have shipped games to consoles and app stores.\nBased in Halifax, NS 🇨🇦'); },
    experience: function () {
      [['2024–now', 'Fisheries and Oceans Canada', 'Computer Systems Developer'], ['2023', '2K Games', 'Software Engineer co-op (PGA 2K25)'], ['2023–24', 'Resilience Research Centre', 'Web Developer'], ['2023', 'InnovaSea', 'Full Stack / DevOps co-op'], ['2022', 'STEMWorld Education', 'Software Developer co-op']]
        .forEach(function (r) { line('<span class="acc">' + r[0].padEnd(10) + '</span><span class="cmd">' + r[1] + '</span> · ' + r[2]); });
    },
    projects: function () {
      line('<span class="cmd">pizza-bot</span>      chatbot on Amazon Lex   → <span class="ok">open pizza</span>');
      line('<span class="cmd">acl-simulator</span>  router ACL playground   → <span class="ok">open acl</span>');
      line('<span class="cmd">playfair</span>       cipher playground        → <span class="ok">open cipher</span>');
      line('<span class="cmd">aws-tagging</span>    Boto3 cost-tag scripts');
      line('<span class="cmd">genai-model</span>    model on Hugging Face');
    },
    skills: function () {
      line('<span class="acc">langs  </span> Python · JavaScript · Java · C# · C/C++ · Go · SQL · Bash');
      line('<span class="acc">web    </span> Angular · Vue · Nuxt · React · Spring Boot');
      line('<span class="acc">cloud  </span> AWS · Azure · GCP · Terraform · Ansible · Grafana');
      line('<span class="acc">games  </span> Unity · C#');
    },
    contact: function () { line('LinkedIn → <a href="https://www.linkedin.com/in/shoaibsr" target="_blank" rel="noopener">linkedin.com/in/shoaibsr</a>\nGitHub   → <a href="https://github.com/shoaibsr7" target="_blank" rel="noopener">github.com/shoaibsr7</a>'); },
    open: function (a) {
      var map = { github: 'https://github.com/shoaibsr7', linkedin: 'https://www.linkedin.com/in/shoaibsr', pizza: '/projects/pizza-bot/index.html', acl: '/projects/acl/index.html', cipher: '/projects/playfair/index.html', playfair: '/projects/playfair/index.html' };
      if (!map[a]) return line('usage: open &lt;github|linkedin|pizza|acl|cipher&gt;', 'pink');
      line('opening ' + a + '…', 'ok'); setTimeout(function () { map[a][0] === '/' ? (location.href = map[a]) : window.open(map[a], '_blank', 'noopener'); }, 300);
    },
    goto: function (a) { var s = $('#' + a); if (!s) return line('no such section. try: about, experience, projects, skills, contact', 'pink'); s.scrollIntoView({ behavior: 'smooth' }); },
    sudo: function (a) {
      if (/hire/.test(a)) { line('[sudo] password for guest: ********', ''); line('✔ Permission granted. Excellent decision.', 'ok'); line('Next step → <a href="https://www.linkedin.com/in/shoaibsr" target="_blank" rel="noopener">message Shoaib on LinkedIn</a> 🚀'); pizzaRain(['🎉', '🚀', '✨', '💜']); }
      else line('guest is not in the sudoers file. This incident will be reported. 👀', 'pink');
    },
    pizza: function () { line('🍕 Ordering pizza… delivered via Amazon Lex (sort of).', 'ok'); pizzaRain(); },
    matrix: function () { matrix(); line('Wake up, Neo… (click anywhere to exit)', 'ok'); },
    ls: function () { line('about.txt  experience/  projects/  skills.json  <span class="acc">secret.txt</span>'); },
    cat: function (a) { line(a === 'secret.txt' ? 'There is no secret. But you could try the Konami code. 😉' : 'cat: ' + (a || '') + ': try `ls` first', a === 'secret.txt' ? 'vio' : 'pink'); },
    echo: function (a) { line(a.replace(/</g, '&lt;')); },
    date: function () { line(new Date().toString()); },
    clear: function () { tout.innerHTML = ''; },
    exit: function () { line('there is no escape. 🙂 (just scroll)', 'pink'); },
    rm: function () { line('nice try. 🙂', 'pink'); }
  };
  function run(raw) {
    var input = raw.trim(); if (!input) return;
    hist.push(input); hi = hist.length;
    line('<span class="ok">guest@shoaib:~$</span> <span class="cmd">' + input.replace(/</g, '&lt;') + '</span>');
    var parts = input.split(/\s+/), name = parts.shift().toLowerCase(), args = parts.join(' ');
    if (cmds[name]) cmds[name](args.toLowerCase());
    else line('command not found: ' + name.replace(/</g, '&lt;') + '. Type <span class="ok">help</span>', 'pink');
    tbody.scrollTop = tbody.scrollHeight;
  }
  if (tin) {
    line('<span class="vio">Welcome to shoaib.sh v2.0</span>. Type <span class="ok">help</span> to see what you can do.');
    tin.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { run(tin.value); tin.value = ''; }
      else if (e.key === 'ArrowUp') { if (hi > 0) { hi--; tin.value = hist[hi]; } e.preventDefault(); }
      else if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); tin.value = hist[hi] || ''; e.preventDefault(); }
      else if (e.key === 'Tab') {
        e.preventDefault(); var v = tin.value.toLowerCase();
        var m = Object.keys(cmds).filter(function (k) { return k.indexOf(v) === 0; });
        if (m.length === 1) tin.value = m[0] + ' '; else if (m.length) line(m.join('  '));
      }
      else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); cmds.clear(); }
      e.stopPropagation();
    });
    tbody.addEventListener('click', function (e) { if (!e.target.closest('a') && !getSelection().toString()) tin.focus({ preventScroll: true }); });
    $$('.term-suggest button').forEach(function (b) { b.addEventListener('click', function () { run(b.dataset.cmd); tin.focus({ preventScroll: true }); }); });
  }
  cmds.help = function () {
    line('<span class="acc">Available commands</span>');
    [['whoami', 'who is this guy?'], ['about', 'the short version'], ['experience', 'where I have worked'], ['projects', 'things I have built'], ['skills', 'languages and tools'], ['contact', 'how to reach me'], ['open <name>', 'github, linkedin, pizza, acl, cipher'], ['goto <section>', 'scroll to a section'], ['pizza', 'you will see'], ['matrix', 'enter the matrix'], ['ls / cat', 'look around'], ['clear', 'clean the screen']]
      .forEach(function (c) { line('  <span class="ok">' + (c[0] + '                ').slice(0, 16).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>' + c[1]); });
    line('Tip: Tab autocompletes, ↑/↓ cycles through your history.', 'vio');
  };

  /* ---------- Matrix rain ---------- */
  function matrix() {
    if (!cf) return;
    var c = cf.getContext('2d'); cf.width = innerWidth; cf.height = innerHeight; cf.style.pointerEvents = 'auto';
    var fs = 16, cols = Math.ceil(innerWidth / fs), drops = Array(cols).fill(0).map(function () { return Math.random() * -50; });
    var chars = 'アイウエオカキクケコサシスセソ01SHOAIB<>{}=+*', alive = true;
    function stop() { alive = false; cf.style.pointerEvents = 'none'; c.clearRect(0, 0, cf.width, cf.height); cf.removeEventListener('click', stop); }
    cf.addEventListener('click', stop);
    setTimeout(stop, reduce ? 10 : 8000);
    (function f() {
      if (!alive) return;
      c.fillStyle = 'rgba(7,7,13,.12)'; c.fillRect(0, 0, cf.width, cf.height);
      c.font = fs + 'px JetBrains Mono, monospace';
      drops.forEach(function (y, i) {
        c.fillStyle = Math.random() > .97 ? '#fff' : (i % 3 ? '#22d3ee' : '#7c5cff');
        c.fillText(chars[Math.floor(Math.random() * chars.length)], i * fs, y * fs);
        drops[i] = (y * fs > cf.height && Math.random() > .975) ? 0 : y + 1;
      });
      requestAnimationFrame(f);
    })();
  }

  /* ---------- Command palette ---------- */
  var pal = $('#palette'), pin = $('#palette-in'), plist = $('#palette-list'), sel = 0, shown = [];
  var actions = [
    { i: '👋', t: 'Go to About', h: 'section', run: function () { go('#about'); } },
    { i: '💼', t: 'Go to Experience', h: 'section', run: function () { go('#experience'); } },
    { i: '🧩', t: 'Go to Projects', h: 'section', run: function () { go('#projects'); } },
    { i: '🧰', t: 'Go to Skills', h: 'section', run: function () { go('#skills'); } },
    { i: '⌨️', t: 'Open the terminal', h: 'section', run: function () { go('#terminal'); setTimeout(function () { tin && tin.focus({ preventScroll: true }); }, 500); } },
    { i: '✉️', t: 'Contact', h: 'section', run: function () { go('#contact'); } },
    { i: '🍕', t: 'Pizza Bot case study', h: 'project', run: function () { location.href = '/projects/pizza-bot/index.html'; } },
    { i: '🛡️', t: 'ACL Simulator playground', h: 'project', run: function () { location.href = '/projects/acl/index.html'; } },
    { i: '🔐', t: 'Playfair Cipher playground', h: 'project', run: function () { location.href = '/projects/playfair/index.html'; } },
    { i: '🐙', t: 'Open GitHub', h: 'link', run: function () { window.open('https://github.com/shoaibsr7', '_blank', 'noopener'); } },
    { i: '💼', t: 'Open LinkedIn', h: 'link', run: function () { window.open('https://www.linkedin.com/in/shoaibsr', '_blank', 'noopener'); } },
    { i: '🔗', t: 'Copy link to this site', h: 'action', run: function () { navigator.clipboard && navigator.clipboard.writeText(location.origin + '/').then(function () { toast('Link copied ✔'); }); } },
    { i: '🎉', t: 'Make it rain pizza', h: 'fun', run: function () { pizzaRain(); } },
    { i: '🟩', t: 'Enter the Matrix', h: 'fun', run: function () { matrix(); toast('Click anywhere to exit the Matrix'); } }
  ];
  function go(sel) { var s = $(sel); s && s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
  function render() {
    var q = pin.value.toLowerCase().trim();
    shown = actions.filter(function (a) { return !q || (a.t + ' ' + a.h).toLowerCase().indexOf(q) > -1; });
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    plist.innerHTML = shown.length ? shown.map(function (a, i) {
      return '<li role="option" data-i="' + i + '" aria-selected="' + (i === sel) + '"><span class="ico">' + a.i + '</span>' + a.t + '<span class="hint">' + a.h + '</span></li>';
    }).join('') : '<div class="empty">No matches. Try "projects" or "pizza".</div>';
  }
  function openPal() { pal.classList.add('open'); pin.value = ''; sel = 0; render(); setTimeout(function () { pin.focus(); }, 10); }
  function closePal() { pal.classList.remove('open'); }
  function choose(i) { var a = shown[i]; closePal(); a && a.run(); }
  if (pal) {
    $('#open-palette').addEventListener('click', openPal);
    addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.classList.contains('open') ? closePal() : openPal(); }
      else if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); openPal(); }
      else if (e.key === 'Escape') closePal();
    });
    pin.addEventListener('input', function () { sel = 0; render(); });
    pin.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { sel = (sel + 1) % Math.max(1, shown.length); render(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = (sel - 1 + shown.length) % Math.max(1, shown.length); render(); e.preventDefault(); }
      else if (e.key === 'Enter') { choose(sel); }
    });
    plist.addEventListener('click', function (e) { var li = e.target.closest('li'); if (li) choose(+li.dataset.i); });
    pal.addEventListener('click', function (e) { if (e.target === pal) closePal(); });
    if (!/Mac|iPhone|iPad/.test(navigator.platform)) { var k = $('#open-palette'); if (k) k.textContent = 'Ctrl K'; $$('.site-footer kbd').forEach(function (x) { x.textContent = 'Ctrl K'; }); }
  }

  onScroll();
  console.log('%c👋 Hey, fellow dev!', 'font-size:18px;font-weight:bold;color:#7c5cff', '\nLike digging around? So do I. Let\'s talk: https://www.linkedin.com/in/shoaibsr');
})();
