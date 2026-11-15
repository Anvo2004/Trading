'use strict';
/* =====================================================================
   ICT GOLD LAB — logic
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const f2 = n => (n == null || isNaN(n)) ? '—' : (+n).toFixed(2);
const fR = n => (n > 0 ? '+' : '') + (+n).toFixed(2) + 'R';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/* ---------------- Store ---------------- */
const Store = {
  p: 'ictlab.',
  get(k, d) { try { const v = localStorage.getItem(this.p + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(this.p + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  backup() {
    const o = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(this.p) && k !== this.p + 'data') o[k] = localStorage.getItem(k); } } catch (e) { }
    UI.download('ictlab-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(o));
  },
  restore(file) {
    if (!file) return;
    file.text().then(t => { const o = JSON.parse(t); Object.entries(o).forEach(([k, v]) => { try { localStorage.setItem(k, v); } catch (e) { } }); UI.toast('Đã khôi phục. Tải lại trang…'); setTimeout(() => location.reload(), 800); });
  },
};

/* ---------------- UI helpers ---------------- */
const UI = {
  toast(m, ms = 2600) { const t = $('#toast'); t.textContent = m; t.style.display = 'block'; clearTimeout(this._t); this._t = setTimeout(() => t.style.display = 'none', ms); },
  modal(title, html) { $('#mTitle').textContent = title; $('#mBody').innerHTML = html; $('#modal').classList.add('on'); },
  close() { $('#modal').classList.remove('on'); $('#mBody').innerHTML = ''; },
  download(name, text, type = 'application/json') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); },
  openRes(r) {
    const url = encodeURI(r.p);
    if (location.protocol !== 'file:' && r.p.includes('Documents/')) {
      this.modal(r.t, `<div class="note warn">Tài liệu này nằm trong thư mục <code>Documents</code> trên máy bạn (sách, video có bản quyền, dung lượng lớn) nên không được đưa lên web.</div><p>Để mở: tải repo về máy, đặt thư mục <code>Documents</code> cạnh <code>BacktestLab</code>, rồi mở <code>BacktestLab/index.html</code> trực tiếp.</p><p class="muted mono" style="font-size:12px">${esc(r.p.replace('../', ''))}</p>`);
      return;
    }
    if (r.k === 'video') this.modal(r.t, `<video src="${url}" controls autoplay></video><p class="muted" style="font-size:12px">Nếu video không phát được (codec), <a href="${url}" target="_blank">mở trực tiếp</a>.</p>`);
    else if (r.k === 'img') this.modal(r.t, `<img src="${url}" alt="${esc(r.t)}">`);
    else window.open(url, '_blank');
  },
  eq(svg, vals, opt = {}) {
    const W = svg.clientWidth || 600, H = svg.clientHeight || 220, p = 30;
    if (!vals.length) { svg.innerHTML = `<text x="${W / 2}" y="${H / 2}" fill="#8a96ad" text-anchor="middle" font-size="13">Chưa có lệnh</text>`; return; }
    const pts = [0, ...vals]; const mn = Math.min(0, ...pts), mx = Math.max(0, ...pts), rg = (mx - mn) || 1;
    const X = i => p + (W - p - 10) * i / (pts.length - 1 || 1), Y = v => 10 + (H - 30) * (1 - (v - mn) / rg);
    const path = pts.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('');
    const last = pts[pts.length - 1], col = last >= 0 ? '#22c58b' : '#f0506e';
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `<line x1="${p}" x2="${W - 10}" y1="${Y(0)}" y2="${Y(0)}" stroke="#243049" stroke-dasharray="4 4"/>
      <path d="${path} L${X(pts.length - 1)},${Y(0)} L${X(0)},${Y(0)}Z" fill="${col}" opacity=".10"/>
      <path d="${path}" fill="none" stroke="${col}" stroke-width="2"/>
      <text x="4" y="${Y(mx) + 4}" fill="#8a96ad" font-size="11">${mx.toFixed(1)}R</text>
      <text x="4" y="${Y(mn)}" fill="#8a96ad" font-size="11">${mn.toFixed(1)}R</text>
      <text x="${W - 12}" y="${H - 4}" fill="#8a96ad" font-size="11" text-anchor="end">${pts.length - 1} lệnh</text>`;
  },
};

/* ---------------- Time (NY / VN) ---------------- */
const T = {
  _c: {},
  dst(y) {
    if (this._c[y]) return this._c[y];
    const w3 = new Date(Date.UTC(y, 2, 1)).getUTCDay(), w11 = new Date(Date.UTC(y, 10, 1)).getUTCDay();
    const s = Date.UTC(y, 2, 1 + (7 - w3) % 7 + 7, 7) / 1000, e = Date.UTC(y, 10, 1 + (7 - w11) % 7, 6) / 1000;
    return this._c[y] = [s, e];
  },
  off(t) { const [s, e] = this.dst(new Date(t * 1000).getUTCFullYear()); return (t >= s && t < e) ? -4 : -5; },
  ny(t) { const o = this.off(t), d = new Date((t + o * 3600) * 1000); return { h: d.getUTCHours(), min: d.getUTCHours() * 60 + d.getUTCMinutes(), dow: d.getUTCDay(), off: o }; },
  dayKey(t) { const o = this.off(t); let k = Math.floor((t + (o + 4) * 3600) / 86400); if ((k + 4) % 7 === 0) k += 1; if ((k + 4) % 7 === 6) k += 2; return k; },
  vn(t) { return t + 7 * 3600; },
  fmt(t, withDate = true) { const d = new Date((t + 7 * 3600) * 1000), p = n => String(n).padStart(2, '0'); return (withDate ? `${WD[d.getUTCDay()]} ${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ` : '') + `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`; },
  hm(m) { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); },
  nyToVN(nyMin, off) { return nyMin + (7 - off) * 60; },
  now() { return Math.floor(Date.now() / 1000); },
  SESS: [
    { k: 'asia', n: 'Range phiên Á (đánh dấu, không trade)', s: 1200, e: 1440 },
    { k: 'mo', n: 'Midnight Open', s: 0, e: 0 },
    { k: 'ldn', n: 'London Killzone', s: 120, e: 300, kz: 1 },
    { k: 'nyam', n: 'NY AM Killzone', s: 420, e: 600, kz: 1 },
    { k: 'news', n: 'Tin Mỹ (CPI, NFP…)', s: 510, e: 510 },
    { k: 'sb', n: 'Silver Bullet NY', s: 600, e: 660 },
    { k: 'lc', n: 'London close (không mở lệnh mới)', s: 600, e: 720 },
  ],
  inKZ(nyMin) { return (nyMin >= 120 && nyMin < 300) || (nyMin >= 420 && nyMin < 600); },
};

/* ---------------- Data ---------------- */
const Data = {
  bars: [], tf: 300, name: '', key: [], nym: [], days: {}, dayKeys: [], prevKey: {}, synthetic: false,
  set(bars, name, synthetic) {
    this.bars = bars; this.name = name; this.synthetic = !!synthetic;
    const diffs = []; for (let i = 1; i < Math.min(bars.length, 3000); i++) diffs.push(bars[i].t - bars[i - 1].t);
    diffs.sort((a, b) => a - b); this.tf = diffs[Math.floor(diffs.length * 0.1)] || 300;
    this.index();
    try { Store.set('data', { name, synthetic: !!synthetic, b: bars.map(b => [b.t, b.o, b.h, b.l, b.c]) }) || Store.set('data', null); } catch (e) { }
  },
  index() {
    const B = this.bars; this.key = new Array(B.length); this.nym = new Array(B.length); this.days = {};
    for (let i = 0; i < B.length; i++) {
      const b = B[i], k = T.dayKey(b.t), m = T.ny(b.t).min; this.key[i] = k; this.nym[i] = m;
      let D = this.days[k];
      if (!D) D = this.days[k] = { key: k, o: b.o, h: b.h, l: b.l, c: b.c, first: i, last: i, aH: -Infinity, aL: Infinity, aDone: -1, lH: -Infinity, lL: Infinity, lDone: -1, mo: null, moIdx: -1 };
      D.h = Math.max(D.h, b.h); D.l = Math.min(D.l, b.l); D.c = b.c; D.last = i;
      if (m >= 1200) { D.aH = Math.max(D.aH, b.h); D.aL = Math.min(D.aL, b.l); }
      else if (m < 1080) {
        if (D.aDone < 0 && isFinite(D.aH)) D.aDone = i;
        if (D.moIdx < 0) { D.moIdx = i; D.mo = b.o; }
        if (m >= 120 && m < 420) { D.lH = Math.max(D.lH, b.h); D.lL = Math.min(D.lL, b.l); }
        if (m >= 420 && D.lDone < 0 && isFinite(D.lH)) D.lDone = i;
      }
    }
    this.dayKeys = Object.keys(this.days).map(Number).sort((a, b) => a - b);
    this.prevKey = {}; let ema = null; const a = 2 / 21;
    this.dayKeys.forEach((k, j) => {
      const D = this.days[k]; D.dow = (k + 4) % 7;
      if (j) this.prevKey[k] = this.dayKeys[j - 1];
      ema = ema == null ? D.c : D.c * a + ema * (1 - a); D.ema = ema;
    });
  },
  prev(k) { const p = this.prevKey[k]; return p != null ? this.days[p] : null; },
  parse(text, tz, custom) {
    const lines = text.split(/\r?\n/).filter(x => x.trim());
    if (lines.length < 3) throw new Error('File quá ít dòng');
    const L0 = lines[0], delim = L0.includes('\t') ? '\t' : ((L0.split(';').length > L0.split(',').length) ? ';' : ',');
    const head = L0.split(delim).map(s => s.trim().replace(/[<>"]/g, '').toLowerCase());
    const hasHead = head.some(h => /open|close|time|date/.test(h));
    let it = -1, id = -1, io, ih, il, ic;
    if (hasHead) {
      it = head.findIndex(h => ['time', 'datetime', 'timestamp', 'date time', 'gmt time', 'local time', 'thời gian'].includes(h));
      id = head.findIndex(h => h === 'date' || h === 'ngày');
      io = head.findIndex(h => h === 'open' || h === 'mở'); ih = head.findIndex(h => h === 'high' || h === 'cao'); il = head.findIndex(h => h === 'low' || h === 'thấp'); ic = head.findIndex(h => h === 'close' || h === 'đóng');
      if (io < 0 || ih < 0 || il < 0 || ic < 0) throw new Error('Không tìm thấy cột open/high/low/close');
      if (it < 0 && id < 0) it = 0;
    } else {
      const c = L0.split(delim);
      if (c.length >= 6 && /\d{4}[.\-/]\d{2}[.\-/]\d{2}/.test(c[0]) && /\d{1,2}:\d{2}/.test(c[1])) { id = 0; it = 1; io = 2; ih = 3; il = 4; ic = 5; }
      else { it = 0; io = 1; ih = 2; il = 3; ic = 4; }
    }
    const out = [];
    for (let r = hasHead ? 1 : 0; r < lines.length; r++) {
      const c = lines[r].split(delim).map(s => s.trim().replace(/"/g, ''));
      let s = (id >= 0 && it >= 0 && id !== it) ? c[id] + ' ' + c[it] : c[it >= 0 ? it : id];
      const t = this.parseT(s, tz, custom);
      const o = parseFloat(c[io]), h = parseFloat(c[ih]), l = parseFloat(c[il]), cl = parseFloat(c[ic]);
      if (!isFinite(t) || !isFinite(o) || !isFinite(h) || !isFinite(l) || !isFinite(cl)) continue;
      out.push({ t, o, h: Math.max(h, o, cl), l: Math.min(l, o, cl), c: cl });
    }
    out.sort((a, b) => a.t - b.t);
    const ded = out.filter((b, i) => !i || b.t !== out[i - 1].t);
    if (ded.length < 50) throw new Error('Đọc được quá ít nến (' + ded.length + ')');
    return ded;
  },
  parseT(s, tz, custom) {
    if (s == null) return NaN; s = String(s).trim();
    if (/^\d+(\.\d+)?$/.test(s)) { let n = +s; if (n > 1e12) n /= 1000; return Math.floor(n); }
    let iso = s.replace(/^(\d{4})[.\/](\d{2})[.\/](\d{2})/, '$1-$2-$3').replace(/^(\d{2})[.\/](\d{2})[.\/](\d{4})/, '$3-$2-$1').replace(' ', 'T');
    if (/(Z|[+-]\d{2}:?\d{2})$/.test(iso)) return Math.floor(Date.parse(iso) / 1000);
    if (/T\d{1,2}:\d{2}$/.test(iso)) iso += ':00';
    if (/T\d:/.test(iso)) iso = iso.replace(/T(\d):/, 'T0$1:');
    let t = Math.floor(Date.parse(iso + 'Z') / 1000);
    if (!isFinite(t)) return NaN;
    const off = tz === 'vn' ? 7 : tz === 'mt5' ? (T.off(t) + 7) : tz === 'custom' ? (+custom || 0) : 0;
    return t - off * 3600;
  },
  demo() {
    let s = 20261115; const R = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const N = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const end = Date.UTC(2026, 10, 13, 21) / 1000, start = end - 75 * 86400;
    const bars = []; let p = 3980, drift = 0;
    for (let t = start - (start % 300); t <= end; t += 300) {
      const d = new Date(t * 1000), dow = d.getUTCDay(), h = d.getUTCHours();
      if (dow === 6 || (dow === 0 && h < 23) || (dow === 5 && h >= 21)) continue;
      const m = T.ny(t).min;
      if (m === 1200) drift = N() * 0.035;
      let vol = 0.45;
      if (m >= 120 && m < 420) vol = 1.0; if (m >= 420 && m < 660) vol = 1.55; if (m >= 510 && m < 530) vol = 2.8; if (m >= 660 && m < 1020) vol = 0.75;
      const o = p + N() * 0.08, c = o + N() * vol + drift + (3980 - o) * 0.0004;
      const hi = Math.max(o, c) + Math.abs(N()) * vol * 0.55, lo = Math.min(o, c) - Math.abs(N()) * vol * 0.55;
      bars.push({ t, o: +o.toFixed(2), h: +hi.toFixed(2), l: +lo.toFixed(2), c: +c.toFixed(2) }); p = c;
    }
    return bars;
  },
  bucket(t, tf) {
    if (tf >= 86400) return T.dayKey(t) * 86400;
    if (tf < 3600) return t - (t % tf);
    const o = T.off(t), m = ((t + (o + 7) * 3600) % tf + tf) % tf; return t - m;
  },
  dispT(bucket, tf) { return tf >= 86400 ? bucket : bucket + 7 * 3600; },
};

/* ---------------- Backtest Lab (replay) ---------------- */
const Lab = {
  chart: null, cs: null, kzS: null, idx: 0, tf: 300, agg: [], play: null, show: { kz: true, lv: true, fvg: false },
  lvLines: [], lvSig: '', pos: null, posLines: [], marks: [], pickMode: null, dir: 1, sessionId: Date.now(), review: null,
  CHK: ['Đang trong killzone (19:30–22:00 / 14:00–16:30)', 'Có cú QUÉT thanh khoản rõ ràng', 'Có DISPLACEMENT + MSS đóng cửa qua đỉnh/đáy', 'FVG/OB chưa bị chạm, vào bằng LIMIT', 'Cùng hướng bias D1 / đúng Premium-Discount', 'SL sau râu quét + 1–1.5$ đệm', 'TP tại thanh khoản đối diện, RR ≥ 2', 'Lot = rủi ro / (SL × 100), làm tròn xuống', 'Hôm nay chưa có lệnh, tuần chưa -3R'],
  init() {
    $('#chkList').innerHTML = this.CHK.map((c, i) => `<label><input type="checkbox" data-i="${i}"> ${c}</label>`).join('');
    $('#chkList').addEventListener('change', () => $('#chkCount').textContent = $$('#chkList input:checked').length);
    $$('#dirSeg button').forEach(b => b.onclick = () => this.setDir(+b.dataset.d));
    ['ordEntry', 'ordSL', 'ordTP', 'ordBal', 'ordRisk'].forEach(id => $('#' + id).addEventListener('input', () => this.calc()));
    $('#ordBal').value = Store.get('bal', 1000); $('#ordRisk').value = Store.get('risk', 1);
    $('#csvFile').onchange = e => this.loadFile(e.target.files[0]);
    const box = $('#chartBox');
    box.addEventListener('dragover', e => { e.preventDefault(); box.style.outline = '2px dashed var(--gold)'; });
    box.addEventListener('dragleave', () => box.style.outline = '');
    box.addEventListener('drop', e => { e.preventDefault(); box.style.outline = ''; if (e.dataTransfer.files[0]) this.loadFile(e.dataTransfer.files[0]); });
    document.addEventListener('keydown', e => {
      if (Router.cur !== 'lab' || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); this.step(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); this.back(); }
      else if (e.key === ' ') { e.preventDefault(); this.togglePlay(); }
      else if (e.key.toLowerCase() === 'b') this.setDir(1);
      else if (e.key.toLowerCase() === 's') this.setDir(-1);
    });
    const saved = Store.get('data', null);
    if (saved && saved.b && saved.b.length) {
      Data.set(saved.b.map(a => ({ t: a[0], o: a[1], h: a[2], l: a[3], c: a[4] })), saved.name, saved.synthetic);
      this.afterLoad(Store.get('labIdx', null));
    }
  },
  ensureChart() {
    if (this.chart || typeof LightweightCharts === 'undefined') return;
    const el = $('#chartBox');
    this.chart = LightweightCharts.createChart(el, {
      autoSize: true,
      layout: { background: { type: 'solid', color: '#0b0f17' }, textColor: '#8a96ad', fontFamily: 'Be Vietnam Pro, sans-serif' },
      grid: { vertLines: { color: '#131a29' }, horzLines: { color: '#131a29' } },
      rightPriceScale: { borderColor: '#243049' },
      timeScale: { borderColor: '#243049', timeVisible: true, secondsVisible: false, rightOffset: 10 },
      crosshair: { mode: 0 },
    });
    this.cs = this.chart.addCandlestickSeries({ upColor: '#22c58b', downColor: '#f0506e', borderVisible: false, wickUpColor: '#22c58b', wickDownColor: '#f0506e', priceFormat: { type: 'price', precision: 2, minMove: 0.01 } });
    const cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;z-index:2'; el.appendChild(cv); this.cv = cv;
    this.chart.subscribeClick(p => {
      if (!this.pickMode || !p.point) return;
      const pr = this.cs.coordinateToPrice(p.point.y); if (pr == null) return;
      $('#ord' + { entry: 'Entry', sl: 'SL', tp: 'TP' }[this.pickMode]).value = pr.toFixed(2);
      const nxt = { entry: 'sl', sl: 'tp', tp: null }[this.pickMode]; this.pick(nxt); this.calc();
    });
    this.chart.subscribeCrosshairMove(p => {
      const d = p && p.seriesData && p.seriesData.get(this.cs);
      const b = d || this.agg[this.agg.length - 1]; if (!b) return;
      $('#legend').innerHTML = `${this.tfName(this.tf)} · O <b>${f2(b.open)}</b> H <b>${f2(b.high)}</b> L <b>${f2(b.low)}</b> C <b>${f2(b.close)}</b>`;
    });
    const loop = () => { if (Router.cur === 'lab') this.draw(); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  },
  tfName(tf) { return { 60: 'M1', 300: 'M5', 900: 'M15', 1800: 'M30', 3600: 'H1', 14400: 'H4', 86400: 'D1' }[tf] || (tf / 60 + 'm'); },
  loadFile(file) {
    if (!file) return;
    file.text().then(text => {
      const tz = Store.get('tz', 'utc');
      UI.modal('Nạp dữ liệu: ' + file.name, `
        <p>Chọn múi giờ của cột thời gian trong file:</p>
        <select id="tzSel"><option value="utc">UTC / Unix timestamp (TradingView "Export chart data" mặc định)</option><option value="vn">Giờ Việt Nam (UTC+7)</option><option value="mt5">Giờ server MT4/MT5 (GMT+2 đông / GMT+3 hè)</option><option value="custom">Tự nhập UTC+…</option></select>
        <input type="number" id="tzCustom" placeholder="VD: 2" style="margin-top:6px;width:120px">
        <p class="muted" style="font-size:12.5px">Nếu cột thời gian là số Unix hoặc có hậu tố múi giờ (Z, +07:00…), lựa chọn này được bỏ qua.</p>
        <button class="btn pri" id="tzGo">Nạp</button>`);
      $('#tzSel').value = tz;
      $('#tzGo').onclick = () => {
        try {
          const v = $('#tzSel').value; Store.set('tz', v);
          const bars = Data.parse(text, v, $('#tzCustom').value);
          Data.set(bars, file.name, false); UI.close(); this.afterLoad(); UI.toast(`Đã nạp ${bars.length.toLocaleString()} nến`);
        } catch (e) { UI.toast('Lỗi: ' + e.message, 5000); }
      };
    });
  },
  loadDemo() { Data.set(Data.demo(), 'Dữ liệu MÔ PHỎNG (ngẫu nhiên, không phải giá thật)', true); this.afterLoad(); UI.toast('Đã tạo dữ liệu mô phỏng M5'); },
  afterLoad(savedIdx) {
    this.ensureChart(); if (!this.chart) return UI.toast('Không tải được thư viện chart (cần Internet lần đầu)');
    $('#chartEmpty').style.display = 'none';
    this.tf = Math.max(Data.tf, 300);
    const tfs = [60, 300, 900, 3600, 14400, 86400].filter(x => x >= Data.tf); if (!tfs.includes(Data.tf)) tfs.unshift(Data.tf);
    $('#tfBtns').innerHTML = tfs.map(x => `<button class="btn sm ${x === this.tf ? 'on' : ''}" data-tf="${x}">${this.tfName(x)}</button>`).join('');
    $$('#tfBtns button').forEach(b => b.onclick = () => { this.tf = +b.dataset.tf; $$('#tfBtns button').forEach(x => x.classList.toggle('on', x === b)); this.rebuild(); });
    const B = Data.bars;
    $('#dataInfo').innerHTML = `<span>📄 ${esc(Data.name)}</span><span>·</span><span>${B.length.toLocaleString()} nến ${this.tfName(Data.tf)}</span><span>·</span><span>${T.fmt(B[0].t)} → ${T.fmt(B[B.length - 1].t)} (giờ VN)</span>` + (Data.synthetic ? '<span class="pill gold">Mô phỏng</span>' : '');
    const d0 = new Date((B[Math.min(B.length - 1, Math.floor(B.length * 0.3))].t + 7 * 3600) * 1000);
    $('#rpDate').value = d0.toISOString().slice(0, 10);
    this.cancelPos(true);
    this.idx = savedIdx && savedIdx > 10 && savedIdx <= B.length ? savedIdx : this.findIdx($('#rpDate').value, '19:00');
    this.rebuild(true);
  },
  findIdx(dateStr, timeStr) {
    const t = Date.parse(dateStr + 'T' + (timeStr || '00:00') + ':00Z') / 1000 - 7 * 3600;
    const B = Data.bars; let lo = 0, hi = B.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (B[m].t < t) lo = m + 1; else hi = m; }
    return Math.max(30, lo);
  },
  jumpDate() {
    if (!Data.bars.length) return UI.toast('Chưa có dữ liệu');
    if (this.pos && !confirm('Lệnh đang mở sẽ bị hủy khi nhảy ngày. Tiếp tục?')) return;
    this.cancelPos(true); this.review = null; this.idx = this.findIdx($('#rpDate').value, $('#rpTime').value); this.rebuild(true);
  },
  rebuild(fit) {
    if (!this.chart || !Data.bars.length) return;
    this.agg = []; this.kz = [];
    for (let i = 0; i < this.idx; i++) this.push(Data.bars[i], i, true);
    this.cs.setData(this.agg.map(this.toC));
    this.refresh();
    if (fit) { const n = this.agg.length; this.chart.timeScale().setVisibleLogicalRange({ from: n - 160, to: n + 10 }); }
  },
  toC(a) { return { time: a.time, open: a.open, high: a.high, low: a.low, close: a.close }; },
  push(b, i, bulk) {
    const bk = Data.bucket(b.t, this.tf), time = Data.dispT(bk, this.tf), last = this.agg[this.agg.length - 1];
    if (last && last.bk === bk) { last.high = Math.max(last.high, b.h); last.low = Math.min(last.low, b.l); last.close = b.c; last.i1 = i; if (!bulk) this.cs.update(this.toC(last)); return; }
    const a = { bk, time, open: b.o, high: b.h, low: b.l, close: b.c, i0: i, i1: i };
    this.agg.push(a);
    const m = Data.nym[i], inkz = this.show.kz && this.tf < 14400 && T.inKZ(m);
    a.kz = inkz ? (m < 300 ? 1 : 2) : 0;
    if (!bulk) this.cs.update(this.toC(a));
  },
  step(silent) {
    if (!Data.bars.length) return false;
    if (this.idx >= Data.bars.length) { this.stopPlay(); UI.toast('Hết dữ liệu'); return false; }
    const i = this.idx, b = Data.bars[i]; this.idx++;
    this.push(b, i, false);
    this.processBar(b, i);
    if (!silent) this.refresh();
    return true;
  },
  back() { if (this.idx > 31) { this.stopPlay(); if (this.pos && this.pos.placedIdx >= this.idx - 1) this.cancelPos(true); this.idx--; this.rebuild(); } },
  togglePlay() { this.play ? this.stopPlay() : this.startPlay(); },
  startPlay() { if (!Data.bars.length) return UI.toast('Chưa có dữ liệu'); this.play = setInterval(() => { if (!this.step()) this.stopPlay(); }, +$('#speed').value); $('#playBtn').textContent = '⏸ Dừng'; },
  stopPlay() { clearInterval(this.play); this.play = null; $('#playBtn').textContent = '▶ Chạy'; },
  toNextKZ() {
    if (!Data.bars.length) return; this.stopPlay();
    let n = 0; const startIn = T.inKZ(Data.nym[this.idx - 1]);
    let left = !startIn;
    while (this.idx < Data.bars.length && n < 5000) {
      const m = Data.nym[this.idx]; const ik = T.inKZ(m);
      if (!ik) left = true; else if (left) break;
      this.step(true); n++; if (this.pos && this.pos.status === 'open' && n > 0 && this._closedNow) break;
    }
    this.rebuild(); this.chart.timeScale().scrollToRealTime();
  },
  toggle(k) {
    this.show[k] = !this.show[k];
    $({ kz: '#tgKZ', lv: '#tgLv', fvg: '#tgFvg' }[k]).classList.toggle('on', this.show[k]);
    this.rebuild();
  },
  refresh() {
    const B = Data.bars; if (!B.length || !this.idx) return;
    const cur = B[this.idx - 1];
    $('#replayInfo').innerHTML = `🕐 <b style="color:var(--text)">${T.fmt(cur.t)}</b> VN · Giá ${f2(cur.c)} · ${this.idx}/${B.length}` + (T.inKZ(Data.nym[this.idx - 1]) ? ' · <span class="pill gold">KILLZONE</span>' : '');
    this.levels(); this.renderPos(); this.renderMarks();
    if (this.idx % 25 === 0) Store.set('labIdx', this.idx);
  },
  levels() {
    const cur = this.idx - 1, k = Data.key[cur], D = Data.days[k], P = Data.prev(k), L = [];
    if (this.show.lv && D) {
      if (P) { L.push(['PDH', P.h, '#c084fc']); L.push(['PDL', P.l, '#c084fc']); }
      if (D.aDone >= 0 && cur >= D.aDone) { L.push(['Đỉnh Á', D.aH, '#4c8dff']); L.push(['Đáy Á', D.aL, '#4c8dff']); }
      if (D.lDone >= 0 && cur >= D.lDone) { L.push(['Đỉnh London', D.lH, '#f2a33a']); L.push(['Đáy London', D.lL, '#f2a33a']); }
      if (D.moIdx >= 0 && cur >= D.moIdx) L.push(['Midnight Open', D.mo, '#8a96ad']);
    }
    const sig = L.map(x => x[0] + x[1]).join('|'); if (sig === this.lvSig) return; this.lvSig = sig;
    this.lvLines.forEach(l => this.cs.removePriceLine(l));
    this.lvLines = L.map(([t, p, c]) => this.cs.createPriceLine({ price: p, color: c, lineWidth: 1, lineStyle: t === 'Midnight Open' ? 1 : 2, axisLabelVisible: true, title: t }));
  },
  fvgs() {
    const A = this.agg, out = [], from = Math.max(2, A.length - 300);
    for (let i = from; i < A.length; i++) {
      const a = A[i - 2], c = A[i];
      if (c.low > a.high) out.push({ i0: i - 1, top: c.low, bot: a.high, up: 1 });
      else if (c.high < a.low) out.push({ i0: i - 1, top: a.low, bot: c.high, up: 0 });
    }
    out.forEach(f => { f.i1 = A.length - 1; for (let j = f.i0 + 2; j < A.length; j++) { if (f.up ? A[j].low <= f.bot : A[j].high >= f.top) { f.i1 = j; f.filled = 1; break; } } });
    return out;
  },
  draw() {
    if (!this.chart || !this.cv || !this.agg.length) return;
    const ts = this.chart.timeScale(), el = $('#chartBox'), dpr = window.devicePixelRatio || 1;
    const W = ts.width(), H = el.clientHeight - ts.height();
    if (this.cv.width !== W * dpr || this.cv.height !== H * dpr) { this.cv.width = W * dpr; this.cv.height = H * dpr; this.cv.style.width = W + 'px'; this.cv.style.height = H + 'px'; }
    const g = this.cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const X0 = i => ts.logicalToCoordinate(Math.round(i)), bw0 = Math.max(1, (X0(1) ?? 1) - (X0(0) ?? 0));
    const X = i => { const r = Math.round(i), x = X0(r); return x == null ? null : x + (i - r) * bw0; };
    const Y = p => this.cs.priceToCoordinate(p);
    const box = (i0, i1, p1, p2, fill, stroke) => {
      const x0 = X(i0), x1 = X(i1), y1 = Y(p1), y2 = Y(p2); if (x0 == null || x1 == null || y1 == null || y2 == null) return;
      g.fillStyle = fill; g.fillRect(x0, Math.min(y1, y2), Math.max(2, x1 - x0), Math.abs(y2 - y1));
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.strokeRect(x0, Math.min(y1, y2), Math.max(2, x1 - x0), Math.abs(y2 - y1)); }
    };
    const vr = ts.getVisibleLogicalRange();
    if (vr) {
      const a0 = Math.max(0, Math.floor(vr.from)), a1 = Math.min(this.agg.length - 1, Math.ceil(vr.to)), bw = Math.max(1, (X(1) ?? 1) - (X(0) ?? 0));
      let s = -1;
      for (let i = a0; i <= a1 + 1; i++) {
        const z = i <= a1 ? this.agg[i].kz : 0;
        if (z && s < 0) s = i;
        if (s >= 0 && (!z || z !== this.agg[s].kz)) { const x0 = X(s) - bw / 2, x1 = X(i - 1) + bw / 2; g.fillStyle = this.agg[s].kz === 1 ? 'rgba(76,141,255,.07)' : 'rgba(232,184,74,.07)'; g.fillRect(x0, 0, x1 - x0, H); s = z ? i : -1; }
      }
    }
    if (this.show.fvg) this.fvgs().forEach(f => {
      box(f.i0 - 0.4, f.i1 + 0.4, f.top, f.bot, f.up ? 'rgba(34,197,139,.22)' : 'rgba(240,80,110,.22)', f.filled ? null : (f.up ? 'rgba(34,197,139,.7)' : 'rgba(240,80,110,.7)'));
      const ce = Y((f.top + f.bot) / 2), x0 = X(f.i0), x1 = X(f.i1); if (ce != null && x0 != null && x1 != null) { g.setLineDash([3, 3]); g.strokeStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(x0, ce); g.lineTo(x1, ce); g.stroke(); g.setLineDash([]); }
    });
    const zone = (z) => {
      const ai = t => { const bk = Data.bucket(t, this.tf); let lo = 0, hi = this.agg.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (this.agg[m].bk < bk) lo = m + 1; else hi = m; } return lo; };
      const i0 = ai(z.t0), i1 = z.t1 ? ai(z.t1) : this.agg.length + 3;
      box(i0 - 0.4, i1 + 0.4, z.entry, z.tp, 'rgba(34,197,139,.16)'); box(i0 - 0.4, i1 + 0.4, z.entry, z.sl, 'rgba(240,80,110,.16)');
    };
    if (this.pos) zone({ t0: Data.bars[this.pos.placedIdx].t, entry: this.pos.entry, sl: this.pos.sl, tp: this.pos.tp });
    if (this.review) zone(this.review);
  },
  setDir(d) { this.dir = d; $$('#dirSeg button').forEach(b => b.classList.toggle('on', +b.dataset.d === d)); this.calc(); },
  pick(w) { this.pickMode = w; $('#pickHint').textContent = w ? `👉 Click lên chart để chọn ${w.toUpperCase()}` : ''; },
  calc() {
    const e = +$('#ordEntry').value, s = +$('#ordSL').value, t = +$('#ordTP').value, bal = +$('#ordBal').value, rk = +$('#ordRisk').value;
    Store.set('bal', bal); Store.set('risk', rk);
    if (e && s && t) { const rr = Math.abs(t - e) / Math.abs(e - s); $('#ordRR').value = rr.toFixed(2); $('#ordRR').style.color = rr >= 2 ? 'var(--up)' : 'var(--down)'; }
    else $('#ordRR').value = '';
    if (e && s) {
      const risk$ = bal * rk / 100, d = Math.abs(e - s), lot = Math.floor(risk$ / (d * 100) * 100) / 100;
      $('#ordLot').innerHTML = `Rủi ro <b>${f2(risk$)}$</b> · SL <b>${f2(d)}$</b> → Lot <b style="color:${lot >= 0.01 ? 'var(--gold2)' : 'var(--down)'}">${lot >= 0.01 ? lot.toFixed(2) : 'bỏ lệnh / dùng cent'}</b>`;
    } else $('#ordLot').textContent = 'Lot: —';
  },
  placeOrder() {
    if (!Data.bars.length) return UI.toast('Chưa có dữ liệu');
    if (this.pos) return UI.toast('Đã có 1 lệnh. Quy tắc: tối đa 1 lệnh cùng lúc.');
    const cur = Data.bars[this.idx - 1], type = $('#ordType').value, d = this.dir;
    let e = type === 'market' ? cur.c : +$('#ordEntry').value; const s = +$('#ordSL').value, t = +$('#ordTP').value;
    if (!e || !s || !t) return UI.toast('Nhập đủ Entry, SL, TP');
    if (d === 1 && !(s < e && e < t)) return UI.toast('Lệnh MUA cần SL < Entry < TP');
    if (d === -1 && !(t < e && e < s)) return UI.toast('Lệnh BÁN cần TP < Entry < SL');
    if (type === 'limit' && ((d === 1 && e > cur.c) || (d === -1 && e < cur.c))) return UI.toast(d === 1 ? 'Buy Limit phải đặt DƯỚI giá hiện tại' : 'Sell Limit phải đặt TRÊN giá hiện tại');
    const chk = $$('#chkList input:checked').length, rr = Math.abs(t - e) / Math.abs(e - s);
    if (rr < 2 && !confirm(`RR chỉ ${rr.toFixed(2)} < 2. Theo luật bạn nên BỎ lệnh. Vẫn đặt?`)) return;
    if (chk < 9 && !confirm(`Checklist mới ${chk}/9. "Thiếu 1 ô = KHÔNG VÀO". Vẫn đặt?`)) return;
    const bal = +$('#ordBal').value, rk = +$('#ordRisk').value;
    this.pos = { dir: d, type, entry: e, sl: s, tp: t, status: type === 'market' ? 'open' : 'pending', placedIdx: this.idx - 1, fillIdx: type === 'market' ? this.idx - 1 : null, setup: $('#ordSetup').value, note: $('#ordNote').value, chk, risk$: bal * rk / 100 };
    if (type === 'market') this.marks.push({ t: cur.t, d, k: 'in' });
    this.posLines = [this.cs.createPriceLine({ price: e, color: '#4c8dff', lineWidth: 1, title: 'Entry' }), this.cs.createPriceLine({ price: s, color: '#f0506e', lineWidth: 1, title: 'SL' }), this.cs.createPriceLine({ price: t, color: '#22c58b', lineWidth: 1, title: 'TP' })];
    this.review = null; this.refresh(); UI.toast('Đã đặt lệnh. Bấm ▶ để tua tiếp.');
  },
  processBar(b, i) {
    const P = this.pos; this._closedNow = false; if (!P) return;
    const d = P.dir;
    if (P.status === 'pending') {
      const fill = d === 1 ? b.l <= P.entry : b.h >= P.entry, tpHit = d === 1 ? b.h >= P.tp : b.l <= P.tp;
      if (!fill && tpHit) { this.closePos(null, 'Hủy (chạm TP trước khi khớp)', i); return; }
      if (!fill) return;
      P.status = 'open'; P.fillIdx = i; this.marks.push({ t: b.t, d, k: 'in' });
      if (d === 1 ? b.l <= P.sl : b.h >= P.sl) this.closePos(P.sl, 'SL', i);
      return;
    }
    if (d === 1 ? b.l <= P.sl : b.h >= P.sl) this.closePos(P.sl, 'SL', i);
    else if (d === 1 ? b.h >= P.tp : b.l <= P.tp) this.closePos(P.tp, 'TP', i);
  },
  closeManual() { if (!this.pos) return; const c = Data.bars[this.idx - 1].c; if (this.pos.status === 'pending') this.closePos(null, 'Hủy lệnh chờ', this.idx - 1); else this.closePos(c, 'Đóng tay', this.idx - 1); },
  closePos(px, why, i) {
    const P = this.pos; if (!P) return; this._closedNow = true;
    const b = Data.bars[i];
    if (px != null) {
      const R = (px - P.entry) * P.dir / Math.abs(P.entry - P.sl);
      this.marks.push({ t: b.t, d: P.dir, k: 'out', R });
      Journal.add({ src: 'replay', sess: this.sessionId, data: Data.name, t: Data.bars[P.fillIdx].t, tExit: b.t, dir: P.dir, setup: P.setup, entry: P.entry, sl: P.sl, tp: P.tp, exit: px, R: +R.toFixed(2), outcome: why, chk: P.chk, note: P.note, usd: +(R * P.risk$).toFixed(2) });
      UI.toast(`${why}: ${fR(R)}`);
      this.review = { t0: Data.bars[P.placedIdx].t, t1: b.t, entry: P.entry, sl: P.sl, tp: P.tp };
    } else UI.toast(why);
    this.cancelPos(); this.renderStats();
  },
  cancelPos(quiet) { this.posLines.forEach(l => { try { this.cs.removePriceLine(l); } catch (e) { } }); this.posLines = []; this.pos = null; if (!quiet) this.renderPos(); },
  renderPos() {
    const P = this.pos, el = $('#posBox');
    if (!P) { el.innerHTML = '<h4>Lệnh hiện tại</h4><div class="muted">Không có lệnh. Đặt Entry/SL/TP bằng 🎯 hoặc gõ số.</div>'; return; }
    const c = Data.bars[this.idx - 1].c, R = P.status === 'open' ? (c - P.entry) * P.dir / Math.abs(P.entry - P.sl) : 0;
    el.innerHTML = `<h4>Lệnh hiện tại <span class="pill ${P.dir === 1 ? 'up' : 'down'}">${P.dir === 1 ? 'MUA' : 'BÁN'}</span> <span class="pill">${P.status === 'open' ? 'Đang chạy' : 'Chờ khớp'}</span></h4>
      <div class="big ${R >= 0 ? 'pos' : 'neg'}">${P.status === 'open' ? fR(R) : '—'}</div>
      <div class="mono muted" style="font-size:12.5px">Entry ${f2(P.entry)} · SL ${f2(P.sl)} · TP ${f2(P.tp)}</div>
      <button class="btn sm" style="margin-top:8px" onclick="Lab.closeManual()">${P.status === 'open' ? 'Đóng lệnh tại giá hiện tại' : 'Hủy lệnh chờ'}</button>`;
  },
  renderMarks() {
    if (!this.cs) return;
    const first = this.agg.length ? this.agg[0].bk : 0, lastT = Data.bars[this.idx - 1]?.t ?? 0;
    const M = this.marks.filter(m => m.t <= lastT).map(m => ({
      time: Data.dispT(Data.bucket(m.t, this.tf), this.tf),
      position: m.k === 'out' ? (m.d === 1 ? 'aboveBar' : 'belowBar') : (m.d === 1 ? 'belowBar' : 'aboveBar'),
      color: m.k === 'sw' ? '#f2a33a' : m.k === 'in' ? '#4c8dff' : (m.R >= 0 ? '#22c58b' : '#f0506e'),
      shape: m.k === 'sw' ? 'square' : m.k === 'in' ? (m.d === 1 ? 'arrowUp' : 'arrowDown') : 'circle',
      text: m.k === 'sw' ? m.txt : m.k === 'in' ? (m.d === 1 ? 'Buy' : 'Sell') : fR(m.R),
    })).filter(m => m.time >= Data.dispT(first, this.tf)).sort((a, b) => a.time - b.time);
    this.cs.setMarkers(M);
  },
  renderStats() {
    const S = Journal.list().filter(x => x.sess === this.sessionId);
    if (!S.length) { $('#sessStats').textContent = 'Chưa có lệnh trong phiên này.'; return; }
    const w = S.filter(x => x.R > 0).length, tot = S.reduce((a, x) => a + x.R, 0);
    $('#sessStats').innerHTML = `<div class="mono" style="color:var(--text)">${S.length} lệnh · thắng ${w} (${Math.round(w / S.length * 100)}%) · <span class="${tot >= 0 ? 'pos' : 'neg'}">${fR(tot)}</span></div><a href="#journal">Xem nhật ký →</a>`;
  },
  showTrade(tr) {
    location.hash = '#lab';
    setTimeout(() => {
      this.cancelPos(true); this.stopPlay();
      const ix = Data.bars.findIndex(b => b.t >= tr.tExit); this.idx = Math.min(Data.bars.length, (ix < 0 ? Data.bars.length : ix) + 12);
      this.marks = [{ t: tr.tFill, d: tr.dir, k: 'in' }, { t: tr.tExit, d: tr.dir, k: 'out', R: tr.R }];
      if (tr.tSweep) this.marks.push({ t: tr.tSweep, d: tr.dir, k: 'sw', txt: 'Quét ' + (tr.lvl || '') });
      this.review = { t0: tr.tMSS || tr.tFill, t1: tr.tExit, entry: tr.entry, sl: tr.sl, tp: tr.tp };
      this.rebuild(true);
      UI.toast('Đang xem lại lệnh. Vùng xanh/đỏ = TP/SL.');
    }, 60);
  },
  showImportHelp() {
    UI.modal('Cách lấy dữ liệu nến', `
      <h3>Cách 1 — TradingView</h3>
      <ol><li>Mở chart <b>XAUUSD</b> (VD: OANDA:XAUUSD), chọn khung <b>M5</b>.</li>
      <li>Kéo chart sang trái để tải đủ lịch sử (M5 thường giới hạn số nến theo gói tài khoản).</li>
      <li>Bấm mũi tên cạnh tên layout (góc trên) → <b>Export chart data…</b> → Time format: <b>UNIX timestamp</b> hoặc ISO → Export.</li>
      <li>Nạp file .csv vào Lab, chọn múi giờ <b>UTC</b>.</li></ol>
      <p class="muted">Tùy gói tài khoản TradingView, tính năng export có thể bị giới hạn. Nếu không có, dùng cách 2.</p>
      <h3>Cách 2 — MetaTrader 5 (miễn phí, nhiều dữ liệu hơn)</h3>
      <ol><li>MT5 → <b>View → Symbols</b> (Ctrl+U) → chọn XAUUSD → tab <b>Bars</b>.</li>
      <li>Chọn khung M5, khoảng ngày → <b>Request</b> → <b>Export Bars</b> → lưu .csv.</li>
      <li>Nạp vào Lab, chọn múi giờ <b>Giờ server MT4/MT5</b>.</li></ol>
      <h3>Định dạng được hỗ trợ</h3>
      <pre class="flow">time,open,high,low,close,Volume          ← TradingView
1731628800,2563.1,2565.4,2561.9,2564.0,...
&lt;DATE&gt;  &lt;TIME&gt;  &lt;OPEN&gt; &lt;HIGH&gt; &lt;LOW&gt; &lt;CLOSE&gt;   ← MT5 (tab)
2024.11.15 00:05:00 2563.1 ...</pre>
      <p>Dữ liệu được lưu trong trình duyệt (nếu không quá lớn) để lần sau mở lại ngay.</p>`);
  },
};

/* ---------------- Strategy tester: Model A ---------------- */
const Strat = {
  last: [],
  defaults: { stKZ: 'ny', stDelay: 30, stBias: 'none', stLv: 'all', stLook: 6, stWait: 12, stEntry: 'ce', stBuf: 1.2, stTP: 'fixed', stRR: 2, stRR2: 4, stMinRR: 2, stMaxSL: 12, stDisp: 1.3, stExit: 12.5, stCost: 0.3 },
  init() { const s = Store.get('stParams', this.defaults); Object.entries({ ...this.defaults, ...s }).forEach(([k, v]) => { const el = $('#' + k); if (el) el.value = v; }); },
  reset() { Object.entries(this.defaults).forEach(([k, v]) => $('#' + k).value = v); },
  params() { const p = {}; Object.keys(this.defaults).forEach(k => { const v = $('#' + k).value; p[k] = isNaN(+v) || v === '' ? v : +v; }); Store.set('stParams', p); return p; },
  run() {
    const B = Data.bars; if (!B.length) { UI.toast('Nạp dữ liệu ở Backtest Lab trước'); return; }
    const P = this.params(), t0 = performance.now();
    const KZ = P.stKZ === 'ny' ? [[420, 600]] : P.stKZ === 'ldn' ? [[120, 300]] : [[120, 300], [420, 600]];
    const kzOf = m => KZ.find(([s, e]) => m >= s && m < e);
    const body = B.map(b => Math.abs(b.c - b.o)), cum = [0]; body.forEach((x, i) => cum.push(cum[i] + x));
    const avgBody = i => { const a = Math.max(0, i - 20); return (cum[i] - cum[a]) / ((i - a) || 1); };
    const FN = { sw: 0, mss: 0, fvg: 0, filt: 0, pend: 0, fill: 0 }; const trades = []; let dayK = null, lv = [], setup = null, pos = null, traded = false, bias = 0, D = null, cancels = 0;
    const exitMin = P.stExit * 60;
    const finish = (i, px, why, extraR = 0, frac = 1) => {
      const r = Math.abs(pos.entry - pos.sl0);
      const R = extraR + frac * (px - pos.entry) * pos.dir / r - P.stCost / r;
      trades.push({ ...pos, tExit: B[i].t, exit: px, R: +R.toFixed(2), outcome: why }); pos = null;
    };
    for (let i = 1; i < B.length; i++) {
      const b = B[i], k = Data.key[i], m = Data.nym[i];
      if (k !== dayK) {
        if (pos && pos.status === 'open') finish(i - 1, B[i - 1].c, 'Hết giờ', pos.partR || 0, pos.partR ? 0.5 : 1);
        pos = null; setup = null; traded = false; dayK = k; D = Data.days[k]; lv = [];
        const pd = Data.prev(k);
        bias = 0;
        if (pd && P.stBias === 'prev') bias = pd.c > pd.o ? 1 : -1;
        if (pd && P.stBias === 'ema') { const pp = Data.prev(pd.key); bias = pd.c > (pp ? pp.ema : pd.ema) ? 1 : -1; }
        if (pd && (P.stLv === 'all' || P.stLv === 'pd')) lv.push({ n: 'PDH', p: pd.h, s: 1 }, { n: 'PDL', p: pd.l, s: -1 });
      }
      if (i === D.aDone && (P.stLv === 'all' || P.stLv === 'asia')) lv.push({ n: 'Đỉnh Á', p: D.aH, s: 1 }, { n: 'Đáy Á', p: D.aL, s: -1 });
      if (i === D.lDone && (P.stLv === 'all' || P.stLv === 'ldn')) lv.push({ n: 'Đỉnh London', p: D.lH, s: 1 }, { n: 'Đáy London', p: D.lL, s: -1 });
      const kz = kzOf(m), active = kz && m >= kz[0] + P.stDelay;
      // ---- manage position
      if (pos) {
        const d = pos.dir;
        if (pos.status === 'pending') {
          const fill = d === 1 ? b.l <= pos.entry : b.h >= pos.entry, tpHit = d === 1 ? b.h >= pos.tp : b.l <= pos.tp;
          if (!fill && (tpHit || !kz)) { pos = null; cancels++; }
          else if (fill) {
            pos.status = 'open'; pos.tFill = b.t; traded = true; FN.fill++;
            if (d === 1 ? b.l <= pos.sl : b.h >= pos.sl) finish(i, pos.sl, 'SL');
          }
        } else {
          if (d === 1 ? b.l <= pos.sl : b.h >= pos.sl) finish(i, pos.sl, pos.partR ? 'TP1 + BE' : 'SL', pos.partR || 0, pos.partR ? 0.5 : 1);
          else if (d === 1 ? b.h >= pos.tp : b.l <= pos.tp) {
            if (P.stTP === 'split' && !pos.partR) { pos.partR = 0.5 * P.stRR; pos.sl = pos.entry; pos.tp = pos.tp2; }
            else finish(i, pos.tp, pos.partR ? 'TP1 + TP2' : 'TP', pos.partR || 0, pos.partR ? 0.5 : 1);
          } else if (m >= exitMin && m < 1200) finish(i, b.c, 'Hết giờ', pos.partR || 0, pos.partR ? 0.5 : 1);
        }
      }
      // ---- detect setups
      if (!pos && !traded && setup) {
        const d = setup.dir; setup.n++;
        setup.ext = d === 1 ? Math.min(setup.ext, b.l) : Math.max(setup.ext, b.h);
        const brk = d === 1 ? b.c > setup.mss : b.c < setup.mss;
        if (brk && Math.abs(b.c - b.o) >= P.stDisp * avgBody(i)) {
          FN.mss++; let F = null;
          for (let j = i; j >= setup.i + 1 && !F; j--) {
            if (d === 1 && B[j].l > B[j - 2].h) F = { lo: B[j - 2].h, hi: B[j].l };
            if (d === -1 && B[j].h < B[j - 2].l) F = { lo: B[j].h, hi: B[j - 2].l };
          }
          if (F) FN.fvg++;
          if (F && kz) {
            const entry = P.stEntry === 'ce' ? (F.lo + F.hi) / 2 : (d === 1 ? F.hi : F.lo);
            const sl = d === 1 ? setup.ext - P.stBuf : setup.ext + P.stBuf, r = Math.abs(entry - sl);
            let tp = null, tp2 = null, tpn = '';
            if (P.stTP === 'liq') {
              const cand = lv.filter(L => !L.taken && L.s === d && (L.p - entry) * d > 0).sort((a, b2) => (a.p - b2.p) * d);
              const c0 = cand.find(L => Math.abs(L.p - entry) / r >= P.stMinRR); if (c0) { tp = c0.p; tpn = c0.n; }
            } else { tp = entry + d * P.stRR * r; tp2 = entry + d * P.stRR2 * r; }
            const ok = tp != null && r > 0.05 && (!P.stMaxSL || r <= P.stMaxSL) && (d === 1 ? b.c > entry : b.c < entry);
            if (!ok) FN.filt++; else FN.pend++;
            if (ok) pos = { dir: d, status: 'pending', entry: +entry.toFixed(2), sl: +sl.toFixed(2), sl0: +sl.toFixed(2), tp: +tp.toFixed(2), tp2: tp2 && +tp2.toFixed(2), tpn, lvl: setup.lvl, tSweep: setup.t, tMSS: b.t, kz: kz && kz[0] === 120 ? 'London' : 'NY AM', dow: D.dow, fvg: F };
          }
          setup = null;
        } else if (setup.n > P.stWait) setup = null;
      }
      for (const L of lv) {
        if (L.taken) continue;
        const hit = L.s === 1 ? b.h > L.p : b.l < L.p;
        if (!hit) continue;
        L.taken = true;
        const dir = -L.s;
        if (active && !pos && !traded && !setup && (bias === 0 || bias === dir)) {
          let mss = dir === 1 ? -Infinity : Infinity;
          for (let j = Math.max(0, i - P.stLook); j < i; j++) mss = dir === 1 ? Math.max(mss, B[j].h) : Math.min(mss, B[j].l);
          FN.sw++; setup = { dir, lvl: L.n, ext: dir === 1 ? b.l : b.h, mss, i, t: b.t, n: 0 };
        }
      }
    }
    if (pos && pos.status === 'open') finish(B.length - 1, B[B.length - 1].c, 'Hết dữ liệu', pos.partR || 0, pos.partR ? 0.5 : 1);
    this.last = trades;
    $('#stInfo').textContent = `${B.length.toLocaleString()} nến · ${Data.dayKeys.length} ngày · ${(performance.now() - t0).toFixed(0)} ms · ${cancels} lệnh chờ bị hủy`;
    this.render(trades, P, FN);
  },
  render(tr, P, FN) {
    const S = Stats.calc(tr), out = $('#stOut');
    const groups = (f) => { const g = {}; tr.forEach(t => { const k = f(t); (g[k] = g[k] || []).push(t); }); return Object.entries(g).map(([k, a]) => { const s = Stats.calc(a); return `<tr><td>${esc(k)}</td><td>${a.length}</td><td>${s.wr}%</td><td class="${s.exp >= 0 ? 'pos' : 'neg'}">${fR(s.exp)}</td><td class="${s.tot >= 0 ? 'pos' : 'neg'}">${fR(s.tot)}</td></tr>`; }).join(''); };
    const gt = (title, f) => `<div class="card"><h4>${title}</h4><table class="tbl"><tr><th></th><th>Lệnh</th><th>Thắng</th><th>Kỳ vọng</th><th>Tổng</th></tr>${groups(f)}</table></div>`;
    out.innerHTML = (Data.synthetic ? '<div class="note warn" style="margin-top:14px">Bạn đang chạy trên <b>dữ liệu mô phỏng ngẫu nhiên</b>. Kết quả gần 0 hoặc âm là bình thường: dữ liệu ngẫu nhiên không có thanh khoản thật. Hãy nạp dữ liệu XAUUSD thật để kiểm chứng.</div>' : '') +
      `<div class="grid g4" style="margin-top:14px">${Stats.kpis(S)}</div>
      ${FN ? `<div class="card" style="margin-top:14px"><h4>Phễu lọc setup</h4><div class="row mono" style="gap:6px;font-size:13px">
        <span class="pill">${FN.sw} cú quét trong KZ</span>→<span class="pill">${FN.mss} MSS có displacement</span>→<span class="pill">${FN.fvg} có FVG</span>→<span class="pill">${FN.pend} lệnh chờ (${FN.filt} bị loại: RR/SL quá lớn)</span>→<span class="pill gold">${FN.fill} khớp</span></div>
        <p class="muted" style="font-size:12.5px;margin:8px 0 0">Bước nào rơi nhiều nhất là bộ lọc khắt khe nhất. Nới lỏng thử (VD: giảm "Displacement", tăng "Tối đa nến chờ MSS") để xem kỳ vọng thay đổi thế nào — nhưng cẩn thận tối ưu quá mức.</p></div>` : ''}
      ${S.n < 30 ? '<div class="note warn">Ít hơn 30 lệnh: mẫu quá nhỏ để kết luận. Nạp thêm dữ liệu.</div>' : ''}
      <div class="card" style="margin-top:14px"><h4>Đường vốn (R tích lũy, đã trừ chi phí)</h4><svg class="eq" id="stEq"></svg></div>
      <div class="grid g3" style="margin-top:14px">${gt('Theo mức thanh khoản bị quét', t => t.lvl)}${gt('Theo hướng', t => t.dir === 1 ? 'MUA' : 'BÁN')}${gt('Theo thứ', t => WD[t.dow])}</div>
      <div class="grid g2" style="margin-top:14px">${gt('Theo killzone', t => t.kz)}${gt('Theo kết quả', t => t.outcome)}</div>
      <h2>Danh sách lệnh (${tr.length})</h2>
      <div class="tblwrap"><table class="tbl"><tr><th>#</th><th>Khớp (VN)</th><th>Hướng</th><th>Quét</th><th>Entry</th><th>SL</th><th>TP</th><th>SL $</th><th>Kết quả</th><th>R</th><th></th></tr>
      ${tr.map((t, i) => `<tr><td>${i + 1}</td><td class="mono">${T.fmt(t.tFill)}</td><td><span class="pill ${t.dir === 1 ? 'up' : 'down'}">${t.dir === 1 ? 'MUA' : 'BÁN'}</span></td><td>${esc(t.lvl)}</td><td class="mono">${f2(t.entry)}</td><td class="mono">${f2(t.sl0)}</td><td class="mono">${f2(t.tp)}</td><td class="mono">${f2(Math.abs(t.entry - t.sl0))}</td><td>${esc(t.outcome)}</td><td class="mono ${t.R >= 0 ? 'pos' : 'neg'}">${fR(t.R)}</td><td><button class="btn sm" onclick="Strat.view(${i})">Xem</button></td></tr>`).join('')}</table></div>`;
    UI.eq($('#stEq'), Stats.cum(tr));
  },
  view(i) { const t = this.last[i]; Lab.showTrade({ ...t, sl: t.sl0 }); },
  toJournal() {
    if (!this.last.length) return UI.toast('Chạy backtest trước');
    const keep = Journal.list().filter(x => x.src !== 'auto');
    const add = this.last.map((t, i) => ({ id: 'a' + i + '_' + t.tFill, src: 'auto', t: t.tFill, tExit: t.tExit, dir: t.dir, setup: 'A', entry: t.entry, sl: t.sl0, tp: t.tp, exit: t.exit, R: t.R, outcome: t.outcome, chk: 9, note: 'Tự động: quét ' + t.lvl, data: Data.name }));
    Store.set('trades', keep.concat(add)); UI.toast(`Đã chép ${add.length} lệnh (thay thế kết quả tự động cũ)`);
  },
};

/* ---------------- Stats ---------------- */
const Stats = {
  calc(tr) {
    const n = tr.length, W = tr.filter(t => t.R > 0), L = tr.filter(t => t.R < 0);
    const tot = tr.reduce((a, t) => a + t.R, 0), gw = W.reduce((a, t) => a + t.R, 0), gl = -L.reduce((a, t) => a + t.R, 0);
    let peak = 0, eq = 0, dd = 0, streak = 0, ms = 0;
    tr.forEach(t => { eq += t.R; peak = Math.max(peak, eq); dd = Math.max(dd, peak - eq); if (t.R < 0) { streak++; ms = Math.max(ms, streak); } else streak = 0; });
    return { n, w: W.length, l: L.length, wr: n ? Math.round(W.length / n * 100) : 0, tot: +tot.toFixed(2), exp: n ? +(tot / n).toFixed(2) : 0, aw: W.length ? gw / W.length : 0, al: L.length ? gl / L.length : 0, pf: gl ? gw / gl : (gw ? Infinity : 0), dd, ms };
  },
  cum(tr) { let s = 0; return tr.map(t => s += t.R); },
  kpis(S) {
    const k = (v, l, c = '') => `<div class="card kpi"><div class="v ${c}">${v}</div><div class="l">${l}</div></div>`;
    return k(S.n, 'Số lệnh') + k(S.wr + '%', `Tỷ lệ thắng (${S.w}W / ${S.l}L)`) + k(fR(S.exp), 'Kỳ vọng / lệnh', S.exp >= 0 ? 'pos' : 'neg') + k(fR(S.tot), 'Tổng R', S.tot >= 0 ? 'pos' : 'neg')
      + k(S.aw.toFixed(2) + 'R', 'R thắng trung bình') + k(isFinite(S.pf) ? S.pf.toFixed(2) : '∞', 'Profit factor') + k('-' + S.dd.toFixed(1) + 'R', 'Sụt giảm tối đa', 'neg') + k(S.ms, 'Chuỗi thua dài nhất');
  },
};

/* ---------------- Journal ---------------- */
const Journal = {
  list() { return Store.get('trades', []); },
  add(t) { const a = this.list(); t.id = t.id || 'j' + Date.now() + Math.random().toString(36).slice(2, 6); a.push(t); Store.set('trades', a); },
  filtered() { const s = $('#jSrc').value, st = $('#jSetup').value; return this.list().filter(t => (s === 'all' || t.src === s) && (st === 'all' || t.setup === st)).sort((a, b) => (a.t || 0) - (b.t || 0)); },
  render() {
    const tr = this.filtered(), S = Stats.calc(tr);
    $('#jKpi').innerHTML = Stats.kpis(S);
    UI.eq($('#jEq'), Stats.cum(tr));
    const grp = (f) => { const g = {}; tr.forEach(t => { const k = f(t); (g[k] = g[k] || []).push(t); }); return '<table class="tbl"><tr><th></th><th>Lệnh</th><th>Thắng</th><th>Kỳ vọng</th></tr>' + Object.entries(g).map(([k, a]) => { const s = Stats.calc(a); return `<tr><td>${esc(k)}</td><td>${a.length}</td><td>${s.wr}%</td><td class="${s.exp >= 0 ? 'pos' : 'neg'}">${fR(s.exp)}</td></tr>`; }).join('') + '</table>'; };
    $('#jBySetup').innerHTML = tr.length ? grp(t => 'Setup ' + t.setup) : '<span class="muted">—</span>';
    $('#jByComp').innerHTML = tr.length ? grp(t => t.chk >= 9 ? '✅ Đủ 9/9 checklist' : '⚠️ Thiếu checklist (' + (t.chk ?? '?') + '/9)') : '<span class="muted">—</span>';
    const SRC = { replay: 'Lab', auto: 'Tự động', demo: 'Demo', real: 'Thật' };
    $('#jTbl').innerHTML = `<tr><th>Thời gian (VN)</th><th>Nguồn</th><th>Setup</th><th>Hướng</th><th>Entry</th><th>SL</th><th>TP</th><th>Kết quả</th><th>R</th><th>Checklist</th><th>Ghi chú</th><th></th></tr>` +
      tr.slice().reverse().slice(0, 500).map(t => `<tr><td class="mono">${t.t ? T.fmt(t.t) : esc(t.date || '')}</td><td>${SRC[t.src] || t.src}</td><td>${esc(t.setup)}</td><td><span class="pill ${t.dir === 1 ? 'up' : 'down'}">${t.dir === 1 ? 'MUA' : 'BÁN'}</span></td><td class="mono">${f2(t.entry)}</td><td class="mono">${f2(t.sl)}</td><td class="mono">${f2(t.tp)}</td><td>${esc(t.outcome)}</td><td class="mono ${t.R >= 0 ? 'pos' : 'neg'}">${fR(t.R)}</td><td>${t.chk ?? '—'}/9</td><td style="max-width:240px">${esc(t.note)}</td><td><button class="btn sm" onclick="Journal.del('${t.id}')">✕</button></td></tr>`).join('');
  },
  del(id) { Store.set('trades', this.list().filter(t => t.id !== id)); this.render(); },
  clear() { const f = new Set(this.filtered().map(t => t.id)); if (!f.size || !confirm(`Xóa ${f.size} lệnh đang hiển thị?`)) return; Store.set('trades', this.list().filter(t => !f.has(t.id))); this.render(); },
  addForm() {
    $('#jForm').innerHTML = `<div class="card" style="margin-bottom:14px"><h4>Thêm lệnh (demo / thật / backtest TradingView)</h4>
    <div class="grid g4">
      <div><label class="f">Nguồn</label><select id="jfSrc"><option value="demo">Demo</option><option value="real">Tiền thật</option><option value="replay">Backtest (TradingView Replay)</option></select></div>
      <div><label class="f">Ngày giờ (VN)</label><input type="datetime-local" id="jfT" style="background:#0e1422;border:1px solid var(--line);border-radius:8px;padding:6px;width:100%"></div>
      <div><label class="f">Hướng</label><select id="jfDir"><option value="1">MUA</option><option value="-1">BÁN</option></select></div>
      <div><label class="f">Setup</label><select id="jfSetup"><option>A</option><option>B</option><option>C</option><option>Khác</option></select></div>
      <div><label class="f">Entry</label><input type="number" step="0.01" id="jfE"></div>
      <div><label class="f">SL</label><input type="number" step="0.01" id="jfS"></div>
      <div><label class="f">TP</label><input type="number" step="0.01" id="jfTP"></div>
      <div><label class="f">Giá thoát (để trống nếu nhập R)</label><input type="number" step="0.01" id="jfX"></div>
      <div><label class="f">Hoặc R đạt được</label><input type="number" step="0.01" id="jfR"></div>
      <div><label class="f">Checklist đạt (0–9)</label><input type="number" id="jfC" value="9" min="0" max="9"></div>
      <div style="grid-column:span 2"><label class="f">Ghi chú</label><input type="text" id="jfN"></div>
    </div><div class="row" style="margin-top:10px"><button class="btn pri" onclick="Journal.saveForm()">Lưu</button><button class="btn" onclick="$('#jForm').innerHTML=''">Hủy</button></div></div>`;
  },
  saveForm() {
    const e = +$('#jfE').value, s = +$('#jfS').value, x = $('#jfX').value, d = +$('#jfDir').value;
    let R = $('#jfR').value !== '' ? +$('#jfR').value : (x !== '' && e && s ? (+x - e) * d / Math.abs(e - s) : NaN);
    if (!isFinite(R)) return UI.toast('Cần Entry + SL + Giá thoát, hoặc nhập R');
    const tv = $('#jfT').value; const t = tv ? Date.parse(tv + ':00Z') / 1000 - 7 * 3600 : T.now();
    this.add({ src: $('#jfSrc').value, t, dir: d, setup: $('#jfSetup').value, entry: e, sl: s, tp: +$('#jfTP').value || null, exit: x !== '' ? +x : null, R: +R.toFixed(2), outcome: R > 0 ? 'Thắng' : R < 0 ? 'Thua' : 'Hòa', chk: +$('#jfC').value, note: $('#jfN').value });
    $('#jForm').innerHTML = ''; this.render(); UI.toast('Đã lưu');
  },
  exportCSV() {
    const tr = this.filtered(), h = ['thoi_gian_vn', 'nguon', 'setup', 'huong', 'entry', 'sl', 'tp', 'exit', 'ket_qua', 'R', 'checklist', 'ghi_chu'];
    const rows = tr.map(t => [t.t ? T.fmt(t.t) : '', t.src, t.setup, t.dir === 1 ? 'MUA' : 'BAN', t.entry, t.sl, t.tp, t.exit, t.outcome, t.R, t.chk, (t.note || '').replace(/[\n,]/g, ' ')].join(','));
    UI.download('nhat_ky_giao_dich.csv', '\uFEFF' + h.join(',') + '\n' + rows.join('\n'), 'text/csv');
  },
};

/* ---------------- Quiz engine ---------------- */
const Quiz = {
  init() {
    $('#qzCh').innerHTML = '<option value="0">Tất cả chương</option>' + CHAPTERS.map(c => `<option value="${c.id}">Chương ${c.id}: ${c.title}</option>`).join('');
    this.hist();
  },
  hist() { const h = Store.get('quizHist', []); $('#qzHist').textContent = h.length ? `Lần gần nhất: ${h[h.length - 1].s}/${h[h.length - 1].n} · Số lần làm: ${h.length} · Câu đang sai: ${Store.get('qWrong', []).length}` : ''; },
  pick(ch, n, mode) {
    let pool = QUESTIONS.map((q, i) => ({ ...q, id: i })).filter(q => !ch || q.c === ch);
    if (mode === 'wrong') { const w = new Set(Store.get('qWrong', [])); const pw = pool.filter(q => w.has(q.id)); if (!pw.length) UI.toast('Không có câu sai nào — làm ngẫu nhiên'); else pool = pw; }
    pool.sort(() => Math.random() - 0.5);
    return pool.slice(0, n);
  },
  start() { this.run($('#quizRun'), this.pick(+$('#qzCh').value, +$('#qzN').value, $('#qzMode').value), r => { const h = Store.get('quizHist', []); h.push({ d: Date.now(), s: r.s, n: r.n, ch: +$('#qzCh').value }); Store.set('quizHist', h); this.hist(); }); $('#quizSetup').style.display = 'none'; $('#quizRun').style.display = 'block'; },
  run(el, qs, done, opts = {}) {
    let i = 0, score = 0; const wrongs = new Set(Store.get('qWrong', []));
    const show = () => {
      if (i >= qs.length) {
        Store.set('qWrong', [...wrongs]);
        const pct = Math.round(score / qs.length * 100);
        el.innerHTML = `<div class="card"><h3 style="margin-top:0">Kết quả: ${score}/${qs.length} (${pct}%)</h3><div class="bar"><i style="width:${pct}%"></i></div>
          <p>${pct >= 80 ? '✅ Rất tốt! Bạn nắm vững nội dung.' : pct >= 60 ? '🟡 Khá. Xem lại các câu sai và tài liệu chương.' : '🔴 Cần ôn lại lý thuyết trước khi thực chiến.'}</p>
          <div class="row">${opts.chapter ? `<button class="btn pri" onclick="Chapters.open(${opts.chapter},'test')">Làm lại</button>` : '<button class="btn pri" onclick="$(\'#quizSetup\').style.display=\'block\';$(\'#quizRun\').style.display=\'none\'">Làm lại</button>'}<button class="btn" onclick="this.closest(\'.card\').nextElementSibling.style.display=\'block\'">Xem lại câu sai</button></div></div>
          <div style="display:none">${qs.filter(q => q.wrong).map(q => `<div class="card" style="margin-top:10px"><b>${esc(q.q)}</b><div class="pos" style="margin-top:6px">✔ ${esc(q.o[q.a])}</div><div class="muted">${esc(q.e)}</div></div>`).join('') || '<p class="muted">Không có câu sai 🎉</p>'}</div>`;
        done && done({ s: score, n: qs.length, pct });
        return;
      }
      const q = qs[i];
      el.innerHTML = `<div class="card"><div class="row" style="justify-content:space-between"><span class="pill gold">Chương ${q.c}</span><span class="muted mono">${i + 1}/${qs.length} · Đúng ${score}</span></div>
        <div class="bar" style="margin:10px 0"><i style="width:${i / qs.length * 100}%"></i></div>
        <h3 style="color:var(--text);margin:14px 0">${esc(q.q)}</h3>
        ${q.o.map((o, j) => `<button class="qopt" data-j="${j}"><b class="muted">${'ABCD'[j]}.</b> ${esc(o)}</button>`).join('')}
        <div id="qExp"></div></div>`;
      $$('.qopt', el).forEach(b => b.onclick = () => {
        if (el.dataset.lock === '1') return; el.dataset.lock = '1';
        const j = +b.dataset.j, ok = j === q.a;
        $$('.qopt', el)[q.a].classList.add('right'); if (!ok) { b.classList.add('wrong'); q.wrong = 1; wrongs.add(q.id); } else { score++; wrongs.delete(q.id); }
        $('#qExp', el).innerHTML = `<div class="note ${ok ? 'ok' : 'bad'}">${ok ? '✅ Chính xác.' : '❌ Chưa đúng.'} ${esc(q.e)}</div><button class="btn pri" id="qNext">${i + 1 < qs.length ? 'Câu tiếp →' : 'Xem kết quả'}</button>`;
        $('#qNext', el).onclick = () => { el.dataset.lock = '0'; i++; show(); };
      });
    };
    el.dataset.lock = '0'; show();
  },
};

/* ---------------- Scenarios (24 bài) ---------------- */
const Scen = {
  i: 0,
  init() { this.renderNav(); this.show(Store.get('scenIdx', 0)); },
  st() { return Store.get('scen', {}); },
  renderNav() {
    const st = this.st(), ok = Object.values(st).filter(x => x.ok).length, done = Object.keys(st).length;
    $('#scenNav').innerHTML = SCENARIOS.map((s, i) => { const r = st[s.n]; return `<button class="btn sm ${i === this.i ? 'on' : ''}" style="${r ? (r.ok ? 'border-color:var(--up)' : 'border-color:var(--down)') : ''}" onclick="Scen.show(${i})">${s.n}</button>`; }).join('') + `<span class="muted" style="margin-left:8px">Đã làm ${done}/24 · Quyết định đúng ${ok}</span> <button class="btn sm" onclick="if(confirm('Làm lại từ đầu?')){Store.set('scen',{});Scen.init()}">↺ Làm lại</button>`;
  },
  show(i) {
    this.i = Math.max(0, Math.min(SCENARIOS.length - 1, i)); Store.set('scenIdx', this.i); this.renderNav();
    const s = SCENARIOS[this.i], r = this.st()[s.n];
    $('#scenBox').innerHTML = `<div class="grid g2">
      <div class="card"><div class="row"><span class="pill gold">Bài ${s.n}</span><span class="pill">${esc(s.day)}</span><span class="pill">${esc(s.kz)}</span></div>
        <h3>Bối cảnh</h3><p style="font-size:15px">${esc(s.ctx)}</p>
        <table class="tbl"><tr><td>Bias D1 / H4</td><td><b>${esc(s.d1)}</b> / <b>${esc(s.h4)}</b></td></tr>
        <tr><td>Thanh khoản vừa bị quét</td><td>${esc(s.liq)} — mức ${f2(s.lvl)}, râu tới ${f2(s.wick)} lúc ${esc(s.tsweep)}</td></tr>
        <tr><td>FVG</td><td class="mono">${f2(s.fl)} – ${f2(s.fh)}</td></tr>
        <tr><td>Thanh khoản đối diện</td><td>${esc(s.tp1n)} <b class="mono">${f2(s.tp1)}</b> · ${esc(s.tp2n)} <b class="mono">${f2(s.tp2)}</b></td></tr></table>
        <p class="muted" style="font-size:12.5px">Gợi ý: Entry = CE của FVG, SL = râu quét ± 1.2$ đệm, TP1 = thanh khoản đối diện gần nhất. Kiểm tra killzone, bias, RR ≥ 2, tin tức.</p></div>
      <div class="card" id="scenAns"></div></div>
      <div class="row" style="margin-top:12px;justify-content:space-between"><button class="btn" onclick="Scen.show(${this.i - 1})">← Bài trước</button><button class="btn" onclick="Scen.show(${this.i + 1})">Bài sau →</button></div>`;
    r ? this.reveal(r) : this.ask();
  },
  ask() {
    $('#scenAns').innerHTML = `<h4>Quyết định của bạn</h4>
      <div class="seg" id="scDir"><button class="b" data-v="MUA">MUA</button><button class="s" data-v="BÁN">BÁN</button><button class="n" data-v="—">KHÔNG VÀO</button></div>
      <div id="scNums" style="display:none"><div class="grid g3" style="margin-top:10px"><div><label class="f">Entry</label><input type="number" step="0.01" id="scE"></div><div><label class="f">SL</label><input type="number" step="0.01" id="scS"></div><div><label class="f">TP1</label><input type="number" step="0.01" id="scT"></div></div><div class="muted mono" id="scRR" style="margin-top:6px;font-size:12.5px"></div></div>
      <label class="f">Lý do của bạn</label><textarea id="scWhy" placeholder="VD: bias tăng, quét đáy London trong killzone, MSS + FVG, RR 2.3…"></textarea>
      <button class="btn pri" style="margin-top:10px" onclick="Scen.submit()">Chấm điểm</button>`;
    this.dec = null;
    $$('#scDir button').forEach(b => b.onclick = () => { this.dec = b.dataset.v; $$('#scDir button').forEach(x => x.classList.toggle('on', x === b)); $('#scNums').style.display = this.dec === '—' ? 'none' : 'block'; });
    ['scE', 'scS', 'scT'].forEach(id => $('#' + id).oninput = () => { const e = +$('#scE').value, s = +$('#scS').value, t = +$('#scT').value; $('#scRR').textContent = e && s ? `SL ${f2(Math.abs(e - s))}$ · ` + (t ? `RR ${(Math.abs(t - e) / Math.abs(e - s)).toFixed(2)}` : '') : ''; });
  },
  submit() {
    if (!this.dec) return UI.toast('Chọn MUA / BÁN / KHÔNG VÀO');
    const s = SCENARIOS[this.i], r = { dec: this.dec, why: $('#scWhy').value, e: +$('#scE').value || null, sl: +$('#scS').value || null, tp: +$('#scT').value || null };
    r.ok = r.dec === s.dir;
    if (r.ok && r.dec !== '—') r.prec = { e: r.e != null && Math.abs(r.e - s.entry) <= 0.5, sl: r.sl != null && Math.abs(r.sl - s.sl) <= 0.8, tp: r.tp != null && Math.abs(r.tp - s.tp1) <= 0.8 };
    const st = this.st(); st[s.n] = r; Store.set('scen', st); this.renderNav(); this.reveal(r);
  },
  reveal(r) {
    const s = SCENARIOS[this.i], tick = b => b ? '<span class="pos">✔</span>' : '<span class="neg">✘</span>';
    $('#scenAns').innerHTML = `<h4>Đáp án</h4>
      <div class="note ${r.ok ? 'ok' : 'bad'}">Bạn chọn <b>${r.dec === '—' ? 'KHÔNG VÀO' : r.dec}</b> · Đáp án <b>${s.dir === '—' ? 'KHÔNG VÀO' : s.dir}</b> ${r.ok ? '✅' : '❌'}</div>
      ${s.dir !== '—' ? `<table class="tbl"><tr><th></th><th>Đáp án</th><th>Bạn</th><th></th></tr>
        <tr><td>Entry (CE)</td><td class="mono">${f2(s.entry)}</td><td class="mono">${f2(r.e)}</td><td>${r.prec ? tick(r.prec.e) : ''}</td></tr>
        <tr><td>SL</td><td class="mono">${f2(s.sl)} (${f2(s.sld)}$)</td><td class="mono">${f2(r.sl)}</td><td>${r.prec ? tick(r.prec.sl) : ''}</td></tr>
        <tr><td>TP1 — ${esc(s.tp1n)}</td><td class="mono">${f2(s.tp1)} (RR ${f2(s.rr1)})</td><td class="mono">${f2(r.tp)}</td><td>${r.prec ? tick(r.prec.tp) : ''}</td></tr>
        <tr><td>TP2 — ${esc(s.tp2n)}</td><td class="mono">${f2(s.tp2)} (RR ${f2(s.rr2)})</td><td></td><td></td></tr>
        <tr><td>Lot (1.000$, 1%)</td><td class="mono">${esc(s.lot)}</td><td></td><td></td></tr></table>` : ''}
      <h3>Lý do</h3><p>${esc(s.why)}</p>
      <h3>Diễn biến thực tế</h3><p><b>${esc(s.result)}</b> ${s.r ? `→ <span class="mono ${s.r >= 0 ? 'pos' : 'neg'}">${fR(s.r)}</span>` : ''} ${s.tfill && s.tfill !== '—' ? '· khớp lúc ' + esc(s.tfill) : ''}</p>
      <div class="note">💡 ${esc(s.lesson)}</div>
      ${r.why ? `<p class="muted"><b>Lý do của bạn:</b> ${esc(r.why)}</p>` : ''}
      <div class="row"><button class="btn" onclick="Scen.redo()">Làm lại bài này</button>${this.i < 23 ? `<button class="btn pri" onclick="Scen.show(${this.i + 1})">Bài tiếp →</button>` : ''}</div>`;
  },
  redo() { const st = this.st(); delete st[SCENARIOS[this.i].n]; Store.set('scen', st); this.show(this.i); },
};

/* ---------------- Chapters ---------------- */
const Chapters = {
  prog() { return Store.get('chap', {}); },
  done(id) { const p = this.prog()[id] || {}; const c = CHAPTERS.find(x => x.id === id); return !!(p.quiz >= 80 && c.tasks.every((_, i) => (p.tasks || [])[i])); },
  renderList() {
    $('#chList').innerHTML = CHAPTERS.map(c => {
      const p = this.prog()[c.id] || {}, t = (p.tasks || []).filter(Boolean).length;
      return `<div class="card chcard" onclick="location.hash='#chapters/${c.id}'"><div class="num">CHƯƠNG ${c.id}</div><div class="ic">${c.icon}</div><h4 style="margin-top:8px;font-size:15.5px">${c.title}</h4><div class="muted" style="font-size:12.5px;min-height:38px">${c.sub}</div>
      <div class="row" style="margin-top:10px;font-size:12px"><span class="muted">Nhiệm vụ ${t}/${c.tasks.length}</span><span class="muted">· Kiểm tra ${p.quiz != null ? p.quiz + '%' : '—'}</span>${this.done(c.id) ? '<span class="done">· ✅ Hoàn thành</span>' : ''}</div></div>`;
    }).join('');
  },
  open(id, tab = 'theory') {
    const c = CHAPTERS.find(x => x.id === id); if (!c) return this.index();
    $('#chIndex').style.display = 'none'; const v = $('#chView'); v.style.display = 'block';
    const p = this.prog()[id] || {};
    v.innerHTML = `<a href="#chapters" class="muted" style="text-decoration:none">← Tất cả chương</a>
      <h1 style="margin-top:10px">${c.icon} Chương ${c.id}: ${c.title}</h1><p class="lead">${c.sub}</p>
      <div class="card"><b>Mục tiêu:</b><ul style="margin:6px 0 0">${c.goals.map(g => `<li>${g}</li>`).join('')}</ul></div>
      <div class="tabs">${[['theory', '📖 Lý thuyết'], ['res', '📂 Tài liệu'], ['prac', '🕹️ Thực chiến'], ['test', '📝 Kiểm tra']].map(([k, n]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div id="chBody"></div>
      <div class="row" style="justify-content:space-between;margin-top:20px">${id > 1 ? `<a class="btn" href="#chapters/${id - 1}">← Chương ${id - 1}</a>` : '<span></span>'}${id < CHAPTERS.length ? `<a class="btn pri" href="#chapters/${id + 1}">Chương ${id + 1} →</a>` : ''}</div>`;
    $$('.tabs button', v).forEach(b => b.onclick = () => { $$('.tabs button', v).forEach(x => x.classList.toggle('on', x === b)); this.tab(c, b.dataset.t); });
    this.tab(c, tab); Store.set('lastCh', id); main().scrollTop = 0;
  },
  tab(c, t) {
    const el = $('#chBody'), p = this.prog()[c.id] || {};
    if (t === 'theory') el.innerHTML = `<div class="card">${c.html}</div>`;
    if (t === 'res') {
      const ic = { pdf: '📕', video: '🎬', img: '🖼️', doc: '📝', xlsx: '📊', folder: '📁' };
      el.innerHTML = `<div class="card res"><p class="muted">Các file nằm trong thư mục <code>Documents</code> và <code>ICT_Gold_Playbook</code> trên máy bạn. Video và ảnh mở ngay trong trang.</p>${c.res.map((r, i) => `<a data-i="${i}">${ic[r.k] || '📄'} <span>${esc(r.t)}</span><span class="muted" style="margin-left:auto;font-size:12px">${r.k.toUpperCase()}</span></a>`).join('')}</div>`;
      $$('.res a', el).forEach(a => a.onclick = () => UI.openRes(c.res[+a.dataset.i]));
    }
    if (t === 'prac') {
      el.innerHTML = `<div class="card"><p>Làm từng nhiệm vụ rồi tích vào ô. Dùng <a href="#lab">Backtest Lab</a> (dữ liệu của bạn hoặc demo) và <a href="#tv">Chart TradingView</a>.</p>
        ${c.tasks.map((tk, i) => `<label class="task"><input type="checkbox" data-i="${i}" ${(p.tasks || [])[i] ? 'checked' : ''}><span>${tk}</span></label>`).join('')}
        <div class="row" style="margin-top:12px"><a class="btn pri" href="#lab">🕹️ Mở Backtest Lab</a>${c.id === 6 ? '<a class="btn" href="#scen">🎲 Kịch bản thực chiến</a><a class="btn" href="#auto">⚙️ Thử nghiệm chiến lược</a>' : ''}${c.id === 7 ? '<a class="btn" href="#tools">🧮 Máy tính lot</a>' : ''}${c.id === 8 ? '<a class="btn" href="#journal">📒 Nhật ký</a>' : ''}</div>
        <label class="f" style="margin-top:14px">Ghi chú của bạn cho chương này</label><textarea id="chNote" style="min-height:100px">${esc(p.note || '')}</textarea></div>`;
      $$('.task input', el).forEach(x => x.onchange = () => { const P = this.prog(); P[c.id] = P[c.id] || {}; P[c.id].tasks = P[c.id].tasks || []; P[c.id].tasks[+x.dataset.i] = x.checked; Store.set('chap', P); this.check(c.id); });
      $('#chNote').oninput = e => { const P = this.prog(); P[c.id] = P[c.id] || {}; P[c.id].note = e.target.value; Store.set('chap', P); };
    }
    if (t === 'test') {
      el.innerHTML = `<p class="muted">${QUESTIONS.filter(q => q.c === c.id).length} câu của chương ${c.id}. Cần ≥ 80% để hoàn thành chương. ${p.quiz != null ? 'Điểm cao nhất: <b>' + p.quiz + '%</b>' : ''}</p><div id="chQuiz"></div>`;
      Quiz.run($('#chQuiz'), Quiz.pick(c.id, 99, 'rand'), r => { const P = this.prog(); P[c.id] = P[c.id] || {}; P[c.id].quiz = Math.max(P[c.id].quiz || 0, r.pct); Store.set('chap', P); this.check(c.id); }, { chapter: c.id });
    }
  },
  check(id) { if (this.done(id)) UI.toast(`🎉 Hoàn thành chương ${id}!`); },
  index() { $('#chIndex').style.display = 'block'; $('#chView').style.display = 'none'; this.renderList(); },
};
const main = () => $('main');

/* ---------------- Home ---------------- */
const Home = {
  render() {
    const chDone = CHAPTERS.filter(c => Chapters.done(c.id)).length;
    const st = Scen.st(), scOk = Object.values(st).filter(x => x.ok).length, scDone = Object.keys(st).length;
    const J = Journal.list(), rp = J.filter(t => t.src === 'replay'), demo = J.filter(t => t.src === 'demo'), real = J.filter(t => t.src === 'real');
    const Sd = Stats.calc(demo), comp = demo.length ? Math.round(demo.filter(t => t.chk >= 9).length / demo.length * 100) : 0, Sr = Stats.calc(rp);
    const k = (v, l, pct) => `<div class="card kpi"><div class="v">${v}</div><div class="l">${l}</div><div class="bar" style="margin-top:8px"><i style="width:${Math.min(100, pct)}%"></i></div></div>`;
    $('#homeKpi').innerHTML = k(chDone + '/8', 'Chương hoàn thành', chDone / 8 * 100) + k(scOk + '/24', `Kịch bản đúng (đã làm ${scDone})`, scOk / 24 * 100) + k(rp.length + '/50', `Mẫu backtest · kỳ vọng ${fR(Sr.exp)}`, rp.length / 50 * 100) + k(demo.length + '/30', `Lệnh demo · tuân thủ ${comp}%`, demo.length / 30 * 100);
    const W = [
      ['Tuần 1', 'Học 8 chương + 24 kịch bản', 'Hiểu lý do từng đáp án', chDone === 8 && scDone === 24],
      ['Tuần 2–3', 'Backtest M5, 3 tháng, chỉ 19:30–22:00 VN', `50 mẫu (đang có ${rp.length})`, rp.length >= 50],
      ['Tuần 4–7', 'Demo đúng giờ thật, rủi ro 1%', `≥ 30 lệnh, tuân thủ ≥ 90%, kỳ vọng > +0.2R (hiện ${demo.length} lệnh, ${comp}%, ${fR(Sd.exp)})`, demo.length >= 30 && comp >= 90 && Sd.exp > 0.2],
      ['Tuần 8+', 'Tiền thật, rủi ro 0.5% hoặc cent', `Giữ số liệu như demo 1 tháng (${real.length} lệnh thật)`, false],
    ];
    $('#roadmap').innerHTML = W.map(w => `<div class="week ${w[3] ? 'ok' : ''}"><div class="n">${w[3] ? '✅' : '⬜'}</div><div style="flex:1"><b>${w[0]}: ${w[1]}</b><div class="muted" style="font-size:12.5px">${w[2]}</div></div></div>`).join('');
    const nx = CHAPTERS.find(c => !Chapters.done(c.id));
    $('#nextChapter').innerHTML = nx ? `<div style="font-size:16px;font-weight:600">${nx.icon} Chương ${nx.id}: ${nx.title}</div><p class="muted">${nx.sub}</p><a class="btn pri" href="#chapters/${nx.id}">Học tiếp →</a>` : '<p>🎉 Bạn đã hoàn thành cả 8 chương. Tập trung backtest và demo.</p><a class="btn pri" href="#lab">Mở Lab</a>';
    Tools.today($('#todayBox'));
  },
};

/* ---------------- Tools ---------------- */
const Tools = {
  init() {
    ['lcBal', 'lcRisk', 'lcE', 'lcS', 'lcD', 'lcC'].forEach(id => $('#' + id).addEventListener('input', () => this.lot()));
    $('#srvT').oninput = () => this.srv(); this.lot(); this.srv();
  },
  lot() {
    const bal = +$('#lcBal').value, rk = +$('#lcRisk').value, e = +$('#lcE').value, s = +$('#lcS').value, C = +$('#lcC').value || 100;
    let d = +$('#lcD').value; if (e && s) { d = Math.abs(e - s); $('#lcD').value = d.toFixed(2); }
    const r$ = bal * rk / 100, raw = r$ / (d * C), lot = Math.floor(raw * 100) / 100, real = lot * d * C;
    $('#lcOut').innerHTML = d > 0 ? `<div class="grid g3"><div class="card kpi"><div class="v">${f2(r$)}$</div><div class="l">Số tiền rủi ro</div></div><div class="card kpi"><div class="v" style="color:${lot >= 0.01 ? 'var(--gold2)' : 'var(--down)'}">${lot >= 0.01 ? lot.toFixed(2) : '< 0.01'}</div><div class="l">Lot (làm tròn xuống, thô ${raw.toFixed(4)})</div></div><div class="card kpi"><div class="v">${f2(real)}$</div><div class="l">Rủi ro thực tế (${bal ? (real / bal * 100).toFixed(2) : 0}%)</div></div></div>${lot < 0.01 ? '<div class="note bad">Lot nhỏ hơn 0.01 → <b>bỏ lệnh</b> hoặc dùng tài khoản cent.</div>' : ''}
      <p class="muted" style="font-size:12.5px">TP 2R = ${f2(2 * real)}$ · TP 3R = ${f2(3 * real)}$ · 10 lệnh thua liên tiếp ≈ -${(100 - 100 * Math.pow(1 - rk / 100, 10)).toFixed(1)}% tài khoản</p>` : '';
  },
  srv() {
    const [h, m] = $('#srvT').value.split(':').map(Number), off = T.off(T.now()), add = off === -5 ? 5 : 4;
    $('#srvOut').textContent = `→ ${T.hm(h * 60 + m + add * 60)} giờ VN (${off === -5 ? 'mùa đông, +5' : 'mùa hè, +4'})`;
  },
  sessTable() {
    const off = T.off(T.now());
    $('#sessTbl').innerHTML = `<p class="muted">Hiện tại: <b>${off === -5 ? 'giờ mùa đông' : 'giờ mùa hè'}</b> của Mỹ (NY = UTC${off}).</p><table class="tbl"><tr><th>Phiên</th><th>Giờ NY</th><th>Giờ VN</th></tr>${T.SESS.map(s => `<tr><td>${s.kz ? '<b>' + s.n + '</b>' : s.n}</td><td class="mono">${T.hm(s.s)}${s.e !== s.s ? '–' + T.hm(s.e) : ''}</td><td class="mono"><b>${T.hm(T.nyToVN(s.s, off))}${s.e !== s.s ? '–' + T.hm(T.nyToVN(s.e, off)) : ''}</b></td></tr>`).join('')}</table>`;
  },
  status() {
    const now = T.now(), ny = T.ny(now), off = ny.off, wk = ny.dow === 6 || (ny.dow === 0 && ny.min < 1080) || (ny.dow === 5 && ny.min >= 1020);
    if (wk) return { txt: 'Cuối tuần — thị trường đóng', kz: null };
    const K = [[120, 300, 'London Killzone'], [420, 600, 'NY AM Killzone']];
    const cur = K.find(([s, e]) => ny.min >= s && ny.min < e);
    if (cur) return { txt: `🟢 Đang trong ${cur[2]} (còn ${cur[1] - ny.min} phút)`, kz: cur };
    let best = null; K.forEach(([s, e, n]) => { let d = s - ny.min; if (d < 0) d += 1440; if (!best || d < best.d) best = { d, n, s }; });
    return { txt: `Killzone kế: ${best.n} lúc ${T.hm(T.nyToVN(best.s, off))} (còn ${Math.floor(best.d / 60)}h${String(best.d % 60).padStart(2, '0')})`, kz: null };
  },
  today(el) {
    const s = this.status(), off = T.off(T.now());
    el.innerHTML = `<div style="font-size:15px">${s.txt}</div><table class="tbl" style="margin-top:8px"><tr><td>Range Á (đánh dấu)</td><td class="mono">${T.hm(T.nyToVN(1200, off))}–${T.hm(T.nyToVN(1440, off))}</td></tr><tr><td>London KZ</td><td class="mono">${T.hm(T.nyToVN(120, off))}–${T.hm(T.nyToVN(300, off))}</td></tr><tr><td><b>NY AM KZ</b></td><td class="mono"><b>${T.hm(T.nyToVN(420, off))}–${T.hm(T.nyToVN(600, off))}</b></td></tr><tr><td>Tin Mỹ</td><td class="mono">${T.hm(T.nyToVN(510, off))}</td></tr></table><a href="https://www.forexfactory.com/calendar" target="_blank" rel="noopener">Xem lịch tin (Forex Factory) ↗</a>`;
  },
  tick() {
    const d = new Date((T.now() + 7 * 3600) * 1000);
    $('#clock').textContent = `${WD[d.getUTCDay()]} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    $('#kzNow').textContent = this.status().txt;
  },
};

/* ---------------- TradingView widget ---------------- */
const TV = {
  load() {
    const go = () => {
      $('#tvBox').innerHTML = '<div id="tvInner" style="height:100%"></div>';
      new TradingView.widget({ container_id: 'tvInner', autosize: true, symbol: $('#tvSym').value || 'OANDA:XAUUSD', interval: $('#tvInt').value, timezone: 'Asia/Ho_Chi_Minh', theme: 'dark', style: '1', locale: 'vi_VN', allow_symbol_change: true, withdateranges: true, hide_side_toolbar: false, details: false });
    };
    if (window.TradingView) return go();
    const s = document.createElement('script'); s.src = 'https://s3.tradingview.com/tv.js'; s.onload = go; s.onerror = () => UI.toast('Không tải được TradingView (cần Internet)'); document.head.appendChild(s);
  },
};

/* ---------------- Router ---------------- */
const Router = {
  cur: null,
  go() {
    const h = (location.hash || '#home').slice(1), [pg, sub] = h.split('/');
    const page = $('#p-' + pg) ? pg : 'home'; this.cur = page;
    $$('.page').forEach(p => p.classList.toggle('on', p.id === 'p-' + page));
    $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.p === page));
    if (page !== 'lab') Lab.stopPlay();
    if (page === 'home') Home.render();
    if (page === 'chapters') sub ? Chapters.open(+sub) : Chapters.index();
    if (page === 'journal') Journal.render();
    if (page === 'tools') Tools.sessTable();
    if (page === 'lab') { Lab.ensureChart(); Lab.renderStats(); }
    if (page !== 'chapters') main().scrollTop = 0;
  },
};

/* ---------------- Boot ---------------- */
window.addEventListener('DOMContentLoaded', () => {
  Lab.init(); Strat.init(); Quiz.init(); Scen.init(); Tools.init();
  Tools.tick(); setInterval(() => Tools.tick(), 30000);
  window.addEventListener('hashchange', () => Router.go()); Router.go();
  document.addEventListener('keydown', e => { if (e.key === 'Escape') UI.close(); });
});
