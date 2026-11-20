/* ICT Gold Lab — Nhận định theo giờ: đọc live.json do bot GitHub Actions (backtest/live.py) tạo mỗi giờ, 24/7, không cần mở máy. */
'use strict';
const Live = {
  URL: 'https://raw.githubusercontent.com/Anvo2004/Trading/live/live.json',
  d: null, err: null, more: false,
  ACT: { SIGNAL: ['🔔', 'ok', 'up'], HOLD: ['🟢', 'ok', 'up'], CLOSED: ['🏁', '', 'gold'], READY: ['🟠', 'warn', 'gold'], WAIT: ['🟡', '', 'gold'], NOTRADE: ['⚪', '', ''] },
  init() { this.load(); setInterval(() => this.load(), 10 * 60e3); },
  async load() {
    try {
      const r = await fetch(this.URL + '?t=' + Math.floor(Date.now() / 60e3), { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status); this.d = await r.json(); this.err = null; this.alert();
    } catch (e) { this.err = e.message; }
    if (Router.cur === 'live') this.render(); this.mini();
  },
  alert() {
    const n = this.d.note; if (!n || (n.act !== 'SIGNAL' && n.act !== 'CLOSED')) return;
    if (n.t <= Store.get('liveSeen', 0)) return; Store.set('liveSeen', n.t);
    Plan.notify(n.title.replace(/^\S+\s/, ''), (n.lines[0] || '').slice(0, 140));
  },
  mini() {
    const el = $('#homeLive'); if (!el) return;
    if (!this.d) { el.innerHTML = ''; return; }
    const n = this.d.note, a = this.ACT[n.act] || ['', '', ''];
    el.innerHTML = `<a href="#live" style="text-decoration:none;color:inherit"><div class="note ${a[1]}" style="font-size:13.5px;margin:0 0 14px"><b>🕐 Nhận định ${T.fmt(n.t, false)}:</b> ${esc(n.title)} <span class="muted">— bấm để xem chi tiết</span></div></a>`;
  },
  stat(arr) { const n = arr.length, w = arr.filter(x => x.R > 0).length, R = arr.reduce((q, x) => q + x.R, 0); return n ? `${n} lệnh · thắng ${Math.round(w / n * 100)}% · tổng <b class="${R >= 0 ? 'pos' : 'neg'}">${R >= 0 ? '+' : ''}${R.toFixed(2)}R</b>` : 'chưa có lệnh'; },
  render() {
    const el = $('#lvOut'); if (!el) return;
    if (!this.d) { el.innerHTML = this.err ? `<div class="note warn">Chưa đọc được nhận định tự động (${esc(this.err)}). Bot GitHub chạy mỗi giờ sau khi mã nguồn được đẩy lên GitHub; trong lúc chờ, dùng trang <a href="#plan">📅 Plan</a> (tự cập nhật mỗi giờ khi đang mở).</div>` : '<div class="card muted">Đang tải…</div>'; return; }
    const D = this.d, n = D.note, a = this.ACT[n.act] || ['', '', ''], s = D.state, dw = d => d === 1 ? 'MUA' : 'BÁN';
    const age = Math.round((Date.now() / 1000 - D.updated) / 60);
    const note = (x, big) => { const q = this.ACT[x.act] || ['', '', '']; return big
      ? `<div class="note ${q[1]}" style="font-size:15px;margin:0"><b>${esc(x.title)}</b></div><ul style="margin:10px 0 0;padding-left:18px;line-height:1.7;font-size:14px">${x.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`
      : `<details style="border-bottom:1px solid var(--line);padding:6px 0"><summary style="cursor:pointer"><span class="mono muted">${T.fmt(x.t).slice(3)}</span> · <span class="mono">${f2(x.px)}</span> · ${esc(x.title)}</summary><ul style="margin:6px 0;padding-left:18px;font-size:13px;line-height:1.6">${x.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul></details>`; };
    const chk = s ? [
      [`① D1: ${s.trD === 1 ? 'TĂNG → chỉ MUA' : s.trD === -1 ? 'GIẢM → chỉ BÁN' : 'không rõ → đứng ngoài'}`, !!s.trD, `giá ${f2(s.dc)} · EMA50 ${f2(s.e50)} · 5 ngày trước ${f2(s.e50p)}`],
      [`② H4 đã hồi: RSI H4 ${s.trD === 1 ? 'thấp nhất ' + s.rmin.toFixed(1) + ' (cần < 40)' : 'cao nhất ' + s.rmax.toFixed(1) + ' (cần > 60)'}`, s.pulled, 'trong 24 nến H4 gần nhất'],
      [`③a Nến H4 đóng ${s.side === 1 ? 'trên' : 'dưới'} EMA21 H4 (${f2(s.h4e21)})`, !!s.trD && s.side === s.trD, `giá đóng H4 ${f2(s.h4c)}`],
      [`③b RSI H1 cắt ${s.trD === 1 ? 'lên' : 'xuống'} 50: hiện ${s.rsi.toFixed(1)} (giờ trước ${s.rsi_prev.toFixed(1)})`, !!D.pos, 'nến H1 vừa đóng'],
    ].map(([t, ok, sub]) => `<div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--line)"><span style="font-size:18px">${ok ? '✅' : '⬜'}</span><div><div>${t}</div><div class="muted" style="font-size:12px">${sub}</div></div></div>`).join('') : '';
    const P = D.pos, pos = P ? `<div class="note ok" style="font-size:13.5px">Lệnh đang chạy: <b>${dw(P.d)}</b> từ ${T.fmt(P.t)} · Entry ${f2(P.e)} · SL ${f2(P.sl)} · TP ${f2(P.tp)} · SL cách <b>${P.r.toFixed(1)}$</b> · hiện <b>${((D.px - P.e) * P.d / P.r).toFixed(2)}R</b></div>` : '';
    const ind = D.ind.map(r => `<tr><td><b>${r.tf}</b></td><td>${r.trend === 1 ? '<span class="pill up">TĂNG</span>' : r.trend === -1 ? '<span class="pill down">GIẢM</span>' : '<span class="pill gold">ĐAN XEN</span>'}</td><td class="mono">${f2(r.c)}</td><td class="mono">${f2(r.e21)} / ${f2(r.e50)} / ${f2(r.e200)}</td><td class="mono">${r.rsi}${r.rsi < 30 ? ' <span class="pill up">quá bán</span>' : r.rsi > 70 ? ' <span class="pill down">quá mua</span>' : ''}</td><td class="mono">${r.hist >= 0 ? '+' : ''}${r.hist} ${Math.abs(r.hist) > Math.abs(r.hist_prev) ? (r.hist > 0 ? '↑ tăng mạnh dần' : '↓ giảm mạnh dần') : (r.hist > 0 ? '↘ lực tăng yếu đi' : '↗ lực giảm yếu đi')}</td></tr>`).join('');
    const lv = D.levels.slice().sort((x, y) => y.p - x.p).map(L => `<tr><td>${esc(L.n)}</td><td class="mono">${f2(L.p)}</td><td class="mono ${L.p > D.px ? 'neg' : 'pos'}">${L.p - D.px >= 0 ? '+' : ''}${(L.p - D.px).toFixed(1)}$</td></tr>`).join('');
    const nw = D.news == null ? '<p class="muted">Không lấy được lịch tin lần này — xem ForexFactory.</p>' : D.news.length ? `<table class="tbl">${D.news.map(e => `<tr><td class="mono">${T.fmt(e.t).slice(3)}</td><td>${esc(e.title)}</td><td class="mono muted">${esc(e.fc || '')}${e.prev ? ' / trước ' + esc(e.prev) : ''}</td></tr>`).join('')}</table>` : '<p class="muted">Không có tin đỏ USD trong 36 giờ tới.</p>';
    const J = D.journal.slice().reverse().slice(0, 12).map(x => `<tr><td class="mono">${T.fmt(x.t).slice(3)}</td><td><span class="pill ${x.d === 1 ? 'up' : 'down'}">${dw(x.d)}</span></td><td class="mono">${f2(x.e)}</td><td class="mono">${f2(x.sl)} / ${f2(x.tp)}</td><td class="mono">${T.fmt(x.xt).slice(3)} (${x.why})</td><td class="mono ${x.R > 0 ? 'pos' : 'neg'}"><b>${x.R > 0 ? '+' : ''}${x.R}R</b></td></tr>`).join('');
    const notes = D.notes.slice().reverse().slice(1, this.more ? 240 : 24);
    el.innerHTML = `
      <div class="row muted" style="gap:12px;font-size:12.5px;margin-bottom:8px"><span>Bot cập nhật lúc <b style="color:var(--text)">${T.fmt(D.updated)}</b> (${age} phút trước) · tự chạy mỗi giờ, 24/7</span><span>Nguồn: ${esc(D.src)}</span><button class="btn sm" onclick="Live.load()">↻ Tải lại</button><button class="btn sm" onclick="Plan.askNotify()">🔔 Bật thông báo</button></div>
      ${age > 150 ? '<div class="note warn" style="font-size:12.5px">Nhận định đã cũ hơn 2 giờ — có thể thị trường đang đóng cửa (cuối tuần) hoặc GitHub đang chậm.</div>' : ''}
      <div class="card" style="border-color:rgba(232,184,74,.5)"><div class="muted" style="font-size:12.5px;margin-bottom:6px">Nhận định mới nhất · dữ liệu tới ${T.fmt(n.t)} · giá ${f2(n.px)} (PAXG ≈ XAUUSD, lệch vài $)</div>${note(n, true)}</div>
      <div class="grid g2" style="margin-top:14px">
        <div class="card"><h4>🎯 Phương pháp chính — đang ở bước nào?</h4>${pos}${chk}
          <p class="muted" style="font-size:12px;margin:8px 0 0">Đủ cả 4 ô → vào lệnh. SL = 1×ATR D1 (hiện ${s ? s.datr.toFixed(1) : '—'}$), TP = 2×SL. Luật đầy đủ: <a href="#method">📘 Phương pháp giao dịch</a>.</p></div>
        <div class="card"><h4>📰 Tin đỏ USD sắp tới (giờ VN)</h4>${nw}<h4 style="margin-top:12px">Mức thanh khoản</h4><table class="tbl">${lv}</table></div>
      </div>
      <div class="card" style="margin-top:14px"><h4>Chỉ báo theo khung (nến đã đóng)</h4><div class="tblwrap"><table class="tbl"><tr><th>Khung</th><th>Xu hướng (giá/EMA50/EMA200)</th><th>Giá</th><th>EMA21 / 50 / 200</th><th>RSI 14</th><th>MACD hist</th></tr>${ind}</table></div></div>
      <div class="card" style="margin-top:14px"><h4>🕐 Các nhận định trước</h4>${notes.map(x => note(x)).join('') || '<p class="muted">Bot mới chạy — các giờ sau sẽ hiện ở đây.</p>'}
        ${D.notes.length > 24 ? `<button class="btn sm" style="margin-top:8px" onclick="Live.more=!Live.more;Live.render()">${this.more ? 'Thu gọn' : 'Xem thêm (tối đa 10 ngày)'}</button>` : ''}</div>
      <div class="card" style="margin-top:14px"><h4>📈 Nhật ký lệnh của bot (phương pháp chính)</h4>
        <div class="grid g2" style="margin:4px 0 10px"><div class="note" style="margin:0;font-size:13px">Tất cả: ${this.stat(D.journal)}</div><div class="note ok" style="margin:0;font-size:13px">Sau khi train (từ 20/11/2026): ${this.stat(D.journal.filter(x => x.t >= Plan.LIVE_FROM))}</div></div>
        <div class="tblwrap" style="max-height:360px"><table class="tbl"><tr><th>Vào lúc</th><th>Lệnh</th><th>Entry</th><th>SL / TP</th><th>Đóng</th><th>Kết quả</th></tr>${J || '<tr><td colspan="6" class="muted">Chưa có</td></tr>'}</table></div>
        <p class="muted" style="font-size:12px;margin:6px 0 0">Phương pháp dự phòng H4: ${this.stat(D.journal4)}. Giá PAXG ≈ XAUUSD, đã trừ ~0.35$ phí + 0.5$/đêm swap.</p></div>`;
  },
};
