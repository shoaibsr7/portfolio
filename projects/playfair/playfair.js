/* Playfair cipher playground. Same algorithm as the Java version in github.com/shoaibsr7/playfair-cipher.
   Rules: 5x5 key square (I and J share a cell), split text into pairs, pad doubles and odd endings with X. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var ALPHA = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // no J

  function keySquare(key) {
    var seen = {}, out = [];
    (key.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '') + ALPHA).split('').forEach(function (c) {
      if (!seen[c]) { seen[c] = true; out.push(c); }
    });
    return out; // 25 letters, row-major
  }
  function pos(sq, c) { var i = sq.indexOf(c); return { r: Math.floor(i / 5), c: i % 5, i: i }; }
  function at(sq, r, c) { return sq[((r + 5) % 5) * 5 + ((c + 5) % 5)]; }

  /* Split plaintext into digraphs. Returns [{a,b,padded}] */
  function digraphs(text) {
    var s = text.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, ''), out = [], i = 0;
    while (i < s.length) {
      var a = s[i], b = s[i + 1];
      if (!b) { out.push({ a: a, b: a === 'X' ? 'Q' : 'X', pad: 'end' }); i += 1; }
      else if (a === b) { out.push({ a: a, b: a === 'X' ? 'Q' : 'X', pad: 'double' }); i += 1; }
      else { out.push({ a: a, b: b }); i += 2; }
    }
    return out;
  }
  function pairsForDecrypt(text) {
    var s = text.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, ''), out = [];
    if (s.length % 2) s += 'X';
    for (var i = 0; i < s.length; i += 2) out.push({ a: s[i], b: s[i + 1] === s[i] ? 'X' : s[i + 1] });
    return out;
  }

  function transform(sq, pair, dir) {
    var p = pos(sq, pair.a), q = pos(sq, pair.b), x, y, rule;
    if (p.r === q.r) { rule = 'row'; x = at(sq, p.r, p.c + dir); y = at(sq, q.r, q.c + dir); }
    else if (p.c === q.c) { rule = 'col'; x = at(sq, p.r + dir, p.c); y = at(sq, q.r + dir, q.c); }
    else { rule = 'rect'; x = at(sq, p.r, q.c); y = at(sq, q.r, p.c); }
    return { inA: pair.a, inB: pair.b, outA: x, outB: y, rule: rule, pad: pair.pad };
  }

  function run(text, key, mode) {
    var sq = keySquare(key), dir = mode === 'decrypt' ? -1 : 1;
    var pairs = mode === 'decrypt' ? pairsForDecrypt(text) : digraphs(text);
    return { sq: sq, steps: pairs.map(function (p) { return transform(sq, p, dir); }) };
  }

  /* ---------- UI ---------- */
  var keyIn = $('#key'), textIn = $('#text'), grid = $('#square'), pairsEl = $('#pairs'), outEl = $('#output'), explain = $('#explain');
  var modeBtns = document.querySelectorAll('[data-mode]'), mode = 'encrypt', result, active = -1, timer;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var RULES = {
    row: { name: 'Same row', text: 'Both letters are in the same <b>row</b>, so each one is replaced by the letter to its <b>RIGHT_LEFT</b> (wrapping around the edge).' },
    col: { name: 'Same column', text: 'Both letters are in the same <b>column</b>, so each one is replaced by the letter <b>BELOW_ABOVE</b> it (wrapping around).' },
    rect: { name: 'Rectangle', text: 'The letters form the corners of a <b>rectangle</b>, so each one is swapped for the corner in its own row on the other side.' }
  };

  function render() {
    result = run(textIn.value, keyIn.value, mode);
    var keyLetters = keySquare(keyIn.value).slice(0, new Set(keyIn.value.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '')).size);
    grid.innerHTML = result.sq.map(function (c, i) {
      return '<div class="cell' + (keyLetters.indexOf(c) > -1 ? ' key' : '') + '" data-i="' + i + '">' + (c === 'I' ? 'I/J' : c) + '</div>';
    }).join('');
    pairsEl.innerHTML = result.steps.map(function (s, i) {
      return '<button type="button" class="pair" data-i="' + i + '"><span class="in">' + s.inA + s.inB + '</span><span class="arrow">↓</span><span class="out">' + s.outA + s.outB + '</span>' + (s.pad ? '<span class="padnote">' + (s.pad === 'double' ? 'X splits a double' : 'X pads the end') + '</span>' : '') + '</button>';
    }).join('') || '<p class="dimtxt">Type a message above to see it split into pairs.</p>';
    var full = result.steps.map(function (s) { return s.outA + s.outB; }).join('');
    outEl.textContent = full.replace(/(.{2})/g, '$1 ').trim() || '—';
    active = -1; explain.innerHTML = 'Click any pair, or press <b>▶ Step through</b>, to see exactly how it was ' + (mode === 'encrypt' ? 'encrypted' : 'decrypted') + '.';
  }

  function show(i) {
    var s = result.steps[i]; if (!s) return;
    active = i;
    pairsEl.querySelectorAll('.pair').forEach(function (b) { b.classList.toggle('active', +b.dataset.i === i); });
    var cells = grid.querySelectorAll('.cell');
    cells.forEach(function (c) { c.className = c.className.replace(/\s?(src|dst|lane)\b/g, ''); });
    var p = pos(result.sq, s.inA), q = pos(result.sq, s.inB), x = pos(result.sq, s.outA), y = pos(result.sq, s.outB);
    // highlight the row/column/rectangle the rule uses
    cells.forEach(function (c) {
      var k = +c.dataset.i, r = Math.floor(k / 5), col = k % 5;
      if ((s.rule === 'row' && r === p.r) || (s.rule === 'col' && col === p.c) ||
          (s.rule === 'rect' && r >= Math.min(p.r, q.r) && r <= Math.max(p.r, q.r) && col >= Math.min(p.c, q.c) && col <= Math.max(p.c, q.c))) c.classList.add('lane');
    });
    cells[p.i].classList.add('src'); cells[q.i].classList.add('src');
    cells[x.i].classList.add('dst'); cells[y.i].classList.add('dst');
    var dirWord = mode === 'encrypt' ? ['right', 'below'] : ['left', 'above'];
    explain.innerHTML = '<span class="rule-tag">' + RULES[s.rule].name + '</span> <b class="mono">' + s.inA + s.inB + ' → ' + s.outA + s.outB + '</b><br>' +
      RULES[s.rule].text.replace('RIGHT_LEFT', dirWord[0]).replace('BELOW_ABOVE', dirWord[1]) +
      (s.pad === 'double' ? '<br><span class="dimtxt">A pair can\'t use the same letter twice, so an <b>X</b> was slipped in between.</span>' : '') +
      (s.pad === 'end' ? '<br><span class="dimtxt">The message had an odd number of letters, so an <b>X</b> was added to the end.</span>' : '');
  }

  function stepThrough() {
    clearInterval(timer);
    if (!result.steps.length) return;
    var i = 0; show(i);
    if (reduce) return;
    timer = setInterval(function () { i++; if (i >= result.steps.length) { clearInterval(timer); return; } show(i); }, 1500);
  }

  pairsEl.addEventListener('click', function (e) { var b = e.target.closest('.pair'); if (b) { clearInterval(timer); show(+b.dataset.i); } });
  $('#step').addEventListener('click', stepThrough);
  $('#swap').addEventListener('click', function () {
    var out = result.steps.map(function (s) { return s.outA + s.outB; }).join('');
    mode = mode === 'encrypt' ? 'decrypt' : 'encrypt'; setMode(mode); textIn.value = out; render();
  });
  $('#copy').addEventListener('click', function () {
    var b = this; navigator.clipboard && navigator.clipboard.writeText(outEl.textContent.replace(/\s/g, '')).then(function () { b.textContent = '✔ Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1400); });
  });
  function setMode(m) {
    mode = m; modeBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === m); });
    $('#text-label').textContent = m === 'encrypt' ? 'Message to encrypt' : 'Ciphertext to decrypt';
    $('#out-label').textContent = m === 'encrypt' ? 'Ciphertext' : 'Decrypted message';
  }
  modeBtns.forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); render(); }); });
  [keyIn, textIn].forEach(function (el) { el.addEventListener('input', function () { clearInterval(timer); render(); }); });
  document.addEventListener('keydown', function (e) {
    if (/input|textarea/i.test(document.activeElement.tagName) || !result.steps.length) return;
    if (e.key === 'ArrowRight') { clearInterval(timer); show(Math.min(result.steps.length - 1, active + 1)); }
    if (e.key === 'ArrowLeft') { clearInterval(timer); show(Math.max(0, active - 1)); }
  });

  // Expose for the self-test in the console: Playfair.run('HELLO', 'KEY', 'encrypt')
  window.Playfair = { run: run, keySquare: keySquare };
  setMode('encrypt'); render();
})();
