# PLAYBOOK THỰC CHIẾN XAUUSD THEO ICT (cho người bận rộn)

> **Nói thẳng trước:** Không ai, kể cả mình, có thể hứa bạn "có lãi thật". Playbook này giúp bạn có **luật rõ ràng, rủi ro nhỏ và số liệu để kiểm chứng**. Lãi hay không phụ thuộc vào việc bạn backtest đủ mẫu và tuân thủ kỷ luật. Lộ trình bắt buộc: **Backtest → Demo → Tiền thật lot nhỏ** (mục 10).

---

## 1. Tóm tắt 1 trang

| Hạng mục | Quy định |
|---|---|
| Cặp | XAUUSD |
| Bias | D1 + H4 |
| Bản đồ thanh khoản | H1 (+ M15) |
| Vào lệnh | M5 (người đã quen có thể dùng M1) |
| **Khung giờ chính** | **19:30 – 22:00 giờ VN** (NY AM Killzone, mùa đông) |
| Khung giờ phụ (nếu rảnh) | 14:00 – 16:30 giờ VN (London Killzone, mùa đông) |
| Mô hình chính | **A: Quét thanh khoản → MSS → vào FVG** |
| Mô hình phụ | B: Tiếp diễn, hồi về FVG/OB H1 trong vùng OTE |
| Rủi ro | 0.5–1%/lệnh, **tối đa 1 lệnh/ngày**, dừng tuần ở -3R |
| RR tối thiểu | 1 : 2 |
| Thời gian cần | ~15 phút chuẩn bị + canh lệnh bằng cảnh báo giá |

---

## 2. Giờ giao dịch theo giờ Việt Nam (UTC+7)

Mỹ và Anh đổi giờ mùa hè/đông, Việt Nam thì không, nên giờ VN lệch 1 tiếng giữa hai mùa.
- **Giờ mùa đông**: từ đầu tháng 11 đến giữa tháng 3 (hiện tại, tháng 11/2026, đang là mùa đông).
- **Giờ mùa hè**: từ giữa tháng 3 đến đầu tháng 11. **Trừ 1 tiếng** so với cột mùa đông.

| Phiên / mốc | Giờ New York | **VN mùa đông** | VN mùa hè | Ý nghĩa với vàng |
|---|---|---|---|---|
| Range phiên Á (ICT) | 20:00 – 00:00 | **08:00 – 12:00** | 07:00 – 11:00 | Tích lũy, gom thanh khoản. **Không trade**, chỉ đánh dấu đỉnh/đáy |
| Mở cửa nửa đêm NY (Midnight Open) | 00:00 | **12:00** | 11:00 | Giá tham chiếu: trên mức này là Premium, dưới là Discount trong ngày |
| **London Killzone** | 02:00 – 05:00 | **14:00 – 17:00** | 13:00 – 16:00 | Judas swing: quét đỉnh/đáy phiên Á rồi chạy thật |
| London mở cửa | 03:00 | 15:00 | 14:00 | |
| **NY AM Killzone** | 07:00 – 10:00 | **19:00 – 22:00** | 18:00 – 21:00 | Biến động lớn nhất ngày của vàng |
| Tin Mỹ (CPI, NFP, PPI…) | 08:30 | **20:30** | 19:30 | Thường là cú quét thanh khoản |
| Mở cửa sàn vàng COMEX | 08:20 | 20:20 | 19:20 | |
| Mở cửa chứng khoán Mỹ | 09:30 | 21:30 | 20:30 | |
| Silver Bullet NY | 10:00 – 11:00 | 22:00 – 23:00 | 21:00 – 22:00 | Setup FVG nhanh, tuỳ chọn |
| London đóng cửa | 10:00 – 12:00 | 22:00 – 00:00 | 21:00 – 23:00 | Hay đảo chiều/chốt lời. **Không mở lệnh mới** |
| FOMC (lãi suất Fed) | 14:00 | 02:00 sáng | 01:00 sáng | **Không giữ lệnh qua tin này** |

**Giờ trên MT4/MT5:** đa số sàn dùng giờ server GMT+2 (mùa đông) hoặc GMT+3 (mùa hè). Khi đó **giờ VN = giờ server + 5 (mùa đông) hoặc + 4 (mùa hè)**. Ví dụ nến server 14:30 là 19:30 VN mùa đông. Các video trong thư mục "Video Trade Gold" đang hiển thị giờ server.

### Vì sao chọn 2 khung này?
1. **NY AM (19:30–22:00 VN)**: phù hợp người đi làm (buổi tối), vàng biến động mạnh nhất, có tin 20:30 tạo cú quét rõ ràng. Theo IPDA, đây là giai đoạn "Retracement → Reversal/Expansion".
2. **London (14:00–16:30 VN)**: chỉ dùng nếu bạn rảnh buổi chiều. Đây là Judas swing kinh điển: quét đỉnh hoặc đáy phiên Á rồi chạy.
3. **Không trade phiên Á**: giá tích lũy, dễ bị quét hai đầu. Dùng phiên Á để **đánh dấu mục tiêu** cho London và NY.

---

## 3. Lịch trình hằng ngày (tối giản)

**Buổi sáng hoặc trưa, 5 phút (có thể làm trên điện thoại):**
- Không làm gì cả, chờ phiên Á kết thúc.

**19:00 – 19:15, chuẩn bị (10–15 phút):**
1. Mở **D1**: nến hôm qua tăng hay giảm, giá đang hướng tới đỉnh hay đáy nào? Viết ra: *"Bias hôm nay: MUA / BÁN / ĐỨNG NGOÀI"*.
2. Mở **H4**: giá đang ở Premium hay Discount của nhịp gần nhất? Có FVG H4 nào gần không?
3. Mở **H1**, kẻ ngang: PDH, PDL, đỉnh/đáy phiên Á, đỉnh/đáy London (14:00–19:00 VN), Midnight Open (12:00 VN).
4. Xem lịch tin (Forex Factory / Investing). Có tin đỏ lúc 20:30 thì **chờ tin ra xong 15 phút** mới tìm setup.
5. **Đặt cảnh báo giá** tại đỉnh/đáy London và đỉnh/đáy Á. Bạn không cần ngồi nhìn chart, giá chạm thì điện thoại báo.

**19:30 – 22:00, chờ setup:**
- Khi có cảnh báo, mở **M5**, kiểm tra mô hình A hoặc B (mục 4). Đủ checklist thì vào, không đủ thì bỏ.
- **22:00 không có setup thì tắt máy.** Ngày "No trade" vẫn là ngày tốt.

**Sau khi vào lệnh:** đặt SL/TP ngay, **không ngồi nhìn**. Kiểm tra lại lúc 23:00 (dời BE nếu đã chạm TP1). **Đóng hết trước 00:30** nếu chưa chạm TP, không giữ qua đêm khi mới bắt đầu.

**Cuối tuần, 30 phút:** ghi nhật ký, chụp ảnh chart, xem lại 5 lệnh của tuần.

---

## 4. Mô hình vào lệnh

### MÔ HÌNH A: "Quét → MSS → FVG" (mô hình chính)

Đây là sự kết hợp của Judas Swing (IPDA), Turtle Soup (CRT), Quasimodo/SDE (HLZ) và MSS + FVG (video).

**Lệnh MUA (ngược lại cho lệnh BÁN):**
1. **Bias D1/H4 là tăng**, hoặc giá đang ở Discount sau một nhịp giảm dài về vùng hỗ trợ H4.
2. **Trong killzone**, giá **quét xuống dưới một đáy thanh khoản**: đáy London, đáy phiên Á, PDL hoặc đáy bằng nhau trên H1.
3. Sau cú quét, M5 xuất hiện **displacement tăng**: 1–3 nến thân dài đóng cửa **trên đỉnh gần nhất** đã tạo ra cú quét. Đó là **MSS**.
4. Nhịp displacement để lại **FVG** (hoặc OB) trên M5.
5. **Đặt Buy Limit tại mép trên FVG hoặc điểm giữa (CE) của FVG.** Không đuổi giá.
6. **SL**: dưới đáy của cú quét **+ 1–1.5$ đệm** (spread vàng).
7. **TP1**: đỉnh thanh khoản gần nhất (đỉnh London / đỉnh Á / đỉnh nội phiên), **ít nhất 2R**. **TP2**: PDH hoặc FVG H1 đối diện.
8. **Hủy lệnh chờ** nếu giá chạm TP1 trước khi khớp, hoặc qua 22:00 vẫn chưa khớp.

**Tại sao lệnh này có lợi thế (lý do vào lệnh):**
- Cú quét đã **lấy stop của phe mua** và kích hoạt lệnh bán breakout. Phe lớn dùng thanh khoản đó để **khớp lệnh mua lớn** ("SL của bạn là entry của big boys").
- **Displacement + MSS** là bằng chứng phe mua đã thật sự vào thị trường. Không có bằng chứng này thì đó chỉ là phá đáy bình thường.
- **FVG** là vùng giá chưa được giao dịch cân bằng, giá có xu hướng quay lại lấp một phần trước khi chạy tiếp (IPDA: Retracement).
- **SL nằm ở nơi ý tưởng sai**: nếu giá xuống lại dưới đáy quét thì cú quét là thật, không phải cú lừa.

```
 Lệnh MUA (Mô hình A)
                                         TP1 (đỉnh London)
        ┌─┐                                ↑
 ───────┤ ├──── đỉnh nhỏ ────────── MSS ──┼──────
        │ │  ┌┐                  ┌──┐      │
        └┬┘ ┌┘└┐   ┌┐         ██│  │ ← FVG (Buy Limit)
         └──┘  └┐ ┌┘└┐      ███ └──┘
 ═══════════════╧═╧═══╧═ đáy Á ═══════════ (SSL)
                       └─┐  ↑ quét
                         ▼  SL dưới râu + đệm 1–1.5$
```

### MÔ HÌNH B: Tiếp diễn với OTE (dành cho phiên NY)
Dùng khi London đã chạy mạnh một chiều (expansion) và trùng bias D1.
1. Kéo Fibo nhịp London (đáy đến đỉnh nếu London tăng), bật 0.5 / 0.618 / 0.786.
2. Đầu phiên NY (19:30–21:00 VN), chờ giá hồi về **vùng OTE trùng FVG/OB H1 hoặc M15**.
3. Tại vùng đó, xuống M5, chờ **MSS nhỏ theo hướng London** (cũng thường là cú quét một đáy nhỏ M5).
4. Vào ở FVG M5 mới. SL dưới đáy hồi. TP là đỉnh London, rồi đỉnh tiếp theo.
- **Lý do:** IPDA mô tả phiên NY thường "Retracement rồi Expansion" tiếp hướng London. Vùng OTE trùng FVG là chỗ giá "rẻ" nhất trong xu hướng.

### MÔ HÌNH C (nâng cao, tuỳ chọn): CRT nến H4
- Nến H4 trên MT5 (server GMT+2) mở lúc **13:00, 17:00, 21:00 VN** (mùa đông).
- Nếu nến H4 **13:00–17:00 quét đỉnh hoặc đáy của nến H4 trước rồi đóng cửa quay lại trong range**, thì phiên NY tìm Mô hình A trên M5 hướng về **50% của range nến H4 trước**, sau đó là phía đối diện.
- Dùng như **bộ lọc tăng xác suất** cho Mô hình A, không cần học ngay.

---

## 5. Khi nào KHÔNG vào lệnh (bộ lọc)
- Ngoài killzone (19:30–22:00 / 14:00–16:30).
- Trong vòng 15 phút trước và sau tin đỏ (CPI, NFP, FOMC, PPI, phát biểu Chủ tịch Fed).
- Không có cú quét rõ ràng, giá đang **ở giữa range** (nhiễu, vùng "Flippy" của HLZ).
- MSS bằng nến yếu, đóng cửa không qua đỉnh/đáy, không có FVG.
- Mua ở Premium hoặc bán ở Discount ngược bias D1.
- Vùng FVG/OB **đã bị chạm một lần** (HLZ: không trade sau FTB).
- RR < 2 sau khi đặt SL đúng chỗ.
- Đã có 1 lệnh trong ngày, hoặc tuần đã lỗ -3R.
- Thứ Hai trước 19:00 (thiếu dữ liệu tuần) và **thứ Sáu sau NFP**. Đầu tuần và cuối tuần nên giảm rủi ro một nửa.

---

## 6. Đặc thù của vàng và cách tính lot

- **1 lot XAUUSD = 100 ounce**: giá chạy 1$ thì 1 lot lời/lỗ **100$**, 0.01 lot lời/lỗ **1$**.
- Giá vàng hiện ~3.900–4.100$, biến động trong ngày thường 30–70$. SL Mô hình A trên M5 thường **4–10$**.
- Spread 0.2–0.5$ (giờ tin có thể 1–3$), vì vậy **luôn thêm đệm 1–1.5$ cho SL**.

**Công thức:** `Lot = Số tiền rủi ro ($) / (Khoảng cách SL ($) × 100)`. Luôn **làm tròn xuống**.

| Tài khoản | Rủi ro 1% | SL 4$ | SL 6$ | SL 8$ | SL 10$ |
|---|---|---|---|---|---|
| 500$ | 5$ | 0.01 | **bỏ lệnh** (0.0083) | bỏ lệnh | bỏ lệnh |
| 1.000$ | 10$ | 0.02 | 0.01 | 0.01 | 0.01 |
| 2.000$ | 20$ | 0.05 | 0.03 | 0.02 | 0.02 |
| 5.000$ | 50$ | 0.12 | 0.08 | 0.06 | 0.05 |

Vốn nhỏ dưới 1.000$: nên dùng **tài khoản cent** để vẫn giữ rủi ro 1%. File Excel có sẵn máy tính lot.

---

## 7. Quản lý lệnh (chọn 1 cách và giữ nguyên ít nhất 30 lệnh)

**Cách khuyến nghị cho người bận: Set & Forget có TP1/TP2**
- Chia 2 phần: **50% chốt ở TP1 (≥2R)**, 50% chạy tới TP2.
- Khi TP1 chạm: **dời SL phần còn lại về entry (BE)**.
- Không dời SL xa hơn, không nhồi lệnh, không mở lệnh thứ hai.
- 00:30 VN chưa chạm TP2: đóng phần còn lại.

**Giới hạn:**
- Ngày: tối đa 1 lệnh, thua là dừng.
- Tuần: -3R thì nghỉ hết tuần, xem lại nhật ký.
- Tháng: -6R thì về demo 2 tuần.

---

## 8. Nhận xét về thư mục "Video Trade Gold"

Mình đã xem 9 video bằng cách cắt ảnh khung hình (video không có tiếng hoặc mình không chuyển được giọng nói). Đây là các clip TikTok khoe lệnh của một nhóm tín hiệu ("nghiemtradevang79"). Nội dung chính:
- Chart **M1/M5/M30/H1** với **Bollinger Bands + đường MA**, thường **bán khi giá chạm dải trên/MA lớn rồi để lại râu** (thực chất là cú quét đỉnh) và mua ở dải dưới.
- Vẽ mô hình **2 đỉnh / 2 đáy** (giống Quasimodo, quét rồi đảo chiều).
- Khoe nhiều lệnh nhỏ 0.02–0.05 lot vào **chồng nhiều lệnh** cùng vùng. Tin nhắn nhóm ghi *"B luôn 85, SL chịu khó 70, TP 4100"*, tức stop-loss **70$** (rất lớn) và TP ở xa.

**Nên lấy gì:**
- Ý tưởng **bán khi giá vượt dải trên Bollinger rồi rút râu ngược lại** chính là "quét thanh khoản" của ICT. Bạn có thể thêm Bollinger (20, 2) trên M5 làm **bộ lọc phụ**: cú quét chạm hoặc vượt dải BB thì càng đáng tin.

**Không nên làm theo:**
- Nhồi nhiều lệnh, SL 70$, không có giới hạn ngày. Một ngày vàng chạy 80–100$ một chiều (thường xuyên ở mức giá 4.000$) là đủ cháy tài khoản.
- Clip khoe lãi là **thiên lệch người sống sót**: bạn chỉ thấy lệnh thắng. Chưa thấy nhật ký đầy đủ thì đừng coi là bằng chứng hiệu quả.

---

## 9. Checklist in ra dán cạnh màn hình

```
TRƯỚC 19:15
[ ] Bias D1/H4: MUA / BÁN / ĐỨNG NGOÀI
[ ] Đã kẻ: PDH, PDL, đỉnh/đáy Á, đỉnh/đáy London, Midnight Open
[ ] Đã xem lịch tin 20:30 / 22:00 / 02:00
[ ] Đã đặt cảnh báo giá

TRƯỚC KHI BẤM LỆNH
[ ] Đang trong 19:30–22:00 (hoặc 14:00–16:30)
[ ] Có cú QUÉT thanh khoản rõ ràng (tên mức: ________)
[ ] Có DISPLACEMENT + MSS đóng cửa qua đỉnh/đáy
[ ] Có FVG/OB chưa bị chạm, vào bằng lệnh LIMIT
[ ] Cùng hướng bias D1 / đúng Premium-Discount
[ ] SL sau râu quét + 1–1.5$ đệm
[ ] TP tại thanh khoản đối diện, RR ≥ 2
[ ] Lot = rủi ro / (SL × 100), làm tròn xuống
[ ] Hôm nay chưa có lệnh nào, tuần chưa -3R
→ Thiếu 1 ô = KHÔNG VÀO
```

---

## 10. Lộ trình 8 tuần trước khi dùng tiền thật

| Tuần | Việc | Tiêu chí qua bài |
|---|---|---|
| 1 | Làm 24 bài tập trong file Excel (sheet "Bai_tap"), đối chiếu "Dap_an" | Hiểu lý do từng đáp án |
| 2–3 | **Backtest bằng TradingView Bar Replay** trên XAUUSD M5, 3 tháng gần nhất, chỉ trong 19:30–22:00 VN | Đủ **50 mẫu**, ghi vào sheet "Nhat_ky" |
| 4–7 | **Demo** đúng giờ thật, đúng luật, rủi ro 1% | ≥ 30 lệnh, tuân thủ ≥ 90%, kỳ vọng > +0.2R/lệnh |
| 8+ | Tiền thật, **rủi ro 0.5%** (hoặc tài khoản cent) | Duy trì số liệu như demo trong 1 tháng rồi mới lên 1% |

**Kỳ vọng (Expectancy)** = (Tỷ lệ thắng × R trung bình thắng) − (Tỷ lệ thua × 1R). Ví dụ thắng 40%, R thắng trung bình 2.5 thì kỳ vọng = 0.4×2.5 − 0.6×1 = **+0.4R/lệnh**. Sheet "Nhat_ky" tự tính.

Nếu sau 50 mẫu backtest mà kỳ vọng ≤ 0, **đừng vào tiền thật**: xem lại bộ lọc hoặc khung giờ, rồi gửi nhật ký cho mình để cùng phân tích.
