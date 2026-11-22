/* ICT Gold Lab — Plan mỗi ngày: nhận định tự động theo phương pháp đã định hình
   Nguồn trực tuyến: PAXG/USDT (Binance, token vàng 1 oz) ≈ XAUUSD — có ô bù chênh lệch với giá sàn của bạn. */
'use strict';

const Plan = {
  H: [], M: [], days: {}, keys: [], chart: null, cs: null, lines: [], emaS: [], last: null,
  API: 'https://data-api.binance.vision/api/v3/klines?symbol=PAXGUSDT',

  init() {
    $('#plSrc').value = Store.get('plSrc', 'live');
    $('#plOff').value = Store.get('plOff', '');
    this.show = Store.get('plShow', { fvg: true, bos: true, crt: true, sw: false });
    $('#plAuto').checked = Store.get('plAuto', true);
    $('#plAuto').onchange = () => { Store.set('plAuto', $('#plAuto').checked); this.schedule(); };
    document.addEventListener('visibilitychange', () => { if (!document.hidden && this.auto() && this.lastRun && Date.now() - this.lastRun > 62 * 60e3) this.run(true); });
    this.schedule();
    const loop = () => { if (Router.cur === 'plan') this.paint(); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    this.renderHist();
  },
  closed(t) { const d = new Date((t + T.off(t) * 3600) * 1000), w = d.getUTCDay(), h = d.getUTCHours(); return w === 6 || (w === 5 && h >= 17) || (w === 0 && h < 18); },
  async fetchK(iv, total) {
    let out = [], end = Date.now();
    while (out.length < total) {
      const r = await fetch(`${this.API}&interval=${iv}&limit=1000&endTime=${end}`); if (!r.ok) throw new Error('Binance ' + r.status);
      const k = await r.json(); if (!k.length) break;
      out = k.map(a => ({ t: a[0] / 1000, o: +a[1], h: +a[2], l: +a[3], c: +a[4], v: +a[5] })).concat(out);
      end = k[0][0] - 1; if (k.length < 1000) break;
    }
    return out.filter(b => !this.closed(b.t));
  },
  agg(bars, tf) {
    const out = [];
    for (const b of bars) { const bk = Data.bucket(b.t, tf), l = out[out.length - 1]; if (l && l.t === bk) { l.h = Math.max(l.h, b.h); l.l = Math.min(l.l, b.l); l.c = b.c; l.v += b.v || 0; } else out.push({ t: bk, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v || 0 }); }
    return out;
  },
  index(bars) {
    const days = {};
    for (const b of bars) {
      const k = T.dayKey(b.t), m = T.ny(b.t).min;
      let D = days[k]; if (!D) D = days[k] = { key: k, o: b.o, h: b.h, l: b.l, c: b.c, aH: -Infinity, aL: Infinity, lH: -Infinity, lL: Infinity, mo: null, t0: b.t };
      D.h = Math.max(D.h, b.h); D.l = Math.min(D.l, b.l); D.c = b.c;
      if (m >= 1200) { D.aH = Math.max(D.aH, b.h); D.aL = Math.min(D.aL, b.l); }
      else if (m < 1080) { if (D.mo == null) D.mo = b.o; if (m >= 120 && m < 300) { D.lH = Math.max(D.lH, b.h); D.lL = Math.min(D.lL, b.l); } }
    }
    const keys = Object.keys(days).map(Number).sort((a, b) => a - b); let ema = null;
    keys.forEach((k, j) => { const D = days[k]; D.dow = (k + 4) % 7; D.wk = k - ((D.dow + 6) % 7); D.prev = j ? days[keys[j - 1]] : null; ema = ema == null ? D.c : D.c * (2 / 21) + ema * (19 / 21); D.ema = ema; });
    return { days, keys };
  },
  ema(arr, n) { const a = 2 / (n + 1), o = []; arr.forEach((v, i) => o.push(i ? v * a + o[i - 1] * (1 - a) : v)); return o; },
  swings(bars, n) {
    const H = [], L = [];
    for (let i = n; i < bars.length - n; i++) {
      let h = true, l = true;
      for (let j = i - n; j <= i + n; j++) { if (j === i) continue; if (bars[j].h >= bars[i].h) h = false; if (bars[j].l <= bars[i].l) l = false; }
      if (h) H.push({ i, t: bars[i].t, p: bars[i].h }); if (l) L.push({ i, t: bars[i].t, p: bars[i].l });
    }
    return { H, L };
  },
  zones(H1, px) {   // vùng S/R: gom các đỉnh/đáy swing H1 gần nhau, vùng nào được chạm ≥ 2 lần là vùng mạnh
    const sw = this.swings(H1.slice(-240), 3), pts = sw.H.map(x => ({ ...x, k: 'H' })).concat(sw.L.map(x => ({ ...x, k: 'L' }))).sort((a, b) => a.p - b.p), Z = [];
    const w = Math.max(2, px * 0.0008);
    for (const p of pts) { const z = Z[Z.length - 1]; if (z && p.p - z.hi <= w) { z.hi = Math.max(z.hi, p.p); z.n++; z.pts.push(p); } else Z.push({ lo: p.p, hi: p.p, n: 1, pts: [p] }); }
    return Z.map(z => ({ ...z, mid: (z.lo + z.hi) / 2 }));
  },
  trend(D) {
    const pd = D.prev; if (!pd) return { v: 0, txt: 'Chưa đủ dữ liệu D1' };
    let q = pd; for (let n = 0; n < 3; n++) q = q.prev || q;
    const above = pd.c > pd.ema, rising = pd.ema > q.ema, v = above && rising ? 1 : !above && !rising ? -1 : 0;
    return { v, txt: `D1 hôm qua đóng cửa ${f2(pd.c)} ${above ? 'trên' : 'dưới'} EMA20 (${f2(pd.ema)}), EMA20 ${rising ? 'dốc lên' : 'dốc xuống'}` };
  },
  h4(H1, upto) {
    const H4 = this.agg(H1.filter(b => b.t <= upto).slice(-300), 14400), sw = this.swings(H4, 2);
    if (sw.H.length < 2 || sw.L.length < 2) return { v: 0, txt: 'Chưa đủ swing H4' };
    const [h1, h2] = sw.H.slice(-2).map(x => x.p), [l1, l2] = sw.L.slice(-2).map(x => x.p);
    const v = h2 > h1 && l2 > l1 ? 1 : h2 < h1 && l2 < l1 ? -1 : 0;
    return { v, txt: `Đỉnh H4 ${f2(h1)} → ${f2(h2)} (${h2 > h1 ? 'HH' : 'LH'}), đáy ${f2(l1)} → ${f2(l2)} (${l2 > l1 ? 'HL' : 'LL'})`, h2, l2 };
  },

  async run(silent) {
    if (this.busy) return; this.busy = true;
    const src = $('#plSrc').value; Store.set('plSrc', src);
    const out = $('#plOut'); if (!silent || !this.H.length) out.innerHTML = '<div class="card muted">Đang tải dữ liệu…</div>';
    this.keepRange = silent && this.chart ? this.chart.timeScale().getVisibleLogicalRange() : null;
    try {
      if (src === 'live') {
        const [h1, m5, d1] = await Promise.all([this.fetchK('1h', 6000), this.fetchK('5m', 1000), this.fetchK('1d', 400)]);
        this.H = h1; this.M = m5; this.Dd = d1; this.srcName = 'PAXG/USDT (Binance) — gần với XAUUSD';
      } else {
        if (!Data.bars.length) throw new Error('Chưa nạp dữ liệu ở Backtest Lab');
        const end = Lab.idx || Data.bars.length;
        this.M = Data.bars.slice(Math.max(0, end - 1500), end); this.H = this.agg(Data.bars.slice(0, end), 3600); this.Dd = this.agg(Data.bars.slice(0, end), 86400); this.srcName = Data.name + ' (tới nến đang replay)';
      }
      this.lastRun = Date.now(); this.build(); this.autoInfo(); if (typeof Week !== 'undefined') Week.onData();
    } catch (e) { if (silent && this.H.length) { UI.toast('Tự cập nhật lỗi mạng, sẽ thử lại giờ sau'); return; } out.innerHTML = `<div class="note bad">Không tải được dữ liệu: ${esc(e.message)}. Thử lại, hoặc chọn nguồn "Dữ liệu đã nạp ở Lab".</div>`; }
    finally { this.busy = false; }
  },
  offset() { const v = +$('#plOff').value; Store.set('plOff', $('#plOff').value); const px = this.H[this.H.length - 1].c; return v > 0 ? v - px : 0; },

  analyze(H1, M5, upto) {
    const H = H1.filter(b => b.t <= upto), { days, keys } = this.index(H), last = H[H.length - 1], k = T.dayKey(last.t), D = days[k], pd = D.prev;
    if (!pd) return null;
    const px = last.c, tr = this.trend(D), h4 = this.h4(H1, upto);
    const pw = keys.map(x => days[x]).filter(x => x.wk === D.wk - 7), PWH = pw.length ? Math.max(...pw.map(x => x.h)) : null, PWL = pw.length ? Math.min(...pw.map(x => x.l)) : null;
    const e9 = this.ema(H.map(b => b.c), 9), e21 = this.ema(H.map(b => b.c), 21), n = H.length - 1;
    let cross = null; for (let i = n; i > n - 48 && i > 0; i--) if ((e9[i] - e21[i]) * (e9[i - 1] - e21[i - 1]) < 0) { cross = { t: H[i].t, up: e9[i] > e21[i] }; break; }
    const m = M5 && M5.length ? M5.filter(b => b.t <= upto + 3600) : [], m9 = this.ema(m.map(b => b.c), 9), m21 = this.ema(m.map(b => b.c), 21);
    const lv = [];
    const add = (n, p, kind) => { if (p != null && isFinite(p)) lv.push({ n, p, kind, taken: false }); };
    add('PDH', pd.h, 'liq'); add('PDL', pd.l, 'liq'); add('PWH', PWH, 'liq'); add('PWL', PWL, 'liq');
    if (isFinite(D.aH)) { const fm = T.ny(last.t).min >= 1200 ? ' (đang hình thành)' : ''; add('Đỉnh Á' + fm, D.aH, 'liq'); add('Đáy Á' + fm, D.aL, 'liq'); }
    if (isFinite(D.lH) && T.ny(last.t).min >= 300 && T.ny(last.t).min < 1080) { add('Đỉnh London', D.lH, 'liq'); add('Đáy London', D.lL, 'liq'); }
    if (D.mo != null) add('Midnight Open', D.mo, 'ref');
    const todays = H.filter(b => T.dayKey(b.t) === k);
    lv.forEach(L => { if (L.kind !== 'liq') return; const above = L.p > (todays[0] ? todays[0].o : px); L.taken = todays.some(b => above ? b.h > L.p : b.l < L.p) && !/Á|London/.test(L.n); });
    const Z = this.zones(H, px).filter(z => z.n >= 2);
    const zUp = Z.filter(z => z.lo > px).sort((a, b) => a.lo - b.lo).slice(0, 3), zDn = Z.filter(z => z.hi < px).sort((a, b) => b.hi - a.hi).slice(0, 3);
    const step = 25, rUp = Math.ceil(px / step) * step, rDn = Math.floor(px / step) * step;
    const mid = (pd.h + pd.l) / 2, prem = px > mid;
    const v = tr.v !== 0 ? tr.v : h4.v;
    return { k, D, pd, px, tr, h4, v, PWH, PWL, e9: e9[n], e21: e21[n], cross, m9: m9[m9.length - 1], m21: m21[m21.length - 1], lv, zUp, zDn, rUp, rDn, mid, prem, last, H };
  },

  build() {
    const A = this.analyze(this.H, this.M, Infinity); if (!A) return $('#plOut').innerHTML = '<div class="note bad">Không đủ dữ liệu.</div>';
    const off = this.offset(), o = p => p + off, F = p => f2(o(p));
    this.last = A; this.off_ = off;
    const ib = A.H.slice(-300); this.ictB = ib;
    const H4 = this.agg(A.H, 14400), lastB = A.H[A.H.length - 1];
    const firstIdx = t => { let lo = 0, hi = ib.length; while (lo < hi) { const m = (lo + hi) >> 1; if (ib[m].t < t) lo = m + 1; else hi = m; } return lo; };
    this.ictR = ICT.analyze(ib.map(b => ({ o: b.o, h: b.h, l: b.l, c: b.c })), 3, { htf: { bars: H4.filter(b => b.t >= ib[0].t), tf: 14400, name: 'H4', map: (b, end) => firstIdx(end ? b.t + 14400 : b.t),
      lastClosed: (() => { const hb = H4.filter(b => b.t >= ib[0].t); return lastB.t + 3600 >= hb[hb.length - 1].t + 14400 ? hb.length - 1 : hb.length - 2; })() } });
    const up = A.lv.filter(L => L.p > A.px && !L.taken && L.kind === 'liq').sort((a, b) => a.p - b.p);
    const dn = A.lv.filter(L => L.p < A.px && !L.taken && L.kind === 'liq').sort((a, b) => b.p - a.p);
    const zs = z => `${F(z.lo)}–${F(z.hi)} (chạm ${z.n} lần)`;
    const dir = A.v, word = dir === 1 ? 'TĂNG' : dir === -1 ? 'GIẢM' : 'ĐI NGANG';
    const conflict = A.tr.v && A.h4.v && A.tr.v !== A.h4.v;
    const ny = T.ny(A.last.t), offH = 7 - ny.off, kzVN = (s, e) => `${T.hm(s + offH * 60)}–${T.hm(e + offH * 60)}`;
    const first = (arr, n) => arr.slice(0, n).map(L => `${L.n} ${F(L.p)}`).join(', ') || '—';
    const sellZ = [...up.slice(0, 2).map(L => `${L.n} ${F(L.p)}`), ...A.zUp.slice(0, 1).map(z => 'vùng kháng cự ' + zs(z))];
    const buyZ = [...dn.slice(0, 2).map(L => `${L.n} ${F(L.p)}`), ...A.zDn.slice(0, 1).map(z => 'vùng hỗ trợ ' + zs(z))];
    const main = dir === -1 ? {
      t: '🔻 Kịch bản chính: BÁN theo xu hướng',
      zone: sellZ.join(' · ') || `số tròn ${F(A.rUp)}`,
      how: `Chờ giá hồi LÊN vùng trên (ưu tiên khi giá ở Premium, trên ${F(A.mid)}). Vào khi: (A) quét đỉnh → nến giảm thân lớn đóng cửa dưới đáy gần nhất (MSS) → Sell limit tại CE của FVG; hoặc (B) tại vùng, EMA9 cắt XUỐNG EMA21 trên M5 → Sell ở giá đóng cửa nến cắt.`,
      sl: 'SL trên râu cao nhất của cú quét + 1–1.5$', tp: `TP1 ${first(dn, 1)} · TP2 ${dn[1] ? dn[1].n + ' ' + F(dn[1].p) : 'số tròn ' + F(A.rDn - 25)}`,
    } : dir === 1 ? {
      t: '🔺 Kịch bản chính: MUA theo xu hướng',
      zone: buyZ.join(' · ') || `số tròn ${F(A.rDn)}`,
      how: `Chờ giá hồi XUỐNG vùng dưới (ưu tiên Discount, dưới ${F(A.mid)}). Vào khi: (A) quét đáy → nến tăng thân lớn đóng cửa trên đỉnh gần nhất (MSS) → Buy limit tại CE của FVG; hoặc (B) tại vùng, EMA9 cắt LÊN EMA21 trên M5 → Buy ở giá đóng cửa nến cắt.`,
      sl: 'SL dưới râu thấp nhất của cú quét − 1–1.5$', tp: `TP1 ${first(up, 1)} · TP2 ${up[1] ? up[1].n + ' ' + F(up[1].p) : 'số tròn ' + F(A.rUp + 25)}`,
    } : {
      t: '↔️ Kịch bản chính: giao dịch biên (thị trường đi ngang)',
      zone: `Bán gần ${sellZ[0] || F(A.rUp)} · Mua gần ${buyZ[0] || F(A.rDn)}`,
      how: 'Chỉ vào khi giá QUÉT một biên rồi có MSS hoặc EMA9/21 cắt ngược lại. Không vào giữa range. Lot giảm 50%.',
      sl: 'SL sau râu quét ± 1–1.5$', tp: 'TP ở giữa range rồi biên đối diện',
    };
    const alt = dir === -1 ? `🔺 Kịch bản phụ (ngược xu hướng, chỉ scalp, rủi ro 0.5%): giá QUÉT ${first(dn, 1)} rồi nến đóng cửa quay lại trên + EMA9 cắt lên EMA21 M5 → Mua, TP tại ${up[0] ? up[0].n + ' ' + F(up[0].p) : 'Midnight Open'}, RR ≥ 2.`
      : dir === 1 ? `🔻 Kịch bản phụ (ngược xu hướng, chỉ scalp, rủi ro 0.5%): giá QUÉT ${first(up, 1)} rồi nến đóng cửa quay lại dưới + EMA9 cắt xuống EMA21 M5 → Bán, TP tại ${dn[0] ? dn[0].n + ' ' + F(dn[0].p) : 'Midnight Open'}, RR ≥ 2.`
        : 'Khi giá phá hẳn một biên và retest thành công (flip zone) → đi theo hướng phá.';
    const inval = dir === -1 ? `Bỏ kịch bản bán nếu nến H1 đóng cửa trên ${up[1] ? up[1].n + ' ' + F(up[1].p) : (A.zUp[0] ? F(A.zUp[0].hi) : F(A.pd.h))}.`
      : dir === 1 ? `Bỏ kịch bản mua nếu nến H1 đóng cửa dưới ${dn[1] ? dn[1].n + ' ' + F(dn[1].p) : (A.zDn[0] ? F(A.zDn[0].lo) : F(A.pd.l))}.` : 'Range bị phá bằng nến H1 thân lớn → chuyển sang theo xu hướng mới.';
    const vnDate = T.fmt(A.last.t);
    const plan = { day: A.k, date: vnDate.slice(3, 13), px: +o(A.px).toFixed(2), v: dir, tr: A.tr.v, h4: A.h4.v, main: main.t, zone: main.zone, ts: Date.now() };
    const hist = Store.get('plans', {}); hist[A.k] = plan; Store.set('plans', hist);

    const lvRows = A.lv.slice().sort((a, b) => b.p - a.p).map(L => `<tr><td>${L.n}</td><td class="mono">${F(L.p)}</td><td>${L.kind === 'ref' ? '<span class="muted">tham chiếu</span>' : L.taken ? '<span class="muted">đã bị lấy</span>' : L.p > A.px ? '<span class="pill down">BSL phía trên</span>' : '<span class="pill up">SSL phía dưới</span>'}</td><td class="mono muted">${(L.p - A.px >= 0 ? '+' : '') + (L.p - A.px).toFixed(1)}$</td></tr>`).join('');
    const zRows = [...A.zUp.slice().reverse().map(z => ['Kháng cự', z]), ...A.zDn.map(z => ['Hỗ trợ', z])].map(([n, z]) => `<tr><td>${n}</td><td class="mono">${F(z.lo)} – ${F(z.hi)}</td><td>${z.n} lần chạm (H1)</td></tr>`).join('');
    const pill = v => v === 1 ? '<span class="pill up">TĂNG</span>' : v === -1 ? '<span class="pill down">GIẢM</span>' : '<span class="pill gold">ĐI NGANG</span>';
    $('#plOut').innerHTML = `
      <div class="note ${off ? '' : 'warn'}" style="font-size:12.5px">Nguồn: ${esc(this.srcName)} · nến cuối ${vnDate} (giờ VN). ${off ? `Đã bù chênh lệch <b>${off >= 0 ? '+' : ''}${off.toFixed(2)}$</b> theo giá sàn bạn nhập.` : 'PAXG thường lệch XAUUSD vài $ — nhập giá XAUUSD trên sàn của bạn ở ô phía trên để các mức khớp với chart của bạn.'}</div>
      <div class="grid g4">
        <div class="card kpi"><div class="l">Giá hiện tại</div><div class="v">${F(A.px)}</div></div>
        <div class="card kpi"><div class="l">Bias D1 (EMA20)</div><div class="v" style="font-size:20px">${pill(A.tr.v)}</div><div class="l">${esc(A.tr.txt)}</div></div>
        <div class="card kpi"><div class="l">Cấu trúc H4</div><div class="v" style="font-size:20px">${pill(A.h4.v)}</div><div class="l">${esc(A.h4.txt)}</div></div>
        <div class="card kpi"><div class="l">EMA9 / EMA21</div><div class="v" style="font-size:20px">${pill(A.e9 > A.e21 ? 1 : -1)}</div><div class="l">H1: EMA9 ${A.e9 > A.e21 ? 'trên' : 'dưới'} EMA21${A.cross ? ` (cắt ${A.cross.up ? 'lên' : 'xuống'} lúc ${T.fmt(A.cross.t)})` : ''} · M5: ${A.m9 > A.m21 ? 'tăng' : 'giảm'}</div></div>
      </div>
      <div class="card" style="margin-top:14px">
        <h4>Nhận định ${esc(vnDate.slice(0, 13))} — Xu hướng tổng thể: ${pill(dir)} ${conflict ? '<span class="pill gold">D1 và H4 mâu thuẫn → giảm lot 50%, chỉ vào khi có đủ xác nhận</span>' : ''}</h4>
        <p style="margin:6px 0">Giá ${F(A.px)} đang ở vùng <b>${A.prem ? 'PREMIUM' : 'DISCOUNT'}</b> của range hôm qua (${F(A.pd.l)} – ${F(A.pd.h)}, 50% = ${F(A.mid)}). ${A.prem ? (dir === -1 ? 'Thuận lợi để tìm điểm BÁN.' : 'Không đuổi mua ở vùng đắt — chờ giá về Discount.') : (dir === 1 ? 'Thuận lợi để tìm điểm MUA.' : 'Không đuổi bán ở vùng rẻ — chờ giá hồi lên Premium.')}</p>
        <div class="grid g2" style="margin-top:10px">
          <div class="card" style="background:var(--panel2)"><h4>${main.t}</h4>
            <div><b>Vùng chờ:</b> ${main.zone}</div><div style="margin-top:6px"><b>Điều kiện vào:</b> ${main.how}</div>
            <div style="margin-top:6px"><b>SL:</b> ${main.sl}</div><div><b>TP:</b> ${main.tp} — chỉ vào khi RR ≥ 2 (mô hình A) / ≥ 1.5 (mô hình B).</div></div>
          <div class="card" style="background:var(--panel2)"><h4>Kịch bản phụ & vô hiệu</h4><div>${alt}</div><div class="note bad" style="font-size:12.5px">${inval}</div>
            <div><b>Giờ giao dịch (VN):</b> London ${kzVN(120, 300)} · NY AM ${kzVN(420, 600)} · Tin Mỹ thường ${kzVN(510, 510).slice(0, 5)} — xem lịch tin ở ForexFactory, đứng ngoài 15 phút trước/sau tin đỏ.</div>
            <div style="margin-top:6px"><b>Kỷ luật:</b> tối đa 1 lệnh/killzone, rủi ro 1%, thua 2 lệnh liên tiếp → nghỉ hết ngày.</div></div>
        </div>
      </div>
      <div class="grid g2" style="margin-top:14px">
        <div class="card"><h4>Mức thanh khoản</h4><table class="tbl">${lvRows}</table></div>
        <div class="card"><h4>Vùng hỗ trợ / kháng cự (đỉnh-đáy H1 chạm ≥ 2 lần)</h4><table class="tbl">${zRows || '<tr><td class="muted">Chưa có vùng chạm ≥ 2 lần gần giá</td></tr>'}</table>
          <div class="muted" style="font-size:12px">Số tròn gần nhất: ${F(A.rDn)} / ${F(A.rUp)}</div></div>
      </div>
      ${this.indPanel()}
      ${this.swingPanel(off)}
      ${this.ictCard()}
      <div class="card" style="margin-top:14px"><div class="row" style="justify-content:space-between;align-items:center;gap:8px"><h4 style="margin:0">Chart H1 + EMA9 (trắng) / EMA21 (xanh) + các mức + ICT</h4>
        <div class="row" id="plIctBtns" style="gap:6px">${[['fvg', 'FVG'], ['bos', 'BOS / MSS'], ['crt', 'CRT H4'], ['sw', 'HH/HL/LH/LL']].map(([k, n]) => `<button class="btn sm ${this.show[k] ? 'on' : ''}" data-k="${k}" onclick="Plan.togICT('${k}')">${n}</button>`).join('')}</div></div><div id="plChart" style="height:460px;position:relative"></div></div>
      <div class="row" style="margin-top:10px"><button class="btn" onclick="Plan.copy()">📋 Sao chép plan dạng chữ</button><button class="btn" onclick="Plan.toLab()">Mở Backtest Lab với dữ liệu này</button></div>`;
    this.text = `PLAN XAUUSD ${vnDate.slice(3, 13)}\nGiá: ${F(A.px)} | D1: ${word} | H4: ${['GIẢM', 'NGANG', 'TĂNG'][A.h4.v + 1]} | ${A.prem ? 'Premium' : 'Discount'} (50% = ${F(A.mid)})\n${main.t}\n- Vùng: ${main.zone}\n- Vào: ${main.how}\n- ${main.sl}\n- ${main.tp}\n${alt}\n${inval}\nKillzone VN: London ${kzVN(120, 300)}, NY AM ${kzVN(420, 600)}`;
    this.drawChart(A, off);
    this.lotCalc();
    this.renderHist();
  },
  drawChart(A, off) {
    const el = $('#plChart'); if (!el || typeof LightweightCharts === 'undefined') return;
    if (this.chart) { try { this.chart.remove(); } catch (e) { } }
    const ch = this.chart = LightweightCharts.createChart(el, { autoSize: true, layout: { background: { type: 'solid', color: '#0b0f17' }, textColor: '#8a96ad' }, grid: { vertLines: { color: '#131a29' }, horzLines: { color: '#131a29' } }, timeScale: { timeVisible: true, borderColor: '#243049' }, rightPriceScale: { borderColor: '#243049' } });
    const H = A.H.slice(-300), cs = this.cs = ch.addCandlestickSeries({ upColor: '#22c58b', downColor: '#f0506e', borderVisible: false, wickUpColor: '#22c58b', wickDownColor: '#f0506e' });
    cs.setData(H.map(b => ({ time: b.t + 7 * 3600, open: b.o + off, high: b.h + off, low: b.l + off, close: b.c + off })));
    const cl = A.H.map(b => b.c), e9 = this.ema(cl, 9).slice(-300), e21 = this.ema(cl, 21).slice(-300);
    ch.addLineSeries({ color: '#ffffff', lineWidth: 1, priceLineVisible: false, lastValueVisible: false }).setData(H.map((b, i) => ({ time: b.t + 7 * 3600, value: e9[i] + off })));
    ch.addLineSeries({ color: '#4c8dff', lineWidth: 1, priceLineVisible: false, lastValueVisible: false }).setData(H.map((b, i) => ({ time: b.t + 7 * 3600, value: e21[i] + off })));
    A.lv.forEach(L => cs.createPriceLine({ price: L.p + off, color: L.kind === 'ref' ? '#8a96ad' : L.taken ? '#4b5563' : L.p > A.px ? '#f0506e' : '#22c58b', lineWidth: 1, lineStyle: 2, title: L.n }));
    [...A.zUp, ...A.zDn].forEach(z => { cs.createPriceLine({ price: z.hi + off, color: '#e8b84a', lineWidth: 1, lineStyle: 1, title: '' }); cs.createPriceLine({ price: z.lo + off, color: '#e8b84a', lineWidth: 1, lineStyle: 1, title: z.lo > A.px ? 'Kháng cự' : 'Hỗ trợ' }); });
    const cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;z-index:2'; el.appendChild(cv); this.cv = cv;
    ch.timeScale().setVisibleLogicalRange(this.keepRange || { from: H.length - 120, to: H.length + 5 }); this.keepRange = null;
  },
  paint() {
    if (!this.chart || !this.cv || !this.ictR || !document.body.contains(this.cv)) return;
    const ts = this.chart.timeScale(), el = $('#plChart'), dpr = window.devicePixelRatio || 1, W = ts.width(), Hh = el.clientHeight - ts.height();
    if (this.cv.width !== W * dpr || this.cv.height !== Hh * dpr) { this.cv.width = W * dpr; this.cv.height = Hh * dpr; this.cv.style.width = W + 'px'; this.cv.style.height = Hh + 'px'; }
    const g = this.cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, Hh);
    const X0 = i => ts.logicalToCoordinate(Math.round(i)), bw = Math.max(1, (X0(1) ?? 1) - (X0(0) ?? 0));
    const X = i => { const r = Math.round(i), x = X0(r); return x == null ? null : x + (i - r) * bw; }, Y = p => this.cs.priceToCoordinate(p + this.off_);
    const vr = ts.getVisibleLogicalRange(); if (!vr) return;
    ICT.paint(g, X, Y, W, this.ictR, this.show, vr.from, vr.to);
  },
  rsi(c, n = 14) {
    let up = 0, dn = 0; const o = [50];
    for (let i = 1; i < c.length; i++) { const d = c[i] - c[i - 1]; up = (up * (n - 1) + Math.max(d, 0)) / n; dn = (dn * (n - 1) + Math.max(-d, 0)) / n; o.push(dn ? 100 - 100 / (1 + up / dn) : 100); }
    return o;
  },
  ind(bars) {
    const c = bars.map(b => b.c), e = n => this.ema(c, n), e26 = e(26), m = e(12).map((x, i) => x - e26[i]), sg = this.ema(m, 9), hist = m.map((x, i) => x - sg[i]);
    const tr = bars.map((b, i) => i ? Math.max(b.h - b.l, Math.abs(b.h - bars[i - 1].c), Math.abs(b.l - bars[i - 1].c)) : b.h - b.l), atr = [];
    tr.forEach((x, i) => atr.push(i ? (atr[i - 1] * 13 + x) / 14 : x));
    return { c, e9: e(9), e21: e(21), e50: e(50), e200: e(200), rsi: this.rsi(c), macd: m, sig: sg, hist, atr, v: bars.map(b => b.v || 0) };
  },
  indPanel() {
    const TF = [['D1', this.Dd && this.Dd.length > 60 ? this.Dd : this.agg(this.H, 86400)], ['H4', this.agg(this.H, 14400)], ['H1', this.H], ['M15', this.agg(this.M, 900)], ['M5', this.M]];
    const rows = TF.map(([n, B]) => {
      if (!B || B.length < 30) return '';
      const I = this.ind(B), k = B.length - 1, kk = k - 1, c = I.c[k], e9 = I.e9[k], e21 = I.e21[k], e50 = I.e50[k], e200 = I.e200[k], r = I.rsi[k], h = I.hist[k], hp = I.hist[k - 1];
      const tr = c > e50 && e50 > e200 ? 1 : c < e50 && e50 < e200 ? -1 : 0;
      const vs = I.v.slice(Math.max(0, kk - 20), kk), vma = vs.length ? vs.reduce((a, x) => a + x, 0) / vs.length : 0, vr = vma ? I.v[kk] / vma : 0;
      const rs = r < 30 ? '<span class="pill up">Quá bán</span>' : r > 70 ? '<span class="pill down">Quá mua</span>' : r > 50 ? 'trên 50' : 'dưới 50';
      const mac = `${I.macd[k] > I.sig[k] ? 'MACD > Signal' : 'MACD < Signal'}, hist ${h >= 0 ? '+' : ''}${h.toFixed(1)} ${Math.abs(h) > Math.abs(hp) ? (h > 0 ? '↑ lực tăng mạnh dần' : '↓ lực giảm mạnh dần') : (h > 0 ? '↘ lực tăng yếu đi' : '↗ lực giảm yếu đi')}`;
      const pill = tr === 1 ? '<span class="pill up">TĂNG</span>' : tr === -1 ? '<span class="pill down">GIẢM</span>' : '<span class="pill gold">ĐAN XEN</span>';
      return `<tr><td><b>${n}</b></td><td>${pill}</td><td class="mono">EMA9 ${e9 > e21 ? '>' : '<'} EMA21<br><span class="muted">${f2(e9)} / ${f2(e21)}</span></td><td class="mono">${c > e50 ? 'trên' : 'dưới'} EMA50 ${f2(e50)}<br><span class="muted">${c > e200 ? 'trên' : 'dưới'} EMA200 ${f2(e200)}</span></td><td class="mono">${r.toFixed(1)} ${rs}</td><td style="font-size:12.5px">${mac}</td><td class="mono">${vr ? vr.toFixed(2) + '×' : '—'}</td></tr>`;
    }).join('');
    return `<div class="card" style="margin-top:14px"><h4>Chỉ báo theo khung (nến gần nhất)</h4><div class="tblwrap"><table class="tbl"><tr><th>Khung</th><th>Xu hướng (giá/EMA50/EMA200)</th><th>EMA9/21</th><th>EMA50/200</th><th>RSI 14</th><th>MACD 12-26-9</th><th>Volume / TB 20</th></tr>${rows}</table></div>
      <p class="muted" style="font-size:12px;margin:6px 0 0">Volume = khối lượng nến đã đóng gần nhất so với trung bình 20 nến (PAXG trên Binance, chỉ để so sánh tương đối). XAUUSD trên TradingView/MT5 chỉ có tick volume; khối lượng thật của vàng xem ở hợp đồng COMEX:GC1!.</p></div>`;
  },
  // PHƯƠNG PHÁP ĐÃ TRAIN trên dữ liệu Exness XAUUSDm 2021–2026 (spread thật, walk-forward):
  // ① D1: giá > EMA50 và EMA50 cao hơn 5 ngày trước (MUA) / ngược lại (BÁN)
  // ② H4: RSI14 hồi < 40 (MUA) / > 60 (BÁN) trong 24 nến H4 gần nhất
  // ③ H1: RSI14 cắt qua 50 theo hướng xu hướng + nến H4 gần nhất đóng cùng phía EMA21 H4 → vào lệnh khi nến H1 đóng
  // SL = 1×ATR14 D1 · TP = 2R · đóng lệnh nếu sau 7 ngày chưa chạm SL/TP
  // method() chạy lại luật này trên TOÀN BỘ dữ liệu vừa tải (≈ 1 năm H1) → backtest liên tục, tự chạy lại mỗi giờ.
  LIVE_FROM: Date.UTC(2026, 10, 20) / 1000,   // lệnh từ ngày này trở đi = giao dịch thật sau khi train (ngoài mẫu hoàn toàn)
  method() {
    const D = this.Dd, Hall = this.H; if (!D || D.length < 70 || Hall.length < 300) return null;
    const H = Hall.slice(0, -1), n = H.length, I = this.ind(H), Di = this.ind(D), H4 = this.agg(H, 14400), I4 = this.ind(H4);
    const trades = []; let pos = null, qd = -1, q4 = -1, st = null;
    const exitChk = (b, tEnd) => {
      const d = pos.d; let px = null, why = '';
      if (d === 1 ? b.l <= pos.sl : b.h >= pos.sl) { px = pos.sl; why = 'SL'; }
      else if (d === 1 ? b.h >= pos.tp : b.l <= pos.tp) { px = pos.tp; why = 'TP'; }
      else if (tEnd - pos.t >= 7 * 86400) { px = b.c; why = '7 ngày'; }
      if (px == null) return false;
      const nights = Math.floor((tEnd - pos.t) / 86400), cost = 0.35 + 0.5 * nights;   // spread+trượt giá ≈ 0.35$, swap ≈ 0.5$/đêm
      trades.push({ ...pos, xt: tEnd, xp: px, why, R: +(((px - pos.e) * d - cost) / pos.r).toFixed(2) }); pos = null; return true;
    };
    for (let j = 1; j < n; j++) {
      const tEnd = H[j].t + 3600;
      while (qd + 1 < D.length && D[qd + 1].t + 86400 <= tEnd) qd++;
      while (q4 + 1 < H4.length && H4[q4 + 1].t + 14400 <= tEnd) q4++;
      if (pos) exitChk(H[j], tEnd);
      if (qd < 60 || q4 < 24) continue;
      const trD = Di.c[qd] > Di.e50[qd] && Di.e50[qd] > Di.e50[qd - 5] ? 1 : Di.c[qd] < Di.e50[qd] && Di.e50[qd] < Di.e50[qd - 5] ? -1 : 0;
      const w = I4.rsi.slice(q4 - 23, q4 + 1), rMin = Math.min(...w), rMax = Math.max(...w), side = H4[q4].c > I4.e21[q4] ? 1 : -1;
      const pulled = trD === 1 ? rMin < 40 : trD === -1 ? rMax > 60 : false;
      if (j === n - 1) st = { trD, rMin, rMax, side, pulled, rsi: I.rsi[j], datr: Di.atr[qd], dc: Di.c[qd], e50: Di.e50[qd], e50p: Di.e50[qd - 5] };
      if (pos || !trD || !pulled || side !== trD) continue;
      if (trD === 1 ? I.rsi[j] > 50 && I.rsi[j - 1] <= 50 : I.rsi[j] < 50 && I.rsi[j - 1] >= 50) {
        const e = H[j].c, r = Di.atr[qd]; pos = { d: trD, t: tEnd, e, sl: e - trD * r, tp: e + 2 * trD * r, r };
      }
    }
    if (pos) { const b = Hall[Hall.length - 1]; exitChk(b, b.t + 3600); }   // nến đang chạy: chạm SL/TP thì tính luôn
    // lưu nhật ký để lịch sử không mất khi dữ liệu trực tuyến trượt đi
    const J = Store.get('fwd', {}); trades.forEach(x => J[x.t] = x); Store.set('fwd', J);
    const all = Object.values(J).sort((a, b) => a.t - b.t);
    return { trades: all, pos, st, from: H[0].t, to: H[n - 1].t + 3600 };
  },
  swingPanel(off) {
    const M = this.M_ = this.method();
    if (!M || !M.st) return '<div class="note">Cần ≥ 300 nến H1 và 70 nến D1 để chạy phương pháp.</div>';
    const F = p => f2(p + off), dw = d => d === 1 ? 'MUA' : 'BÁN', s = M.st, P = M.pos;
    let head = '';
    if (P) {
      const now = this.H[this.H.length - 1].c, R = ((now - P.e) * P.d / P.r).toFixed(2);
      head = `<div class="note ok" style="font-size:13.5px"><b>🟢 LỆNH ĐANG CHẠY — ${dw(P.d)}</b> từ ${T.fmt(P.t)} · Entry <b>${F(P.e)}</b> · SL <b>${F(P.sl)}</b> · TP <b>${F(P.tp)}</b> (SL cách ${P.r.toFixed(1)}$)<br>Giá hiện tại ${F(now)} = <b>${R}R</b>. Giữ tới khi chạm SL/TP, tối đa tới ${T.fmt(P.t + 7 * 86400)}. Không dời SL.</div>`;
      if (P.t > Store.get('lastSig', 0)) { Store.set('lastSig', P.t); this.notify(`Tín hiệu ${dw(P.d)} XAUUSD`, `Entry ${F(P.e)} · SL ${F(P.sl)} · TP ${F(P.tp)}`); }
    }
    const wait = !s.trD ? `① D1 chưa có xu hướng rõ (giá ${F(s.dc)}, EMA50 ${F(s.e50)}, EMA50 5 ngày trước ${F(s.e50p)}) → <b>KHÔNG giao dịch</b>.`
      : `① D1 <b>${s.trD === 1 ? 'TĂNG' : 'GIẢM'}</b> (giá ${F(s.dc)} ${s.trD === 1 ? '>' : '<'} EMA50 ${F(s.e50)}, EMA50 ${s.trD === 1 ? 'đi lên' : 'đi xuống'}) → chỉ ${dw(s.trD)} ✅<br>` +
        `② RSI H4 trong 4 ngày: ${s.trD === 1 ? 'thấp nhất ' + s.rMin.toFixed(1) + (s.pulled ? ' &lt; 40 ✅ đã hồi' : ' — cần &lt; 40 ❌ chưa hồi') : 'cao nhất ' + s.rMax.toFixed(1) + (s.pulled ? ' &gt; 60 ✅ đã hồi' : ' — cần &gt; 60 ❌ chưa hồi')}<br>` +
        `③ Nến H4 gần nhất đóng ${s.side === 1 ? 'TRÊN' : 'DƯỚI'} EMA21 H4 ${s.side === s.trD ? '✅' : '❌'} · RSI H1 hiện ${s.rsi.toFixed(1)} → ${P ? 'đang có lệnh, không vào thêm' : s.pulled && s.side === s.trD ? `<b>chờ RSI H1 cắt ${s.trD === 1 ? 'LÊN' : 'XUỐNG'} 50</b> rồi vào ${dw(s.trD)} khi nến H1 đóng` : '<b>chưa đủ điều kiện, KHÔNG vào</b>'}<br>` +
        `SL nếu vào bây giờ = 1×ATR D1 = <b>${s.datr.toFixed(1)}$</b> → TP = ${(2 * s.datr).toFixed(1)}$.`;
    const T_ = M.trades, live = T_.filter(x => x.t >= this.LIVE_FROM), win = T_.filter(x => x.t >= M.from);
    const sm = a => { const n = a.length, w = a.filter(x => x.R > 0).length, R = a.reduce((q, x) => q + x.R, 0); return n ? `${n} lệnh · thắng ${Math.round(w / n * 100)}% · tổng <b class="${R >= 0 ? 'pos' : 'neg'}">${R >= 0 ? '+' : ''}${R.toFixed(2)}R</b> · TB ${(R / n >= 0 ? '+' : '') + (R / n).toFixed(2)}R/lệnh` : 'chưa có lệnh'; };
    const rows = T_.slice().reverse().slice(0, 25).map(x => `<tr><td class="mono">${T.fmt(x.t).slice(3)}${x.t >= this.LIVE_FROM ? ' <span class="pill gold">thật</span>' : ''}</td><td><span class="pill ${x.d === 1 ? 'up' : 'down'}">${dw(x.d)}</span></td><td class="mono">${F(x.e)}</td><td class="mono">${F(x.sl)} / ${F(x.tp)}</td><td class="mono">${T.fmt(x.xt).slice(3)}</td><td>${x.why}</td><td class="mono ${x.R > 0 ? 'pos' : 'neg'}"><b>${x.R > 0 ? '+' : ''}${x.R}R</b></td></tr>`).join('');
    return `<div class="card" style="margin-top:14px;border-color:rgba(34,197,139,.5)"><h4>🎯 Phương pháp đã train (Exness 2021–2026) — swing 3–7 ngày</h4>
      ${head}<div class="note" style="font-size:13px">${wait}</div>
      <div id="plLot"></div>
      <div class="muted" style="font-size:12.5px">Luật: ① D1: giá trên EMA50 và EMA50 cao hơn 5 ngày trước → chỉ MUA (ngược lại chỉ BÁN) · ② H4: RSI14 xuống dưới 40 (MUA) / lên trên 60 (BÁN) trong 24 nến H4 gần nhất · ③ H1: RSI14 cắt qua 50 theo hướng xu hướng và nến H4 gần nhất đóng cùng phía EMA21 H4 → vào lệnh khi nến H1 đóng · SL = 1×ATR14 D1 · TP = 2R · đóng sau 7 ngày nếu chưa chạm.
      Kết quả train 2021–2026 (spread thật + trượt giá + swap): 82 lệnh, thắng 58.5%, +0.46R/lệnh, PF 2.17, sụt giảm tối đa 4.6R, dương cả 6/6 năm.</div></div>
    <div class="card" style="margin-top:14px"><h4>📈 Backtest liên tục trên dữ liệu mới nhất (tự chạy lại mỗi giờ)</h4>
      <div class="grid g2" style="margin:6px 0 10px"><div class="note" style="font-size:13px;margin:0"><b>Dữ liệu vừa tải</b> (${T.fmt(M.from).slice(3, 13)} → ${T.fmt(M.to).slice(3)}): ${sm(win)}</div>
      <div class="note ${live.length ? 'ok' : ''}" style="font-size:13px;margin:0"><b>Giao dịch thật sau khi train</b> (từ 20/11/2026, ghi trong trình duyệt này): ${sm(live)}</div></div>
      <div class="tblwrap" style="max-height:360px"><table class="tbl"><tr><th>Vào lúc (VN)</th><th>Lệnh</th><th>Entry</th><th>SL / TP</th><th>Đóng lúc</th><th>Lý do</th><th>Kết quả</th></tr>${rows || '<tr><td colspan="7" class="muted">Chưa có lệnh trong dữ liệu đã tải</td></tr>'}</table></div>
      <p class="muted" style="font-size:12px;margin:6px 0 0">Giá PAXG (≈ XAUUSD). Mỗi lệnh đã trừ ~0.35$ spread/trượt giá và 0.5$/đêm swap. Lệnh đánh dấu <span class="pill gold">thật</span> là lệnh xuất hiện SAU khi phương pháp được train → đây mới là bằng chứng thật; theo dõi ít nhất 20–30 lệnh trước khi tăng vốn.</p></div>`;
  },
  // Tính lot theo vốn thật. XAUUSD: 1 lot = 100 oz → lot 0.01 = 1$ mỗi 1$ giá chạy. Tài khoản Cent: lỗ/lãi tính bằng US cent (1/100).
  lotCalc() {
    const el = $('#plLot'); if (!el || !this.M_ || !this.M_.st) return;
    if (!el.innerHTML) el.innerHTML = `<div class="grid g3" style="margin:8px 0"><div><label class="f">Vốn tài khoản (USD)</label><input type="number" id="plBal" step="1"></div>
      <div><label class="f">Loại tài khoản Exness</label><select id="plAcc"><option value="cent">Standard Cent (USC)</option><option value="std">Standard / Pro (USD)</option></select></div>
      <div><label class="f">Rủi ro mỗi lệnh (%)</label><input type="number" id="plRisk" step="0.5"></div></div><div id="plLotOut"></div>`;
    const b = $('#plBal'), a = $('#plAcc'), r = $('#plRisk');
    if (!b.value) { b.value = Store.get('plBal', 57); a.value = Store.get('plAcc', 'cent'); r.value = Store.get('plRisk', 1); [b, a, r].forEach(x => x.oninput = () => this.lotCalc()); }
    const bal = +b.value || 0, acc = a.value, rk = +r.value || 1; Store.set('plBal', bal); Store.set('plAcc', acc); Store.set('plRisk', rk);
    const P = this.M_.pos, sl = P ? P.r : this.M_.st.datr, per001 = acc === 'cent' ? sl * 0.01 : sl;   // $ lỗ khi chạm SL với 0.01 lot
    const want = bal * rk / 100, lot = Math.floor(want / per001) / 100, pct = per001 / bal * 100;
    let verdict;
    if (lot >= 0.01) verdict = `<b style="color:var(--up)">Vào ${lot.toFixed(2)} lot</b> → chạm SL mất ≈ ${(lot * 100 * per001).toFixed(2)}$ (${(lot * 100 * per001 / bal * 100).toFixed(1)}%), chạm TP lãi ≈ ${(lot * 200 * per001).toFixed(2)}$.`;
    else if (pct <= 2.5) verdict = `Lot nhỏ nhất 0.01 → chạm SL mất ≈ <b>${per001.toFixed(2)}$ = ${pct.toFixed(1)}%</b> vốn (hơi trên ${rk}% nhưng chấp nhận được) → <b style="color:var(--gold2)">vào 0.01 lot</b>, TP lãi ≈ ${(2 * per001).toFixed(2)}$.`;
    else verdict = `<b style="color:var(--down)">KHÔNG vào.</b> Lot nhỏ nhất 0.01 đã mất ≈ <b>${per001.toFixed(2)}$ = ${pct.toFixed(0)}%</b> vốn nếu chạm SL${pct >= 100 ? ' — mất hết tài khoản' : ''}. ${acc === 'std' ? `Chuyển sang tài khoản <b>Standard Cent</b> (0.01 lot chỉ mất ≈ ${(sl * 0.01).toFixed(2)}$) hoặc cần vốn ≈ ${Math.ceil(per001 * 100 / rk)}$ để rủi ro ${rk}%.` : `Cần vốn ≈ ${Math.ceil(per001 * 100 / 2.5)}$ trở lên.`}`;
    $('#plLotOut').innerHTML = `<div class="note" style="font-size:13px">💰 SL ${P ? 'của lệnh đang chạy' : 'hiện tại'} = ${sl.toFixed(1)}$ · 0.01 lot ${acc === 'cent' ? 'Cent' : 'Standard'} chạm SL mất ≈ ${per001.toFixed(2)}$ · muốn rủi ro ${rk}% = ${want.toFixed(2)}$<br>${verdict}
      <span class="muted" style="font-size:12px"><br>Kiểm tra trên MT5: chuột phải mã vàng → Specification → "Contract size" (Standard: 100 oz/lot; Cent: lãi/lỗ tính bằng cent). Đặt SL/TP ngay khi vào lệnh.</span></div>`;
  },
  notify(title, body) {
    UI.toast('🔔 ' + title + ' — ' + body, 8000);
    try { if (window.Notification && Notification.permission === 'granted') new Notification(title, { body }); } catch (e) { }
  },
  askNotify() {
    if (!window.Notification) return UI.toast('Trình duyệt không hỗ trợ thông báo');
    Notification.requestPermission().then(p => UI.toast(p === 'granted' ? 'Đã bật thông báo: có tín hiệu mới sẽ báo ngay (khi trang đang mở)' : 'Bạn đã từ chối thông báo'));
  },
  // ---- tự cập nhật mỗi giờ: chạy lại ngay sau khi nến H1 đóng (+90 giây) ----
  auto() { return $('#plAuto') && $('#plAuto').checked; },
  schedule() {
    clearTimeout(this.tm); const info = $('#plAutoInfo');
    if (!this.auto()) { if (info) info.textContent = 'Đang tắt tự cập nhật'; return; }
    const now = Date.now(), next = Math.floor(now / 3600e3) * 3600e3 + 3600e3 + 90e3;
    this.nextAt = next;
    this.tm = setTimeout(() => { if ($('#plSrc').value === 'live' && (this.H.length || Router.cur === 'plan')) this.run(true); this.schedule(); }, next - now);
    this.autoInfo();
  },
  autoInfo() {
    const info = $('#plAutoInfo'); if (!info) return;
    info.innerHTML = (this.lastRun ? `Cập nhật lúc <b>${T.fmt(this.lastRun / 1000, false)}</b> · ` : '') + (this.auto() ? `lần tới ${T.fmt(this.nextAt / 1000, false)} (giờ VN)` : 'tự cập nhật đang tắt');
  },
  // ---- ICT trên chart Plan ----
  show: null,
  togICT(k) { this.show[k] = !this.show[k]; Store.set('plShow', this.show); $$('#plIctBtns button').forEach(b => b.classList.toggle('on', !!this.show[b.dataset.k])); },
  ictCard() {
    const R = this.ictR; if (!R) return '';
    const S = ICT.summary(R, this.ictB, i => T.fmt(this.ictB[Math.max(0, Math.min(this.ictB.length - 1, i))].t).slice(3), p => f2(p + this.off_));
    return `<div class="card" style="margin-top:14px"><h4>🧩 Cấu trúc ICT trên H1 (tự động, vẽ trên chart bên dưới)</h4><ul style="margin:6px 0 6px 18px;padding:0;font-size:13.5px">${S.map(x => `<li style="margin:3px 0">${x}</li>`).join('')}</ul>
      <p class="muted" style="font-size:12.5px;margin:4px 0 0"><b>BOS</b> (nét đứt) = nến đóng cửa phá đỉnh/đáy swing CÙNG chiều xu hướng → xu hướng tiếp diễn. <b>MSS</b> (nét liền, đậm) = phá NGƯỢC chiều xu hướng cũ → dấu hiệu đảo chiều (còn gọi CHoCH). <b>FVG</b> = khoảng trống giữa nến 1 và nến 3; viền đậm = chưa bị lấp, nét đứt giữa = CE (50%). <b>CRT H4</b> = nến H4 thứ 2 quét đỉnh/đáy nến H4 thứ 1 rồi đóng cửa quay lại trong biên → mục tiêu là cạnh đối diện của biên (nét đứt màu), hỏng nếu giá vượt râu quét (nét xám).
      Cách dùng với phương pháp: chỉ lấy tín hiệu cùng hướng D1. Khi hệ thống báo "chờ RSI H1 cắt 50", ưu tiên vào lệnh nếu giá vừa có MSS/BOS cùng hướng và đang ở trong FVG/CRT cùng hướng — đây là xác nhận thêm, KHÔNG phải luật đã được backtest.</p></div>`;
  },
  copy() { if (!this.text) return; navigator.clipboard.writeText(this.text).then(() => UI.toast('Đã sao chép plan')); },
  toLab() {
    if (!this.M.length) return;
    Data.set(this.M.map(b => ({ ...b })), 'PAXG/USDT M5 (Binance) — gần XAUUSD', false); location.hash = '#lab'; setTimeout(() => Lab.afterLoad(), 80);
  },
  /* Đánh giá plan cũ + kiểm tra bias theo kiểu walk-forward trên dữ liệu đã tải */
  renderHist() {
    const el = $('#plHist'); if (!el) return;
    const rows = [];
    if (this.H.length > 600) {
      const { days, keys } = this.index(this.H);
      keys.slice(-31, -1).forEach(k => {
        const D = days[k]; if (!D.prev) return;
        const tr = this.trend(D), h4 = this.h4(this.H, D.t0 - 1), v = tr.v || h4.v, real = D.c > D.o ? 1 : -1, ok = v === 0 ? null : v === real;
        const move = D.c - D.o;
        rows.push(`<tr><td class="mono">${T.fmt(D.t0 + 4 * 3600).slice(3, 13)}</td><td>${['GIẢM', 'NGANG', 'TĂNG'][tr.v + 1]}</td><td>${['GIẢM', 'NGANG', 'TĂNG'][h4.v + 1]}</td><td><b>${['BÁN', 'ĐỨNG NGOÀI/BIÊN', 'MUA'][v + 1]}</b></td><td class="mono ${move >= 0 ? 'pos' : 'neg'}">${move >= 0 ? '+' : ''}${move.toFixed(1)}$</td><td>${ok == null ? '—' : ok ? '✅' : '❌'}</td></tr>`);
        D._ok = ok;
      });
      const ev = keys.slice(-31, -1).map(k => days[k]._ok).filter(x => x != null), acc = ev.length ? Math.round(ev.filter(Boolean).length / ev.length * 100) : 0;
      el.innerHTML = `<h4>Kiểm tra lại: nếu dùng đúng luật này mỗi sáng trong ${rows.length} ngày qua</h4>
        <p class="muted" style="font-size:12.5px;margin:4px 0">Hướng của ngày (đóng cửa so với mở cửa) trùng với bias: <b style="color:var(--text)">${ev.filter(Boolean).length}/${ev.length} = ${acc}%</b>. Bias chỉ cho biết NÊN ƯU TIÊN phía nào — điểm vào vẫn phải chờ quét + MSS / EMA cắt tại vùng.</p>
        <div class="tblwrap" style="max-height:340px"><table class="tbl"><tr><th>Ngày</th><th>D1</th><th>H4</th><th>Plan ưu tiên</th><th>Thực tế trong ngày</th><th>Đúng?</th></tr>${rows.reverse().join('')}</table></div>`;
    } else {
      const P = Object.values(Store.get('plans', {})).sort((a, b) => b.day - a.day).slice(0, 20);
      el.innerHTML = '<h4>Plan đã tạo</h4>' + (P.length ? `<table class="tbl"><tr><th>Ngày</th><th>Giá lúc tạo</th><th>Plan</th></tr>${P.map(p => `<tr><td>${p.date}</td><td class="mono">${f2(p.px)}</td><td>${esc(p.main)}</td></tr>`).join('')}</table>` : '<p class="muted">Chưa có. Bấm "Tạo plan hôm nay".</p>');
    }
  },
};
