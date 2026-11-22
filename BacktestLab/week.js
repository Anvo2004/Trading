/* ICT Gold Lab — Kế hoạch tuần & ngày.
   Tự lập trên trình duyệt từ dữ liệu trực tiếp (PAXG H1/D1 — cùng dữ liệu & cùng phương pháp đã train với 📅 Plan),
   nên luôn mới kể cả khi bot GitHub chạy trễ. Lịch tin cả tuần lấy từ bot (live.json → week_news).
   Mỗi ngày giao dịch, lúc ≥ 9:00 sáng (giờ VN) trang tự "chốt xu hướng" và lưu lại để cuối ngày đối chiếu đúng/sai. */
'use strict';
const Week = {
  P: null, busy: false,
  init() { setInterval(() => this.tick(), 5 * 60e3); },
  // dữ liệu Plan cũ quá 62 phút (và thị trường đang mở) → tải lại; còn mới thì chỉ vẽ lại (trạng thái theo giờ)
  tick() {
    if (!Plan.H.length) return;
    if (Date.now() - (Plan.lastRun || 0) > 62 * 60e3 && $('#plSrc').value === 'live' && !Plan.closed(Date.now() / 1000)) Plan.run(true);
    else this.onData();
  },
  onData() {
    this.builtAt = Plan.lastRun;
    try { this.P = this.build(); this.lock(); } catch (e) { console.error('Week', e); this.P = null; }
    if (Router.cur === 'week') this.render();
    if (Router.cur === 'live') Live.render();
  },
  ready() {
    if (Plan.M_ && Plan.lastRun && Date.now() - Plan.lastRun < 70 * 60e3) { if (this.builtAt !== Plan.lastRun) this.onData(); return !!this.P; }
    if (!this.busy && $('#plSrc').value === 'live') { this.busy = true; Plan.run(true).finally(() => { this.busy = false; this.onData(); }); }
    return false;
  },
  wkOf: k => k - (((k + 4) % 7) + 6) % 7,               // ngày giao dịch k (số ngày kể từ 1/1/1970, theo lịch NY) → thứ 2 của tuần đó
  nyAt(k, h, m = 0) { const o = T.off(k * 86400 + 43200); return k * 86400 + (h * 60 + m) * 60 - o * 3600; },   // giờ NY h:m của ngày k → unix
  vnDate(k) { const d = new Date(k * 86400e3), p = n => String(n).padStart(2, '0'); return `${['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getUTCDay()]} ${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}`; },
  holiday(k) {   // ngày nghỉ / rút ngắn của Mỹ ảnh hưởng vàng
    const d = new Date(k * 86400e3), y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, dd = d.getUTCDate();
    const nov1 = new Date(Date.UTC(y, 10, 1)).getUTCDay(), thanks = 1 + ((4 - nov1 + 7) % 7) + 21;
    if (m === 11 && dd === thanks) return '🇺🇸 Lễ Tạ ơn — thị trường Mỹ nghỉ, vàng giao dịch mỏng & đóng sớm. Hạn chế vào lệnh mới.';
    if (m === 11 && dd === thanks + 1) return '🇺🇸 Black Friday — Mỹ làm nửa ngày, thanh khoản thấp, dễ giật bất thường.';
    if (m === 12 && dd === 24) return 'Đêm Giáng sinh — đóng cửa sớm, thanh khoản thấp.';
    if (m === 12 && dd === 25) return 'Giáng sinh — thị trường nghỉ.';
    if (m === 12 && dd === 31) return 'Cuối năm — đóng cửa sớm.';
    if (m === 1 && dd === 1) return 'Năm mới — thị trường nghỉ.';
    if (m === 7 && dd === 4) return '🇺🇸 Quốc khánh Mỹ — nghỉ/đóng sớm.';
    return '';
  },
  news() {
    const L = Live.d && Live.d.week_news; if (L && L.length) return L;
    return null;
  },
  // RSI H4 sẽ vượt ngưỡng ở giá nào nếu giá hồi đều trong k nến H4 tới (ước lượng)
  needPx(c4, tr, k, atr) {
    const last = c4[c4.length - 1], tgt = tr === -1 ? 60 : 40, base = c4.slice(-400);
    const f = P => { const path = []; for (let i = 1; i <= k; i++) path.push(last + (P - last) * i / k); const r = Plan.rsi(base.concat(path)); return r[r.length - 1]; };
    let lo = last, hi = last - tr * 4 * atr; const ok = P => tr === -1 ? f(P) >= tgt : f(P) <= tgt;
    if (!ok(hi)) return null;
    for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (ok(mid)) hi = mid; else lo = mid; }
    return hi;
  },

  build() {
    const P_pos = M => !!(M && M.pos);
    const H = Plan.H, M = Plan.M_; if (!M || !M.st || H.length < 300 || !Plan.Dd) return null;
    const now = Date.now() / 1000, s = M.st, atr = s.datr, px = H[H.length - 1].c, tr = s.trD, dw = d => d === 1 ? 'MUA' : 'BÁN';
    const { days, keys } = Plan.index(H), kNow = T.dayKey(now), wk = this.wkOf(kNow), open = !Plan.closed(now);
    const W = a => a.length ? { o: a[0].o, h: Math.max(...a.map(d => d.h)), l: Math.min(...a.map(d => d.l)), c: a[a.length - 1].c, n: a.length } : null;
    const byWk = {}; keys.forEach(k => (byWk[this.wkOf(k)] = byWk[this.wkOf(k)] || []).push(days[k]));
    const PW = W(byWk[wk - 7] || []), PPW = W(byWk[wk - 14] || []), TW = W(byWk[wk] || []);
    const wr = Object.keys(byWk).map(Number).sort((a, b) => a - b).filter(w => w < wk).slice(-9, -1).map(w => { const x = W(byWk[w]); return x.h - x.l; });
    const avgWR = wr.length ? wr.reduce((a, b) => a + b, 0) / wr.length : 2.5 * atr;
    const prevK = keys.filter(k => k < kNow), pd = prevK.length ? days[prevK[prevK.length - 1]] : null, today = days[kNow] || null;
    // khung H4 / H1 / D1 — chỉ nến đã đóng (giống luật)
    const Hc = H.slice(0, -1), endC = Hc[Hc.length - 1].t + 3600, H4 = Plan.agg(H, 14400), H4c = H4.filter(b => b.t + 14400 <= endC);
    const I4 = Plan.ind(H4c), n4 = H4c.length - 1, e21_4 = I4.e21[n4], rsi4 = I4.rsi[n4], IH = Plan.ind(Hc), nh = Hc.length - 1;
    const Dc = Plan.Dd.filter(b => b.t + 86400 <= now), ID = Plan.ind(Dc), nd = Dc.length - 1, rsiD = ID.rsi[nd], e50 = ID.e50[nd];
    const h4s = Plan.h4(H, Infinity);
    // FVG H4 chưa lấp nằm ở phía nhịp hồi (xu hướng giảm → FVG giảm phía trên; tăng → FVG tăng phía dưới)
    const fv = [];
    if (tr) for (let i = Math.max(1, H4.length - 150); i < H4.length - 1; i++) {
      const a = H4[i - 1], c = H4[i + 1], later = H4.slice(i + 2);
      if (tr === -1 && a.l > c.h) { const mx = later.length ? Math.max(...later.map(b => b.h)) : -Infinity, top = a.l; if (mx >= top) continue; const bot = Math.max(c.h, mx); if (top - bot > atr * 0.05) fv.push({ lo: bot, hi: top, t: H4[i].t }); }
      if (tr === 1 && a.h < c.l) { const mn = later.length ? Math.min(...later.map(b => b.l)) : Infinity, bot = a.h; if (mn <= bot) continue; const top = Math.min(c.l, mn); if (top - bot > atr * 0.05) fv.push({ lo: bot, hi: top, t: H4[i].t }); }
    }
    // sóng chính (30 nến D1) để đo Fibonacci nhịp hồi
    const DA = Plan.Dd.slice(-30); let fib = null, leg = null;
    if (tr === -1) { let iH = 0; DA.forEach((b, i) => { if (b.h > DA[iH].h) iH = i; }); const hi = DA[iH].h, lo = Math.min(px, ...DA.slice(iH).map(b => b.l)); fib = r => lo + (hi - lo) * r; leg = { hi, lo, t: DA[iH].t }; }
    if (tr === 1) { let iL = 0; DA.forEach((b, i) => { if (b.l < DA[iL].l) iL = i; }); const lo = DA[iL].l, hi = Math.max(px, ...DA.slice(iL).map(b => b.h)); fib = r => hi - (hi - lo) * r; leg = { hi, lo, t: DA[iL].t }; }
    // giá cần hồi tới để RSI H4 đạt ngưỡng (nếu chưa hồi)
    let est = null;
    if (tr && !s.pulled) for (const k of [6, 12, 24]) { const p = this.needPx(I4.c, tr, k, atr); if (p != null && (!est || Math.abs(p - px) < Math.abs(est.p - px))) est = { p, k }; }
    // các mức hợp lưu phía nhịp hồi
    const C = [], side = -tr;
    const add = (n, a, b = a, key) => { if (a == null || !isFinite(a)) return; const m = (a + b) / 2; if ((m - px) * side > 0 && Math.abs(m - px) <= 3 * atr) C.push({ n, lo: Math.min(a, b), hi: Math.max(a, b), m, d: m - px, key }); };
    if (tr) {
      add('EMA21 H4', e21_4, e21_4, 'ema');
      fv.sort((a, b) => Math.abs(a.lo - px) - Math.abs(b.lo - px)).slice(0, 5).forEach(f => add(`FVG H4 chưa lấp (${T.fmt(f.t).slice(-16, -11)} ${T.fmt(f.t, false)})`, f.lo, f.hi, 'fvg'));
      [0.236, 0.382, 0.5].forEach(r => add(`Fibonacci ${(r * 100).toFixed(1)}% của sóng ${tr === -1 ? 'giảm' : 'tăng'}`, fib(r), fib(r), 'fib'));
      if (pd) add(tr === -1 ? 'Đỉnh hôm qua (PDH)' : 'Đáy hôm qua (PDL)', tr === -1 ? pd.h : pd.l, undefined, 'liq');
      if (PW) add(tr === -1 ? 'Đỉnh tuần trước (PWH)' : 'Đáy tuần trước (PWL)', tr === -1 ? PW.h : PW.l, undefined, 'liq');
      if (est) add(`RSI H4 ${tr === -1 ? 'vượt 60' : 'xuống dưới 40'} (ước lượng, nếu giá ${tr === -1 ? 'hồi' : 'chỉnh'} đều trong ~${est.k / 6} ngày)`, est.p, est.p, 'rsi');
      C.sort((a, b) => Math.abs(a.d) - Math.abs(b.d));
    }
    // vùng canh lệnh chính: nhịp hồi phải đưa giá qua EMA21 H4 và đủ xa để RSI H4 đạt ngưỡng, rồi quay lại dưới/trên EMA21 → vào lệnh.
    // → vùng = từ EMA21 H4 tới mức giá RSI H4 đạt ngưỡng (đã hồi đủ thì = quanh EMA21 H4), cộng các mức hợp lưu nằm sát vùng.
    let zone = null;
    if (tr && !P_pos(M)) {
      let a = e21_4, b = est ? est.p : s.pulled ? e21_4 : e21_4 - tr * 0.5 * atr;
      if (s.pulled) { a = e21_4 + tr * 0.25 * atr; b = e21_4 - tr * 0.25 * atr; }
      let lo = Math.min(a, b), hi = Math.max(a, b); if (hi - lo < 0.2 * atr) { const m = (lo + hi) / 2; lo = m - 0.1 * atr; hi = m + 0.1 * atr; }
      const pad = 0.3 * atr, items = C.filter(c => c.hi >= lo - pad && c.lo <= hi + pad);
      items.forEach(c => { lo = Math.min(lo, Math.max(c.lo, lo - pad)); hi = Math.max(hi, Math.min(c.hi, hi + pad)); });
      zone = { lo, hi, near: tr === -1 ? lo : hi, far: tr === -1 ? hi : lo, n: items.length, items };
    }
    // nhịp trong ngày so với xu hướng chính
    const dOpen = today ? today.o : null;
    const sig = [[`H4: giá ${px > e21_4 ? 'trên' : 'dưới'} EMA21 H4 (${f2(e21_4)})`, px > e21_4 ? 1 : -1], [`H1: EMA9 ${IH.e9[nh] > IH.e21[nh] ? 'trên' : 'dưới'} EMA21 (RSI H1 ${IH.rsi[nh].toFixed(0)})`, IH.e9[nh] > IH.e21[nh] ? 1 : -1]];
    if (dOpen != null) sig.push([`Giá ${px > dOpen ? 'trên' : 'dưới'} giá mở cửa ngày (${f2(dOpen)})`, px > dOpen ? 1 : -1]);
    const agree = sig.filter(x => x[1] === tr).length, tone = !tr ? { v: 0, t: 'không có xu hướng chính → đứng ngoài', c: '' }
      : agree === sig.length ? { v: 1, t: `đang chạy THUẬN xu hướng chính (${tr === -1 ? 'giảm tiếp' : 'tăng tiếp'}) — không ${tr === -1 ? 'bán' : 'mua'} đuổi, chờ nhịp hồi`, c: '' }
      : agree === 0 ? { v: -1, t: `đang HỒI NGƯỢC (${tr === -1 ? 'hồi lên' : 'chỉnh xuống'}) — đây là lúc theo dõi sát, setup có thể hình thành`, c: 'warn' }
      : { v: 0, t: 'đang giằng co (các khung nhỏ chưa thống nhất)', c: '' };
    // trạng thái phương pháp
    const P = M.pos; let step;
    if (P) step = { k: 'HOLD', t: `🟢 Đang giữ lệnh ${dw(P.d)} từ ${T.fmt(P.t)} ở ${f2(P.e)} · SL ${f2(P.sl)} · TP ${f2(P.tp)} — hiện ${((px - P.e) * P.d / P.r).toFixed(2)}R. Giữ nguyên, không dời SL, đóng chậm nhất ${T.fmt(P.t + 7 * 86400)}.` };
    else if (!tr) step = { k: 'NOTRADE', t: '⚪ D1 không có xu hướng rõ → phương pháp không giao dịch.' };
    else if (!s.pulled) step = { k: 'PULL', t: `🟡 Bước ②: chờ giá ${tr === -1 ? 'hồi lên' : 'chỉnh xuống'} để RSI H4 ${tr === -1 ? 'vượt 60' : 'xuống dưới 40'} (4 ngày qua ${tr === -1 ? 'cao nhất ' + s.rMax.toFixed(1) : 'thấp nhất ' + s.rMin.toFixed(1)}, hiện ${rsi4.toFixed(1)}).` };
    else if (s.side !== tr) step = { k: 'H4', t: `🟡 Bước ③a: RSI H4 đã đạt. Chờ một nến H4 đóng ${tr === -1 ? 'DƯỚI' : 'TRÊN'} EMA21 H4 (${f2(e21_4)}).` };
    else step = { k: 'READY', t: `🟠 Bước ③b: đủ điều kiện, chờ nến H1 đóng với RSI H1 cắt ${tr === -1 ? 'XUỐNG' : 'LÊN'} 50 (đang ${s.rsi.toFixed(1)}) → vào ${dw(tr)}.` };
    const bal = +Store.get('plBal', 57) || 57, acc = Store.get('plAcc', 'cent'), lossSL = acc === 'cent' ? atr * 0.01 : atr;
    return { now, open, px, atr, tr, s, M, days, keys, kNow, wk, PW, PPW, TW, avgWR, pd, today, e21_4, rsi4, rsiD, e50, h4s, fv, leg, fib, est, C, zone, sig, tone, step, IH, nh, bal, acc, lossSL, dw };
  },
  // chốt xu hướng lúc ≥ 9:00 sáng VN mỗi ngày giao dịch (lưu trên trình duyệt để đối chiếu)
  lock() {
    const P = this.P; if (!P || !P.open || !P.today) return;
    const now = Date.now() / 1000, vh = new Date((now + 7 * 3600) * 1000).getUTCHours(); if (vh < 9) return;
    const L = Store.get('wkLock', {}); if (L[P.kNow]) return;
    L[P.kNow] = { at: Math.round(now), px: +P.px.toFixed(2), tr: P.tr, tone: P.tone.v, step: P.step.k };
    const ks = Object.keys(L).map(Number).sort((a, b) => a - b); ks.slice(0, -30).forEach(k => delete L[k]);
    Store.set('wkLock', L);
  },
  trName: tr => tr === -1 ? 'GIẢM ⬇' : tr === 1 ? 'TĂNG ⬆' : 'KHÔNG RÕ',

  // ---------------- giao diện ----------------
  check910(P) {
    const L = Store.get('wkLock', {})[P.kNow], now = P.now, vnH = new Date((now + 7 * 3600) * 1000).getUTCHours();
    const tag = !P.open ? `Thị trường đang đóng cửa — đây là nhận định trước giờ mở cửa. Trang tự chốt lại lúc 9:00 sáng ${this.vnDate(P.kNow)} khi bạn mở web.`
      : L ? `Đã chốt lúc <b>${T.fmt(L.at, false)}</b> ở giá ${f2(L.px)} (lưu trên máy bạn để cuối ngày đối chiếu). Bên dưới là số liệu cập nhật mới nhất.`
      : vnH < 9 ? 'Chưa tới 9:00 — đây là nhận định sơ bộ, trang sẽ tự chốt lúc 9:00.' : 'Đang chốt…';
    const gap = P.TW && P.PW && P.kNow === this.wkOf(P.kNow) ? P.TW.o - P.PW.c : null;
    const a = P.today && isFinite(P.today.aH) ? P.today : null;
    const rows = [
      [`<b>Xu hướng chính (D1): ${this.trName(P.tr)}</b>`, P.tr ? `Nến D1 đã đóng lúc 07:00 sáng: giá ${f2(P.s.dc)} ${P.tr === -1 ? 'dưới' : 'trên'} EMA50 D1 (${f2(P.s.e50)}), EMA50 ${P.s.e50 < P.s.e50p ? 'dốc xuống' : 'dốc lên'}. Cách EMA50 ${(Math.abs(P.s.dc - P.s.e50) / P.atr).toFixed(1)}×ATR → xu hướng ${Math.abs(P.s.dc - P.s.e50) / P.atr > 3 ? 'rất mạnh, không thể đảo trong ngày' : 'rõ'}. RSI D1 ${P.rsiD.toFixed(0)}${P.rsiD < 30 ? ' (quá bán → dễ có nhịp hồi kỹ thuật)' : P.rsiD > 70 ? ' (quá mua → dễ có nhịp chỉnh)' : ''}.` : 'Giá và EMA50 D1 không cùng hướng → hôm nay đứng ngoài.'],
      gap != null ? ['Mở cửa tuần', `Giá mở cửa tuần ${f2(P.TW.o)} so với đóng cửa tuần trước ${f2(P.PW.c)}: ${Math.abs(gap) < 2 ? 'không gap' : `gap ${gap > 0 ? 'LÊN' : 'XUỐNG'} ${Math.abs(gap).toFixed(1)}$`}${Math.abs(gap) > 0.15 * P.atr ? ' — gap lớn hay được lấp lại trong 1–2 ngày' : ''}.`] : null,
      a ? ['Phiên Á hôm nay', `Biên độ ${f2(a.aL)} – ${f2(a.aH)} (${(a.aH - a.aL).toFixed(1)}$). Thường phiên London/Mỹ sẽ quét một phía của vùng này — quét ${P.tr === -1 ? 'ĐỈNH Á rồi quay xuống' : P.tr === 1 ? 'ĐÁY Á rồi quay lên' : 'một phía'} là mẫu thuận xu hướng.`] : null,
      ['Nhịp trong ngày', `${P.sig.map(x => (x[1] === P.tr ? '✅ ' : '↩️ ') + x[0]).join('<br>')}<br><b>→ ${P.tone.t}</b>`],
      ['Phương pháp đang ở', P.step.t],
    ].filter(Boolean);
    const todo = this.todo(P);
    return `<div class="card" style="border-color:rgba(232,184,74,.6)"><h3 style="margin:0 0 4px">⏰ Chốt xu hướng 9–10h sáng — ${this.vnDate(P.kNow)}</h3><p class="muted" style="font-size:12.5px;margin:0 0 10px">${tag}</p>
      <div class="note ${P.tr ? (P.tone.c || 'ok') : ''}" style="font-size:15.5px;margin:0 0 10px"><b>${P.tr ? `XU HƯỚNG CHÍNH: ${this.trName(P.tr)} → hôm nay CHỈ canh ${P.dw(P.tr)}, không ${P.dw(-P.tr).toLowerCase()} ngược xu hướng.` : 'KHÔNG CÓ XU HƯỚNG CHÍNH → hôm nay đứng ngoài.'}</b></div>
      <table class="tbl">${rows.map(r => `<tr><td style="width:150px;vertical-align:top">${r[0]}</td><td style="font-size:13.5px;line-height:1.6">${r[1]}</td></tr>`).join('')}</table>
      <h4 style="margin:14px 0 6px">✅ Việc cần làm hôm nay</h4><ul style="margin:0;padding-left:18px;line-height:1.75;font-size:14px">${todo.map(x => `<li>${x}</li>`).join('')}</ul></div>`;
  },
  todo(P) {
    const F = f2, out = [], z = P.zone, tr = P.tr, dw = P.dw;
    if (P.step.k === 'HOLD') { const p = P.M.pos; out.push(`Giữ lệnh ${dw(p.d)}: SL ${F(p.sl)}, TP ${F(p.tp)}. Không dời SL, không chốt sớm vì sợ — luật đã kiểm tra là giữ tới SL/TP/7 ngày.`); }
    else if (P.step.k === 'NOTRADE') out.push('Không vào lệnh. Chỉ quan sát và học: ghi lại cấu trúc ICT trên 🕹️ Backtest Lab.');
    else if (P.step.k === 'PULL') {
      out.push(z ? `Đặt <b>cảnh báo giá trên MT5/TradingView ở ${F(z.near)}</b> (mép gần của vùng canh ${dw(tr)}). Chưa tới vùng này thì KHÔNG làm gì.` : `Chờ RSI H4 ${tr === -1 ? 'vượt 60' : 'xuống dưới 40'}.`);
      out.push(`Giá ${tr === -1 ? 'giảm tiếp' : 'tăng tiếp'} không hồi → vẫn đứng ngoài, <b>không ${dw(tr).toLowerCase()} đuổi</b> (luật ②).`);
      if (z) out.push(`Khi giá vào vùng ${F(Math.min(z.lo, z.hi))} – ${F(Math.max(z.lo, z.hi))} và RSI H4 ${tr === -1 ? '> 60' : '< 40'} → mở trang này xem bước ③ (nến H4 đóng lại ${tr === -1 ? 'dưới' : 'trên'} EMA21 H4, rồi RSI H1 cắt ${tr === -1 ? 'xuống' : 'lên'} 50).`);
    } else if (P.step.k === 'H4') out.push(`Chờ nến H4 đóng ${tr === -1 ? 'dưới' : 'trên'} EMA21 H4 ${F(P.e21_4)}. Nến H4 đóng lúc 03:00 · 07:00 · 11:00 · 15:00 · 19:00 · 23:00 giờ VN (mùa đông).`);
    else out.push(`Canh từng nến H1 đóng: RSI H1 cắt ${tr === -1 ? 'xuống dưới' : 'lên trên'} 50 → vào ${dw(tr)} ngay giá đóng nến, SL ${P.atr.toFixed(1)}$, TP ${(2 * P.atr).toFixed(1)}$. Bật 🔔 thông báo trên web.`);
    out.push(`Khối lượng: <b>0.01 lot ${P.acc === 'cent' ? 'tài khoản Cent' : 'Standard'}</b> → chạm SL mất ≈ ${P.lossSL.toFixed(2)}$ (${(P.lossSL / P.bal * 100).toFixed(1)}% vốn ${P.bal}$). Tối đa 1 lệnh vàng cùng lúc.`);
    const nw = this.dayNews(P.kNow);
    if (nw.length) out.push(`⚠️ Tin hôm nay: ${nw.map(e => `<b>${T.fmt(e.t, false)}</b> ${esc(e.title)}${e.imp === 'High' ? ' 🔴' : ''}`).join(' · ')} — không mở lệnh mới 30 phút trước/sau tin đỏ.`);
    const hd = this.holiday(P.kNow); if (hd) out.push(hd);
    out.push('Các mốc xem lại: <b>12:00</b> (hết phiên Á) · <b>14:00–17:00</b> (London) · <b>20:30–23:00</b> (Mỹ) · trang tự cập nhật mỗi giờ.');
    return out;
  },
  dayNews(k) { const N = this.news() || [], a = this.nyAt(k - 1, 18), b = this.nyAt(k, 17); return N.filter(e => e.t >= a && e.t < b && (e.imp === 'High' || e.imp === 'Medium')); },
  weekCard(P) {
    const F = f2, tr = P.tr, z = P.zone, dw = P.dw, wkEnd = P.wk + 4;
    const lvRows = P.C.map(c => `<tr${z && z.items.includes(c) ? ' style="background:rgba(232,184,74,.08)"' : ''}><td>${esc(c.n)}${z && z.items.includes(c) ? ' <span class="pill gold">trong vùng</span>' : ''}</td><td class="mono">${c.hi - c.lo > 0.5 ? F(c.lo) + ' – ' + F(c.hi) : F(c.m)}</td><td class="mono ${c.d > 0 ? 'neg' : 'pos'}">${c.d >= 0 ? '+' : ''}${c.d.toFixed(1)}$</td></tr>`).join('');
    let scen = '';
    if (P.step.k === 'HOLD') { const p = P.M.pos; scen = `<li><b>Đang có lệnh ${dw(p.d)}</b> — mục tiêu tuần là quản lý lệnh: TP ${F(p.tp)}, SL ${F(p.sl)}, hết hạn ${T.fmt(p.t + 7 * 86400)}.</li>`; }
    else if (tr) {
      const e = z ? (z.lo + z.hi) / 2 : P.e21_4, sl = e - tr * P.atr, tp = e + 2 * tr * P.atr;
      const ext = tr === -1 ? (P.TW ? P.TW.h - P.avgWR : (P.PW ? P.PW.c : P.px) - 0.6 * P.avgWR) : (P.TW ? P.TW.l + P.avgWR : (P.PW ? P.PW.c : P.px) + 0.6 * P.avgWR);
      scen = `<li><b>Kịch bản A — ${tr === -1 ? 'hồi lên rồi BÁN' : 'chỉnh xuống rồi MUA'} (kịch bản chính của phương pháp):</b> giá ${tr === -1 ? 'hồi lên' : 'chỉnh về'} vùng <b>${z ? F(Math.min(z.lo, z.hi)) + ' – ' + F(Math.max(z.lo, z.hi)) : 'EMA21 H4 ' + F(P.e21_4)}</b>${P.s.pulled ? '' : `, RSI H4 ${tr === -1 ? 'vượt 60' : 'xuống dưới 40'}`} → nến H4 đóng lại ${tr === -1 ? 'dưới' : 'trên'} EMA21 H4 → nến H1 có RSI cắt ${tr === -1 ? 'xuống' : 'lên'} 50 → <b>${dw(tr)}</b>.
          <br><span class="muted">Ví dụ nếu khớp quanh ${F(e)}: SL ${F(sl)} (1×ATR D1 = ${P.atr.toFixed(1)}$) · TP ${F(tp)} (2R). Giá vào thật = giá đóng nến H1 lúc có tín hiệu, không đặt lệnh chờ.</span></li>
        <li><b>Kịch bản B — ${tr === -1 ? 'giảm tiếp' : 'tăng tiếp'} không hồi:</b> phương pháp <b>đứng ngoài</b>, không ${dw(tr).toLowerCase()} đuổi. Biên độ tuần trung bình 8 tuần ≈ ${P.avgWR.toFixed(0)}$ → ${tr === -1 ? 'đáy' : 'đỉnh'} tuần có thể tới khoảng <b>${F(ext)}</b> (tham khảo, không phải mục tiêu vào lệnh).</li>
        <li><b>Kịch bản C — ${tr === -1 ? 'hồi quá mạnh' : 'giảm quá sâu'}:</b> nến D1 đóng ${tr === -1 ? 'trên' : 'dưới'} EMA50 D1 (${F(P.s.e50)}, cách ${Math.abs(P.s.e50 - P.px).toFixed(0)}$) → hết xu hướng, dừng ${dw(tr).toLowerCase()}, đứng ngoài.</li>`;
    } else scen = `<li>D1 không có xu hướng (giá ${F(P.s.dc)}, EMA50 ${F(P.s.e50)}) → <b>cả tuần đứng ngoài</b> cho tới khi giá và độ dốc EMA50 cùng hướng.</li>`;
    const PW = P.PW, chg = PW && P.PPW ? PW.c - P.PPW.c : null;
    return `<div class="card" style="margin-top:14px"><h3 style="margin:0 0 6px">🗓️ Kế hoạch tuần ${this.vnDate(P.wk)} → ${this.vnDate(wkEnd)}</h3>
      <div class="note ${tr ? 'ok' : ''}" style="font-size:14.5px;margin:0 0 10px"><b>${tr ? `Tuần này: xu hướng ${this.trName(tr)} → chỉ canh ${dw(tr)}.` : 'Tuần này: chưa có xu hướng → đứng ngoài.'}</b> ${P.step.t}</div>
      ${PW ? `<p style="font-size:13.5px;margin:0 0 8px">Tuần trước: mở ${F(PW.o)} · cao ${F(PW.h)} · thấp ${F(PW.l)} · đóng <b>${F(PW.c)}</b>${chg != null ? ` (<span class="${chg >= 0 ? 'pos' : 'neg'}">${chg >= 0 ? '+' : ''}${chg.toFixed(1)}$</span>)` : ''} · biên độ ${(PW.h - PW.l).toFixed(0)}$ (trung bình ${P.avgWR.toFixed(0)}$).${P.TW ? ` Tuần này tới giờ: mở ${F(P.TW.o)} · cao ${F(P.TW.h)} · thấp ${F(P.TW.l)}.` : ''}</p>` : ''}
      <ul style="margin:0 0 10px;padding-left:18px;line-height:1.75;font-size:14px">${scen}</ul>
      ${tr ? `<h4 style="margin:10px 0 6px">${tr === -1 ? '📍 Các mức giá phía trên — nơi chờ nhịp hồi để BÁN' : '📍 Các mức giá phía dưới — nơi chờ nhịp chỉnh để MUA'} (giá hiện ${F(P.px)})</h4>
      <div class="tblwrap"><table class="tbl"><tr><th>Mức</th><th>Giá</th><th>Cách giá hiện tại</th></tr>${lvRows || '<tr><td colspan="3" class="muted">Không có mức nào trong 2.5×ATR</td></tr>'}</table></div>
      <p class="muted" style="font-size:12px;margin:6px 0 0">Vùng tô vàng = nơi nhiều mức trùng nhau ("hợp lưu"). Mức RSI là ước lượng: nếu giá hồi đều tới đó trong 1–4 ngày thì RSI H4 đạt ngưỡng (hồi nhanh và mạnh thì có thể đạt sớm hơn). Giá PAXG ≈ XAUUSD, trên MT5 có thể lệch vài $ — dùng khoảng cách là chính.</p>` : ''}</div>`;
  },
  dayCard(P) {
    const k = P.kNow, at = (dk, h, m) => T.fmt(this.nyAt(dk, h, m), false), F = f2;
    const tl = [
      [at(k - 1, 18, 0), 'Mở cửa ngày (giá mở cửa ngày = mốc tham chiếu)'],
      [`${at(k - 1, 20, 0)}–${at(k, 0, 0)}`, 'Phiên Á — tạo vùng đỉnh/đáy Á'],
      ['09:00–10:00', '<b>Chốt xu hướng</b> (thẻ ở trên)'],
      [`${at(k, 2, 0)}–${at(k, 5, 0)}`, 'London kill zone — hay quét đỉnh/đáy Á'],
      [`${at(k, 8, 30)}–${at(k, 11, 0)}`, 'Phiên Mỹ (NY AM) — tin Mỹ ra lúc ' + at(k, 8, 30) + ', biến động mạnh nhất'],
      ['07:00 sáng hôm sau', 'Nến D1 đóng → xu hướng chính được tính lại'],
    ];
    const nw = this.dayNews(k), lv = [];
    if (P.pd) lv.push(['Đỉnh hôm qua (PDH)', P.pd.h], ['Đáy hôm qua (PDL)', P.pd.l]);
    if (P.PW) lv.push(['Đỉnh tuần trước (PWH)', P.PW.h], ['Đáy tuần trước (PWL)', P.PW.l], ['Đóng cửa tuần trước', P.PW.c]);
    if (P.today) { lv.push(['Mở cửa ngày', P.today.o]); if (isFinite(P.today.aH)) lv.push(['Đỉnh Á', P.today.aH], ['Đáy Á', P.today.aL]); if (P.today.mo != null) lv.push(['Midnight Open', P.today.mo]); }
    lv.push(['EMA21 H4', P.e21_4]);
    const lr = lv.sort((a, b) => b[1] - a[1]).map(([n, p]) => `<tr><td>${n}</td><td class="mono">${F(p)}</td><td class="mono ${p > P.px ? 'neg' : 'pos'}">${p - P.px >= 0 ? '+' : ''}${(p - P.px).toFixed(1)}$</td></tr>`).join('');
    return `<div class="grid g2" style="margin-top:14px">
      <div class="card"><h4>📆 Lịch trong ngày ${this.vnDate(k)} (giờ VN)</h4><table class="tbl">${tl.map(r => `<tr><td class="mono" style="white-space:nowrap">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>
        <h4 style="margin-top:12px">📰 Tin USD hôm nay</h4>${this.news() == null ? '<p class="muted" style="margin:0">Chưa lấy được lịch tin tuần này (bot sẽ cập nhật) — xem ForexFactory.</p>' : nw.length ? `<table class="tbl">${nw.map(e => `<tr><td class="mono">${T.fmt(e.t, false)}</td><td>${e.imp === 'High' ? '🔴' : '🟠'} ${esc(e.title)}</td><td class="mono muted">${esc(e.fc || '')}${e.prev ? ' / trước ' + esc(e.prev) : ''}</td></tr>`).join('')}</table>` : '<p class="muted" style="margin:0">Không có tin USD quan trọng.</p>'}</div>
      <div class="card"><h4>📏 Mức giá quan trọng hôm nay (giá hiện ${F(P.px)})</h4><table class="tbl">${lr}</table></div></div>`;
  },
  calendar(P) {
    const N = this.news(), rows = [];
    for (let i = 0; i < 5; i++) {
      const k = P.wk + i, d = P.days[k], nw = this.dayNews(k), hd = this.holiday(k), cur = k === P.kNow;
      const ev = nw.map(e => `<div>${e.imp === 'High' ? '🔴' : '🟠'} <span class="mono">${T.fmt(e.t, false)}</span> ${esc(e.title)}${e.fc ? ` <span class="muted">(dự báo ${esc(e.fc)})</span>` : ''}</div>`).join('');
      const px = d ? `<span class="mono">${f2(d.o)} → ${f2(d.c)}</span> <span class="${d.c >= d.o ? 'pos' : 'neg'}">${d.c - d.o >= 0 ? '+' : ''}${(d.c - d.o).toFixed(1)}$</span><br><span class="muted mono" style="font-size:12px">${f2(d.l)} – ${f2(d.h)}</span>` : '<span class="muted">—</span>';
      rows.push(`<tr${cur ? ' style="background:rgba(76,141,255,.10)"' : ''}><td style="white-space:nowrap"><b>${this.vnDate(k)}</b>${cur ? ' <span class="pill gold">hôm nay</span>' : ''}</td><td style="font-size:13px">${ev || (N ? '<span class="muted">không có tin quan trọng</span>' : '<span class="muted">chưa có lịch tin</span>')}${hd ? `<div style="color:var(--gold)">${hd}</div>` : ''}</td><td style="font-size:13px">${px}</td></tr>`);
    }
    return `<div class="card" style="margin-top:14px"><h4>📅 Lịch tuần (tin USD 🔴 đỏ / 🟠 cam, giờ VN)</h4><div class="tblwrap"><table class="tbl"><tr><th>Ngày</th><th>Tin & ghi chú</th><th>Giá trong ngày</th></tr>${rows.join('')}</table></div>
      <p class="muted" style="font-size:12px;margin:6px 0 0">Luật tin: không mở lệnh mới trong 30 phút trước/sau tin 🔴. Lệnh đang chạy thì giữ nguyên SL/TP (đã tính trong backtest).</p></div>`;
  },
  review(P) {
    const L = Store.get('wkLock', {}), ks = Object.keys(L).map(Number).sort((a, b) => b - a).slice(0, 10);
    if (!ks.length) return '';
    let ok = 0, n = 0;
    const rows = ks.map(k => {
      const x = L[k], d = P.days[k], done = d && k < P.kNow, mv = done ? d.c - x.px : null, right = done && x.tr ? Math.sign(mv) === x.tr : null;
      if (right != null) { n++; if (right) ok++; }
      return `<tr><td>${this.vnDate(k)} <span class="muted mono">${T.fmt(x.at, false)}</span></td><td>${this.trName(x.tr)}</td><td class="mono">${f2(x.px)}</td><td class="mono">${done ? f2(d.c) : '<span class="muted">đang chạy</span>'}</td><td>${right == null ? '—' : right ? '✅ đúng hướng' : '❌ ngược'}${done ? ` <span class="mono ${mv >= 0 ? 'pos' : 'neg'}">${mv >= 0 ? '+' : ''}${mv.toFixed(1)}$</span>` : ''}</td></tr>`;
    }).join('');
    return `<div class="card" style="margin-top:14px"><h4>📒 Nhật ký chốt xu hướng 9h (trên máy này)${n ? ` — đúng hướng ${ok}/${n} ngày` : ''}</h4><div class="tblwrap"><table class="tbl"><tr><th>Ngày (giờ chốt)</th><th>Xu hướng chốt</th><th>Giá lúc chốt</th><th>Đóng cửa ngày</th><th>Kết quả</th></tr>${rows}</table></div>
      <p class="muted" style="font-size:12px;margin:6px 0 0">"Đúng hướng" = giá đóng cửa ngày đi cùng chiều xu hướng chính so với lúc chốt. Đây là để bạn tập đọc xu hướng; vào lệnh vẫn chỉ theo 3 bước của phương pháp.</p></div>`;
  },
  render() {
    const el = $('#wkOut'); if (!el) return;
    if ($('#plSrc').value !== 'live') { el.innerHTML = '<div class="note warn">Trang 📅 Plan đang dùng nguồn "dữ liệu đã nạp ở Lab". Đổi lại nguồn <b>Trực tuyến</b> ở 📅 Plan để lập kế hoạch tuần bằng giá thật.</div>'; return; }
    if (!this.ready()) { el.innerHTML = '<div class="card muted">⏳ Đang tải dữ liệu giá trực tiếp và lập kế hoạch…</div>'; return; }
    const P = this.P;
    el.innerHTML = `<div class="row muted" style="gap:12px;font-size:12.5px;margin-bottom:8px"><span>Tính lúc <b style="color:var(--text)">${T.fmt(Plan.lastRun / 1000)}</b> · giá ${f2(P.px)} (PAXG ≈ XAUUSD) · tự cập nhật mỗi giờ khi trang đang mở</span><button class="btn sm" onclick="Plan.run(true).then(()=>Week.onData())">↻ Cập nhật ngay</button><button class="btn sm" onclick="Plan.askNotify()">🔔 Bật thông báo</button></div>
      ${this.check910(P)}${this.weekCard(P)}${this.dayCard(P)}${this.calendar(P)}${this.review(P)}`;
  },
  mini() {   // dòng tóm tắt cho trang Nhận định theo giờ
    const P = this.P; if (!P) return '';
    const z = P.zone, F = f2;
    return `<a href="#week" style="text-decoration:none;color:inherit"><div class="note" style="font-size:13.5px;margin:0 0 14px">🗓️ <b>Kế hoạch tuần:</b> xu hướng ${this.trName(P.tr)}${P.tr ? ` → chỉ ${P.dw(P.tr)}` : ''}${P.step.k === 'PULL' && z ? ` · chờ giá ${P.tr === -1 ? 'hồi lên' : 'chỉnh về'} vùng ${F(Math.min(z.lo, z.hi))}–${F(Math.max(z.lo, z.hi))}` : ''} <span class="muted">— bấm để xem kế hoạch tuần, ngày và thẻ chốt xu hướng 9h</span></div></a>`;
  },
};
