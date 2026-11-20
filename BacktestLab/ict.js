/* ICT Gold Lab — tự động đánh dấu cấu trúc ICT trên chart (không nhìn trước tương lai):
   • Swing HH/HL/LH/LL  • BOS (phá cấu trúc cùng xu hướng)  • MSS/CHoCH (phá cấu trúc ngược xu hướng = dấu hiệu đảo chiều)
   • FVG (khoảng trống giá 3 nến, chưa lấp = viền đậm)  • CRT (Candle Range Theory trên khung lớn hơn)
   Dùng chung cho Backtest Lab và Plan mỗi ngày. Nến vào: [{o,h,l,c}] theo chỉ số chart. */
'use strict';
const ICT = {
  // Đỉnh/đáy swing: cao/thấp nhất trong n nến mỗi bên. Chỉ "xác nhận" sau n nến → conf = i + n.
  swings(B, n) {
    const out = [];
    for (let i = n; i < B.length - n; i++) {
      let h = true, l = true;
      for (let j = i - n; j <= i + n && (h || l); j++) { if (j === i) continue; if (B[j].h >= B[i].h) h = false; if (B[j].l <= B[i].l) l = false; }
      if (h) out.push({ i, p: B[i].h, k: 'H', conf: i + n });
      if (l) out.push({ i, p: B[i].l, k: 'L', conf: i + n });
    }
    let pH = null, pL = null;   // gán nhãn HH/LH/HL/LL so với swing cùng loại trước đó
    out.forEach(s => { if (s.k === 'H') { s.lab = pH == null ? '' : s.p > pH ? 'HH' : 'LH'; pH = s.p; } else { s.lab = pL == null ? '' : s.p > pL ? 'HL' : 'LL'; pL = s.p; } });
    return out;
  },
  // BOS / MSS: nến ĐÓNG CỬA vượt swing đã xác nhận gần nhất. Ngược xu hướng hiện tại = MSS, cùng xu hướng = BOS.
  structure(B, n) {
    const sw = this.swings(B, n), ev = []; let trend = 0, k = 0, H = null, L = null;
    for (let j = 0; j < B.length; j++) {
      while (k < sw.length && sw[k].conf <= j) { const s = sw[k++]; if (s.k === 'H') H = { ...s }; else L = { ...s }; }
      const c = B[j].c;
      if (H && !H.used && c > H.p) { ev.push({ type: trend === -1 ? 'MSS' : 'BOS', dir: 1, i0: H.i, i1: j, p: H.p }); H.used = true; trend = 1; }
      if (L && !L.used && c < L.p) { ev.push({ type: trend === 1 ? 'MSS' : 'BOS', dir: -1, i0: L.i, i1: j, p: L.p }); L.used = true; trend = -1; }
    }
    return { sw, ev, trend };
  },
  // FVG 3 nến; bỏ khoảng trống quá nhỏ (< 15% biên độ nến TB) để đỡ nhiễu. filled = đã bị giá lấp hoàn toàn.
  fvgs(B, from = 0) {
    const out = [], rng = B.slice(-100).reduce((s, b) => s + b.h - b.l, 0) / Math.max(1, Math.min(100, B.length)), min = rng * 0.15;
    for (let i = Math.max(2, from); i < B.length; i++) {
      const a = B[i - 2], c = B[i];
      if (c.l - a.h > min) out.push({ i0: i - 1, top: c.l, bot: a.h, up: 1 });
      else if (a.l - c.h > min) out.push({ i0: i - 1, top: a.l, bot: c.h, up: 0 });
    }
    out.forEach(f => { f.i1 = B.length - 1; for (let j = f.i0 + 2; j < B.length; j++) { if (f.up ? B[j].l <= f.bot : B[j].h >= f.top) { f.i1 = j; f.filled = 1; break; } if (f.up ? B[j].l < f.top : B[j].h > f.bot) f.part = 1; } });
    return out;
  },
  /* CRT trên khung lớn: nến 1 tạo biên (range), nến 2 QUÉT đỉnh (hoặc đáy) nến 1 rồi ĐÓNG CỬA quay lại trong biên
     → kỳ vọng giá chạy về phía đối diện của biên nến 1. HB: nến khung lớn {t,o,h,l,c} (t = mở nến), tf giây.
     map(nến, 0|1) → chỉ số nến chart lúc nến khung lớn mở (0) / sau khi đóng (1); B: nến chart để theo dõi kết quả. live = nến 2 chưa đóng. */
  crt(HB, tf, map, B, lastClosedIdx) {
    const out = [];
    for (let k = 1; k < HB.length; k++) {
      const c1 = HB[k - 1], c2 = HB[k], live = k > lastClosedIdx;
      let d = 0;
      if (c2.h > c1.h && c2.c < c1.h && c2.c > c1.l) d = -1;
      else if (c2.l < c1.l && c2.c > c1.l && c2.c < c1.h) d = 1;
      if (!d) continue;
      const x = { d, hi: c1.h, lo: c1.l, ext: d === -1 ? c2.h : c2.l, target: d === -1 ? c1.l : c1.h, i0: map(c1, 0), i2: map(c2, 1), live, t1: c1.t };
      x.i1 = Math.min(B.length - 1, x.i2 + 1); x.res = '';
      if (!live) for (let j = x.i2; j < B.length; j++) {
        x.i1 = j;
        if (d === -1 ? B[j].h > x.ext : B[j].l < x.ext) { x.res = 'fail'; break; }
        if (d === -1 ? B[j].l <= x.target : B[j].h >= x.target) { x.res = 'hit'; break; }
      }
      out.push(x);
    }
    return out;
  },
  analyze(B, n, opt = {}) {
    const st = this.structure(B, n);
    return { ...st, px: B.length ? B[B.length - 1].c : 0, fvg:this.fvgs(B, Math.max(2, B.length - (opt.fvgLook || 300))), crt: opt.htf ? this.crt(opt.htf.bars, opt.htf.tf, opt.htf.map, B, opt.htf.lastClosed) : [], htfName: opt.htf ? opt.htf.name : '' };
  },
  // Vẽ lên canvas overlay. X(i) → toạ độ x của nến chỉ số i, Y(p) → toạ độ y của giá p.
  paint(g, X, Y, W, R, show, from = 0, to = 1e9) {
    if (!R) return;
    const txt = (s, x, y, col, al = 'center') => { g.font = '600 10px "Be Vietnam Pro",sans-serif'; g.textAlign = al; g.fillStyle = col; g.fillText(s, x, y); };
    const vis = i => i >= from - 2 && i <= to + 2;
    if (show.crt) R.crt.slice(-4).forEach(c => {
      if (c.i1 < from - 2 || c.i0 > to + 2) return;
      const x0 = X(c.i0 - 0.45), x1 = X(c.i1 + 0.45), yh = Y(c.hi), yl = Y(c.lo), yt = Y(c.target), ye = Y(c.ext); if (x0 == null || x1 == null || yh == null || yl == null) return;
      const col = c.d === 1 ? '34,197,139' : '240,80,110';
      g.fillStyle = `rgba(192,132,252,${c.live ? 0.05 : 0.08})`; g.fillRect(x0, yh, x1 - x0, yl - yh);
      g.setLineDash(c.live ? [2, 3] : [6, 3]); g.strokeStyle = 'rgba(192,132,252,.75)'; g.lineWidth = 1; g.strokeRect(x0, yh, x1 - x0, yl - yh);
      g.setLineDash([2, 2]); g.strokeStyle = `rgba(${col},.9)`; g.beginPath(); g.moveTo(x0, yt); g.lineTo(x1, yt); g.stroke();
      if (ye != null) { g.strokeStyle = 'rgba(138,150,173,.6)'; g.beginPath(); g.moveTo(x0, ye); g.lineTo(x1, ye); g.stroke(); }
      g.setLineDash([]);
      const st = c.live ? ' (chưa đóng)' : c.res === 'hit' ? ' ✓' : c.res === 'fail' ? ' ✗' : ' …';
      txt(`CRT ${R.htfName} ${c.d === 1 ? '▲' : '▼'}${st}`, x0 + 3, (c.d === 1 ? yl : yh) + (c.d === 1 ? 12 : -4), 'rgba(214,170,255,.95)', 'left');
    });
    // FVG: chỉ giữ 4 vùng chưa lấp gần giá nhất mỗi phía + các vùng đã lấp gần đây → đỡ rối
    const px = R.px, open = R.fvg.filter(f => !f.filled), keep = new Set([...open.filter(f => f.bot >= px).sort((a, b) => a.bot - b.bot).slice(0, 4), ...open.filter(f => f.bot < px).sort((a, b) => b.top - a.top).slice(0, 4)]);
    if (show.fvg) R.fvg.forEach(f => {
      if (f.i1 < from - 2 || f.i0 > to + 2 || (f.filled ? f.i1 < to - 60 : !keep.has(f))) return;
      const x0 = X(f.i0 - 0.4), x1 = X(f.i1 + 0.4), y1 = Y(f.top), y2 = Y(f.bot); if (x0 == null || x1 == null || y1 == null || y2 == null) return;
      g.fillStyle = f.up ? `rgba(34,197,139,${f.filled ? 0.1 : 0.22})` : `rgba(240,80,110,${f.filled ? 0.1 : 0.22})`; g.fillRect(x0, Math.min(y1, y2), Math.max(2, x1 - x0), Math.abs(y2 - y1));
      if (!f.filled) { g.strokeStyle = f.up ? 'rgba(34,197,139,.75)' : 'rgba(240,80,110,.75)'; g.lineWidth = 1; g.strokeRect(x0, Math.min(y1, y2), Math.max(2, x1 - x0), Math.abs(y2 - y1));
        const ce = Y((f.top + f.bot) / 2); g.setLineDash([3, 3]); g.strokeStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(x0, ce); g.lineTo(x1, ce); g.stroke(); g.setLineDash([]);
        if (Math.abs(y2 - y1) > 9) txt('FVG', x0 + 2, Math.max(y1, y2) - 2, f.up ? 'rgba(34,197,139,.95)' : 'rgba(240,80,110,.95)', 'left'); }
    });
    if (show.bos) R.ev.forEach(e => {
      if (e.i1 < from - 2 || e.i0 > to + 2) return;
      const x0 = X(e.i0), x1 = X(e.i1), y = Y(e.p); if (x0 == null || x1 == null || y == null) return;
      const mss = e.type === 'MSS', col = e.dir === 1 ? '#22c58b' : '#f0506e';
      g.strokeStyle = col; g.lineWidth = mss ? 1.6 : 1; g.setLineDash(mss ? [] : [4, 3]); g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); g.setLineDash([]);
      txt(e.type === 'MSS' ? 'MSS' : 'BOS', (x0 + x1) / 2, y + (e.dir === 1 ? -4 : 12), mss ? (e.dir === 1 ? '#5ef0b4' : '#ff8aa0') : col);
    });
    if (show.sw) R.sw.forEach(s => {
      if (!vis(s.i) || !s.lab) return;
      const x = X(s.i), y = Y(s.p); if (x == null || y == null) return;
      txt(s.lab, x, y + (s.k === 'H' ? -6 : 14), /HH|HL/.test(s.lab) ? 'rgba(34,197,139,.85)' : 'rgba(240,80,110,.85)');
    });
  },
  // Tóm tắt dạng chữ cho Plan (giá p hiện tại)
  summary(R, B, fmtT, F) {
    const last = R.ev[R.ev.length - 1], lastM = R.ev.filter(e => e.type === 'MSS').pop(), px = B[B.length - 1].c;
    const open = R.fvg.filter(f => !f.filled), up = open.filter(f => f.bot > px).sort((a, b) => a.bot - b.bot)[0], dn = open.filter(f => f.top < px).sort((a, b) => b.top - a.top)[0];
    const c = R.crt[R.crt.length - 1];
    const ev = e => `<b style="color:${e.dir === 1 ? 'var(--up)' : 'var(--down)'}">${e.type} ${e.dir === 1 ? 'TĂNG' : 'GIẢM'}</b> (đóng cửa ${e.dir === 1 ? 'trên' : 'dưới'} ${F(e.p)} lúc ${fmtT(e.i1)})`;
    return [
      `Xu hướng cấu trúc: <b>${R.trend === 1 ? 'TĂNG' : R.trend === -1 ? 'GIẢM' : 'chưa rõ'}</b>${last ? ' · sự kiện gần nhất: ' + ev(last) : ''}${lastM && lastM !== last ? ' · MSS gần nhất: ' + ev(lastM) : ''}`,
      `FVG chưa lấp gần nhất: phía trên ${up ? `<b>${F(up.bot)}–${F(up.top)}</b> (giảm, kháng cự)` : '—'} · phía dưới ${dn ? `<b>${F(dn.bot)}–${F(dn.top)}</b> (tăng, hỗ trợ)` : '—'}`,
      c ? `CRT ${R.htfName} gần nhất (nến ${fmtT(c.i0)}): ${c.d === 1 ? 'quét ĐÁY rồi đóng lại trong biên → kỳ vọng lên' : 'quét ĐỈNH rồi đóng lại trong biên → kỳ vọng xuống'} tới <b>${F(c.target)}</b>, hỏng nếu ${c.d === 1 ? 'thủng' : 'vượt'} ${F(c.ext)} — ${c.live ? 'nến 2 chưa đóng, chưa xác nhận' : c.res === 'hit' ? 'ĐÃ đạt mục tiêu' : c.res === 'fail' ? 'đã HỎNG' : 'đang chờ'}` : `Chưa có CRT ${R.htfName} gần đây`,
    ];
  },
};
