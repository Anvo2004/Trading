/* ICT Gold Lab — Báo cáo backtest nhiều chiến lược (dữ liệu tạo bởi backtest/run.py) */
'use strict';
const Report = {
  sort: 'exp', grp: 'all',
  render() {
    const B = window.BT, el = $('#rpOut'); if (!el) return;
    if (!B) { el.innerHTML = '<div class="note bad">Chưa có dữ liệu báo cáo.</div>'; return; }
    const R = B.rows.filter(r => this.grp === 'all' || r.group === this.grp).slice().sort((a, b) => (b[this.sort] ?? -9) - (a[this.sort] ?? -9));
    const tot = B.rows.reduce((s, r) => s + r.n, 0), sc = B.rows.filter(r => r.group === 'scalp'), sw = B.rows.filter(r => r.group === 'swing');
    const pos = a => a.filter(r => r.exp > 0 && r.n >= 30).length;
    const best = sw.slice().sort((a, b) => b.exp - a.exp)[0];
    const cls = v => v > 0.05 ? 'pos' : v < -0.05 ? 'neg' : '';
    const yrs = best ? Object.entries(best.years) : [];
    el.innerHTML = `
      <div class="grid g4">
        <div class="card kpi"><div class="v">${tot.toLocaleString()}</div><div class="l">lệnh mô phỏng (mỗi lượt), ${B.rows.length} cấu hình</div></div>
        <div class="card kpi"><div class="v">${B.days.toLocaleString()}</div><div class="l">ngày giao dịch · ${B.from} → ${B.to.slice(0, 10)}</div></div>
        <div class="card kpi"><div class="v neg">${pos(sc)}/${sc.length}</div><div class="l">cấu hình SCALP có kỳ vọng dương (≥ 30 lệnh)</div></div>
        <div class="card kpi"><div class="v pos">${pos(sw)}/${sw.length}</div><div class="l">cấu hình SWING có kỳ vọng dương</div></div>
      </div>
      <div class="note warn" style="margin-top:14px"><b>Kết luận chính.</b> Sau khi trừ phí ${B.cost}$/lệnh (spread + trượt giá MT5), <b>không có chiến lược scalp nào có lãi ổn định</b> trong 6 năm — kể cả khi hạ phí xuống 0.15$ (cột "Kỳ vọng phí thấp"). Chiến lược <b>swing thuận xu hướng D1</b> là nhóm duy nhất có kỳ vọng dương, chủ yếu nhờ các năm có xu hướng mạnh (2022, 2024–2026), và vẫn có năm thua (2023).</div>
      ${best ? `<div class="card" style="margin-top:14px"><h4>Cấu hình tốt nhất: ${esc(best.name)}</h4>
        <div class="row mono" style="gap:14px;font-size:13px"><span>${best.n} lệnh</span><span>thắng ${best.wr}%</span><span class="pos">${fR(best.exp)}/lệnh</span><span>PF ${best.pf}</span><span>sụt giảm tối đa ${best.dd}R</span><span>thua liên tiếp tối đa ${best.ms}</span><span>Mua ${fR(best.long)} · Bán ${fR(best.short)}</span></div>
        <div class="row" style="gap:6px;margin-top:10px">${yrs.map(([y, v]) => `<span class="pill ${v > 0 ? 'up' : 'down'}">${y}: ${fR(v)}</span>`).join('')}</div>
        <p class="muted" style="font-size:12.5px;margin:8px 0 0">Kỳ vọng +${best.exp}R/lệnh nghĩa là rủi ro 1% mỗi lệnh → trung bình +${(best.exp).toFixed(2)}%/lệnh, khoảng ${Math.round(best.n / 6)} lệnh/năm. Sụt giảm ${best.dd}R = −${best.dd}% tài khoản nếu rủi ro 1% → nên dùng 0.5%.</p></div>` : ''}
      <div class="row" style="margin:16px 0 8px">
        <select onchange="Report.grp=this.value;Report.render()" style="width:auto"><option value="all">Tất cả</option><option value="scalp">Chỉ scalp (giữ vài giờ)</option><option value="swing">Chỉ swing (giữ 3–5 ngày)</option></select>
        <select onchange="Report.sort=this.value;Report.render()" style="width:auto"><option value="exp">Sắp theo kỳ vọng</option><option value="oos">Theo kỳ vọng 2024–2026</option><option value="pf">Theo Profit factor</option><option value="n">Theo số lệnh</option></select>
      </div>
      <div class="tblwrap" style="max-height:640px"><table class="tbl"><tr><th>Chiến lược</th><th>Loại</th><th>Lệnh</th><th>Thắng</th><th>Kỳ vọng</th><th>Kỳ vọng phí thấp</th><th>PF</th><th>Sụt giảm</th><th>2021–23</th><th>2024–26</th><th>Mua</th><th>Bán</th></tr>
      ${R.map(r => `<tr><td style="max-width:420px">${esc(r.name)}</td><td>${r.group === 'scalp' ? 'Scalp' : 'Swing'}</td><td class="mono">${r.n}</td><td class="mono">${r.wr}%</td><td class="mono ${cls(r.exp)}"><b>${fR(r.exp)}</b></td><td class="mono ${cls(r.exp015)}">${r.exp015 != null ? fR(r.exp015) : '—'}</td><td class="mono">${r.pf}</td><td class="mono">${r.dd}R</td><td class="mono ${cls(r.is)}">${fR(r.is)}</td><td class="mono ${cls(r.oos)}">${fR(r.oos)}</td><td class="mono ${cls(r.long)}">${fR(r.long)}</td><td class="mono ${cls(r.short)}">${fR(r.short)}</td></tr>`).join('')}</table></div>
      <p class="muted" style="font-size:12.5px">Kỳ vọng = R trung bình mỗi lệnh sau phí (1R = khoảng cách SL). PF = tổng lãi / tổng lỗ. "2021–23" là giai đoạn kiểm tra trong mẫu, "2024–26" là ngoài mẫu: một chiến lược tốt phải dương ở CẢ HAI.</p>`;
  },
};
