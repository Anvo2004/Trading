/* ICT Gold Lab — Công cụ vẽ (kiểu TradingView) + Huấn luyện thực chiến có chấm điểm */
'use strict';

const dn = d => d === 1 ? 'MUA' : 'BÁN';
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

/* ---------------- Drawing tools ---------------- */
const Draw = {
  tool: 'cursor', items: [], tmp: null, hov: null, sel: -1,
  COL: { hline: '#e8b84a', line: '#4c8dff', box: '#22c58b', fib: '#c084fc' },
  HINT: {
    cursor: 'Click vào hình vẽ để chọn · Delete để xóa · Esc để thoát công cụ',
    hline: 'Click 1 lần lên chart để đặt đường ngang (đánh dấu đỉnh/đáy, thanh khoản)',
    line: 'Click điểm đầu rồi điểm cuối (đường xu hướng)',
    box: 'Click 2 góc đối diện để vẽ vùng (FVG, OB, range)',
    fib: 'Click điểm đầu rồi điểm cuối. Kéo từ ĐÁY lên ĐỈNH để tìm vùng MUA (OTE 0.618–0.786 ở dưới), từ ĐỈNH xuống ĐÁY để tìm vùng BÁN',
  },
  FIB: [0, 0.5, 0.618, 0.705, 0.786, 1],
  load() { const s = Store.get('drawings', null); this.items = s && s.name === Data.name ? s.items : []; this.sel = -1; this.tmp = null; },
  save() { Store.set('drawings', { name: Data.name, items: this.items }); },
  set(t) {
    this.tool = t; this.tmp = null;
    $$('#drawBar [data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
    $('#drawHint').textContent = this.HINT[t];
    $('#chartBox').style.cursor = t === 'cursor' ? '' : 'crosshair';
  },
  // logical index (theo khung đang xem) <-> thời gian thật, để hình vẽ giữ nguyên khi đổi khung
  toT(l) {
    const A = Lab.agg, n = A.length, tf = Lab.tf; if (!n) return 0;
    if (l >= n - 1) return A[n - 1].bk + (l - (n - 1)) * tf;
    if (l <= 0) return A[0].bk + l * tf;
    const j = Math.floor(l); return A[j].bk + (l - j) * (A[j + 1].bk - A[j].bk);
  },
  toL(t) {
    const A = Lab.agg, n = A.length, tf = Lab.tf; if (!n) return 0;
    if (t < A[0].bk) return (t - A[0].bk) / tf;
    let lo = 0, hi = n - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (A[m].bk <= t) lo = m; else hi = m - 1; }
    if (lo === n - 1) return lo + (t - A[lo].bk) / tf;
    return lo + Math.min(0.999, (t - A[lo].bk) / (A[lo + 1].bk - A[lo].bk));
  },
  pt(p) {
    if (!p || !p.point) return null;
    const l = Lab.chart.timeScale().coordinateToLogical(p.point.x), pr = Lab.cs.coordinateToPrice(p.point.y);
    if (l == null || pr == null) return null;
    return { t: this.toT(l), p: +pr.toFixed(2) };
  },
  click(p) {
    if (this.tool === 'cursor') return this.select(p);
    const q = this.pt(p); if (!q) return true;
    if (this.tool === 'hline') { this.items.push({ type: 'hline', a: q }); this.done(); return true; }
    if (!this.tmp) { this.tmp = q; return true; }
    this.items.push({ type: this.tool, a: this.tmp, b: q }); this.tmp = null; this.done(); return true;
  },
  done() { this.sel = this.items.length - 1; this.save(); if (!$('#drawKeep').checked) this.set('cursor'); },
  move(p) { this.hov = this.tmp ? this.pt(p) : null; },
  select(p) {
    if (!p || !p.point || !this.items.length) return false;
    const { x, y } = p.point, X = l => Lab.chart.timeScale().logicalToCoordinate(l), Y = v => Lab.cs.priceToCoordinate(v);
    let best = -1, bd = 7;
    this.items.forEach((d, k) => {
      const ya = Y(d.a.p); let dist = Infinity;
      if (d.type === 'hline') dist = Math.abs(y - ya);
      else {
        const xa = X(this.toL(d.a.t)), xb = X(this.toL(d.b.t)), yb = Y(d.b.p);
        if ([xa, xb, ya, yb].some(v => v == null)) return;
        const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), y0 = Math.min(ya, yb), y1 = Math.max(ya, yb);
        if (d.type === 'line') {
          const vx = xb - xa, vy = yb - ya, L2 = vx * vx + vy * vy || 1, u = Math.max(0, Math.min(1, ((x - xa) * vx + (y - ya) * vy) / L2));
          dist = Math.hypot(x - (xa + u * vx), y - (ya + u * vy));
        } else if (x >= x0 - 4 && x <= x1 + 60 && y >= y0 - 4 && y <= y1 + 4) dist = 0;
      }
      if (dist < bd) { bd = dist; best = k; }
    });
    this.sel = best; return best >= 0;
  },
  del() {
    if (this.sel >= 0) this.items.splice(this.sel, 1); else this.items.pop();
    this.sel = -1; this.save();
  },
  clear() { if (!this.items.length || !confirm(`Xóa ${this.items.length} hình vẽ?`)) return; this.items = []; this.sel = -1; this.save(); },
  render(g, X, Y, W) {
    const list = this.items.map((d, k) => ({ ...d, k }));
    if (this.tmp && this.hov) list.push({ type: this.tool, a: this.tmp, b: this.hov, k: -2 });
    g.font = '11px JetBrains Mono, monospace';
    for (const d of list) {
      const c = this.COL[d.type], sel = d.k === this.sel;
      g.strokeStyle = c; g.fillStyle = c; g.lineWidth = sel ? 2.5 : 1.4; g.setLineDash(d.k === -2 ? [4, 3] : []);
      const ya = Y(d.a.p); if (ya == null) continue;
      if (d.type === 'hline') {
        g.beginPath(); g.moveTo(0, ya); g.lineTo(W, ya); g.stroke();
        g.fillText(d.a.p.toFixed(2), 6, ya - 4); if (sel) g.fillRect(W / 2 - 3, ya - 3, 6, 6); continue;
      }
      const xa = X(this.toL(d.a.t)), xb = X(this.toL(d.b.t)), yb = Y(d.b.p);
      if ([xa, xb, yb].some(v => v == null)) continue;
      if (d.type === 'line') {
        g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb, yb); g.stroke();
        if (sel) { g.fillRect(xa - 3, ya - 3, 6, 6); g.fillRect(xb - 3, yb - 3, 6, 6); }
      } else if (d.type === 'box') {
        const x0 = Math.min(xa, xb), y0 = Math.min(ya, yb), w = Math.abs(xb - xa), h = Math.abs(yb - ya);
        g.fillStyle = rgba(c, 0.14); g.fillRect(x0, y0, w, h); g.strokeRect(x0, y0, w, h);
        g.fillStyle = c; g.fillText(Math.max(d.a.p, d.b.p).toFixed(2), x0 + w + 4, y0 + 4); g.fillText(Math.min(d.a.p, d.b.p).toFixed(2), x0 + w + 4, y0 + h + 4);
      } else if (d.type === 'fib') {
        const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb) + 50, pr = v => d.b.p + v * (d.a.p - d.b.p);
        const y618 = Y(pr(0.618)), y786 = Y(pr(0.786));
        if (y618 != null && y786 != null) { g.fillStyle = rgba('#22c58b', 0.12); g.fillRect(x0, Math.min(y618, y786), x1 - x0, Math.abs(y786 - y618)); }
        const ym = Y(pr(0.5));
        this.FIB.forEach(v => {
          const y = Y(pr(v)); if (y == null) return;
          g.strokeStyle = v === 0.5 ? '#8a96ad' : c; g.globalAlpha = v === 0 || v === 1 ? 1 : 0.8;
          g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); g.globalAlpha = 1;
          g.fillStyle = v === 0.5 ? '#8a96ad' : c; g.fillText(`${v} (${pr(v).toFixed(2)})`, x1 + 4, y + 4);
        });
        if (ym != null) { g.fillStyle = '#8a96ad'; g.fillText(d.a.p < d.b.p ? 'Discount ↓ · Premium ↑' : 'Premium ↑ · Discount ↓', x0 + 4, ym - 5); }
        g.setLineDash([2, 3]); g.strokeStyle = rgba(c, 0.6); g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb, yb); g.stroke();
      }
    }
    g.setLineDash([]);
  },
};

/* ---------------- Coach: thực chiến có hướng dẫn ---------------- */
const Coach = {
  on: false, ev: [], ptr: 0, cur: null, ann: [], ffwd: false,
  P: { kz: 'both', buf: 1.2, look: 6, wait: 12, disp: 1.3, maxSL: 12, exitMin: 750, tolLv: 1.0 },
  sess: { n: 0, ok: 0 },
  init() {
    this.hist = Store.get('coachHist', { n: 0, ok: 0, ev: 0 });
    this.P.kz = Store.get('coachKZ', 'both');
    this.render();
  },
  toggle() {
    if (!Data.bars.length) return UI.toast('Nạp dữ liệu (CSV hoặc demo) trước');
    this.on = !this.on; this.cur = null; this.ann = [];
    if (this.on) {
      this.build(); this.seek();
      if (Lab.show.lv) Lab.toggle('lv'); if (Lab.show.fvg) Lab.toggle('fvg');
      UI.toast('Đã tắt "Mức thanh khoản" và "FVG" tự động để bạn tự xác định. Bật lại bất cứ lúc nào.', 5000);
    }
    this.render();
  },
  setKZ(v) { this.P.kz = v; Store.set('coachKZ', v); if (this.on) { this.build(); this.seek(); } this.render(); },
  seek() { const i = Lab.idx; this.ptr = this.ev.findIndex(e => e.i >= i); if (this.ptr < 0) this.ptr = this.ev.length; },
  dataChanged() { if (!this.hist) return; this.cur = null; this.ann = []; if (this.on) { this.build(); this.seek(); } this.render(); },
  jumped() { if (this.cur && !this.cur.done) this.cur = null; this.ann = []; if (this.on) this.seek(); this.render(); },
  blocking() { return this.on && !this.ffwd && !!this.cur && !this.cur.done; },
  hit(i) {
    if (!this.on || this.ffwd) return false;
    while (this.ptr < this.ev.length && this.ev[this.ptr].i < i) this.ptr++;
    if (this.ptr < this.ev.length && this.ev[this.ptr].i === i) { this.start(this.ev[this.ptr++]); return true; }
    return false;
  },
  next() {
    if (!this.on) return;
    if (this.blocking()) return UI.toast('Trả lời xong câu hỏi hiện tại trước');
    this.cur = null;
    Lab.stopPlay(); let n = 0;
    while (!this.cur && Lab.idx < Data.bars.length && n < 60000) { Lab.step(true); n++; }
    Lab.rebuild(); Lab.chart.timeScale().scrollToRealTime();
    if (!this.cur) UI.toast('Không còn điểm câu hỏi nào phía sau. Chọn ngày khác hoặc nạp thêm dữ liệu.');
    this.render();
  },

  /* ---------- phân tích cố định (chỉ dùng dữ liệu tới thời điểm đang xem) ---------- */
  bias(k) {
    const pd = Data.prev(k); if (!pd) return { v: 0, txt: 'Chưa đủ dữ liệu D1.' };
    let q = pd; for (let n = 0; n < 3; n++) q = Data.prev(q.key) || q;
    const above = pd.c > pd.ema, rising = pd.ema > q.ema;
    const v = above && rising ? 1 : !above && !rising ? -1 : 0;
    return { v, txt: `Nến D1 hôm trước đóng cửa ${f2(pd.c)}, ${above ? 'TRÊN' : 'DƯỚI'} EMA20 (${f2(pd.ema)}); EMA20 ${rising ? 'dốc LÊN' : 'dốc XUỐNG'} so với 3 ngày trước (${f2(q.ema)}). ${v === 1 ? '→ Bias TĂNG.' : v === -1 ? '→ Bias GIẢM.' : '→ Hai tín hiệu ngược nhau: ĐI NGANG / chưa rõ.'}` };
  },
  h4(i) {
    const B = Data.bars, t0 = B[i].t - 50 * 14400; let j = i; while (j > 0 && B[j - 1].t >= t0) j--;
    const H = [];
    for (let x = j; x <= i; x++) {
      const bk = Data.bucket(B[x].t, 14400), l = H[H.length - 1];
      if (l && l.bk === bk) { l.h = Math.max(l.h, B[x].h); l.l = Math.min(l.l, B[x].l); } else H.push({ bk, h: B[x].h, l: B[x].l });
    }
    const sh = [], sl = [];
    for (let x = 2; x < H.length - 2; x++) {
      if (H[x].h >= Math.max(H[x - 1].h, H[x - 2].h, H[x + 1].h, H[x + 2].h)) sh.push(H[x].h);
      if (H[x].l <= Math.min(H[x - 1].l, H[x - 2].l, H[x + 1].l, H[x + 2].l)) sl.push(H[x].l);
    }
    if (sh.length < 2 || sl.length < 2) return { v: 0, txt: 'Chưa đủ đỉnh/đáy H4 để kết luận.' };
    const [h1, h2] = sh.slice(-2), [l1, l2] = sl.slice(-2);
    const v = h2 > h1 && l2 > l1 ? 1 : h2 < h1 && l2 < l1 ? -1 : 0;
    return { v, txt: `2 đỉnh swing H4 gần nhất: ${f2(h1)} → ${f2(h2)} (${h2 > h1 ? 'HH' : 'LH'}); 2 đáy: ${f2(l1)} → ${f2(l2)} (${l2 > l1 ? 'HL' : 'LL'}). ${v === 1 ? '→ HH + HL = TĂNG.' : v === -1 ? '→ LH + LL = GIẢM.' : '→ Lẫn lộn = ĐI NGANG.'} (Swing = nến H4 cao/thấp nhất so với 2 nến mỗi bên.)` };
  },
  levels(i) {
    const B = Data.bars, k = Data.key[i], D = Data.days[k], pd = Data.prev(k), L = [];
    if (pd) L.push({ n: 'PDH', p: pd.h, s: 1, from: D.first }, { n: 'PDL', p: pd.l, s: -1, from: D.first });
    if (D.aDone >= 0 && i >= D.aDone) L.push({ n: 'Đỉnh Á', p: D.aH, s: 1, from: D.aDone }, { n: 'Đáy Á', p: D.aL, s: -1, from: D.aDone });
    if (D.lDone >= 0 && i >= D.lDone) L.push({ n: 'Đỉnh London', p: D.lH, s: 1, from: D.lDone }, { n: 'Đáy London', p: D.lL, s: -1, from: D.lDone });
    L.forEach(l => { l.taken = false; for (let j = l.from; j <= i; j++) if (l.s === 1 ? B[j].h > l.p : B[j].l < l.p) { l.taken = true; break; } });
    return L;
  },
  sim(d, e, sl, tp, i0) {
    const B = Data.bars, k0 = Data.key[i0], r = Math.abs(e - sl); let fill = null;
    for (let j = i0 + 1; j < B.length; j++) {
      const b = B[j], m = Data.nym[j], newDay = Data.key[j] !== k0;
      if (fill == null) {
        if (newDay || !T.inKZ(m)) return { res: 'Không khớp — hết killzone, hủy lệnh chờ', R: 0, fill: null, end: j };
        const f = d === 1 ? b.l <= e : b.h >= e, th = d === 1 ? b.h >= tp : b.l <= tp;
        if (!f && th) return { res: 'Không khớp — giá chạy tới TP trước, hủy lệnh', R: 0, fill: null, end: j };
        if (!f) continue;
        fill = j;
        if (d === 1 ? b.l <= sl : b.h >= sl) return { res: 'Chạm SL', R: -1, fill, end: j, exit: sl };
        continue;
      }
      if (d === 1 ? b.l <= sl : b.h >= sl) return { res: 'Chạm SL', R: -1, fill, end: j, exit: sl };
      if (d === 1 ? b.h >= tp : b.l <= tp) return { res: 'Chạm TP', R: +((tp - e) * d / r).toFixed(2), fill, end: j, exit: tp };
      if (newDay || (m >= this.P.exitMin && m < 1200)) return { res: 'Đóng cuối phiên NY', R: +((b.c - e) * d / r).toFixed(2), fill, end: j, exit: b.c };
    }
    return { res: 'Hết dữ liệu', R: 0, fill, end: B.length - 1 };
  },
  build() {
    const B = Data.bars, P = this.P, ev = [];
    const KZ = P.kz === 'ny' ? [[420, 600]] : P.kz === 'ldn' ? [[120, 300]] : [[120, 300], [420, 600]];
    const kzOf = m => KZ.find(([s, e]) => m >= s && m < e);
    const cum = [0]; B.forEach((b, i) => cum.push(cum[i] + Math.abs(b.c - b.o)));
    const avgBody = i => { const a = Math.max(0, i - 20); return (cum[i] - cum[a]) / ((i - a) || 1); };
    let dayK = null, D = null, lv = [], setup = null, busy = -1, traded = false, prevKz = null, bias = 0;
    for (let i = 31; i < B.length; i++) {
      const b = B[i], k = Data.key[i], m = Data.nym[i];
      if (k !== dayK) {
        dayK = k; D = Data.days[k]; lv = []; setup = null; traded = false; bias = this.bias(k).v;
        const pd = Data.prev(k); if (pd) lv.push({ n: 'PDH', p: pd.h, s: 1 }, { n: 'PDL', p: pd.l, s: -1 });
      }
      if (i === D.aDone) lv.push({ n: 'Đỉnh Á', p: D.aH, s: 1 }, { n: 'Đáy Á', p: D.aL, s: -1 });
      if (i === D.lDone) lv.push({ n: 'Đỉnh London', p: D.lH, s: 1 }, { n: 'Đáy London', p: D.lL, s: -1 });
      const kz = kzOf(m);
      if (kz && kz !== prevKz && Data.prev(k) && !traded && i > busy) ev.push({ type: 'ctx', i: i - 1, kz: kz[0] });
      prevKz = kz;
      if (setup) {
        const d = setup.dir; setup.n++;
        setup.ext = d === 1 ? Math.min(setup.ext, b.l) : Math.max(setup.ext, b.h);
        const brk = d === 1 ? b.c > setup.mss : b.c < setup.mss;
        if (brk && Math.abs(b.c - b.o) >= P.disp * avgBody(i)) {
          let F = null;
          for (let j = i; j >= setup.i + 1 && !F; j--) {
            if (d === 1 && B[j].l > B[j - 2].h) F = { lo: B[j - 2].h, hi: B[j].l, j: j - 1 };
            if (d === -1 && B[j].h < B[j - 2].l) F = { lo: B[j].h, hi: B[j - 2].l, j: j - 1 };
          }
          const e = { type: 'mss', i, dir: d, sw: setup.sw, mss: setup.mss, ext: setup.ext, F, inKZ: !!kz, bias };
          if (F) {
            const entry = +((F.lo + F.hi) / 2).toFixed(2), sl = +(d === 1 ? setup.ext - P.buf : setup.ext + P.buf).toFixed(2), r = Math.abs(entry - sl);
            const cand = lv.filter(L => !L.taken && L.s === d && (L.p - entry) * d >= 2 * r).sort((a, c) => (a.p - c.p) * d)[0];
            const tp = +(cand ? cand.p : entry + d * 2 * r).toFixed(2);
            e.trade = { entry, sl, tp, tpn: cand ? cand.n : '2R cố định', r };
            e.closeOk = d === 1 ? b.c > entry : b.c < entry;
            e.slOk = r > 0.05 && r <= P.maxSL;
            e.take = e.inKZ && e.closeOk && e.slOk && bias !== -d;
            e.sim = this.sim(d, entry, sl, tp, i);
            if (e.take) { busy = e.sim.end; if (e.sim.fill != null) traded = true; }
          } else e.take = false;
          ev.push(e); setup = null;
        } else if (setup.n > P.wait) { ev.push({ type: 'expire', i, sw: setup.sw, mss: setup.mss, dir: d }); setup = null; }
      }
      for (const L of lv) {
        if (L.taken || !(L.s === 1 ? b.h > L.p : b.l < L.p)) continue;
        L.taken = true;
        if (kz && i > busy && !traded && !setup) {
          const dir = -L.s; let mss = dir === 1 ? -Infinity : Infinity;
          for (let j = Math.max(0, i - P.look); j < i; j++) mss = dir === 1 ? Math.max(mss, B[j].h) : Math.min(mss, B[j].l);
          const sw = { type: 'sweep', i, L: { n: L.n, p: L.p, s: L.s }, dir, mss, bias };
          ev.push(sw); setup = { dir, ext: dir === 1 ? b.l : b.h, mss, i, n: 0, sw };
        }
      }
    }
    this.ev = ev;
  },

  /* ---------- câu hỏi ---------- */
  shuf(o, a, seed) {
    const idx = o.map((_, i) => i); let s = seed * 9301 + 49297;
    for (let i = idx.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return { o: idx.map(i => o[i]), a: idx.indexOf(a) };
  },
  mc(q, o, a, e, seed, fixed) { const s = fixed ? { o, a } : this.shuf(o, a, seed); return { k: 'mc', q, o: s.o, a: s.a, e }; },
  makeSteps(ev) {
    const B = Data.bars, i = ev.i, b = B[i], k = Data.key[i], S = [];
    if (ev.type === 'ctx') {
      const kzn = ev.kz === 120 ? 'London' : 'NY AM', c = this.levels(i), bi = this.bias(k), h4 = this.h4(i), px = b.c, pd = Data.prev(k);
      const head = `⏰ <b>Sắp mở ${kzn} Killzone</b>. Giá hiện tại <b class="mono">${f2(px)}</b>. Đọc bối cảnh trước khi xem nến tiếp theo — có thể đổi sang khung D1/H4 để xem.`;
      S.push(this.mc('Xu hướng D1 (bias ngày) đang là gì?', ['TĂNG — ưu tiên MUA', 'GIẢM — ưu tiên BÁN', 'ĐI NGANG / chưa rõ'], bi.v === 1 ? 0 : bi.v === -1 ? 1 : 2, bi.txt + ' Quy tắc cố định của bài: giá đóng cửa so với EMA20 + độ dốc EMA20.', i, true));
      S.push(this.mc('Cấu trúc H4 gần nhất?', ['TĂNG (HH + HL)', 'GIẢM (LH + LL)', 'ĐI NGANG / lẫn lộn'], h4.v === 1 ? 0 : h4.v === -1 ? 1 : 2, h4.txt, i, true));
      if (pd) {
        const mid = (pd.h + pd.l) / 2, prem = px > mid;
        S.push(this.mc('So với range hôm qua (PDL–PDH), giá đang ở vùng nào?', [`PREMIUM (trên 50%) — đắt, ưu tiên tìm điểm BÁN`, `DISCOUNT (dưới 50%) — rẻ, ưu tiên tìm điểm MUA`], prem ? 0 : 1, `Range hôm qua ${f2(pd.l)} – ${f2(pd.h)}, mức 50% = ${f2(mid)}. Giá ${f2(px)} ${prem ? 'TRÊN' : 'DƯỚI'} 50% → ${prem ? 'Premium' : 'Discount'}. Tip: dùng công cụ Fibo kéo từ PDL lên PDH để thấy ngay.`, i, true));
      }
      const open = c.filter(l => !l.taken);
      if (open.length) S.push({ k: 'drawLv', levels: c, q: `Dùng công cụ <b>— Đường ngang</b> đánh dấu các mức thanh khoản <b>CHƯA bị lấy</b> (PDH/PDL, Đỉnh/Đáy phiên Á${c.some(l => /London/.test(l.n)) ? ', Đỉnh/Đáy London' : ''}). Sai số cho phép ±${this.P.tolLv}$.` });
      const up = open.filter(l => l.p > px).sort((a, z) => a.p - z.p), dw = open.filter(l => l.p < px).sort((a, z) => z.p - a.p);
      const lab = l => `${l.n} (${f2(l.p)})`;
      const pool = c.map(lab);
      if (up.length) {
        const o = [lab(up[0]), ...pool.filter(x => x !== lab(up[0]))].slice(0, 4);
        S.push(this.mc('Thanh khoản bên MUA (BSL) gần nhất PHÍA TRÊN giá — nơi giá có thể chạy tới để lấy stop của phe bán?', o, 0, `BSL gần nhất chưa bị lấy: ${lab(up[0])}. ${up.length > 1 ? 'Xa hơn: ' + up.slice(1).map(lab).join(', ') + '.' : ''} Mức đã bị giá vượt qua trong ngày thì không còn thanh khoản.`, i + 1));
      }
      if (dw.length) {
        const o = [lab(dw[0]), ...pool.filter(x => x !== lab(dw[0]))].slice(0, 4);
        S.push(this.mc('Thanh khoản bên BÁN (SSL) gần nhất PHÍA DƯỚI giá?', o, 0, `SSL gần nhất chưa bị lấy: ${lab(dw[0])}. ${dw.length > 1 ? 'Xa hơn: ' + dw.slice(1).map(lab).join(', ') + '.' : ''}`, i + 2));
      }
      S.push(this.mc(`Kế hoạch cho ${kzn} Killzone?`, ['Chờ giá QUÉT SSL phía dưới → MSS tăng → Buy limit ở FVG', 'Chờ giá QUÉT BSL phía trên → MSS giảm → Sell limit ở FVG', 'Chờ quét bất kỳ phía nào rồi đi theo MSS (bias chưa rõ)', 'Vào lệnh ngay khi mở killzone theo hướng nến đang chạy'], bi.v === 1 ? 0 : bi.v === -1 ? 1 : 2, `Bias D1 ${bi.v === 1 ? 'TĂNG → chỉ tìm MUA sau khi quét SSL' : bi.v === -1 ? 'GIẢM → chỉ tìm BÁN sau khi quét BSL' : 'chưa rõ → chỉ vào khi có cú quét + MSS rõ, giảm rủi ro'}. Không bao giờ vào lệnh chỉ vì "đã tới giờ".`, i, true));
      return { head, steps: S, show: () => [] };
    }
    if (ev.type === 'sweep') {
      const L = ev.L, back = L.s === 1 ? b.c < L.p : b.c > L.p, against = ev.bias === -ev.dir;
      const head = `⚡ <b>Nến vừa đóng cửa</b> lúc ${T.fmt(b.t, false)} VN: H <span class="mono">${f2(b.h)}</span> · L <span class="mono">${f2(b.l)}</span> · C <span class="mono">${f2(b.c)}</span>. Giá đang trong killzone.`;
      S.push(this.mc('Nến vừa rồi đã làm gì?', [`Quét ${L.n} (${f2(L.p)}) — râu vượt qua rồi đóng cửa quay lại`, `Phá vỡ ${L.n} (${f2(L.p)}) — đóng cửa vượt hẳn qua mức`, 'Tạo MSS — đảo chiều cấu trúc', 'Không chạm mức thanh khoản nào'], back ? 0 : 1,
        `${L.s === 1 ? 'High' : 'Low'} nến = ${f2(L.s === 1 ? b.h : b.l)} vượt ${L.n} ${f2(L.p)}; đóng cửa ${f2(b.c)} ${back ? 'QUAY LẠI bên trong → cú quét điển hình' : 'NẰM NGOÀI mức → chưa quay lại; vẫn là lấy thanh khoản, nhưng phải chờ MSS ngược lại mới xác nhận là quét'}. ${L.s === 1 ? 'Trên đỉnh là stop của phe bán (BSL).' : 'Dưới đáy là stop của phe mua (SSL).'}`, i));
      S.push(this.mc('Bây giờ làm gì?', [`Chờ MSS ${ev.dir === 1 ? 'TĂNG' : 'GIẢM'}: nến thân lớn đóng cửa ${ev.dir === 1 ? 'TRÊN' : 'DƯỚI'} ${f2(ev.mss)}, để lại FVG`, `Vào ${dn(ev.dir)} market ngay vì đã quét`, `Vào ${dn(-ev.dir)} theo hướng phá vỡ`, `Không giao dịch: hướng đảo chiều (${dn(ev.dir)}) ngược bias D1`], against ? 3 : 0,
        against ? `Bias D1 đang ${ev.bias === 1 ? 'TĂNG' : 'GIẢM'}, còn cú quét này mở ra setup ${dn(ev.dir)} → ngược xu hướng lớn, Mô hình A bỏ qua.` : `Quét chỉ là "nhiên liệu". Cần xác nhận bằng MSS: nến thân lớn đóng cửa qua swing gần nhất (${f2(ev.mss)} = ${ev.dir === 1 ? 'đỉnh cao nhất' : 'đáy thấp nhất'} của ${this.P.look} nến trước cú quét) trong ${this.P.wait} nến tới.`, i, true));
      return { head, steps: S, show: () => [{ t: 'h', p: L.p, c: '#f2a33a', label: 'Bị quét: ' + L.n }, { t: 'h', p: ev.mss, c: '#c084fc', label: 'Mức MSS cần phá' }] };
    }
    if (ev.type === 'expire') {
      const head = `⌛ Đã ${this.P.wait} nến kể từ cú quét ${ev.sw.L.n} mà chưa có nến displacement đóng cửa qua ${f2(ev.mss)}.`;
      S.push(this.mc('Xử lý setup này thế nào?', ['Hủy setup, chờ cú quét khác', `Vào ${dn(ev.dir)} vì đã có cú quét`, 'Dời mức MSS xuống/lên cho dễ phá'], 0, 'Không có MSS = không có xác nhận đảo chiều. Hủy và chờ, không "đoán đáy/đỉnh".', i, true));
      return { head, steps: S, show: () => [{ t: 'h', p: ev.mss, c: '#c084fc', label: 'MSS chưa bị phá' }] };
    }
    // ---- MSS
    const F = ev.F, tr = ev.trade, d = ev.dir, pd = Data.prev(k), mid = pd ? (pd.h + pd.l) / 2 : null;
    const ref = tr ? tr.entry : b.c, pdOk = mid == null ? false : d === 1 ? ref < mid : ref > mid;
    const head = `🔥 <b>Nến vừa đóng cửa ${d === 1 ? 'TRÊN' : 'DƯỚI'} ${f2(ev.mss)}</b> với thân lớn sau cú quét ${ev.sw.L.n} (${T.fmt(b.t, false)} VN, C <span class="mono">${f2(b.c)}</span>).`;
    S.push({
      k: 'multi', q: 'Tick TẤT CẢ yếu tố ĐANG CÓ (bỏ trống những yếu tố không có):', items: [
        { t: 'Đang trong killzone', v: ev.inKZ, why: ev.inKZ ? 'Nến MSS nằm trong killzone.' : 'Đã ra khỏi killzone.' },
        { t: `Đã quét thanh khoản (${ev.sw.L.n})`, v: true, why: `Cú quét lúc ${T.fmt(Data.bars[ev.sw.i].t, false)}.` },
        { t: `Displacement + MSS: thân lớn đóng cửa qua ${f2(ev.mss)}`, v: true, why: `Thân nến ≥ ${this.P.disp}× thân trung bình 20 nến, đóng cửa ${f2(b.c)}.` },
        { t: `Có FVG ${d === 1 ? 'tăng' : 'giảm'} chưa bị lấp`, v: !!F, why: F ? `FVG ${f2(F.lo)} – ${f2(F.hi)}.` : 'Nhịp phá không để lại khoảng trống giữa nến 1 và nến 3.' },
        { t: `Cùng hướng bias D1 (${dn(d)})`, v: ev.bias === d, why: ev.bias === d ? 'Bias D1 cùng hướng.' : ev.bias === 0 ? 'Bias D1 đi ngang — không tính là cùng hướng.' : 'Bias D1 ngược hướng.' },
        { t: `Điểm vào nằm trong vùng ${d === 1 ? 'Discount' : 'Premium'} của range hôm qua`, v: pdOk, why: mid == null ? 'Không có dữ liệu hôm qua.' : `50% range hôm qua = ${f2(mid)}, điểm vào ${f2(ref)}.` },
      ],
    });
    if (F) S.push({ k: 'drawBox', F, q: `Dùng công cụ <b>▭ Vùng</b> vẽ hộp bao FVG mà nhịp phá vừa để lại (từ ${d === 1 ? 'High nến 1 tới Low nến 3' : 'Low nến 1 tới High nến 3'}).` });
    const why = [];
    if (!F) why.push('không có FVG để đặt lệnh limit');
    if (!ev.inKZ) why.push('đã ngoài killzone');
    if (F && !ev.closeOk) why.push('giá đã chạy qua điểm vào');
    if (F && !ev.slOk) why.push(`SL ${f2(tr.r)}$ quá rộng (> ${this.P.maxSL}$)`);
    if (ev.bias === -d) why.push('ngược bias D1');
    S.push(this.mc('Quyết định?', [`Đặt ${d === 1 ? 'Buy' : 'Sell'} LIMIT trong FVG, SL sau râu quét`, 'Bỏ qua setup này', `Vào ${dn(d)} MARKET ngay để không lỡ`], ev.take ? 0 : 1,
      ev.take ? `Đủ điều kiện Mô hình A: killzone + quét ${ev.sw.L.n} + displacement/MSS + FVG${ev.bias === d ? ' + cùng bias D1' : ' (bias đi ngang nên chấp nhận, giảm kỳ vọng)'}. Vào bằng LIMIT ở CE, không đuổi giá.` : 'Bỏ vì: ' + why.join('; ') + '.', i, true));
    if (F && ev.take) S.push({ k: 'order', ev });
    S.push({ k: 'result', ev });
    return { head, steps: S, show: () => F ? [{ t: 'box', i0: F.j - 1, i1: i, top: F.hi, bot: F.lo, c: d === 1 ? '#22c58b' : '#f0506e', label: 'FVG' }, { t: 'h', p: ev.mss, c: '#c084fc', label: 'MSS' }] : [{ t: 'h', p: ev.mss, c: '#c084fc', label: 'MSS' }] };
  },
  start(ev) {
    const m = this.makeSteps(ev);
    this.cur = { ev, head: m.head, steps: m.steps, show: m.show, s: 0, done: false, pts: 0, n: 0 };
    this.ann = []; this.hist.ev++; Store.set('coachHist', this.hist);
    this.render();
    const box = $('#coachBox'); if (box) box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  },
  score(ok) { const C = this.cur; C.n++; this.sess.n++; this.hist.n++; if (ok) { C.pts++; this.sess.ok++; this.hist.ok++; } Store.set('coachHist', this.hist); },
  step() { return this.cur && this.cur.steps[this.cur.s]; },
  ans(j) { const st = this.step(); if (!st || st.u != null) return; st.u = j; this.score(j === st.a); this.render(); },
  check() {
    const st = this.step(); if (!st || st.res) return;
    if (st.k === 'multi') {
      st.u = $$('#coachBox .cm input').map(x => x.checked);
      st.res = st.items.map((it, j) => st.u[j] === it.v); this.score(st.res.every(Boolean));
    } else if (st.k === 'drawLv') {
      const H = Draw.items.filter(d => d.type === 'hline').map(d => d.a.p);
      st.res = st.levels.filter(l => !l.taken).map(l => { const near = H.length ? H.reduce((a, p) => Math.abs(p - l.p) < Math.abs(a - l.p) ? p : a) : null; return { l, near, ok: near != null && Math.abs(near - l.p) <= this.P.tolLv }; });
      this.score(st.res.every(r => r.ok));
      this.ann = st.levels.map(l => ({ t: 'h', p: l.p, c: l.taken ? '#6b7280' : '#e8b84a', label: l.n + (l.taken ? ' (đã bị lấy)' : '') }));
    } else if (st.k === 'drawBox') {
      const F = st.F, bx = Draw.items.filter(d => d.type === 'box');
      let best = 0;
      bx.forEach(d => { const hi = Math.max(d.a.p, d.b.p), lo = Math.min(d.a.p, d.b.p), inter = Math.max(0, Math.min(hi, F.hi) - Math.max(lo, F.lo)), uni = Math.max(hi, F.hi) - Math.min(lo, F.lo); best = Math.max(best, uni > 0 ? inter / uni : 0); });
      st.res = { iou: best, ok: best >= 0.4, none: !bx.length }; this.score(st.res.ok);
      this.ann = this.cur.show();
    } else if (st.k === 'order') {
      const e = +$('#cE').value, s = +$('#cS').value, t = +$('#cT').value, ev = st.ev, d = ev.dir, F = ev.F;
      if (!e || !s || !t) return UI.toast('Nhập đủ Entry, SL, TP');
      const dirOk = d === 1 ? s < e && e < t : t < e && e < s, rr = Math.abs(t - e) / Math.abs(e - s);
      const c = [
        { t: `Đúng chiều lệnh ${dn(d)} (${d === 1 ? 'SL < Entry < TP' : 'TP < Entry < SL'})`, ok: dirOk },
        { t: `Entry nằm trong FVG ${f2(F.lo)} – ${f2(F.hi)}`, ok: e >= F.lo - 0.3 && e <= F.hi + 0.3 },
        { t: `SL ${d === 1 ? 'dưới' : 'trên'} râu quét ${f2(ev.ext)}, đệm ≤ 3$`, ok: d === 1 ? s < ev.ext && ev.ext - s <= 3 : s > ev.ext && s - ev.ext <= 3 },
        { t: `RR ≥ 2 (của bạn: ${isFinite(rr) ? rr.toFixed(2) : '—'})`, ok: rr >= 2 },
      ];
      st.res = { c, e, s, t, sim: dirOk ? this.sim(d, e, s, t, ev.i) : null }; this.score(c.every(x => x.ok));
      if (st.res.sim && st.res.sim.fill != null) Journal.add({ src: 'coach', sess: Lab.sessionId, data: Data.name, t: Data.bars[st.res.sim.fill].t, tExit: Data.bars[st.res.sim.end].t, dir: d, setup: 'A', entry: e, sl: s, tp: t, exit: st.res.sim.exit, R: st.res.sim.R, outcome: st.res.sim.res, chk: c.filter(x => x.ok).length + 5, note: 'Huấn luyện: quét ' + ev.sw.L.n });
    }
    this.render();
  },
  skipDraw() { const st = this.step(); if (!st) return; st.skip = true; this.check(); },
  fromTicket() { $('#cE').value = $('#ordEntry').value; $('#cS').value = $('#ordSL').value; $('#cT').value = $('#ordTP').value; },
  nxt() {
    const C = this.cur; if (!C) return;
    if (C.s < C.steps.length - 1) { C.s++; if (C.steps[C.s].k === 'result') this.ann = C.show(); this.render(); return; }
    this.finish();
  },
  finish() { const C = this.cur; if (!C) return; const a = C.show(); if (a.length) this.ann = a; this.cont(); },
  cont() { this.cur = null; this.render(); },
  playOut() {
    const C = this.cur, ev = C.ev; if (!ev.sim) return;
    const ord = C.steps.find(s => s.k === 'order'), us = ord && ord.res && ord.res.sim;
    const end = Math.max(ev.sim.end, us ? us.end : 0);
    Lab.stopPlay(); C.done = true; this.ffwd = true;
    while (Lab.idx <= Math.min(Data.bars.length - 1, end + 8)) Lab.step(true);
    this.ffwd = false; this.seek();
    const B = Data.bars, tr = ev.trade;
    if (ev.sim.fill != null) Lab.marks.push({ t: B[ev.sim.fill].t, d: ev.dir, k: 'in' }, { t: B[ev.sim.end].t, d: ev.dir, k: 'out', R: ev.sim.R });
    Lab.review = { t0: B[ev.i].t, t1: B[ev.sim.end].t, entry: tr.entry, sl: tr.sl, tp: tr.tp };
    C.played = true; C.done = true;
    Lab.rebuild(); Lab.chart.timeScale().scrollToRealTime(); this.render();
  },

  /* ---------- giao diện ---------- */
  render() {
    const el = $('#coachBox'); if (!el) return;
    const H = this.hist, pct = H.n ? Math.round(H.ok / H.n * 100) : 0;
    const top = `<div class="row" style="justify-content:space-between"><h4 style="margin:0">🎓 Huấn luyện thực chiến</h4><button class="btn sm ${this.on ? 'on' : 'pri'}" onclick="Coach.toggle()">${this.on ? '✓ Đang bật' : 'Bật'}</button></div>`;
    const score = `<div class="muted" style="font-size:12px;margin:6px 0">Phiên này: <b style="color:var(--text)">${this.sess.ok}/${this.sess.n}</b> · Tổng: <b style="color:var(--text)">${H.ok}/${H.n}</b> (${pct}%)</div>`;
    if (!this.on) {
      el.innerHTML = top + `<p class="muted" style="font-size:12.5px;margin:8px 0">Replay sẽ <b>tự dừng ở các điểm cố định</b>: trước mỗi killzone, khi có cú quét thanh khoản, khi có MSS. Mỗi lần dừng, bạn trả lời: xu hướng D1/H4, Premium/Discount, vẽ mức thanh khoản, các yếu tố vào lệnh, vẽ FVG, đặt Entry/SL/TP. Hệ thống chấm đúng/sai rồi tua tới kết quả thật.</p>
        <label class="f">Killzone luyện tập</label><select onchange="Coach.setKZ(this.value)"><option value="both">London + NY AM</option><option value="ny">Chỉ NY AM</option><option value="ldn">Chỉ London</option></select>` + (H.n ? score : '');
      el.querySelector('select').value = this.P.kz; return;
    }
    const C = this.cur;
    if (!C) {
      const left = this.ev.length - this.ptr, cnt = t => this.ev.slice(this.ptr).filter(e => e.type === t).length;
      el.innerHTML = top + score + `<p class="muted" style="font-size:12.5px;margin:6px 0">Bấm <b>Tới câu hỏi kế</b> hoặc ▶ Chạy — replay tự dừng ở điểm cần quyết định.<br>Còn ${left} điểm: ${cnt('ctx')} bối cảnh · ${cnt('sweep')} cú quét · ${cnt('mss')} MSS.</p>
        <button class="btn pri" style="width:100%" onclick="Coach.next()">⏭ Tới câu hỏi kế</button>`;
      return;
    }
    const st = C.steps[C.s], N = C.steps.filter(s => s.k !== 'result').length, num = Math.min(C.s + 1, N);
    let h = top + score + `<div class="note" style="font-size:12.5px;margin:8px 0">${C.head}</div>`;
    if (st.k !== 'result') h += `<div class="muted" style="font-size:11.5px">Câu ${num}/${N}</div>`;
    const nextBtn = `<button class="btn pri sm" style="margin-top:8px" onclick="Coach.nxt()">${C.s < C.steps.length - 1 ? 'Tiếp →' : 'Xong — tiếp tục replay'}</button>`;
    if (st.k === 'mc') {
      h += `<div class="cq">${st.q}</div>` + st.o.map((o, j) => `<button class="qopt ${st.u == null ? '' : j === st.a ? 'right' : j === st.u ? 'wrong' : ''}" ${st.u != null ? 'disabled' : ''} onclick="Coach.ans(${j})">${esc(o)}</button>`).join('');
      if (st.u != null) h += `<div class="note ${st.u === st.a ? 'ok' : 'bad'}" style="font-size:12.5px">${st.u === st.a ? '✅ Đúng. ' : '❌ Chưa đúng. '}${esc(st.e)}</div>` + nextBtn;
    } else if (st.k === 'multi') {
      h += `<div class="cq">${st.q}</div><div class="cm">` + st.items.map((it, j) => `<label class="${st.res ? (st.res[j] ? 'ok' : 'bad') : ''}"><input type="checkbox" ${st.res ? 'disabled' : ''} ${st.u && st.u[j] ? 'checked' : ''}> <span>${esc(it.t)}${st.res ? `<br><small>${it.v ? 'CÓ' : 'KHÔNG'} — ${esc(it.why)}</small>` : ''}</span></label>`).join('') + '</div>';
      h += st.res ? `<div class="note ${st.res.every(Boolean) ? 'ok' : 'bad'}" style="font-size:12.5px">${st.res.every(Boolean) ? '✅ Xác định đúng toàn bộ.' : `❌ Sai ${st.res.filter(x => !x).length} ý (tô đỏ).`}</div>` + nextBtn : `<button class="btn pri sm" onclick="Coach.check()">Kiểm tra</button>`;
    } else if (st.k === 'drawLv') {
      h += `<div class="cq">${st.q}</div>`;
      if (!st.res) h += `<div class="row"><button class="btn sm" onclick="Draw.set('hline')">— Vẽ đường ngang</button><button class="btn pri sm" onclick="Coach.check()">Kiểm tra hình vẽ</button><button class="btn sm" onclick="Coach.skipDraw()">Xem đáp án</button></div>`;
      else h += `<table class="tbl" style="font-size:12px">${st.res.map(r => `<tr><td>${r.ok ? '✅' : '❌'} ${r.l.n}</td><td class="mono">${f2(r.l.p)}</td><td class="mono muted">${r.near != null ? 'bạn: ' + f2(r.near) : '—'}</td></tr>`).join('')}</table>
        <div class="muted" style="font-size:12px">Đáp án đã vẽ nét đứt trên chart (vàng = còn thanh khoản, xám = đã bị lấy).</div>` + nextBtn;
    } else if (st.k === 'drawBox') {
      h += `<div class="cq">${st.q}</div>`;
      if (!st.res) h += `<div class="row"><button class="btn sm" onclick="Draw.set('box')">▭ Vẽ vùng</button><button class="btn pri sm" onclick="Coach.check()">Kiểm tra hình vẽ</button><button class="btn sm" onclick="Coach.skipDraw()">Xem đáp án</button></div>`;
      else h += `<div class="note ${st.res.ok ? 'ok' : 'bad'}" style="font-size:12.5px">${st.res.ok ? '✅ Vùng của bạn trùng FVG' : st.res.none ? '❌ Chưa có hộp nào trên chart' : '❌ Vùng lệch so với FVG'} (độ trùng ${Math.round(st.res.iou * 100)}%, cần ≥ 40%). FVG đúng: <b class="mono">${f2(st.F.lo)} – ${f2(st.F.hi)}</b>, CE = ${f2((st.F.lo + st.F.hi) / 2)}. Đã vẽ trên chart.</div>` + nextBtn;
    } else if (st.k === 'order') {
      const ev = st.ev, tr = ev.trade, R = st.res;
      h += `<div class="cq">Đặt lệnh ${dn(ev.dir)} LIMIT của bạn (dùng 🎯 trên phiếu lệnh rồi bấm "Lấy từ phiếu", hoặc gõ số):</div>
        <div class="row"><div><label class="f">Entry</label><input type="number" step="0.01" id="cE" value="${R ? R.e : ''}"></div><div><label class="f">SL</label><input type="number" step="0.01" id="cS" value="${R ? R.s : ''}"></div><div><label class="f">TP</label><input type="number" step="0.01" id="cT" value="${R ? R.t : ''}"></div></div>`;
      if (!R) h += `<div class="row" style="margin-top:8px"><button class="btn sm" onclick="Coach.fromTicket()">Lấy từ phiếu lệnh</button><button class="btn pri sm" onclick="Coach.check()">Chấm lệnh</button></div>`;
      else h += `<div style="margin-top:8px;font-size:12.5px">${R.c.map(x => `<div>${x.ok ? '✅' : '❌'} ${esc(x.t)}</div>`).join('')}</div>
        <div class="note" style="font-size:12.5px"><b>Lệnh mẫu (mức cố định):</b> Entry CE <b class="mono">${f2(tr.entry)}</b> · SL <b class="mono">${f2(tr.sl)}</b> (râu ${f2(ev.ext)} ${ev.dir === 1 ? '−' : '+'} ${this.P.buf}$) · TP <b class="mono">${f2(tr.tp)}</b> (${esc(tr.tpn)}) · RR ${(Math.abs(tr.tp - tr.entry) / tr.r).toFixed(2)}</div>` + nextBtn;
    } else if (st.k === 'result') {
      const ev = st.ev, tr = ev.trade, ord = C.steps.find(s => s.k === 'order'), us = ord && ord.res && ord.res.sim;
      const pts = `<div style="margin:8px 0">Điểm điểm dừng này: <b>${C.pts}/${C.n}</b></div>`;
      if (!tr) h += `<div class="note">Không có FVG → không có lệnh mẫu.</div>` + pts;
      else {
        h += `<div class="note ${ev.take ? '' : 'warn'}" style="font-size:12.5px">${ev.take ? '<b>Lệnh mẫu</b>' : '<b>Nếu vẫn vào</b> (để bạn thấy vì sao nên bỏ)'}: ${dn(ev.dir)} ${f2(tr.entry)} · SL ${f2(tr.sl)} · TP ${f2(tr.tp)}<br>→ ${C.played ? `<b class="${ev.sim.R > 0 ? 'pos' : ev.sim.R < 0 ? 'neg' : ''}">${esc(ev.sim.res)}${ev.sim.fill != null ? ' (' + fR(ev.sim.R) + ')' : ''}</b>` : '<i>bấm nút dưới để tua tới kết quả</i>'}</div>`;
        if (us && C.played) h += `<div class="note" style="font-size:12.5px"><b>Lệnh của bạn:</b> ${esc(us.res)}${us.fill != null ? ' (' + fR(us.R) + ') — đã ghi vào Nhật ký' : ''}</div>`;
        h += pts + (C.played ? '' : `<button class="btn pri sm" onclick="Coach.playOut()">▶ Tua tới kết quả</button> `);
      }
      h += `<button class="btn sm" onclick="Coach.cont()">Tiếp tục replay</button>`;
    }
    el.innerHTML = h;
  },
  renderAnn(g, X, Y, W) {
    g.font = '11px Be Vietnam Pro, sans-serif';
    for (const a of this.ann) {
      if (a.t === 'h') {
        const y = Y(a.p); if (y == null) continue;
        g.strokeStyle = a.c; g.lineWidth = 1.5; g.setLineDash([6, 4]); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); g.setLineDash([]);
        const tw = g.measureText(a.label).width; g.fillStyle = rgba(a.c, 0.9); g.fillRect(W - tw - 120, y - 15, tw + 10, 14); g.fillStyle = '#0b0f17'; g.fillText(a.label, W - tw - 115, y - 4);
      } else if (a.t === 'box') {
        const ai = i => { const bk = Data.bucket(Data.bars[i].t, Lab.tf); let lo = 0, hi = Lab.agg.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (Lab.agg[m].bk < bk) lo = m + 1; else hi = m; } return lo; };
        const x0 = X(ai(a.i0) - 0.45), x1 = X(Lab.agg.length - 1 + 6), y0 = Y(a.top), y1 = Y(a.bot);
        if ([x0, x1, y0, y1].some(v => v == null)) continue;
        g.fillStyle = rgba(a.c, 0.22); g.fillRect(x0, y0, x1 - x0, y1 - y0); g.strokeStyle = a.c; g.lineWidth = 1.5; g.setLineDash([6, 4]); g.strokeRect(x0, y0, x1 - x0, y1 - y0); g.setLineDash([]);
        const ce = Y((a.top + a.bot) / 2); g.strokeStyle = rgba('#ffffff', 0.5); g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x0, ce); g.lineTo(x1, ce); g.stroke(); g.setLineDash([]);
        g.fillStyle = a.c; g.fillText(a.label + ' (đáp án)', x0 + 3, y0 - 4);
      }
    }
  },
};
