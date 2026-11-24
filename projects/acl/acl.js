/* ACL Simulator — evaluates Cisco-style standard and extended access lists against packets.
   Same rules as the Java version in github.com/shoaibsr7/acl-simulator. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  /* ---------- IP helpers ---------- */
  function ipToInt(ip) {
    var p = ip.split('.');
    if (p.length !== 4 || p.some(function (x) { return !/^\d{1,3}$/.test(x) || +x > 255; })) throw new Error('"' + ip + '" is not a valid IPv4 address');
    return ((+p[0] << 24) >>> 0) + (+p[1] << 16) + (+p[2] << 8) + (+p[3]);
  }
  // Cisco wildcard: 0 bits must match, 1 bits are ignored.
  function matchIp(ip, addr) { return addr.any || (((ip ^ addr.ip) & ~addr.wc) >>> 0) === 0; }

  /* Parse an address spec starting at tokens[i]. Returns {addr, next}. */
  function parseAddr(t, i) {
    if (t[i] === 'any') return { addr: { any: true, text: 'any' }, next: i + 1 };
    if (t[i] === 'host') return { addr: { ip: ipToInt(t[i + 1]), wc: 0, text: 'host ' + t[i + 1] }, next: i + 2 };
    var wc = t[i + 1] && /^\d+\.\d+\.\d+\.\d+$/.test(t[i + 1]) ? t[i + 1] : '0.0.0.0';
    return { addr: { ip: ipToInt(t[i]), wc: ipToInt(wc), text: t[i] + ' ' + wc }, next: wc === t[i + 1] ? i + 2 : i + 1 };
  }

  var PORTS = { ftp: 21, ssh: 22, telnet: 23, smtp: 25, dns: 53, domain: 53, www: 80, http: 80, pop3: 110, https: 443 };
  function parsePort(x) {
    if (x == null) throw new Error('missing port after "eq"');
    if (PORTS[x] != null) return PORTS[x];
    if (!/^\d+$/.test(x) || +x > 65535) throw new Error('"' + x + '" is not a valid port');
    return +x;
  }

  /* ---------- Parse the ACL text ---------- */
  function parseAcl(text) {
    var rules = [], errors = [];
    text.split('\n').forEach(function (raw, n) {
      var lineText = raw.replace(/!.*$/, '').trim();
      if (!lineText) return;
      try {
        var t = lineText.toLowerCase().split(/\s+/);
        if (t[0] !== 'access-list') throw new Error('lines must start with "access-list"');
        var num = +t[1];
        if (!(num >= 1 && num <= 199)) throw new Error('list number must be 1–99 (standard) or 100–199 (extended)');
        var action = t[2];
        if (action !== 'permit' && action !== 'deny') throw new Error('action must be "permit" or "deny"');
        var rule = { line: n, num: num, action: action, raw: raw.trim(), extended: num >= 100 };
        if (!rule.extended) {
          rule.src = parseAddr(t, 3).addr;
        } else {
          rule.proto = t[3];
          if (['ip', 'tcp', 'udp', 'icmp'].indexOf(rule.proto) < 0) throw new Error('protocol must be ip, tcp, udp or icmp');
          var s = parseAddr(t, 4); rule.src = s.addr;
          var d = parseAddr(t, s.next); rule.dst = d.addr;
          if (t[d.next] === 'eq') rule.port = parsePort(t[d.next + 1]);
          else if (t[d.next] && t[d.next] !== 'log') throw new Error('unexpected "' + t[d.next] + '" (only "eq <port>" is supported)');
        }
        rules.push(rule);
      } catch (e) { errors.push('Line ' + (n + 1) + ': ' + e.message); }
    });
    return { rules: rules, errors: errors };
  }

  /* ---------- Parse packets ---------- */
  function parsePackets(text) {
    var packets = [], errors = [];
    text.split('\n').forEach(function (raw, n) {
      var l = raw.replace(/#.*$/, '').trim(); if (!l) return;
      try {
        var t = l.toLowerCase().split(/\s+/);
        var p = { raw: l, src: ipToInt(t[0]), srcText: t[0] };
        if (t[1]) { p.dst = ipToInt(t[1]); p.dstText = t[1]; }
        if (t[2]) { p.proto = /^\d+$/.test(t[2]) ? 'tcp' : t[2]; p.port = /^\d+$/.test(t[2]) ? +t[2] : (t[3] ? parsePort(t[3]) : undefined); }
        packets.push(p);
      } catch (e) { errors.push('Packet line ' + (n + 1) + ': ' + e.message); }
    });
    return { packets: packets, errors: errors };
  }

  /* ---------- Evaluate (first match wins, implicit deny) ---------- */
  function evaluate(rules, pkt, listNum) {
    var list = rules.filter(function (r) { return r.num === listNum; });
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (!matchIp(pkt.src, r.src)) continue;
      if (r.extended) {
        if (pkt.dst == null || !matchIp(pkt.dst, r.dst)) continue;
        if (r.proto !== 'ip' && pkt.proto && r.proto !== pkt.proto) continue;
        if (r.port != null && pkt.port !== r.port) continue;
      }
      return { action: r.action, rule: r };
    }
    return { action: 'deny', rule: null };
  }

  /* ---------- Presets ---------- */
  var PRESETS = {
    standard: {
      acl: '! Standard ACL: filters on SOURCE address only\naccess-list 10 deny   host 172.16.4.13\naccess-list 10 deny   172.16.3.0 0.0.0.255\naccess-list 10 permit 172.16.0.0 0.0.255.255\n! everything else hits the implicit "deny any"',
      packets: '172.16.4.13\n172.16.3.77\n172.16.9.1\n10.0.0.5\n172.16.200.200'
    },
    extended: {
      acl: '! Extended ACL: source, destination, protocol and port\naccess-list 101 permit tcp 10.0.0.0 0.0.0.255 192.168.1.10 0.0.0.0 eq 80\naccess-list 101 permit tcp any host 192.168.1.10 eq 443\naccess-list 101 deny   tcp any any eq telnet\naccess-list 101 permit udp 10.0.0.0 0.0.255.255 any eq 53\naccess-list 101 deny   ip  any any',
      packets: '# src           dst            proto port\n10.0.0.7       192.168.1.10   tcp   80\n10.0.5.7       192.168.1.10   tcp   80\n8.8.8.8        192.168.1.10   tcp   443\n10.0.0.7       192.168.1.20   tcp   23\n10.0.44.2      1.1.1.1        udp   53\n10.0.44.2      1.1.1.1        udp   123'
    },
    office: {
      acl: '! Protect the server subnet: web + SSH from IT only\naccess-list 150 permit tcp any 10.10.0.0 0.0.0.255 eq https\naccess-list 150 permit tcp 10.20.5.0 0.0.0.255 10.10.0.0 0.0.0.255 eq ssh\naccess-list 150 deny   tcp any 10.10.0.0 0.0.0.255 eq ssh\naccess-list 150 permit ip  any any',
      packets: '203.0.113.9    10.10.0.25     tcp   443\n10.20.5.14     10.10.0.25     tcp   22\n10.30.1.2      10.10.0.25     tcp   22\n10.30.1.2      8.8.4.4        udp   53'
    }
  };

  /* ---------- UI ---------- */
  var aclIn = $('#acl-in'), pktIn = $('#pkt-in'), listSel = $('#acl-num'), out = $('#results'), err = $('#errors'), summary = $('#summary'), ruleView = $('#rule-view');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function refreshLists(rules) {
    var nums = rules.map(function (r) { return r.num; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var cur = +listSel.value;
    listSel.innerHTML = nums.map(function (n) { return '<option value="' + n + '">' + n + (n >= 100 ? ' (extended)' : ' (standard)') + '</option>'; }).join('') || '<option>none</option>';
    if (nums.indexOf(cur) > -1) listSel.value = cur;
  }

  function run(animate) {
    var a = parseAcl(aclIn.value), p = parsePackets(pktIn.value);
    refreshLists(a.rules);
    var num = +listSel.value;
    var list = a.rules.filter(function (r) { return r.num === num; });
    var errors = a.errors.concat(p.errors);
    err.innerHTML = errors.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('');
    err.hidden = !errors.length;

    var hits = list.map(function () { return 0; }), implicit = 0, permitted = 0;
    var rows = p.packets.map(function (pkt, i) {
      var res = evaluate(a.rules, pkt, num);
      var idx = res.rule ? list.indexOf(res.rule) : -1;
      if (idx > -1) hits[idx]++; else implicit++;
      if (res.action === 'permit') permitted++;
      var desc = esc(pkt.srcText) + (pkt.dstText ? ' → ' + esc(pkt.dstText) : '') + (pkt.proto ? ' <span class="dimtxt">' + esc(pkt.proto) + (pkt.port != null ? ':' + pkt.port : '') + '</span>' : '');
      var why = res.rule ? 'matched rule ' + (idx + 1) + ': <code>' + esc(res.rule.raw) + '</code>' : 'no rule matched → <b>implicit deny any</b>';
      return '<li class="pkt ' + res.action + '" style="--i:' + i + '" data-rule="' + idx + '"><span class="verdict">' + (res.action === 'permit' ? '✔ PERMIT' : '✖ DENY') + '</span><span class="pdesc">' + desc + '</span><span class="why">' + why + '</span></li>';
    });
    out.classList.toggle('animate', !!animate && !reduce);
    out.innerHTML = rows.join('') || '<li class="empty">Add some packets to test.</li>';

    ruleView.innerHTML = list.map(function (r, i) {
      return '<li class="' + r.action + '" data-rule="' + i + '"><span class="n">' + (i + 1) + '</span><code>' + esc(r.raw) + '</code><span class="hits">' + hits[i] + ' hit' + (hits[i] === 1 ? '' : 's') + '</span></li>';
    }).join('') + '<li class="deny implicit" data-rule="-1"><span class="n">∞</span><code>(implicit) deny any</code><span class="hits">' + implicit + ' hit' + (implicit === 1 ? '' : 's') + '</span></li>';

    summary.textContent = p.packets.length ? permitted + ' of ' + p.packets.length + ' packets permitted by ACL ' + num + '.' : '';
  }

  // Hover a result → highlight the rule that decided it (and vice versa)
  function link(container, other) {
    container.addEventListener('mouseover', function (e) {
      var li = e.target.closest('[data-rule]'); if (!li) return;
      other.querySelectorAll('[data-rule]').forEach(function (x) { x.classList.toggle('hl', x.dataset.rule === li.dataset.rule); });
    });
    container.addEventListener('mouseleave', function () { other.querySelectorAll('.hl').forEach(function (x) { x.classList.remove('hl'); }); });
  }
  link(out, ruleView); link(ruleView, out);

  function load(name) {
    aclIn.value = PRESETS[name].acl; pktIn.value = PRESETS[name].packets;
    document.querySelectorAll('[data-preset]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.preset === name); });
    listSel.innerHTML = ''; run(true);
  }
  document.querySelectorAll('[data-preset]').forEach(function (b) { b.addEventListener('click', function () { load(b.dataset.preset); }); });

  var t;
  [aclIn, pktIn].forEach(function (el) { el.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { run(false); }, 250); }); });
  listSel.addEventListener('change', function () { run(true); });
  $('#run').addEventListener('click', function () { run(true); });

  // Quick-add packet builder
  $('#add-pkt').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, parts = [f.src.value.trim(), f.dst.value.trim(), f.proto.value, f.port.value.trim()].filter(Boolean);
    if (!f.src.value.trim()) return;
    pktIn.value = pktIn.value.replace(/\s*$/, '') + '\n' + parts.join('  ');
    run(true);
  });

  load('standard');
})();
