// =====================================================================
// NỘI DUNG KHÓA HỌC — tổng hợp từ ICT_Gold_Playbook/01_Tong_hop_ICT.md,
// 02_Playbook_XAUUSD.md và thư mục Documents/Trade For Beginer
// =====================================================================
const D = '../Documents/Trade For Beginer/';
const G = '../ICT_Gold_Playbook/';

window.CHAPTERS = [
{
  id: 1, icon: '📐', title: 'Nến & Cấu trúc thị trường',
  sub: 'HH/HL, LH/LL, BOS, MSS — đọc xu hướng trước khi làm gì khác',
  goals: ['Đọc được xu hướng trên D1/H4 bằng đỉnh/đáy', 'Phân biệt BOS (tiếp diễn) và MSS (đảo chiều)', 'Biết vì sao "phá cấu trúc chưa phải điểm vào lệnh"'],
  html: `
  <h3>1. Xu hướng = chuỗi đỉnh và đáy</h3>
  <ul>
    <li><b>Xu hướng tăng:</b> đỉnh cao hơn (<b>HH</b>) + đáy cao hơn (<b>HL</b>).</li>
    <li><b>Xu hướng giảm:</b> đỉnh thấp hơn (<b>LH</b>) + đáy thấp hơn (<b>LL</b>).</li>
    <li>Chỉ tính đỉnh/đáy "rõ ràng" (swing), tức có ít nhất 2 nến thấp hơn/cao hơn ở mỗi bên.</li>
  </ul>
  <h3>2. BOS và MSS</h3>
  <table class="tbl"><tr><th></th><th>BOS — Break of Structure</th><th>MSS / CHoCH — Market Structure Shift</th></tr>
  <tr><td>Hướng phá</td><td>Cùng xu hướng</td><td><b>Ngược</b> xu hướng ngắn hạn</td></tr>
  <tr><td>Ý nghĩa</td><td>Xu hướng tiếp diễn</td><td>Tín hiệu đảo chiều ở khung nhỏ</td></tr>
  <tr><td>Điều kiện tốt</td><td>Nến đóng cửa qua đỉnh/đáy</td><td>Nến <b>thân lớn</b> đóng cửa qua đỉnh/đáy, thường để lại FVG</td></tr></table>
  <div class="note warn">HLZ nhấn mạnh: <b>phá cấu trúc chưa phải là điểm vào lệnh</b>. Đó chỉ là tín hiệu sớm. Điểm vào là khi giá <b>hồi lại</b> vùng FVG/OB do nhịp phá để lại.</div>
  <h3>3. Đa khung thời gian (HTF → LTF)</h3>
  <p>D1/H4 cho <b>bias</b> (hướng ưu tiên) → H1/M15 vẽ <b>bản đồ thanh khoản</b> → M5/M1 tìm <b>trigger</b>. Không bao giờ vào lệnh M5 mà chưa biết D1 đang làm gì.</p>
  <h3>4. Râu nến kể chuyện gì?</h3>
  <p>Râu dài vượt qua một đỉnh/đáy rồi đóng cửa quay lại là dấu hiệu <b>quét</b> (chương 2). Thân dài, đóng cửa gần đỉnh/đáy nến là dấu hiệu <b>displacement</b> (chương 3).</p>`,
  res: [
    { t: 'Cẩm nang Price Action', p: D + 'Cẩm nang Price Action.pdf', k: 'pdf' },
    { t: 'The Power of Japanese Candlestick Charts', p: D + '1_the_power_of_japanese_candlestick_charts_advanced_filtering_techniques.pdf', k: 'pdf' },
    { t: 'Video: Market Structure Shift là gì mà winrate cao đến vậy', p: D + 'Market_Structure_Shift_là_gì_mà_winrate_cao_đến_vậy.mp4', k: 'video' },
    { t: 'Ảnh: HTF-LTF', p: D + 'HTF-LTF.jpeg', k: 'img' },
  ],
  tasks: [
    'Trong Lab, chọn khung D1, đánh dấu 3 đỉnh và 3 đáy gần nhất. Viết ra xu hướng.',
    'Chuyển sang H4, tìm 1 BOS và 1 MSS. Chụp ảnh lại.',
    'Chạy replay M5 qua 1 ngày, mỗi lần thấy MSS hãy dừng lại và ghi: "MSS tăng/giảm tại giá ___".',
  ],
},
{
  id: 2, icon: '💧', title: 'Thanh khoản (Liquidity)',
  sub: 'BSL, SSL, PDH/PDL, range phiên Á — "nếu bạn không thấy thanh khoản, bạn chính là thanh khoản"',
  goals: ['Đánh dấu đúng các mức thanh khoản mỗi ngày', 'Nhận biết cú quét (sweep) khác phá vỡ thật', 'Hiểu "SL của bạn là entry của big boys"'],
  html: `
  <h3>1. Ý tưởng cốt lõi</h3>
  <div class="note">Giá di chuyển <b>từ vùng thanh khoản này sang vùng thanh khoản khác</b>. Trước khi chạy thật, giá thường "lừa" một nhịp để quét stop-loss của đám đông, rồi mới dịch chuyển mạnh về mục tiêu thật.</div>
  <h3>2. Hai loại thanh khoản</h3>
  <ul>
    <li><b>BSL (Buy-side liquidity):</b> stop của phe bán nằm <b>trên</b> đỉnh cũ, đỉnh bằng nhau.</li>
    <li><b>SSL (Sell-side liquidity):</b> stop của phe mua nằm <b>dưới</b> đáy cũ, đáy bằng nhau.</li>
  </ul>
  <h3>3. Mức cần đánh dấu mỗi ngày</h3>
  <table class="tbl"><tr><th>Mức</th><th>Giờ VN (mùa đông)</th></tr>
  <tr><td>PDH / PDL — đỉnh/đáy ngày hôm trước</td><td>—</td></tr>
  <tr><td>Đỉnh / đáy phiên Á</td><td>08:00 – 12:00</td></tr>
  <tr><td>Đỉnh / đáy London</td><td>14:00 – 19:00</td></tr>
  <tr><td>Đỉnh/đáy tuần trước, đỉnh/đáy bằng nhau rõ ràng trên H1</td><td>—</td></tr></table>
  <h3>4. Sweep (quét) ≠ entry</h3>
  <p>Sweep là khi giá xuyên qua mức đó bằng râu hoặc vài nến rồi quay lại. Tài liệu Quản trị rủi ro: <i>"Một liquidity sweep không phải entry"</i>. Cần thêm <b>displacement + MSS</b> (chương 3, 6).</p>
  <h3>5. Vì sao giá cần thanh khoản?</h3>
  <p>Tổ chức lớn cần khối lượng đối ứng để khớp lệnh lớn. Stop-loss của phe mua (lệnh bán) nằm dưới đáy là nguồn đối ứng hoàn hảo cho lệnh <b>mua</b> lớn. Vì vậy cú quét đáy thường đi trước một nhịp tăng.</p>
  <p class="muted">HLZ và Bẫy giá (Ray Wang) mô tả cùng hiện tượng dưới tên "bẫy giá", "Quasimodo / Over-Under".</p>`,
  res: [
    { t: 'Video: Nếu bạn ko nhìn thấy thanh khoản, BẠN CHÍNH LÀ THANH KHOẢN', p: D + '1_Nếu_bạn_ko_nhìn_thấy_thanh_khoản,_BẠN_CHÍNH_LÀ_THANH.mp4', k: 'video' },
    { t: "Video: Your SL is big boys' entry", p: D + "3. Your SL is big boys' entry.mp4", k: 'video' },
    { t: 'Video: Giá luôn chạy tới nguồn thanh khoản dồi dào nhất', p: D + '4_giá_luôn_chạy_tới_nguồn_thanh_khoản_dồi_dào_nhất.mp4', k: 'video' },
    { t: 'Bẫy Giá - Market trap (Ray Wang)', p: D + 'Bẫy Giá - Market trap - Ray Wang.pdf', k: 'pdf' },
    { t: 'High Liquidity Zone (VN)', p: D + 'High.Liquidity.Zone_VN.pdf', k: 'pdf' },
  ],
  tasks: [
    'Trong Lab bật "Mức thanh khoản". Replay 5 ngày, mỗi ngày ghi lại mức nào bị quét trước (Á / London / PDH / PDL).',
    'Đếm: trong 5 ngày đó, bao nhiêu lần cú quét đi kèm đảo chiều ≥ 2 lần biên độ quét?',
    'Trên TradingView thật, kẻ PDH, PDL, đỉnh/đáy Á cho hôm nay và đặt cảnh báo giá.',
  ],
},
{
  id: 3, icon: '🧱', title: 'Displacement & PD Arrays',
  sub: 'FVG, Order Block, IFVG, Breaker — vùng giá để vào lệnh',
  goals: ['Vẽ đúng FVG theo mẫu 3 nến', 'Xác định Order Block hợp lệ', 'Hiểu IFVG và quy tắc "chỉ dùng lần chạm đầu tiên"'],
  html: `
  <h3>1. Displacement</h3>
  <p>Nhịp di chuyển mạnh, nến thân dài, đi một mạch, thường để lại FVG. Đây là "dấu chân" của dòng tiền lớn và là bằng chứng thị trường thật sự đổi hướng.</p>
  <h3>2. Các PD Array</h3>
  <table class="tbl"><tr><th>Vùng</th><th>Định nghĩa</th><th>Cách dùng</th></tr>
  <tr><td><b>FVG</b> (Fair Value Gap)</td><td>Mẫu 3 nến: khoảng trống giữa râu nến 1 và râu nến 3; nến 2 là nến displacement. FVG tăng: <code>Low[3] &gt; High[1]</code></td><td>Limit ở mép FVG hoặc điểm giữa <b>CE (50%)</b></td></tr>
  <tr><td><b>Order Block</b></td><td>Cây nến ngược màu cuối cùng trước nhịp displacement</td><td>Giá hồi về OB thì vào, SL ngoài OB</td></tr>
  <tr><td><b>IFVG</b></td><td>FVG bị giá đóng cửa xuyên qua và đổi vai trò (hỗ trợ ↔ kháng cự)</td><td>Rất hay gặp ở vàng sau cú quét</td></tr>
  <tr><td><b>Breaker</b></td><td>OB bị phá, đổi vai trò</td><td>Giống "Flippy" của HLZ</td></tr></table>
  <h3>3. Đối chiếu HLZ ↔ ICT</h3>
  <ul>
    <li>Base / SGB ≈ <b>Order Block</b> · SDE ≈ <b>MSS bằng displacement</b></li>
    <li>Flippy ≈ Breaker / vùng nhiễu → <b>không trade trong vùng Flippy</b></li>
    <li>FTB (giá hồi lần đầu) ≈ ICT chỉ dùng OB/FVG <b>lần chạm đầu tiên</b>. Sau FTB không trade lại vùng đó.</li>
    <li>Quasimodo ≈ <b>Sweep đỉnh rồi MSS</b> — mô hình vào lệnh chính (chương 6)</li>
  </ul>
  <div class="note">Lab có nút <b>"FVG"</b> tự đánh dấu FVG trên khung đang xem. Dùng nó để kiểm tra mắt mình, đừng phụ thuộc vào nó.</div>`,
  res: [
    { t: 'Video: 1. Order Block', p: D + '1. Order Block.mp4', k: 'video' },
    { t: 'Video: 2. 99% người dùng OB không biết điều này', p: D + '2. 99% ng dùng ob k biết đến điều này.mp4', k: 'video' },
    { t: 'Video: 3. Fair Value Gap', p: D + '3. Fair Value Gap.mp4', k: 'video' },
    { t: 'Video: FVG ĐẢO NGƯỢC là gì mà WINRATE CAO NHƯ VẬY', p: D + '4_FVG_ĐẢO_NGƯỢC_là_gì_mà_WINRATE_CAO_NHƯ_VẬY.mp4', k: 'video' },
    { t: 'High Liquidity Zone (VN)', p: D + 'High.Liquidity.Zone_VN.pdf', k: 'pdf' },
  ],
  tasks: [
    'Replay M5, tắt nút FVG. Tự tìm 10 FVG, sau đó bật nút FVG để chấm điểm mắt mình.',
    'Với mỗi FVG, ghi lại: giá có quay về CE (50%) không? Lần chạm đầu có phản ứng không?',
    'Tìm 3 Order Block trước nhịp displacement trên M15.',
  ],
},
{
  id: 4, icon: '📏', title: 'Premium / Discount & OTE',
  sub: 'Fibo 0.5 – 0.618 – 0.786: mua rẻ, bán đắt',
  goals: ['Kéo Fibo đúng chiều', 'Phân biệt Premium/Discount', 'Biết vùng OTE và khi nào nó có giá trị'],
  html: `
  <h3>1. Premium / Discount</h3>
  <p>Kéo Fibo từ đáy đến đỉnh của nhịp vừa tạo. <b>Trên 50%</b> là Premium (đắt, ưu tiên bán), <b>dưới 50%</b> là Discount (rẻ, ưu tiên mua).</p>
  <h3>2. OTE — Optimal Trade Entry</h3>
  <p>Chỉ bật 3 mức <b>0.5, 0.618, 0.786</b>. Chờ giá vào vùng này <b>và có phản ứng</b> (theo ảnh "Cách sử dụng Fibo").</p>
  <div class="note">Lệnh mua đẹp nhất: FVG/OB nằm <b>trong Discount</b> và trùng vùng OTE. Lệnh bán đẹp nhất: FVG/OB trong Premium, trùng OTE.</div>
  <h3>3. Midnight Open</h3>
  <p>Giá mở cửa lúc 00:00 New York (<b>12:00 VN mùa đông</b>) là mức tham chiếu trong ngày: trên mức này là Premium, dưới là Discount của ngày.</p>
  <h3>4. Lỗi thường gặp</h3>
  <ul><li>Kéo Fibo trên nhịp quá nhỏ (nhiễu).</li><li>Mua ở Premium ngược bias D1 → nằm trong danh sách "KHÔNG vào lệnh".</li><li>Thấy giá chạm 0.618 là vào ngay, không chờ MSS khung nhỏ.</li></ul>`,
  res: [
    { t: 'Ảnh: Cách sử dụng Fibo', p: D + 'Cách sử dụng Fibo.png', k: 'img' },
    { t: 'Video: Giá luôn làm điều này trước khi phân phối 1 xu hướng', p: D + '2_Giá_luôn_làm_điều_này_trước_khi_phân_phối_1_xu_hướng.mp4', k: 'video' },
  ],
  tasks: [
    'Trên TradingView, kéo Fibo nhịp London gần nhất. Ghi lại phiên NY có hồi về 0.5–0.786 không.',
    'Lặp lại cho 10 ngày (dùng Bar Replay). Đếm số ngày có phản ứng trong OTE.',
  ],
},
{
  id: 5, icon: '⏰', title: 'Thời gian: Phiên, Killzone, IPDA, CRT',
  sub: 'Trade đúng giờ quan trọng ngang trade đúng giá',
  goals: ['Thuộc giờ killzone theo giờ VN cả 2 mùa', 'Hiểu chu kỳ Power of 3 (AMD) trong ngày', 'Biết mô hình CRT nến H4/D1'],
  html: `
  <h3>1. Giờ giao dịch (giờ VN)</h3>
  <table class="tbl"><tr><th>Phiên / mốc</th><th>Giờ NY</th><th>VN mùa đông</th><th>VN mùa hè</th></tr>
  <tr><td>Range phiên Á — <i>không trade, chỉ đánh dấu</i></td><td>20:00–00:00</td><td><b>08:00–12:00</b></td><td>07:00–11:00</td></tr>
  <tr><td>Midnight Open</td><td>00:00</td><td>12:00</td><td>11:00</td></tr>
  <tr><td><b>London Killzone</b></td><td>02:00–05:00</td><td><b>14:00–17:00</b></td><td>13:00–16:00</td></tr>
  <tr><td><b>NY AM Killzone</b></td><td>07:00–10:00</td><td><b>19:00–22:00</b></td><td>18:00–21:00</td></tr>
  <tr><td>Tin Mỹ (CPI, NFP…)</td><td>08:30</td><td>20:30</td><td>19:30</td></tr>
  <tr><td>Silver Bullet NY</td><td>10:00–11:00</td><td>22:00–23:00</td><td>21:00–22:00</td></tr>
  <tr><td>London close — <i>không mở lệnh mới</i></td><td>10:00–12:00</td><td>22:00–00:00</td><td>21:00–23:00</td></tr></table>
  <p class="muted">Mùa đông: đầu tháng 11 → giữa tháng 3. MT4/MT5 thường dùng giờ server GMT+2/+3 → giờ VN = server + 5 (đông) / + 4 (hè).</p>
  <h3>2. IPDA / Power of 3 (AMD)</h3>
  <pre class="flow">Tích lũy (Á) → Thao túng / Judas Swing (đầu London) → Mở rộng (London)
→ Tích lũy giữa giờ → Hồi (8:00–8:30 NY) → Đảo chiều hoặc Mở rộng (phiên Mỹ)
→ Đảo chiều (10–11h NY, London close) → Tích lũy cuối ngày</pre>
  <ul><li><b>Judas Swing:</b> cú chạy giả quét một phía range Á, thường kèm tin.</li><li><b>Phiên Mỹ:</b> hoặc tiếp diễn hướng London sau nhịp hồi, hoặc đảo chiều sau khi quét đỉnh/đáy London.</li></ul>
  <h3>3. CRT — Candle Range Theory</h3>
  <ol><li>Lấy nến khung lớn (D1/H4): đỉnh = CRTH, đáy = CRTL.</li><li>Nến tiếp theo quét qua CRTH/CRTL rồi <b>đóng cửa quay lại trong range</b> (Turtle Soup).</li><li>Xuống khung nhỏ chờ phá cấu trúc ngược lại → vào lệnh.</li><li>Mục tiêu: 50% range, sau đó phía đối diện.</li></ol>`,
  res: [
    { t: 'ICT IPDA Market Cycle (bản dịch tiếng Việt)', p: D + 'ICT_IPDA_Market_Cycle_Ban_Dich_Tieng_Viet.pdf', k: 'pdf' },
    { t: 'ICT IPDA Market Cycle (bản gốc)', p: D + 'ict_ipda_market_cycle_thread_by_liq_sniper_jan_18,_2024_from_rattibha.pdf', k: 'pdf' },
    { t: 'Ảnh: HTF-LTF (CRT)', p: D + 'HTF-LTF.jpeg', k: 'img' },
    { t: 'Video: 99% Traders KHÔNG BIẾT tin ra rồi vẫn có thể trade', p: D + '99%_Traders_KO_BIẾT_TIN_RA_RỒI_VẪN_CÓ_THỂ_TRADE.mp4', k: 'video' },
  ],
  tasks: [
    'Bật "Killzone" trong Lab. Replay 5 ngày và ghi lại: cú quét lớn nhất trong ngày rơi vào killzone nào?',
    'Mở trang Công cụ → kiểm tra giờ killzone hôm nay theo mùa hiện tại.',
    'Tìm 2 ví dụ CRT trên H4: nến quét đỉnh/đáy nến trước rồi đóng cửa vào lại range.',
  ],
},
{
  id: 6, icon: '🎯', title: 'Mô hình vào lệnh A · B · C',
  sub: 'Quét → MSS → FVG, Tiếp diễn OTE, CRT H4 + bộ lọc "KHÔNG vào"',
  goals: ['Thuộc 8 bước Mô hình A', 'Biết khi nào dùng Mô hình B', 'Thuộc danh sách lý do KHÔNG vào lệnh'],
  html: `
  <h3>Mô hình A: "Quét → MSS → FVG" (chính)</h3>
  <ol>
    <li><b>Bias D1/H4 tăng</b> (hoặc giá ở Discount về vùng hỗ trợ H4).</li>
    <li><b>Trong killzone</b>, giá quét xuống dưới một đáy thanh khoản: đáy London, đáy Á, PDL, đáy bằng nhau H1.</li>
    <li>M5 xuất hiện <b>displacement tăng</b>: 1–3 nến thân dài đóng cửa trên đỉnh gần nhất → <b>MSS</b>.</li>
    <li>Nhịp displacement để lại <b>FVG</b> (hoặc OB).</li>
    <li><b>Buy Limit</b> tại mép trên FVG hoặc CE. Không đuổi giá.</li>
    <li><b>SL</b> dưới râu quét + <b>1–1.5$ đệm</b>.</li>
    <li><b>TP1</b> đỉnh thanh khoản gần nhất (≥ 2R). <b>TP2</b> PDH hoặc FVG H1 đối diện.</li>
    <li><b>Hủy lệnh chờ</b> nếu giá chạm TP1 trước khi khớp, hoặc qua 22:00 chưa khớp.</li>
  </ol>
  <pre class="flow">                                         TP1 (đỉnh London)
        ┌─┐                                ↑
 ───────┤ ├──── đỉnh nhỏ ────────── MSS ──┼──────
        │ │  ┌┐                  ┌──┐      │
        └┬┘ ┌┘└┐   ┌┐         ██│  │ ← FVG (Buy Limit)
         └──┘  └┐ ┌┘└┐      ███ └──┘
 ═══════════════╧═╧═══╧═ đáy Á ═══════════ (SSL)
                       └─┐  ↑ quét
                         ▼  SL dưới râu + đệm 1–1.5$</pre>
  <h3>Mô hình B: Tiếp diễn với OTE (phiên NY)</h3>
  <p>Khi London đã chạy mạnh một chiều và trùng bias D1: kéo Fibo nhịp London → chờ giá hồi về OTE trùng FVG/OB H1/M15 → MSS nhỏ M5 theo hướng London → vào FVG M5 mới. TP: đỉnh London rồi đỉnh tiếp theo.</p>
  <h3>Mô hình C (nâng cao): CRT nến H4</h3>
  <p>Nến H4 13:00–17:00 VN quét đỉnh/đáy nến trước rồi đóng cửa vào lại range → phiên NY tìm Mô hình A hướng về 50% range nến H4 trước. Dùng như <b>bộ lọc</b>.</p>
  <h3>Khi nào KHÔNG vào lệnh</h3>
  <ul class="nolist">
    <li>❌ Ngoài killzone (19:30–22:00 / 14:00–16:30)</li>
    <li>❌ Trong ±15 phút quanh tin đỏ (CPI, NFP, FOMC, PPI, Chủ tịch Fed)</li>
    <li>❌ Không có cú quét rõ ràng, giá ở giữa range</li>
    <li>❌ MSS bằng nến yếu, không đóng cửa qua đỉnh/đáy, không có FVG</li>
    <li>❌ Mua ở Premium / bán ở Discount ngược bias D1</li>
    <li>❌ FVG/OB đã bị chạm một lần</li>
    <li>❌ RR &lt; 2 sau khi đặt SL đúng chỗ</li>
    <li>❌ Đã có 1 lệnh trong ngày, hoặc tuần đã lỗ -3R</li>
  </ul>
  <div class="note">Trang <b>Thử nghiệm chiến lược</b> tự động chạy Mô hình A trên dữ liệu của bạn. Thay đổi từng tham số để xem cái nào thực sự tạo lợi thế.</div>`,
  res: [
    { t: 'Video: 3 ĐIỀU ĐỂ CÓ 1 SETUP A+', p: D + '6. 3 ĐIỀU ĐỂ CÓ  1 SET UP A+.mp4', k: 'video' },
    { t: 'Playbook XAUUSD (Markdown)', p: G + '02_Playbook_XAUUSD.md', k: 'doc' },
    { t: 'Tổng hợp ICT (Markdown)', p: G + '01_Tong_hop_ICT.md', k: 'doc' },
    { t: 'Thư mục Video Trade Gold', p: '../Documents/Video Trade Gold/', k: 'folder' },
  ],
  tasks: [
    'Làm 24 kịch bản trong "Ôn tập → Kịch bản thực chiến". Mục tiêu ≥ 80% quyết định đúng.',
    'Replay M5 một tuần, chỉ trong NY AM. Mỗi setup A tìm được, đặt lệnh trong Lab và ghi checklist.',
    'Chạy "Thử nghiệm chiến lược" với cài đặt mặc định, ghi lại kỳ vọng R.',
  ],
},
{
  id: 7, icon: '🛡️', title: 'Quản trị rủi ro & tính lot vàng',
  sub: 'Rủi ro 0.5–1%, RR ≥ 2, 1 lệnh/ngày — sống sót trước, lợi nhuận sau',
  goals: ['Tính lot XAUUSD từ rủi ro và SL', 'Thuộc giới hạn ngày / tuần / tháng', 'Chấm điểm hành vi trước P&L'],
  html: `
  <h3>1. Rủi ro cố định</h3>
  <p><b>0.5% – 1% tài khoản mỗi lệnh.</b> Chuỗi 10 lệnh thua ở 0.5% chỉ mất ~4.9%; ở 5% sẽ mất ~40%.</p>
  <h3>2. Thứ tự đúng</h3>
  <pre class="flow">Xác định điểm sai của setup → đặt SL ở đó → tính lot.
Lot là KẾT QUẢ, không phải điểm bắt đầu.</pre>
  <h3>3. Công thức lot vàng</h3>
  <p>1 lot XAUUSD = 100 ounce → giá chạy 1$ thì 1 lot lời/lỗ <b>100$</b>.</p>
  <pre class="flow">Lot = Số tiền rủi ro ($) / (Khoảng cách SL ($) × 100)   → luôn làm tròn XUỐNG</pre>
  <table class="tbl"><tr><th>Tài khoản</th><th>Rủi ro 1%</th><th>SL 4$</th><th>SL 6$</th><th>SL 8$</th><th>SL 10$</th></tr>
  <tr><td>500$</td><td>5$</td><td>0.01</td><td>bỏ lệnh</td><td>bỏ lệnh</td><td>bỏ lệnh</td></tr>
  <tr><td>1.000$</td><td>10$</td><td>0.02</td><td>0.01</td><td>0.01</td><td>0.01</td></tr>
  <tr><td>2.000$</td><td>20$</td><td>0.05</td><td>0.03</td><td>0.02</td><td>0.02</td></tr>
  <tr><td>5.000$</td><td>50$</td><td>0.12</td><td>0.08</td><td>0.06</td><td>0.05</td></tr></table>
  <p class="muted">Spread vàng 0.2–0.5$ (giờ tin 1–3$) → luôn thêm đệm 1–1.5$ cho SL. Vốn &lt; 1.000$: dùng tài khoản cent.</p>
  <h3>4. Quản lý lệnh: Set & Forget TP1/TP2</h3>
  <ul><li>50% chốt ở TP1 (≥ 2R), 50% chạy tới TP2.</li><li>TP1 chạm → dời SL phần còn lại về entry (BE).</li><li>Không dời SL xa hơn, không nhồi lệnh. 00:30 VN chưa chạm TP2 → đóng.</li></ul>
  <h3>5. Giới hạn</h3>
  <table class="tbl"><tr><td>Ngày</td><td>Tối đa 1 lệnh, thua là dừng</td></tr><tr><td>Tuần</td><td>-3R → nghỉ hết tuần</td></tr><tr><td>Tháng</td><td>-6R → về demo 2 tuần</td></tr></table>
  <div class="note warn">Thua đúng hệ thống là lệnh <b>tốt</b>. Thắng do phá luật là lệnh <b>xấu</b>. Hãy chấm điểm tuân thủ trước khi nhìn P&L.</div>
  <h3>6. Về các video "khoe lệnh"</h3>
  <p>Video Trade Gold cho thấy nhồi nhiều lệnh, SL 70$. Một ngày vàng chạy 80–100$ một chiều là đủ cháy tài khoản. Clip khoe lãi là <b>thiên lệch người sống sót</b>.</p>`,
  res: [
    { t: 'Quản trị rủi ro + Quản lí lệnh', p: D + 'Quan tri rui ro + Quan li lenh.pdf', k: 'pdf' },
    { t: 'Bán Khống', p: D + 'Bán Khống (1).pdf', k: 'pdf' },
    { t: 'Excel: Máy tính lot + Nhật ký', p: G + '03_Bo_du_lieu_luyen_tap_XAUUSD.xlsx', k: 'xlsx' },
  ],
  tasks: [
    'Dùng trang Công cụ: tính lot cho tài khoản của bạn với SL 5$, 7$, 9$.',
    'Viết ra giấy 3 giới hạn ngày/tuần/tháng và dán cạnh màn hình.',
    'Trong Lab, đặt 10 lệnh với rủi ro 1%, không lệnh nào RR < 2.',
  ],
},
{
  id: 8, icon: '📊', title: 'Backtest, nhật ký & lộ trình lên tiền thật',
  sub: 'Backtest → Demo → Tiền thật lot nhỏ. Số liệu quyết định, không phải cảm xúc',
  goals: ['Backtest đủ 50 mẫu', 'Tính và hiểu Expectancy', 'Biết tiêu chí qua từng giai đoạn'],
  html: `
  <h3>1. Kỳ vọng (Expectancy)</h3>
  <pre class="flow">Kỳ vọng = (Tỷ lệ thắng × R thắng TB) − (Tỷ lệ thua × 1R)
Ví dụ: thắng 40%, R thắng TB 2.5 → 0.4×2.5 − 0.6×1 = +0.4R / lệnh</pre>
  <p>Kỳ vọng dương nhỏ + rủi ro cố định + nhiều lệnh = tăng trưởng. Kỳ vọng ≤ 0 sau 50 mẫu → <b>đừng vào tiền thật</b>.</p>
  <h3>2. Cách backtest bằng TradingView</h3>
  <ol>
    <li>Mở XAUUSD M5 → nút <b>Replay</b> (Bar Replay) trên thanh công cụ trên cùng.</li>
    <li>Chọn ngày bắt đầu 3 tháng trước. Chỉ tua trong 19:30–22:00 VN.</li>
    <li>Mỗi setup: ghi Entry/SL/TP và kết quả vào Nhật ký (trang này có sẵn).</li>
    <li><b>Hoặc</b> xuất dữ liệu (menu ⋯ → <i>Export chart data</i>) và nạp vào <b>Backtest Lab</b> ở đây để replay + ghi lệnh tự động.</li>
  </ol>
  <h3>3. Lộ trình 8 tuần</h3>
  <table class="tbl"><tr><th>Tuần</th><th>Việc</th><th>Tiêu chí qua bài</th></tr>
  <tr><td>1</td><td>24 kịch bản + 8 chương</td><td>Hiểu lý do từng đáp án</td></tr>
  <tr><td>2–3</td><td>Backtest M5, 3 tháng, chỉ 19:30–22:00 VN</td><td><b>50 mẫu</b> trong nhật ký</td></tr>
  <tr><td>4–7</td><td>Demo đúng giờ thật, rủi ro 1%</td><td>≥ 30 lệnh, tuân thủ ≥ 90%, kỳ vọng &gt; +0.2R</td></tr>
  <tr><td>8+</td><td>Tiền thật, rủi ro 0.5% (hoặc cent)</td><td>Giữ số liệu như demo 1 tháng rồi mới lên 1%</td></tr></table>
  <h3>4. Cạm bẫy khi backtest</h3>
  <ul><li><b>Nhìn trước tương lai</b>: kéo chart sang phải "lỡ" thấy kết quả. Lab ẩn nến tương lai để tránh việc này.</li><li><b>Chọn mẫu đẹp</b>: chỉ ghi lệnh thắng. Ghi <i>mọi</i> setup đủ điều kiện.</li><li><b>Tối ưu quá mức</b>: chỉnh tham số tới khi đẹp trên 1 tháng dữ liệu. Kiểm tra lại trên tháng khác.</li><li>Nến M5 không cho biết SL hay TP chạm trước nếu cả hai trong 1 nến → Lab mặc định tính <b>SL trước</b> (thận trọng).</li></ul>`,
  res: [
    { t: 'Excel: Bộ dữ liệu luyện tập XAUUSD', p: G + '03_Bo_du_lieu_luyen_tap_XAUUSD.xlsx', k: 'xlsx' },
    { t: 'Giao dịch theo xu hướng để kiếm sống (Andrew Abraham)', p: D + 'Giao_dich_theo_xu_huong_de_kiem_song_Trend_Following_Andrew_Abraham.pdf', k: 'pdf' },
    { t: 'Ba kỹ năng giao dịch hàng đầu (Hank Pruden)', p: D + 'Ba kỹ năng giao dịch hàng đầu - Hank Pruden.pdf', k: 'pdf' },
    { t: 'Volume Profile / Market Profile / Order Flow (VN)', p: D + 'Johannes_Forthman_Volume_Profile_Market_Profile_Order_Flow_VN.pdf', k: 'pdf' },
    { t: 'Ichimoku', p: D + 'Ichimoku.pdf', k: 'pdf' },
  ],
  tasks: [
    'Xuất 3 tháng XAUUSD M5 từ TradingView (hoặc MT5) và nạp vào Backtest Lab.',
    'Backtest đủ 50 lệnh trong Lab. Xem kỳ vọng ở trang Nhật ký.',
    'So sánh kết quả tay của bạn với "Thử nghiệm chiến lược" tự động trên cùng dữ liệu.',
  ],
},
];

// =====================================================================
// NGÂN HÀNG CÂU HỎI TRẮC NGHIỆM  (c = chương, a = đáp án đúng)
// =====================================================================
window.QUESTIONS = [
// ---- Chương 1
{c:1,q:'Xu hướng tăng được xác định bởi:',o:['Đỉnh thấp hơn và đáy thấp hơn','Đỉnh cao hơn (HH) và đáy cao hơn (HL)','Giá nằm trên đường MA 20','Nến xanh nhiều hơn nến đỏ'],a:1,e:'Cấu trúc tăng = chuỗi HH + HL. Chỉ báo chỉ là phụ.'},
{c:1,q:'BOS (Break of Structure) nghĩa là:',o:['Giá phá đỉnh/đáy theo cùng xu hướng → tiếp diễn','Giá phá cấu trúc ngược xu hướng → đảo chiều','Giá đi ngang','Giá quét thanh khoản'],a:0,e:'BOS = phá cùng chiều, xu hướng tiếp diễn. Phá ngược chiều là MSS/CHoCH.'},
{c:1,q:'Một MSS chất lượng cao thường có đặc điểm nào?',o:['Râu nến chạm qua đỉnh nhưng đóng cửa bên dưới','Nến thân lớn đóng cửa qua đỉnh/đáy và để lại FVG','Xảy ra trong phiên Á','Có 2 nến doji liên tiếp'],a:1,e:'MSS cần displacement: thân lớn, đóng cửa qua mức cấu trúc, thường để lại FVG.'},
{c:1,q:'Theo HLZ, khi thấy giá phá cấu trúc, bạn nên:',o:['Vào lệnh ngay bằng lệnh market','Coi đó là tín hiệu sớm, chờ giá hồi về vùng FVG/OB để vào','Đóng hết lệnh','Bỏ qua vì phá cấu trúc luôn là bẫy'],a:1,e:'"Phá cấu trúc chưa phải điểm vào lệnh" — điểm vào là khi giá hồi lại.'},
{c:1,q:'Trong playbook XAUUSD, khung dùng để xác định bias là:',o:['M1 và M5','M15','D1 và H4','Tuần và tháng'],a:2,e:'D1 + H4 cho bias, H1/M15 bản đồ thanh khoản, M5 vào lệnh.'},
{c:1,q:'Xu hướng giảm có cấu trúc:',o:['HH + HL','LH + LL','HH + LL','LH + HL'],a:1,e:'Giảm = đỉnh thấp hơn (LH) và đáy thấp hơn (LL).'},
// ---- Chương 2
{c:2,q:'Buy-side liquidity (BSL) nằm ở đâu?',o:['Dưới các đáy cũ','Trên các đỉnh cũ / đỉnh bằng nhau','Ở giữa range','Tại đường MA'],a:1,e:'BSL = stop của phe bán (lệnh mua) nằm trên đỉnh cũ.'},
{c:2,q:'Stop-loss của phe MUA nằm ở đâu?',o:['Trên đỉnh cũ (BSL)','Dưới đáy cũ (SSL)','Tại giá mở cửa ngày','Không xác định được'],a:1,e:'Người mua đặt SL dưới đáy → tạo sell-side liquidity (SSL).'},
{c:2,q:'"PDH" là viết tắt của:',o:['Previous Day High — đỉnh ngày hôm trước','Price Delivery High','Premium Discount High','Pivot Daily High'],a:0,e:'PDH/PDL = đỉnh/đáy ngày hôm trước, mức thanh khoản quan trọng.'},
{c:2,q:'Giá vừa quét qua đáy phiên Á bằng một râu dài rồi đóng cửa quay lên. Bạn nên làm gì?',o:['Mua ngay lập tức','Bán vì đáy đã bị phá','Chờ displacement + MSS và FVG rồi mới tìm điểm vào','Không quan tâm'],a:2,e:'"Một liquidity sweep không phải entry." Cần bằng chứng displacement + MSS.'},
{c:2,q:'Vì sao giá thường quét đáy trước khi tăng mạnh?',o:['Do ngẫu nhiên','Tổ chức lớn cần thanh khoản (lệnh bán từ SL của phe mua) để khớp lệnh mua lớn','Vì chỉ báo RSI quá bán','Vì sàn muốn săn SL của bạn'],a:1,e:'"SL của bạn là entry của big boys" — stop tạo khối lượng đối ứng.'},
{c:2,q:'Range phiên Á (giờ VN mùa đông) là:',o:['08:00 – 12:00','14:00 – 17:00','19:00 – 22:00','00:00 – 04:00'],a:0,e:'Phiên Á ICT = 20:00–00:00 NY = 08:00–12:00 VN mùa đông.'},
// ---- Chương 3
{c:3,q:'FVG tăng (bullish FVG) được xác định khi:',o:['High nến 3 < Low nến 1','Low nến 3 > High nến 1','Nến 2 là doji','Close nến 3 > Open nến 1'],a:1,e:'Khoảng trống giữa râu trên nến 1 và râu dưới nến 3: Low[3] > High[1].'},
{c:3,q:'CE của FVG là:',o:['Mép trên FVG','Điểm giữa 50% của FVG','Mép dưới FVG','Giá đóng cửa nến 2'],a:1,e:'CE (Consequent Encroachment) = 50% của FVG, điểm vào phổ biến.'},
{c:3,q:'Order Block tăng là:',o:['Nến tăng cuối cùng trước nhịp giảm','Nến giảm (ngược màu) cuối cùng trước nhịp displacement tăng','Nến có khối lượng lớn nhất','Vùng đi ngang trong phiên Á'],a:1,e:'OB = nến ngược màu cuối cùng trước displacement.'},
{c:3,q:'IFVG (FVG đảo ngược) là:',o:['FVG chưa bị chạm','FVG bị giá đóng cửa xuyên qua và đổi vai trò hỗ trợ ↔ kháng cự','FVG trên khung D1','FVG có kích thước lớn'],a:1,e:'FVG bị phá bằng giá đóng cửa sẽ đổi vai trò — rất hay gặp ở vàng.'},
{c:3,q:'Theo HLZ (FTB), một FVG/OB đã bị giá chạm một lần thì:',o:['Càng mạnh hơn','Không trade lại vùng đó','Chỉ trade bằng lot lớn','Trade ngược chiều'],a:1,e:'ICT/HLZ: chỉ dùng lần chạm đầu tiên. Sau FTB không trade lại.'},
{c:3,q:'Displacement là:',o:['Giá đi ngang chậm','Nhịp di chuyển mạnh, nến thân dài, đi một mạch, thường để lại FVG','Khoảng trống cuối tuần','Một cú quét râu'],a:1,e:'Displacement là "dấu chân" của dòng tiền lớn.'},
// ---- Chương 4
{c:4,q:'Các mức Fibo của vùng OTE là:',o:['0.236 / 0.382','0.5 / 0.618 / 0.786','1.0 / 1.272 / 1.618','0.1 / 0.9'],a:1,e:'OTE: bật 0.5, 0.618, 0.786.'},
{c:4,q:'Trong một nhịp tăng, vùng Discount là:',o:['Trên 50% Fibo','Dưới 50% Fibo','Trên đỉnh','Bất kỳ đâu'],a:1,e:'Dưới 50% = rẻ = Discount, ưu tiên mua.'},
{c:4,q:'Lệnh MUA đẹp nhất theo ICT có FVG/OB nằm ở:',o:['Premium, trên 0.786','Discount, trùng vùng OTE','Ngay tại đỉnh','Giữa range phiên Á'],a:1,e:'Mua ở Discount + OTE + PD array = hợp lưu tốt nhất.'},
{c:4,q:'Midnight Open (giờ VN mùa đông) là lúc:',o:['00:00','07:00','12:00','19:30'],a:2,e:'00:00 New York = 12:00 VN mùa đông.'},
{c:4,q:'Giá chạm 0.618 trong nhịp hồi. Bạn nên:',o:['Vào lệnh ngay','Chờ phản ứng và MSS khung nhỏ theo hướng xu hướng','Đặt lệnh ngược xu hướng','Dời Fibo cho đẹp hơn'],a:1,e:'OTE là vùng, cần phản ứng + MSS M5 (Mô hình B).'},
// ---- Chương 5
{c:5,q:'NY AM Killzone theo giờ VN mùa đông là:',o:['14:00 – 17:00','19:00 – 22:00','08:00 – 12:00','22:00 – 00:00'],a:1,e:'07:00–10:00 NY = 19:00–22:00 VN mùa đông. Playbook dùng 19:30–22:00.'},
{c:5,q:'London Killzone theo giờ VN mùa HÈ là:',o:['13:00 – 16:00','14:00 – 17:00','15:00 – 18:00','12:00 – 15:00'],a:0,e:'Mùa hè trừ 1 tiếng so với mùa đông (14:00–17:00 → 13:00–16:00).'},
{c:5,q:'Tin Mỹ (CPI, NFP) lúc 08:30 NY tương ứng giờ VN mùa đông:',o:['19:30','20:30','21:30','22:30'],a:1,e:'08:30 NY + 12h = 20:30 VN mùa đông.'},
{c:5,q:'Judas Swing là:',o:['Nhịp tăng cuối ngày','Cú chạy giả quét một phía range Á trước khi giá chạy thật','Nến doji ở phiên Á','Khoảng trống mở cửa tuần'],a:1,e:'Judas Swing = thao túng (Manipulation) trong Power of 3.'},
{c:5,q:'Trên MT5 với giờ server GMT+2 (mùa đông), nến server 14:30 là mấy giờ VN?',o:['16:30','19:30','21:30','09:30'],a:1,e:'Giờ VN = server + 5 (mùa đông).'},
{c:5,q:'Trong CRT, sau khi nến quét CRTH rồi đóng cửa quay lại trong range, mục tiêu đầu tiên là:',o:['Đỉnh mới','50% của range','Đáy tuần','Không có mục tiêu'],a:1,e:'Mục tiêu CRT: 50% range trước, sau đó phía đối diện.'},
{c:5,q:'Phiên Á trong playbook được dùng để:',o:['Vào lệnh nhiều nhất','Đánh dấu đỉnh/đáy làm mục tiêu thanh khoản, không trade','Đánh tin','Nhồi lệnh'],a:1,e:'Phiên Á tích lũy, dễ bị quét hai đầu → chỉ đánh dấu.'},
// ---- Chương 6
{c:6,q:'Thứ tự đúng của Mô hình A là:',o:['FVG → Quét → MSS','Quét thanh khoản → Displacement + MSS → Vào lệnh khi hồi về FVG','MSS → Quét → Market order','Vào lệnh → chờ quét'],a:1,e:'Quét → MSS → FVG.'},
{c:6,q:'SL của lệnh MUA Mô hình A đặt ở:',o:['Dưới mép dưới FVG','Dưới râu của cú quét + 1–1.5$ đệm','Cố định 70$','Không cần SL'],a:1,e:'SL ở nơi ý tưởng sai: nếu giá xuống lại dưới đáy quét thì cú quét là thật.'},
{c:6,q:'Lệnh chờ Buy Limit tại FVG chưa khớp nhưng giá đã chạy tới TP1. Bạn:',o:['Đuổi theo bằng market','Hủy lệnh chờ','Dời entry lên cao hơn','Nhân đôi lot'],a:1,e:'Bước 8: hủy nếu giá chạm TP1 trước khi khớp, hoặc qua 22:00.'},
{c:6,q:'Setup đủ đẹp nhưng RR chỉ 1.5 sau khi đặt SL đúng chỗ. Bạn:',o:['Thu nhỏ SL để RR thành 2','Bỏ lệnh','Vào với lot gấp đôi','Dời TP xa hơn tùy ý'],a:1,e:'RR < 2 → bỏ. Không bóp SL sai chỗ để làm đẹp RR.'},
{c:6,q:'Mô hình B (tiếp diễn OTE) dùng khi nào?',o:['Phiên Á đi ngang','London đã chạy mạnh một chiều trùng bias D1, NY hồi về OTE','Trước tin FOMC','Khi đã thua 3 lệnh'],a:1,e:'IPDA: phiên NY thường "Retracement rồi Expansion" tiếp hướng London.'},
{c:6,q:'Điều nào sau đây KHÔNG phải lý do bỏ lệnh?',o:['Ngoài killzone','FVG đã bị chạm một lần','Có cú quét rõ + MSS + FVG chưa chạm, cùng bias, RR 2.5','Trong 15 phút quanh tin đỏ'],a:2,e:'Đó chính là setup A+ đủ điều kiện.'},
{c:6,q:'"3 điều cho một setup A+" gồm:',o:['RSI, MACD, MA','Context (bias + Premium/Discount), Thanh khoản bị quét trong killzone, Xác nhận displacement + MSS','Tin tức, lot lớn, SL rộng','Nhiều lệnh, nhiều cặp, nhiều khung'],a:1,e:'Context → Liquidity → Confirmation.'},
// ---- Chương 7
{c:7,q:'Tài khoản 1.000$, rủi ro 1%, SL 4$ trên XAUUSD. Lot đúng là:',o:['0.01','0.02','0.025','0.25'],a:1,e:'10 / (4×100) = 0.025 → làm tròn xuống 0.02.'},
{c:7,q:'Tài khoản 500$, rủi ro 1%, SL 6$. Lot tính ra 0.0083. Bạn:',o:['Vào 0.01 lot','Bỏ lệnh hoặc dùng tài khoản cent','Vào 0.05 cho đáng','Bỏ SL'],a:1,e:'0.01 lot sẽ rủi ro 6$ = 1.2%. Đúng luật: bỏ lệnh hoặc dùng cent.'},
{c:7,q:'1 lot XAUUSD, giá chạy 1$ thì lời/lỗ:',o:['1$','10$','100$','1.000$'],a:2,e:'1 lot = 100 ounce → 100$ mỗi 1$ giá.'},
{c:7,q:'Thứ tự đúng khi lên lệnh:',o:['Chọn lot → đặt SL','Xác định điểm sai → đặt SL → tính lot','Đặt TP → chọn lot → bỏ SL','Vào lệnh → sau đó mới tính'],a:1,e:'"Lot là kết quả, không phải điểm bắt đầu."'},
{c:7,q:'Tuần đã lỗ -3R. Theo playbook bạn:',o:['Tăng lot để gỡ','Nghỉ hết tuần, xem lại nhật ký','Chuyển sang cặp khác','Trade phiên Á'],a:1,e:'Giới hạn tuần: -3R → nghỉ.'},
{c:7,q:'Một lệnh thua nhưng làm đúng 100% checklist được đánh giá là:',o:['Lệnh xấu','Lệnh tốt','Không quan trọng','Phải đổi hệ thống ngay'],a:1,e:'Chấm điểm hành vi trước P&L. Thua đúng hệ thống = lệnh tốt.'},
{c:7,q:'Khi nào dời SL về hòa vốn (BE)?',o:['Ngay khi lời 1$','Khi chạm TP1 hoặc có cấu trúc xác nhận','Không bao giờ','Khi thấy sợ'],a:1,e:'Dời BE quá sớm làm bạn bị quét ra khỏi lệnh thắng.'},
// ---- Chương 8
{c:8,q:'Thắng 40%, R thắng trung bình 2.5, thua 1R. Kỳ vọng là:',o:['-0.2R','+0.4R','+1.0R','+2.5R'],a:1,e:'0.4×2.5 − 0.6×1 = 1.0 − 0.6 = +0.4R.'},
{c:8,q:'Cần tối thiểu bao nhiêu mẫu backtest trước khi demo theo lộ trình?',o:['5','10','50','500'],a:2,e:'50 mẫu backtest, sau đó ≥ 30 lệnh demo.'},
{c:8,q:'Tiêu chí qua giai đoạn demo:',o:['Lãi 50%','≥ 30 lệnh, tuân thủ ≥ 90%, kỳ vọng > +0.2R','Thắng 10 lệnh liên tiếp','Không thua lệnh nào'],a:1,e:'Đo hành vi + kỳ vọng, không đo lãi tuyệt đối.'},
{c:8,q:'Khi một nến M5 chạm cả SL và TP, cách tính thận trọng là:',o:['Tính TP trước','Tính SL trước','Bỏ qua lệnh','Tính hòa vốn'],a:1,e:'Không biết thứ tự trong nến → giả định xấu nhất (SL).'},
{c:8,q:'"Nhìn trước tương lai" khi backtest là:',o:['Dự báo tốt','Lỡ thấy nến sau rồi mới quyết định → kết quả ảo','Dùng nhiều khung thời gian','Đọc tin tức'],a:1,e:'Bar Replay / Lab ẩn nến tương lai để tránh lỗi này.'},
{c:8,q:'Sau 50 mẫu backtest kỳ vọng ≤ 0. Bạn nên:',o:['Vào tiền thật để thử','Không vào tiền thật; xem lại bộ lọc, khung giờ','Tăng rủi ro lên 5%','Bỏ nhật ký'],a:1,e:'Số liệu nói hệ thống chưa có lợi thế với cách bạn thực hiện.'},
{c:8,q:'Rủi ro khi vào tiền thật lần đầu theo lộ trình:',o:['0.5% (hoặc tài khoản cent)','2%','5%','10%'],a:0,e:'Bắt đầu 0.5%, giữ số liệu 1 tháng rồi mới lên 1%.'},
];
