'use strict';
/* =====================================================================
   HÌNH MINH HỌA — biểu đồ nến SVG (phong cách nền trắng, nến xanh dương,
   đường MA xanh lá). Dùng cho chương học, câu hỏi và 24 kịch bản.
   ===================================================================== */
const Fig = (() => {
  const C = { up: '#2962c9', grid: '#e7eaf0', axis: '#6b7280', ma: '#34a46a', maO: '#1d6b42', liq: '#8b5cf6', mss: '#f59e0b', fvgB: 'rgba(16,185,129,.20)', fvgS: 'rgba(239,68,68,.18)', entry: '#2563eb', sl: '#dc2626', tp: '#059669', band1: 'rgba(59,130,246,.08)', band2: 'rgba(245,158,11,.10)' };
  const rng = seed => { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  /* ---- tạo nến từ các điểm mốc [index, giá đóng cửa, cờ] ---- */
  function walk(wp, o = {}) {
    const R = rng(o.seed || 3), vol = o.vol ?? 0.3, wk = o.wick ?? 0.3, B = [];
    const c0 = wp[0][1], d0 = (wp[1][1] - c0) / (wp[1][0] - wp[0][0]);
    B.push({ o: c0 - d0 * 0.6, c: c0, h: Math.max(c0, c0 - d0 * .6) + R() * wk, l: Math.min(c0, c0 - d0 * .6) - R() * wk });
    for (let k = 0; k < wp.length - 1; k++) {
      const [i0, p0] = wp[k], [i1, p1, f] = wp[k + 1], n = i1 - i0;
      for (let j = 1; j <= n; j++) {
        const c = p0 + (p1 - p0) * j / n + (j < n && f !== 'd' ? (R() - .5) * 2 * vol : 0), op = B[B.length - 1].c, w = f === 'd' ? wk * 0.12 : wk;
        B.push({ o: op, c, h: Math.max(op, c) + R() * w, l: Math.min(op, c) - R() * w });
      }
    }
    return B;
  }
  const norm = B => B.forEach((b, i) => { if (i) b.o = B[i - 1].c; b.h = Math.max(b.h, b.o, b.c); b.l = Math.min(b.l, b.o, b.c); });
  const clamp = (B, i0, i1, lo, hi) => { for (let i = Math.max(0, i0); i <= Math.min(B.length - 1, i1); i++) { const b = B[i]; if (lo != null) { b.c = Math.max(b.c, lo); b.l = Math.max(b.l, lo); } if (hi != null) { b.c = Math.min(b.c, hi); b.h = Math.min(b.h, hi); } } };
  const fix = (B, i0, i1, lo, hi) => { for (let i = Math.max(0, i0); i <= Math.min(B.length - 1, i1); i++) { const b = B[i]; if (lo != null) { b.o = Math.max(b.o, lo); b.l = Math.max(b.l, lo); } if (hi != null) { b.o = Math.min(b.o, hi); b.h = Math.min(b.h, hi); } b.h = Math.max(b.h, b.o, b.c); b.l = Math.min(b.l, b.o, b.c); } };
  const mirror = (B, P) => B.map(b => ({ o: 2 * P - b.o, c: 2 * P - b.c, h: 2 * P - b.l, l: 2 * P - b.h }));
  const G = p => 3950 + (p - 100) * 4; // đổi thang trừu tượng -> giá vàng
  const gold = B => B.map(b => ({ o: G(b.o), c: G(b.c), h: G(b.h), l: G(b.l) }));
  const fvgIn = (B, i0, i1, dir) => { for (let j = i0 + 2; j <= i1; j++) { if (dir > 0 && B[j].l > B[j - 2].h) return { i: j - 1, lo: B[j - 2].h, hi: B[j].l }; if (dir < 0 && B[j].h < B[j - 2].l) return { i: j - 1, lo: B[j].h, hi: B[j - 2].l }; } return null; };

  /* ---- vẽ SVG ---- */
  function render(sp) {
    const B = sp.bars, n = B.length, W = sp.w || 680, H = sp.h || 300, pl = 6, pr = 66, pt = 14, pb = sp.time ? 22 : 10, A = sp.ann || [], dp = sp.dp ?? 1;
    let lo = Math.min(...B.map(b => b.l)), hi = Math.max(...B.map(b => b.h));
    A.forEach(a => { [a.p, a.p1, a.p2].forEach(p => { if (p != null && a.fit !== false) { lo = Math.min(lo, p); hi = Math.max(hi, p); } }); });
    const pad = (hi - lo) * 0.09; lo -= pad; hi += pad;
    const cw = (W - pl - pr) / n, X = i => pl + (i + .5) * cw, Y = p => pt + (H - pt - pb) * (hi - p) / (hi - lo), bw = Math.max(2, cw * 0.6);
    const o = [];
    const txt = (x, y, s, col = '#111827', anchor = 'start', bold) => { const w = String(s).length * 6.3 + 8, x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x; return `<rect x="${x0}" y="${y - 11}" width="${w}" height="15" rx="3" fill="#fff" fill-opacity=".88"/><text x="${x0 + 4}" y="${y}" fill="${col}" font-size="11"${bold ? ' font-weight="700"' : ''}>${esc(s)}</text>`; };
    // lưới + trục giá
    const raw = (hi - lo) / 5, mag = Math.pow(10, Math.floor(Math.log10(raw))), step = [1, 2, 2.5, 5, 10].map(k => k * mag).find(s => s >= raw);
    for (let p = Math.ceil(lo / step) * step; p <= hi; p += step) o.push(`<line x1="${pl}" x2="${W - pr}" y1="${Y(p)}" y2="${Y(p)}" stroke="${C.grid}"/><text x="${W - pr + 6}" y="${Y(p) + 4}" fill="${C.axis}" font-size="10.5">${p.toFixed(step < 1 ? 1 : 0)}</text>`);
    const k = Math.max(1, Math.ceil(n / 7)), tick = sp.tick || (i => i % k === 0);
    for (let i = 0; i < n; i++) { if (!tick(i)) continue; o.push(`<line x1="${X(i)}" x2="${X(i)}" y1="${pt - 6}" y2="${H - pb}" stroke="${C.grid}"/>`); if (sp.time) { const t = sp.time(i); if (t) o.push(`<text x="${X(i)}" y="${H - 6}" fill="${C.axis}" font-size="10.5" text-anchor="middle">${t}</text>`); } }
    // vùng thời gian
    A.filter(a => a.t === 'band').forEach(a => { const x0 = X(Math.max(-0.5, a.i0)) - cw / 2, x1 = X(Math.min(n - .5, a.i1)) + cw / 2; o.push(`<rect x="${x0}" y="${pt - 6}" width="${Math.max(0, x1 - x0)}" height="${H - pb - pt + 6}" fill="${a.color || C.band1}"/>`); if (a.label) o.push(`<text x="${x0 + 4}" y="${pt + 4}" fill="${C.axis}" font-size="10.5" font-weight="600">${esc(a.label)}</text>`); });
    // hộp
    A.filter(a => a.t === 'box').forEach(a => {
      const x0 = X(a.i0) - cw / 2, x1 = X(Math.min(n - 1, a.i1)) + cw / 2, y0 = Y(Math.max(a.p1, a.p2)), y1 = Y(Math.min(a.p1, a.p2));
      o.push(`<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${Math.max(1, y1 - y0)}" fill="${a.color}" stroke="${a.stroke || 'none'}"/>`);
      if (a.ce) o.push(`<line x1="${x0}" x2="${x1}" y1="${(y0 + y1) / 2}" y2="${(y0 + y1) / 2}" stroke="#374151" stroke-dasharray="3 3" stroke-width=".8"/>`);
      if (a.label && a.ltop) o.push(txt(x0 + 4, y0 + 14, a.label, a.lc || '#065f46', 'start', 1));
      else if (a.label) o.push(txt(x1 + 4 > W - pr - 60 ? x1 - 4 : x1 + 4, (y0 + y1) / 2 + 4, a.label, a.lc || '#065f46', x1 + 4 > W - pr - 60 ? 'end' : 'start', 1));
    });
    // đường MA
    if (sp.ma) {
      const m = B.map((b, i) => { const a = B.slice(Math.max(0, i - sp.ma + 1), i + 1); return a.reduce((s, x) => s + x.c, 0) / a.length; });
      const d = m.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('');
      o.push(`<path d="${d}" fill="none" stroke="${C.maO}" stroke-width="3.2" opacity=".55"/><path d="${d}" fill="none" stroke="${C.ma}" stroke-width="1.8"/>`);
    }
    // nến
    B.forEach((b, i) => {
      const x = X(i), up = b.c >= b.o, y0 = Y(Math.max(b.o, b.c)), y1 = Y(Math.min(b.o, b.c)), hl = a => A.some(q => q.t === 'hl' && q.i === i);
      const col = hl() ? '#d97706' : C.up;
      o.push(`<line x1="${x}" x2="${x}" y1="${Y(b.h)}" y2="${Y(b.l)}" stroke="${col}" stroke-width="1.2"/><rect x="${x - bw / 2}" y="${y0}" width="${bw}" height="${Math.max(1, y1 - y0)}" fill="${up ? '#fff' : col}" stroke="${col}" stroke-width="1.2"/>`);
    });
    // đường gấp khúc
    A.filter(a => a.t === 'line').forEach(a => o.push(`<polyline points="${a.pts.map(([i, p]) => X(i) + ',' + Y(p)).join(' ')}" fill="none" stroke="${a.color || '#6b7280'}" stroke-width="1.3" stroke-dasharray="${a.dash || '5 4'}"/>`));
    // đường ngang
    A.filter(a => a.t === 'h').forEach(a => {
      const x0 = a.from != null ? X(a.from) - cw / 2 : pl, x1 = a.to != null ? X(Math.min(n - 1, a.to)) + cw / 2 : W - pr, y = Y(a.p), col = a.color || C.liq;
      o.push(`<line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" stroke="${col}" stroke-width="${a.w || 1.3}" stroke-dasharray="${a.dash ?? '6 4'}"/>`);
      if (a.label) o.push(txt(a.lx != null ? X(a.lx) : x1 - 2, y - 4, a.label, col, a.lx != null ? 'start' : 'end', 1));
      if (a.axis !== false) o.push(`<rect x="${W - pr + 1}" y="${y - 8}" width="${pr - 2}" height="16" rx="3" fill="${col}"/><text x="${W - pr + 5}" y="${y + 4}" fill="#fff" font-size="10.5" font-weight="600">${a.p.toFixed(dp)}</text>`);
    });
    // nhãn + mũi tên
    A.filter(a => a.t === 'tag').forEach(a => {
      const x = X(a.i), y = Y(a.p), col = a.color || '#111827', dn = a.dir === 'down';
      const ay = dn ? y - 5 : y + 5, s = dn ? -1 : 1;
      o.push(`<path d="M${x},${ay} l-5,${8 * s} l10,0 z" fill="${col}"/>`);
      if (a.text) o.push(txt(x, ay + s * 23 + (dn ? 4 : 0), a.text, col, x > W - pr - 70 ? 'end' : x < 60 ? 'start' : 'middle', 1));
    });
    A.filter(a => a.t === 'txt').forEach(a => o.push(`<text x="${X(a.i)}" y="${Y(a.p) + (a.dy || 0)}" fill="${a.color || '#111827'}" font-size="${a.size || 11}" font-weight="700" text-anchor="middle">${esc(a.text)}</text>`));
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Be Vietnam Pro, system-ui, sans-serif" role="img">${sp.title ? `<title>${esc(sp.title)}</title>` : ''}<rect width="${W}" height="${H}" fill="#fff"/>${o.join('')}</svg>`;
  }

  /* ---- hình khái niệm (tham số q = bản câu hỏi, ẩn nhãn đáp án) ---- */
  const zig = [[0, 100], [4, 103.2], [7, 101.6], [11, 105.2], [14, 103.4], [18, 107.4], [21, 105.4], [26, 109.6]];
  const F = {
    trendUp(q) {
      const B = gold(walk(zig, { seed: 11, vol: .25, wick: .3 }));
      const sw = [[4, 'HH', 1], [7, 'HL', 0], [11, 'HH', 1], [14, 'HL', 0], [18, 'HH', 1], [21, 'HL', 0]];
      const ann = [{ t: 'line', pts: [[0, B[0].c], ...sw.map(([i, , h]) => [i, h ? B[i].h : B[i].l]), [26, B[26].h]], color: '#9ca3af' }];
      if (!q) sw.forEach(([i, s, h]) => ann.push({ t: 'txt', i, p: h ? B[i].h : B[i].l, text: s, dy: h ? -8 : 16, color: h ? '#059669' : '#2563eb' }));
      return { bars: B, ann, ma: 9, title: 'Xu hướng tăng: HH + HL' };
    },
    trendDown(q) {
      const B = mirror(gold(walk(zig, { seed: 12, vol: .25, wick: .3 })), G(104));
      const sw = [[4, 'LL', 0], [7, 'LH', 1], [11, 'LL', 0], [14, 'LH', 1], [18, 'LL', 0], [21, 'LH', 1]];
      const ann = [{ t: 'line', pts: [[0, B[0].c], ...sw.map(([i, , h]) => [i, h ? B[i].h : B[i].l]), [26, B[26].l]], color: '#9ca3af' }];
      if (!q) sw.forEach(([i, s, h]) => ann.push({ t: 'txt', i, p: h ? B[i].h : B[i].l, text: s, dy: h ? -8 : 16, color: h ? '#dc2626' : '#2563eb' }));
      return { bars: B, ann, ma: 9, title: 'Xu hướng giảm: LH + LL' };
    },
    bos(q) {
      const B = gold(walk(zig, { seed: 11, vol: .25, wick: .3 })), ann = [];
      [[4, 11], [11, 18], [18, 26]].forEach(([a, b], k) => { let j = a + 1; while (j < B.length - 1 && B[j].c <= B[a].h) j++; ann.push({ t: 'h', p: B[a].h, from: a, to: j, color: '#059669', dash: '', w: 1.2, axis: false, label: q && k === 2 ? '?' : 'BOS', lx: a + 0.5 }); });
      return { bars: B, ann, ma: 9, title: 'BOS: phá đỉnh theo cùng xu hướng' };
    },
    mss(q) {
      const B = gold(walk([[0, 110], [3, 107.6], [6, 108.9], [10, 105.6], [13, 106.9], [17, 104.2], [18, 103.4], [19, 104.0], [20, 106.6, 'd'], [21, 108.8, 'd'], [22, 109.4], [25, 108.6], [29, 111]], { seed: 21, vol: .2, wick: .3 }));
      norm(B);
      let j = 14; while (B[j].c <= B[13].h) j++;
      const f = fvgIn(B, 18, 24, 1), ann = [
        { t: 'h', p: B[13].h, from: 13, to: j, color: C.mss, dash: '', axis: false, label: q ? '' : 'MSS', lx: 13.5 },
        { t: 'tag', i: 18, p: B[18].l, text: q ? '' : 'Quét đáy', color: C.liq },
      ];
      if (!q) { ann.push({ t: 'txt', i: 13, p: B[13].h, text: 'LH', dy: -8, color: '#dc2626' }, { t: 'txt', i: 10, p: B[10].l, text: 'LL', dy: 16, color: '#2563eb' }); if (f) ann.push({ t: 'box', i0: f.i, i1: 28, p1: f.lo, p2: f.hi, color: C.fvgB, label: 'FVG', ce: 1 }); }
      ann.push({ t: 'hl', i: j });
      return { bars: B, ann, ma: 9, title: 'MSS: nến thân dài phá ngược cấu trúc' };
    },
    sweepSSL(q) {
      const B = gold(walk([[0, 104.4], [3, 101.6], [6, 103.6], [9, 101.6], [12, 103.4], [15, 101.9], [16, 101.5], [17, 102.4], [19, 104.6, 'd'], [21, 106.4, 'd'], [24, 105.6], [28, 108.4]], { seed: 31, vol: .22, wick: .25 }));
      norm(B); const L = G(101.2);
      clamp(B, 1, 15, L + .6, null); norm(B); B[3].l = L; B[9].l = L; B[16].l = L - 4.4; fix(B, 1, 15, L, null);
      return { bars: B, ma: 9, title: 'Quét thanh khoản bên bán (SSL)', ann: [
        { t: 'h', p: L, from: 1, to: 16, color: C.liq, label: q ? 'Đáy bằng nhau' : 'SSL — stop của phe mua', lx: 0.5 },
        { t: 'tag', i: 16, p: B[16].l, text: q ? '?' : 'Quét SSL rồi đóng cửa quay lại', color: C.liq }, { t: 'hl', i: 16 }] };
    },
    bsl(q) {
      const s = F.sweepSSL(true), P = G(104.8), B = mirror(s.bars, P), L = 2 * P - G(101.2);
      return { bars: B, ma: 9, title: 'Quét thanh khoản bên mua (BSL)', ann: [
        { t: 'h', p: L, from: 1, to: 16, color: C.liq, label: q ? 'Đỉnh bằng nhau' : 'BSL — stop của phe bán', lx: 0.5 },
        { t: 'tag', i: 16, p: B[16].h, dir: 'down', text: q ? '?' : 'Quét BSL rồi giảm', color: C.liq }, { t: 'hl', i: 16 }] };
    },
    fvgBull(q) {
      const B = gold(walk([[0, 100.4], [3, 101.3], [5, 100.6], [6, 100.9], [7, 103.6, 'd'], [8, 104.5], [10, 104.9], [12, 104.0], [13, 103.1], [15, 104.2], [19, 106.6]], { seed: 41, vol: .18, wick: .3 }));
      norm(B); B[6].h = B[6].c + 1; B[8].l = B[8].o - 0.9; fix(B, 9, 12, B[8].l + 0.6, null);
      const lo = B[6].h, hi = B[8].l; B[13].l = (lo + hi) / 2; B[13].c = Math.max(B[13].c, (lo + hi) / 2 + 1.5); norm(B); B[13].l = (lo + hi) / 2;
      const ann = [{ t: 'box', i0: 6, i1: 19, p1: lo, p2: hi, color: C.fvgB, stroke: 'rgba(5,150,105,.5)', ce: !q, label: q ? '?' : 'FVG tăng (CE = 50%)' }];
      if (!q) ann.push({ t: 'txt', i: 6, p: B[6].l, text: '1', dy: 16 }, { t: 'txt', i: 7, p: B[7].l, text: '2', dy: 16 }, { t: 'txt', i: 8, p: B[8].l, text: '3', dy: 16 }, { t: 'tag', i: 13, p: B[13].l, text: 'Hồi về CE', color: '#059669' });
      return { bars: B, ann, ma: 9, title: 'FVG tăng: Low nến 3 > High nến 1' };
    },
    fvgBear(q) {
      const s = F.fvgBull(true), P = G(103.5), B = mirror(s.bars, P), lo = B[8].h, hi = B[6].l;
      const ann = [{ t: 'box', i0: 6, i1: 19, p1: lo, p2: hi, color: C.fvgS, stroke: 'rgba(220,38,38,.5)', ce: !q, label: q ? '?' : 'FVG giảm', lc: '#991b1b' }];
      if (!q) ann.push({ t: 'tag', i: 13, p: B[13].h, dir: 'down', text: 'Sell limit tại CE', color: '#dc2626' });
      return { bars: B, ann, ma: 9, title: 'FVG giảm: High nến 3 < Low nến 1' };
    },
    ob(q) {
      const B = gold(walk([[0, 104.2], [3, 102.6], [5, 103.3], [8, 101.4], [9, 100.8], [10, 102.9, 'd'], [11, 104.8, 'd'], [12, 105.6], [15, 104.3], [17, 102.6], [19, 103.8], [24, 107.6]], { seed: 51, vol: .2, wick: .25 }));
      norm(B); if (B[9].c >= B[9].o) { B[9].o = B[9].c + .8; } norm(B);
      const top = B[9].h, bot = B[9].l; fix(B, 12, 16, top + 1, null); B[17].l = top - 0.3; fix(B, 18, 24, top + 0.5, null);
      return { bars: B, ma: 9, title: 'Order Block tăng', ann: [
        { t: 'box', i0: 9, i1: 24, p1: top, p2: bot, color: 'rgba(37,99,235,.15)', stroke: 'rgba(37,99,235,.55)', label: q ? '?' : 'Order Block', lc: '#1d4ed8' },
        ...(q ? [] : [{ t: 'tag', i: 11, p: B[11].h, dir: 'down', text: 'Displacement', color: '#059669' }, { t: 'tag', i: 17, p: B[17].l, text: 'Hồi về OB', color: '#1d4ed8' }]), { t: 'hl', i: 9 }] };
    },
    ifvg(q) {
      const B = gold(walk([[0, 106.4], [3, 105.6], [4, 103.6, 'd'], [5, 102.4, 'd'], [7, 102.9], [9, 102.1], [11, 105.2, 'd'], [12, 106.3], [14, 105.6], [16, 105], [20, 107.6]], { seed: 61, vol: .15, wick: .25 }));
      norm(B); B[3].l = Math.min(B[3].o, B[3].c) - .2; B[5].h = Math.max(B[5].o, B[5].c) + .2; const f = { i: 4, lo: B[5].h, hi: B[3].l };
      fix(B, 6, 10, null, f.lo - .4); norm(B); fix(B, 13, 20, f.hi - .2, null); B[16].l = f.hi - 0.5; fix(B, 6, 10, null, f.lo - .4);
      return { bars: B, ma: 9, title: 'IFVG: FVG giảm bị phá lên, đổi thành hỗ trợ', ann: [
        { t: 'box', i0: f.i, i1: 20, p1: f.lo, p2: f.hi, color: 'rgba(124,58,237,.16)', stroke: 'rgba(124,58,237,.55)', label: q ? '?' : 'FVG giảm → IFVG', lc: '#6d28d9', ltop: !q },
        ...(q ? [] : [{ t: 'tag', i: 11, p: B[11].h, dir: 'down', text: 'Đóng cửa xuyên qua', color: '#059669' }, { t: 'tag', i: 16, p: B[16].l, text: 'Retest = hỗ trợ', color: '#6d28d9' }])] };
    },
    fibOTE(q) {
      const B = gold(walk([[0, 101.6], [2, 100], [6, 104.5, 'd'], [9, 106.6], [12, 110], [15, 107.4], [18, 103.6], [20, 105.4, 'd'], [23, 108.8], [27, 112]], { seed: 71, vol: .25, wick: .3 }));
      norm(B); const lo = G(99.6), hi = G(110.4); B[2].l = lo; B[12].h = hi; fix(B, 3, 11, lo + 1, hi - 1); fix(B, 13, 17, null, hi - 1); const fl = p => hi - p * (hi - lo);
      B[18].l = fl(0.7); fix(B, 13, 17, fl(0.62) + .5, null); fix(B, 19, 27, fl(0.6), null);
      const ann = [{ t: 'box', i0: 2, i1: 27, p1: fl(0.618), p2: fl(0.786), color: 'rgba(16,185,129,.16)', label: q ? '?' : 'OTE 0.618–0.786' }];
      if (!q) ann.push({ t: 'box', i0: 2, i1: 27, p1: hi, p2: fl(0.5), color: 'rgba(239,68,68,.05)' });
      [[0, '0'], [0.5, '0.5'], [0.618, '0.618'], [0.786, '0.786'], [1, '1']].forEach(([r, s]) => ann.push({ t: 'h', p: fl(r), from: 2, color: r === 0.5 ? '#6b7280' : '#9ca3af', dash: '4 3', w: 1, label: s + (q || r !== 0.5 ? '' : ' — trên: Premium · dưới: Discount'), lx: 2.2 }));
      if (!q) ann.push({ t: 'tag', i: 18, p: B[18].l, text: 'Mua trong OTE + MSS', color: '#059669' });
      return { bars: B, ann, ma: 9, title: 'Fibo OTE và Premium/Discount' };
    },
    judas(q) {
      const B = gold(walk([[0, 102.2], [3, 103.4], [6, 102.4], [9, 103.5], [12, 102.5], [14, 103], [16, 102.6], [18, 101.1], [19, 101.5], [21, 104.4, 'd'], [23, 105.6], [26, 105], [31, 108.6]], { seed: 81, vol: .18, wick: .3 }));
      norm(B); fix(B, 0, 16, G(102.0), G(103.9)); norm(B); const aH = Math.max(...B.slice(0, 13).map(b => b.h)), aL = Math.min(...B.slice(0, 13).map(b => b.l));
      fix(B, 13, 16, aL + .5, aH - .5); B[18].l = aL - 5;
      return { bars: B, ma: 9, title: 'Power of 3: Tích lũy (Á) → Thao túng (Judas) → Mở rộng', time: i => hm(480 + i * 20), tick: i => i % 3 === 0, ann: [
        { t: 'band', i0: 0, i1: 11.5, color: C.band1, label: q ? 'Phiên Á' : 'Phiên Á — tích lũy' }, { t: 'band', i0: 18, i1: 26.5, color: C.band2, label: 'London KZ' },
        { t: 'h', p: aH, from: 0, to: 20, color: '#2563eb', label: 'Đỉnh Á', lx: 0.3, w: 1 }, { t: 'h', p: aL, from: 0, to: 20, color: '#2563eb', label: 'Đáy Á', lx: 0.3, w: 1 },
        { t: 'tag', i: 18, p: B[18].l, text: q ? '?' : 'Judas swing (quét đáy Á)', color: C.liq }, ...(q ? [] : [{ t: 'tag', i: 27, p: B[27].h, dir: 'down', text: 'Mở rộng', color: '#059669' }])] };
    },
    crt(q) {
      const B = [{ o: 4000, h: 4024, l: 3996, c: 4018 }, { o: 4018, h: 4031, l: 4012, c: 4016 }, { o: 4016, h: 4019, l: 4006, c: 4008 }, { o: 4008, h: 4011, l: 3993, c: 3997 }, { o: 3997, h: 4003, l: 3992, c: 4000 }];
      return { bars: B, w: 560, title: 'CRT: nến 2 quét CRTH rồi đóng cửa vào lại range', dp: 0, ann: [
        { t: 'h', p: 4024, color: '#dc2626', label: 'CRTH (đỉnh nến 1)', lx: -0.4 }, { t: 'h', p: 3996, color: '#2563eb', label: 'CRTL (đáy nến 1)', lx: -0.4 },
        { t: 'h', p: 4010, color: '#6b7280', label: q ? '?' : '50% range = mục tiêu 1', lx: 1.6, dash: '3 3' },
        { t: 'tag', i: 1, p: 4031, dir: 'down', text: q ? 'Nến 2' : 'Turtle Soup: quét CRTH', color: C.liq }, { t: 'txt', i: 0, p: 3996, text: 'Nến 1', dy: 16 }] };
    },
  };

  /* ---- chart kịch bản từ số liệu Excel ---- */
  const tm = t => { const m = String(t || '').match(/(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : null; };
  const hm = m => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  function scen(s, full) {
    const d = s.wick < s.lvl ? 1 : -1, P = s.lvl, m = x => d === 1 ? x : 2 * P - x;
    const L = m(s.lvl), Wk = m(s.wick), MS = m(s.mss), FL = m(d === 1 ? s.fl : s.fh), FH = m(d === 1 ? s.fh : s.fl), E = m(s.entry), SL = m(s.sl), T1 = m(s.tp1), T2 = m(s.tp2);
    const r = Math.max(MS - L, 3), g = Math.max(FH - FL, 0.6), ts = tm(s.tsweep), tM = tm(s.tmss), S = 22;
    const Mi = S + Math.max(2, Math.round((tM - ts) / 5)), bc = Math.max(MS, FH) + Math.max(0.7, 0.35 * g), traded = !String(s.result).startsWith('Không vào');
    let Fi = tm(s.tfill) != null && traded ? Math.max(Mi + 3, S + Math.round((tm(s.tfill) - ts) / 5)) : null;
    const res = String(s.result);
    const wp = [[0, L + .55 * r], [2, L + .22 * r], [9, MS - .14 * r], [14, L + .42 * r], [17, L + .55 * r], [S - 1, L + .14 * r], [S, L + Math.min(.3 * r, .4 * (FL - L) + .2)], [Mi - 1, FL - .15 * g], [Mi, bc, 'd'], [Mi + 1, bc + .45 * g]];
    let end = Mi + 1, phases = [];
    if (full && traded) {
      if (Fi) {
        wp.push([Mi + 2, bc + .5 * g], [Fi - 1, E + .45 * g], [Fi, E + .55 * g]);
        if (res.includes('TP2')) { wp.push([Fi + 8, T1 - .2 * (T1 - E)], [Fi + 9, T1 - .05 * (T1 - E)], [Fi + 13, T1 - .3 * (T1 - E)], [Fi + 22, T2]); end = Fi + 22; }
        else if (res.includes('BE')) { wp.push([Fi + 8, T1 - .15 * (T1 - E)], [Fi + 9, T1 - .05 * (T1 - E)], [Fi + 18, E - .2]); end = Fi + 18; }
        else { wp.push([Fi + 3, E + .5 * g + .3], [Fi + 10, SL - .1]); end = Fi + 10; }
      } else { wp.push([Mi + 4, bc + .3 * g], [Mi + 14, T1]); end = Mi + 14; }
    }
    const B = walk(wp, { seed: s.n * 7919 + 3, vol: r * .05, wick: r * .05 });
    clamp(B, 1, S - 1, L + .12, MS - .05); clamp(B, S + 1, Mi - 1, Wk + .25, FL - .03);
    if (full && Fi) { clamp(B, Mi + 2, Fi - 1, E + .1, T1 - .3); if (!res.includes('SL')) clamp(B, Fi + 1, end, SL + .4, null); }
    if (full && traded && !Fi) clamp(B, Mi + 2, end, E + .3, null);
    norm(B);
    fix(B, 1, S - 1, L + .12, MS - .05); fix(B, S + 1, Mi - 2, Wk + .25, FL - .03);
    B[9].h = MS; B[S].l = Wk; B[Mi - 1].h = FL; B[Mi - 1].c = Math.min(B[Mi - 1].c, FL - .05); B[Mi - 1].o = Math.min(B[Mi - 1].o, FL - .05);
    B[Mi].o = B[Mi - 1].c; B[Mi + 1].l = FH;
    if (full && Fi) {
      fix(B, Mi + 2, Fi - 1, E + .1, null); B[Fi].l = Math.min(B[Fi].l, E - .15);
      if (res.includes('TP')) { const t1 = Fi + 9; B[t1].h = Math.max(B[t1].h, T1 + .15); for (let i = Fi + 1; i < t1; i++) B[i].h = Math.min(B[i].h, T1 - .1); fix(B, Fi + 1, res.includes('BE') ? end - 1 : end, SL + .4, null); fix(B, t1 + 1, end, res.includes('BE') ? null : E + .3, null); }
      if (res.includes('TP2')) B[end].h = T2 + .15;
      if (res.includes('BE')) B[end].l = E - .35;
      if (res.includes('SL')) { B[end].l = SL - .3; fix(B, Fi + 1, end, null, T1 - .5); }
    }
    if (full && traded && !Fi) { fix(B, Mi + 2, end, E + .3, null); B[end].h = T1 + .15; }
    for (let i = 0; i < B.length; i++) { const b = B[i]; b.h = Math.max(b.h, b.o, b.c); b.l = Math.min(b.l, b.o, b.c); }
    let bars = B.slice(0, (full ? end : Mi + 1) + 1);
    if (d === -1) bars = mirror(bars, P);
    // chú thích
    const n = bars.length, ann = [], t0 = ts - S * 5, kz = String(s.kz).match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
    if (kz) ann.push({ t: 'band', i0: (tm(kz[1]) - t0) / 5, i1: (tm(kz[2]) - t0) / 5, color: C.band2, label: s.kz.replace(/\s*\(.*/, '') + ' KZ' });
    const noSw = /Không có cú quét/.test(s.liq);
    if (!noSw) ann.push({ t: 'h', p: s.lvl, from: 0, to: S + 2, color: C.liq, label: s.liq.replace(/\s*\(.*\)/, ''), lx: 0.3 });
    ann.push({ t: 'h', p: s.mss, from: 9, to: Mi, color: C.mss, label: 'MSS ' + s.tmss, lx: 9.3, axis: false });
    ann.push({ t: 'tag', i: S, p: s.wick, dir: d === 1 ? 'up' : 'down', text: (noSw ? 'Đáy nhỏ ' : 'Quét ') + s.tsweep, color: noSw ? '#6b7280' : C.liq });
    ann.push({ t: 'box', i0: Mi - 1, i1: n - 1, p1: s.fl, p2: s.fh, color: d === 1 ? C.fvgB : C.fvgS, stroke: d === 1 ? 'rgba(5,150,105,.5)' : 'rgba(220,38,38,.5)', ce: true, label: 'FVG', lc: d === 1 ? '#065f46' : '#991b1b' });
    ann.push({ t: 'hl', i: Mi });
    ann.push({ t: 'h', p: s.tp1, color: C.tp, label: 'TP1 · ' + s.tp1n, dash: '2 3', w: 1.1, fit: !!full, axis: true });
    if (full && traded && s.entry != null) {
      ann.push({ t: 'h', p: s.entry, from: Mi - 1, color: C.entry, label: 'Entry ' + s.entry, dash: '', w: 1.2, lx: Mi + 2.5 });
      ann.push({ t: 'h', p: s.sl, from: Mi - 1, color: C.sl, label: 'SL ' + s.sl, dash: '', w: 1.2, lx: Mi + 2.5 });
      ann.push({ t: 'h', p: s.tp2, color: C.tp, label: 'TP2 · ' + s.tp2n, dash: '6 4', w: 1, fit: res.includes('TP2') });
      if (Fi) ann.push({ t: 'tag', i: Fi, p: d === 1 ? bars[Fi].l : bars[Fi].h, dir: d === 1 ? 'up' : 'down', text: 'Khớp ' + s.tfill, color: C.entry });
      ann.push({ t: 'tag', i: n - 1, p: d === 1 ? (res.includes('SL') || res.includes('BE') ? bars[n - 1].l : bars[n - 1].h) : (res.includes('SL') || res.includes('BE') ? bars[n - 1].h : bars[n - 1].l), dir: (d === 1) === (res.includes('SL') || res.includes('BE')) ? 'up' : 'down', text: res.replace(/, phần còn lại/, ' →') + (s.r ? ` (${s.r > 0 ? '+' : ''}${s.r}R)` : ''), color: s.r > 0 ? C.tp : s.r < 0 ? C.sl : '#6b7280' });
    }
    return { bars, ann, ma: 9, dp: 1, w: 720, h: 320, time: i => hm(t0 + i * 5), tick: i => (t0 + i * 5) % 30 === 0, title: `Kịch bản ${s.n}` };
  }

  /* ---- API ---- */
  function svg(key) {
    if (!key) return '';
    const [k, v] = String(key).split(':');
    let sp;
    if (k.startsWith('scen')) { const s = (window.SCENARIOS || []).find(x => x.n === +k.slice(4)); if (!s) return ''; sp = scen(s, v === 'full'); }
    else if (k === 'modelA') sp = scen(window.SCENARIOS[0], v !== 'q');
    else if (F[k]) sp = F[k](v === 'q');
    else return '';
    return render(sp);
  }
  function html(key, cap) { const s = svg(key); return s ? `<figure class="fig">${s}${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>` : ''; }
  function hydrate(root) { root.querySelectorAll('[data-fig]').forEach(el => { el.outerHTML = html(el.dataset.fig, el.dataset.cap || ''); }); }
  return { svg, html, hydrate, render, scen, keys: Object.keys(F) };
})();
