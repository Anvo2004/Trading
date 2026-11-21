/* ICT Gold Lab — Trang "Phương pháp giao dịch": cách chọn, setup, luật vào lệnh, quản lý lệnh, thời gian giao dịch.
   Số liệu lấy từ data/opt.js (train swing H1) và data/mtf.js (so sánh khung) → tự cập nhật sau mỗi lần train lại. */
'use strict';
const Method = {
  ltf() {
    const R = window.REF; if (!R) return '';
    const K = R.key, cls = v => v > 0.05 ? 'pos' : v < -0.05 ? 'neg' : '';
    const row = (k, lab) => { const v = K[k]; if (!v) return ''; return `<tr><td>${lab}</td><td class="mono">${v.n}</td><td class="mono">${v.wr}%</td><td class="mono ${cls(v.exp)}"><b>${fR(v.exp)}</b></td><td class="mono ${cls(v.tot)}">${v.tot >= 0 ? '+' : ''}${v.tot}R</td><td class="mono">${v.totb >= 0 ? '+' : ''}${v.totb}</td><td class="mono">${Math.round(v.risk_ratio * 100)}%</td><td class="mono">${v.ms}</td><td class="mono">${v.dd}R</td></tr>`; };
    const T15 = K.m15_tight, ys = Object.entries(T15.ys).map(([y, v]) => `<span class="pill ${v[1] > 0 ? 'up' : 'down'}">${y}: ${v[1] >= 0 ? '+' : ''}${v[1]}R</span>`).join(' ');
    const slNow = 88.7 * T15.risk_ratio;
    return `<h2>5. Vào lệnh bằng M5 / M15 — có "đẹp" hơn không?</h2>
    <div class="card"><p style="margin:0 0 8px">Đã thử <b>${R.n_cfg} cách vào lệnh</b> ở M5/M15 sau tín hiệu H1 (limit chờ hồi, EMA9/21 cắt lại, RSI hồi rồi vượt 50, quét đáy + MSS kiểu ICT; SL gốc hoặc SL theo khung nhỏ; TP gốc/2R/3R; chờ 4/8/24 giờ) trên ${R.n_bases} biến thể của phương pháp, quản lý lệnh trên từng nến M5 thật của Exness. Kết quả (phương pháp đang dùng):</p>
      <div class="tblwrap"><table class="tbl"><tr><th>Cách vào lệnh</th><th>Lệnh</th><th>Thắng</th><th>TB/lệnh</th><th>Tổng R</th><th>Lời nếu giữ nguyên lot*</th><th>SL so với gốc</th><th>Thua liên tiếp</th><th>Sụt giảm</th></tr>
        ${row('base', 'Gốc: market khi nến H1 đóng')}${row('delay4', 'Chỉ chờ 4 giờ rồi vào market (đối chứng)')}${row('m15_orig', 'Tín hiệu M15 (quét + MSS), giữ SL gốc')}${row('limit', 'Limit chờ giá hồi, giữ SL gốc')}${row('m15_tight', '<b>Entry M15: EMA9/21 M15 cắt lại + SL hẹp, TP gốc</b>')}${row('sniper', 'Entry M5: EMA9/21 M5 cắt lại + SL hẹp, TP gốc')}</table></div>
      <p class="muted" style="font-size:12px;margin:6px 0 10px">* Lời tính theo đơn vị "rủi ro gốc" (1×ATR D1) khi giữ nguyên số lot như cách gốc. "Tổng R" tính khi chỉnh lot theo rủi ro thật của từng lệnh (SL hẹp → lot lớn hơn để cùng % rủi ro). Bản gốc ở bảng này đóng lệnh sau đúng 7 ngày lịch nên thấp hơn số +0.46R ở trên.</p>
      <div class="grid g2">
        <div class="note" style="margin:0;font-size:13.5px"><b>Phát hiện 1 — giá vào không "đẹp" hơn.</b> Giá vào bằng M5/M15 trung bình gần như bằng giá đóng nến H1. Nếu <b>giữ SL gốc</b>, mọi kiểu tín hiệu M5/M15 cho kết quả <b>giống hệt việc chỉ chờ 4 giờ rồi vào</b> → tín hiệu khung nhỏ không thêm lợi thế. Cách đơn giản: không cần vội, vào trong 1–4 giờ sau tín hiệu.</div>
        <div class="note ok" style="margin:0;font-size:13.5px"><b>Phát hiện 2 — SL hẹp mới tạo khác biệt.</b> Vào bằng M15 với SL sau nhịp hồi (≈ ${Math.round(T15.risk_ratio * 100)}% SL gốc) nhưng <b>vẫn giữ TP gốc</b>: thắng ít hơn (${T15.wr}%) nhưng mỗi lệnh thắng ≈ +5 đến +10R. Có lãi cả 6/6 năm (${ys}); tốt hơn cách gốc ở ${T15.better_in}/${R.n_bases} biến thể; walk-forward nhóm SL hẹp ${fR(R.wf_tight.oos_R / Math.max(1, R.wf_tight.oos_n))}/lệnh so với gốc ${fR(R.wf_tight.base_oos_R / Math.max(1, R.wf_tight.base_oos_n))}.</div>
      </div></div>
    <div class="card" style="margin-top:14px;border-color:rgba(232,184,74,.55)"><h4>🎯 Luật Entry M15 (nâng cao, tùy chọn)</h4><ol style="margin:0;padding-left:20px;line-height:1.8">
      <li>Chỉ dùng khi phương pháp chính vừa có <b>tín hiệu H1</b> (①②③ đủ). Ghi lại <b>giá tín hiệu P0</b> và <b>ATR D1</b>. TP gốc = P0 ± 2×ATR D1, SL gốc = P0 ∓ 1×ATR D1.</li>
      <li>Mở <b>M15</b>, thêm EMA 9, EMA 21, ATR 14. Trong <b>24 giờ</b> sau tín hiệu: chờ EMA9 M15 hồi <b>xuống dưới</b> EMA21 (MUA) / <b>lên trên</b> EMA21 (BÁN) — giá đang điều chỉnh.</li>
      <li>Khi EMA9 M15 <b>cắt lại</b> theo hướng tín hiệu → vào lệnh market ở giá đóng nến M15 đó.</li>
      <li><b>SL</b> = đáy thấp nhất của nhịp hồi (MUA; BÁN thì đỉnh cao nhất) − 0.3×ATR M15. Nếu SL này cách giá vào <b>ít hơn 0.2×ATR D1</b> thì nới ra đúng 0.2×ATR D1.</li>
      <li><b>TP = TP gốc</b> của tín hiệu H1 — không chốt sớm ở 2R/3R (phần lớn lợi thế nằm ở các lệnh chạy hết tới TP gốc). Tối đa 7 ngày.</li>
      <li>Bỏ lệnh nếu: quá 24h không có điểm vào, hoặc giá chạm SL gốc / TP gốc trước khi có điểm vào.</li></ol>
      <div class="grid g2" style="margin-top:10px">
        <div class="note warn" style="margin:0;font-size:13px"><b>Cái giá phải trả:</b> chỉ thắng ~1/3 số lệnh, từng <b>thua liền ${T15.ms} lệnh</b>, sụt giảm tối đa ${T15.dd}R (rủi ro 1%/lệnh → −${T15.dd}% tài khoản). Phải canh M15 trong 24h sau tín hiệu (đặt cảnh báo "EMA9 crossing EMA21" khung M15 trên TradingView). Không chịu được chuỗi thua dài → dùng cách gốc.</div>
        <div class="note ok" style="margin:0;font-size:13px"><b>Lợi ích cho vốn nhỏ:</b> SL hiện ≈ ${slNow.toFixed(0)}$ thay vì ≈ 89$ → tài khoản Cent 57$: 0.01 lot chỉ rủi ro ≈ ${(slNow * 0.01).toFixed(2)}$ (${(slNow * 0.01 / 57 * 100).toFixed(1)}%), có thể dùng 0.02 lot (≈ ${(slNow * 0.02 / 57 * 100).toFixed(1)}%). Bot theo giờ tự theo dõi Entry M15 và báo khi đã kích hoạt.</div>
      </div>
      <p class="muted" style="font-size:12px;margin:8px 0 0">Bản M5 (cùng luật trên M5, chờ 8h) có tổng R tương tự nhưng thua liền tới ${K.sniper.ms} lệnh và sụt giảm ${K.sniper.dd}R — M15 dễ theo và ổn định hơn. Kết quả trên ~100 lệnh, chọn ra từ ${R.n_cfg} cách → kỳ vọng thật sẽ thấp hơn. Nên demo 20 lệnh trước.</p></div>`;
  },
  render() {
    const el = $('#mtOut'); if (!el) return;
    const O = window.OPT, X = window.MTF, P = O && O.pick, cls = v => v > 0.05 ? 'pos' : v < -0.05 ? 'neg' : '';
    const T_ = (O && O.pick_trades) || [];
    // thống kê theo giờ vào lệnh (giờ VN)
    const blk = h => h >= 5 && h < 14 ? 0 : h >= 14 && h < 19 ? 1 : h >= 19 ? 2 : 3, BN = ['Phiên Á 05–13h', 'Phiên London 14–18h', 'Phiên New York 19–23h', 'Đêm 00–04h'];
    const sb = BN.map(() => []); T_.forEach(x => sb[blk(new Date((x[0] + 7 * 3600) * 1000).getUTCHours())].push(x[3]));
    const sess = sb.map((a, i) => { const n = a.length, s = a.reduce((q, v) => q + v, 0), w = a.filter(v => v > 0).length; return `<tr><td>${BN[i]}</td><td class="mono">${n}</td><td class="mono">${n ? Math.round(w / n * 100) : 0}%</td><td class="mono ${cls(n ? s / n : 0)}"><b>${n ? fR(s / n) : '—'}</b></td><td class="mono">${s >= 0 ? '+' : ''}${s.toFixed(1)}R</td></tr>`; }).join('');
    const last = T_.slice(-8).reverse().map(x => `<tr><td class="mono">${T.fmt(x[0]).slice(3)}</td><td><span class="pill ${x[2] === 1 ? 'up' : 'down'}">${x[2] === 1 ? 'MUA' : 'BÁN'}</span></td><td class="mono">${f2(x[4])}</td><td class="mono">${x[5].toFixed(1)}$</td><td class="mono">${T.fmt(x[1]).slice(3)}</td><td class="mono ${cls(x[3])}"><b>${fR(x[3])}</b></td></tr>`).join('');
    const mtf = X ? ['H4', 'H1', 'M15', 'M5'].filter(k => X[k]).map(k => `<tr><td><b>${k}</b></td><td class="mono">${X[k].n_trades_total.toLocaleString()}</td><td class="mono ${X[k].pct_positive >= 45 ? 'pos' : 'neg'}">${X[k].pct_positive}%</td><td class="mono ${cls(X[k].wf.oos_exp)}"><b>${fR(X[k].wf.oos_exp)}</b> (${X[k].wf.oos_n} lệnh)</td></tr>`).join('') : '';
    const yrs = P ? Object.entries(P.ys).map(([y, v]) => `<span class="pill ${v[1] > 0 ? 'up' : 'down'}">${y}: ${v[0]} lệnh, ${v[1] >= 0 ? '+' : ''}${v[1]}R</span>`).join(' ') : '';
    el.innerHTML = `
    <div class="grid g4">
      <div class="card kpi"><div class="l">Kết quả 2021–2026 (Exness, đã trừ phí)</div><div class="v pos">${P ? fR(P.exp) : '+0.46R'}</div><div class="l">mỗi lệnh · ${P ? P.n : 82} lệnh · thắng ${P ? P.wr : 58.5}%</div></div>
      <div class="card kpi"><div class="l">Trên các năm máy chưa thấy (walk-forward)</div><div class="v pos">${O ? fR(O.wf.oos_exp) : '+0.57R'}</div><div class="l">${O ? O.wf.oos_n : 109} lệnh, giống giao dịch thật</div></div>
      <div class="card kpi"><div class="l">Số lệnh</div><div class="v">~14/năm</div><div class="l">giữ trung bình ~5 ngày</div></div>
      <div class="card kpi"><div class="l">Rủi ro xấu nhất từng gặp</div><div class="v neg">−${P ? P.dd : 4.6}R</div><div class="l">thua liên tiếp tối đa ${P ? P.ms : 5} lệnh</div></div>
    </div>
    <div class="note ok" style="margin-top:14px;font-size:14px"><b>Tóm tắt trong 3 dòng.</b> ① Nhìn <b>D1</b> để biết chỉ MUA hay chỉ BÁN. ② Chờ <b>H4</b> hồi ngược lại đủ sâu (RSI H4). ③ Vào lệnh khi <b>H1</b> quay lại đúng hướng (RSI H1 cắt 50). SL = 1 × ATR D1, TP = 2 lần SL, giữ tối đa 7 ngày. Không dời SL, mỗi lúc chỉ 1 lệnh.</div>

    <h2>1. Phương pháp được chọn như thế nào</h2>
    <div class="card">
      <ol style="margin:0;padding-left:20px;line-height:1.7">
        <li><b>Dữ liệu thật của sàn bạn dùng:</b> toàn bộ tick XAUUSDm của Exness 01/2020 → 11/2026, gom thành ~487.000 nến M5, giữ <b>spread thật từng thời điểm</b>. Năm 2020 chỉ để khởi động chỉ báo.</li>
        <li><b>Không ăn gian:</b> khung lớn chỉ dùng nến đã đóng; vào lệnh ở giá đóng cửa nến tín hiệu; nếu một nến chạm cả SL và TP thì tính là thua; mỗi lệnh trừ spread thật + 0.05$ trượt giá + 0.5$/oz mỗi đêm swap.</li>
        <li><b>Thử mọi tổ hợp:</b> 3 cách xác định xu hướng × 5 mức hồi RSI × 3 cửa sổ × 3 tín hiệu vào (EMA9/21, MACD, RSI 50) × 6 kiểu SL × 5 kiểu thoát × 3 thời gian giữ × 2 bộ lọc = <b>24.300 bộ luật</b>, ~2,8 triệu lệnh mô phỏng.</li>
        <li><b>Walk-forward:</b> máy chọn bộ luật chỉ bằng các năm TRƯỚC rồi trade năm SAU mà nó chưa thấy (2023, 2024, 2025, 2026). Ghép lại: <b>${O ? fR(O.wf.oos_exp) : '+0.57R'}/lệnh</b> — cách chọn này vẫn có lãi trên dữ liệu mới.</li>
        <li><b>Chọn cái ổn định nhất, không phải cái lãi nhất:</b> phải có lãi ít nhất 4/6 năm, năm tệ nhất không lỗ quá −0.5R/lệnh. Bộ được chọn có lãi <b>cả 6/6 năm</b>; ${P ? P.neighbors_pos_pct : 95}% bộ "hàng xóm" (đổi đúng 1 tham số) cũng có lãi → không phụ thuộc may mắn.</li>
        <li><b>So với các khung khác:</b> cùng logic nhưng vào lệnh ở H4/H1/M15/M5 (thêm ~110 triệu lệnh mô phỏng). Khung càng nhỏ, phí và nhiễu càng ăn mất lợi nhuận:</li>
      </ol>
      ${mtf ? `<div class="tblwrap" style="margin-top:8px"><table class="tbl"><tr><th>Khung vào lệnh</th><th>Lệnh mô phỏng</th><th>% bộ luật có lãi</th><th>Walk-forward (năm chưa thấy)</th></tr>${mtf}<tr><td><b>H1 (phương pháp chính, lưới đầy đủ)</b></td><td class="mono">${O ? O.n_trades_total.toLocaleString() : ''}</td><td class="mono pos">${O ? O.pct_positive : ''}%</td><td class="mono pos"><b>${O ? fR(O.wf.oos_exp) : ''}</b> (${O ? O.wf.oos_n : ''} lệnh)</td></tr></table></div>` : ''}
      <p class="muted" style="font-size:12.5px;margin:8px 0 0">Kết quả từng năm của phương pháp được chọn: ${yrs}. Chi tiết ở trang <a href="#report">📊 Báo cáo backtest</a>. Máy tự train lại mỗi Chủ nhật trên dữ liệu mới nhất.</p>
    </div>

    <h2>2. Cài đặt trước khi giao dịch</h2>
    <div class="grid g2">
      <div class="card"><h4>📈 TradingView (xem chart)</h4><ul style="margin:0;padding-left:18px;line-height:1.7">
        <li>Mở mã <b>OANDA:XAUUSD</b> (hoặc mã XAUUSD của Exness nếu có).</li>
        <li><b>Khung D1:</b> thêm <b>EMA 50</b> và <b>ATR 14</b>.</li>
        <li><b>Khung H4:</b> thêm <b>EMA 21</b> và <b>RSI 14</b> — trong cài đặt RSI thêm đường mức <b>40 và 60</b>.</li>
        <li><b>Khung H1:</b> thêm <b>RSI 14</b> với đường mức <b>50</b>.</li>
        <li>Mẹo: dùng bố cục 3 chart (D1 · H4 · H1) để nhìn một lần thấy đủ 3 bước.</li></ul></div>
      <div class="card"><h4>💼 MT5 / Exness (vào lệnh)</h4><ul style="margin:0;padding-left:18px;line-height:1.7">
        <li>Vốn nhỏ (dưới ~1.000$): dùng tài khoản <b>Standard Cent</b> — lot 0.01 chạm SL chỉ mất ~${(88.7 * 0.01).toFixed(2)}$ (SL hiện ~89$).</li>
        <li>Tài khoản Standard: 0.01 lot = 1$ mỗi 1$ giá chạy → SL 89$ = mất 89$ / lệnh. Cần vốn ~8.900$ để rủi ro 1%.</li>
        <li>Tắt "One click trading" khi mới tập; luôn điền SL và TP ngay trong cửa sổ đặt lệnh.</li>
        <li>Kiểm tra mức swap: chuột phải mã vàng → <b>Specification</b>.</li></ul></div>
    </div>

    <h2>3. Luật vào lệnh — 3 bước (đọc từ khung lớn xuống khung nhỏ)</h2>
    <div class="grid g2">
      <div class="card" style="border-color:rgba(34,197,139,.5)"><h4 style="color:var(--up)">🔺 Lệnh MUA</h4><ol style="margin:0;padding-left:18px;line-height:1.8">
        <li><b>D1 — xu hướng:</b> nến D1 gần nhất ĐÃ ĐÓNG nằm <b>trên EMA50</b>, và EMA50 hôm nay <b>cao hơn</b> EMA50 của 5 ngày trước (đường EMA50 đi lên).</li>
        <li><b>H4 — nhịp hồi:</b> trong 24 nến H4 gần nhất (~4 ngày), RSI H4 đã có lúc <b>xuống dưới 40</b> → giá đã điều chỉnh đủ sâu, không mua đỉnh.</li>
        <li><b>H1 — điểm vào:</b> nến H4 gần nhất đóng <b>trên EMA21 H4</b>, VÀ một nến H1 vừa đóng với <b>RSI H1 cắt từ dưới lên trên 50</b> → bấm MUA.</li></ol></div>
      <div class="card" style="border-color:rgba(240,80,110,.5)"><h4 style="color:var(--down)">🔻 Lệnh BÁN</h4><ol style="margin:0;padding-left:18px;line-height:1.8">
        <li><b>D1 — xu hướng:</b> nến D1 gần nhất ĐÃ ĐÓNG nằm <b>dưới EMA50</b>, và EMA50 hôm nay <b>thấp hơn</b> EMA50 của 5 ngày trước.</li>
        <li><b>H4 — nhịp hồi:</b> trong 24 nến H4 gần nhất, RSI H4 đã có lúc <b>lên trên 60</b> → giá đã hồi lên đủ, không bán đáy.</li>
        <li><b>H1 — điểm vào:</b> nến H4 gần nhất đóng <b>dưới EMA21 H4</b>, VÀ một nến H1 vừa đóng với <b>RSI H1 cắt từ trên xuống dưới 50</b> → bấm BÁN.</li></ol></div>
    </div>
    <div class="note" style="font-size:13px">Không thỏa bước ① → không giao dịch (kể cả khi chart "trông rất đẹp"). Thiếu bước nào thì chờ, không đoán trước. Trang <a href="#live">🕐 Nhận định theo giờ</a> tự kiểm tra cả 3 bước mỗi giờ và ghi rõ đang ở bước nào.</div>

    <h2>4. Đặt lệnh trên MT5 (ví dụ có số)</h2>
    <div class="card"><ol style="margin:0;padding-left:20px;line-height:1.8">
      <li>Đọc <b>ATR 14 trên D1</b> ở nến đã đóng gần nhất — VD <b>77.15$</b>. Đây là khoảng cách SL.</li>
      <li>Bấm lệnh <b>Market</b> theo hướng tín hiệu. VD BÁN, khớp ở <b>4079.21</b>.</li>
      <li><b>SL</b> = giá vào ± 1 × ATR → BÁN: 4079.21 + 77.15 = <b>4156.36</b> (MUA thì trừ).</li>
      <li><b>TP</b> = giá vào ∓ 2 × ATR → BÁN: 4079.21 − 154.30 = <b>3924.91</b> (MUA thì cộng).</li>
      <li><b>Lot:</b> Cent 0.01 lot → chạm SL mất ≈ ATR × 0.01 = 0.77$; Standard 0.01 lot → mất ≈ 77$. Chọn lot sao cho mất ≤ 1–2% vốn (ô tính lot có sẵn ở trang <a href="#plan">📅 Plan</a>).</li>
      <li>Kết quả lệnh ví dụ (10/11/2026): giá chạm TP ngày 12/11 → <b>+2R</b> (sau phí +1.98R).</li>
      <li>Không cần vội: vào trễ 1–4 giờ sau tín hiệu (giữ nguyên SL/TP) cho kết quả bằng hoặc tốt hơn — xem mục 5 và 6.</li></ol>
      <p class="muted" style="font-size:12.5px;margin:8px 0 0">Giá trên web là PAXG (≈ XAUUSD, lệch vài $). Khi vào lệnh, dùng <b>khoảng cách</b> SL/TP (bằng $) cộng/trừ vào giá khớp thật trên MT5 của bạn.</p></div>

    ${this.ltf()}

    <h2>5b. Quản lý lệnh</h2>
    <div class="grid g2">
      <div class="card"><h4>✅ Làm</h4><ul style="margin:0;padding-left:18px;line-height:1.7">
        <li>Đặt SL/TP ngay khi vào, rồi để thị trường làm việc.</li>
        <li>Sau <b>7 ngày</b> chưa chạm SL/TP → đóng lệnh ở giá thị trường.</li>
        <li>Mỗi lúc chỉ <b>1 lệnh</b>. Đang có lệnh thì bỏ qua tín hiệu mới.</li>
        <li>Ghi lại mọi lệnh ở <a href="#journal">📒 Nhật ký</a>, kể cả lệnh bỏ lỡ.</li></ul></div>
      <div class="card"><h4>⛔ Không làm</h4><ul style="margin:0;padding-left:18px;line-height:1.7">
        <li>Không dời SL xa hơn, không bỏ SL, không chốt non vì sợ.</li>
        <li>Không nhồi lệnh, không tăng lot sau khi thua để "gỡ".</li>
        <li>Không vào lệnh khi D1 không có xu hướng hoặc chưa đủ 3 bước.</li>
        <li>Không tăng vốn trước khi có ≥ 20–30 lệnh thật đúng luật.</li></ul></div>
    </div>

    <h2>6. Đánh vào thời gian nào?</h2>
    <div class="card">
      <p style="margin:0 0 8px">Tín hiệu xuất hiện khi <b>một nến H1 đóng cửa</b> (xx:00 giờ VN), có thể ở bất kỳ giờ nào. Số liệu 2021–2026 của chính phương pháp này:</p>
      <div class="grid g2">
        <div><table class="tbl"><tr><th>Giờ vào lệnh (VN)</th><th>Lệnh</th><th>Thắng</th><th>TB/lệnh</th><th>Tổng</th></tr>${sess}</table>
          <p class="muted" style="font-size:12px;margin:6px 0 0">Tín hiệu phiên Á tốt nhất, phiên London kém nhất — nhưng mỗi nhóm chỉ 11–34 lệnh nên <b>chưa đủ để bỏ giờ nào</b>. Luật gốc (đã kiểm tra walk-forward) vẫn là vào mọi giờ.</p></div>
        <div><table class="tbl"><tr><th>Vào trễ so với tín hiệu</th><th>Kết quả TB</th></tr>
          <tr><td>Vào ngay khi nến H1 đóng</td><td class="mono pos">+0.47R</td></tr><tr><td>Trễ 1 giờ</td><td class="mono pos">+0.51R</td></tr><tr><td>Trễ 2 giờ</td><td class="mono pos">+0.50R</td></tr><tr><td>Trễ 4 giờ</td><td class="mono pos">+0.53R</td></tr><tr><td>Trễ 8 giờ (3/82 lệnh đã chạm SL/TP trước → bỏ)</td><td class="mono pos">+0.55R</td></tr></table>
          <p class="muted" style="font-size:12px;margin:6px 0 0">Giữ nguyên mức SL/TP của tín hiệu, chỉ vào trễ. Kiểm tra trên 82 lệnh Exness 2021–2026 (20/11/2026).</p></div>
      </div>
      <div class="note ok" style="margin-top:10px;font-size:13.5px"><b>Lịch kiểm tra đề xuất (giờ VN):</b> <b>7:30 · 12:00 · 17:30 · 21:30</b> — mỗi lần 2 phút mở trang <a href="#live">🕐 Nhận định theo giờ</a>. Vì vào trễ tới 8 giờ không làm kết quả xấu đi, bạn <b>không cần thức đêm canh tín hiệu</b>. Nếu tín hiệu ra lúc bạn ngủ: sáng dậy vẫn vào được với đúng SL/TP đó, miễn giá chưa chạm SL hoặc TP.</div>
      <div class="note warn" style="font-size:13.5px"><b>Tin đỏ USD</b> (CPI, Non-Farm, FOMC… thường 19:30/20:30 hoặc 1:00–2:00 sáng giờ VN): nếu tín hiệu rơi vào 30 phút trước/sau tin, <b>đợi nến H1 chứa tin đóng xong rồi mới vào</b> — vào trễ không làm hại kết quả, còn tránh được trượt giá lớn. Trang nhận định theo giờ tự liệt kê tin đỏ sắp tới. Cuối tuần thị trường đóng cửa (sáng Thứ 7 → sáng Thứ 2 giờ VN).</div>
    </div>

    <h2>7. Kỳ vọng thực tế với vốn nhỏ</h2>
    <div class="card"><ul style="margin:0;padding-left:18px;line-height:1.7">
      <li>Khoảng <b>14 lệnh/năm</b> (có tháng không có lệnh nào — bình thường). Thắng ~6/10 lệnh; thắng +2R, thua −1R.</li>
      <li>Tài khoản Cent 57$, 0.01 lot, SL ~89$: mỗi lệnh thua ≈ −0.89$, thắng ≈ +1.77$; cả năm kỳ vọng khoảng +5–6$ (+10%). Mục tiêu năm đầu là <b>chứng minh bạn làm đúng luật</b>, không phải kiếm nhiều tiền.</li>
      <li>Sẽ có chuỗi thua 4–5 lệnh liên tiếp và có năm chỉ hơi dương (2023: +1.8R). Bỏ cuộc giữa chuỗi thua là cách chắc chắn nhất để thua.</li>
      <li>Lợi nhuận tương lai nhiều khả năng <b>thấp hơn</b> backtest. Không phải khuyến nghị đầu tư.</li></ul></div>

    <h2>8. Phương pháp dự phòng H4 & công cụ ICT</h2>
    <div class="grid g2">
      <div class="card"><h4>Dự phòng H4 (walk-forward +0.24R)</h4><p style="margin:0;font-size:13.5px;line-height:1.7">D1 như bước ① → RSI H4 xuống dưới 45 (MUA) / lên trên 55 (BÁN) trong 12 nến H4 → <b>EMA9 cắt EMA21 trên H4</b> → vào khi nến H4 đóng. SL dưới đáy (trên đỉnh) 12 nến H4 ± 0.3 ATR H4, TP 2R, tối đa 7 ngày. Ít tín hiệu nhiễu hơn nhưng lợi thế yếu hơn — chỉ dùng khi bạn không thể xem chart trong ngày. Không chạy song song với phương pháp chính (vẫn 1 lệnh/lúc).</p></div>
      <div class="card"><h4>FVG · BOS/MSS · CRT</h4><p style="margin:0;font-size:13.5px;line-height:1.7">Được vẽ tự động trên chart Plan và Backtest Lab để bạn hiểu cấu trúc giá. Chúng <b>chưa phải luật đã kiểm chứng</b> — các mô hình ICT thuần trên M5/M15 đã thử (~31.000 lệnh) đều không có lãi sau phí. Dùng chúng để <b>xác nhận thêm</b>: khi phương pháp báo "sẵn sàng", tín hiệu cùng hướng với MSS/BOS gần nhất và đang ở trong FVG cùng hướng là bối cảnh tốt hơn.</p></div>
    </div>

    <h2>9. 8 lệnh gần nhất của phương pháp (dữ liệu Exness)</h2>
    <div class="tblwrap"><table class="tbl"><tr><th>Vào lúc (VN)</th><th>Lệnh</th><th>Giá vào</th><th>SL cách</th><th>Đóng lúc</th><th>Kết quả</th></tr>${last}</table></div>`;
  },
};
