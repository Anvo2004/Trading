# TỔNG HỢP PHƯƠNG PHÁP ICT TỪ THƯ MỤC "Trade For Beginer"

> Tài liệu học tập, không phải khuyến nghị đầu tư. Không phương pháp nào đảm bảo có lãi. Hãy backtest và chạy demo trước khi dùng tiền thật.

## 0. Mình đã đọc những gì

| Tài liệu | Trạng thái | Dùng vào phần nào |
|---|---|---|
| ICT_IPDA_Market_Cycle (bản dịch + bản gốc) | Đọc toàn bộ | Chu kỳ thị trường trong ngày, Judas Swing, khung giờ |
| Quản trị rủi ro + Quản lí lệnh | Đọc toàn bộ | Toàn bộ phần quản lý vốn, checklist |
| High Liquidity Zone (HLZ) | Đọc toàn bộ | Base, SDE/SGB, FTB, Flippy, Quasimodo |
| HTF-LTF.jpeg | Xem | Mô hình CRT (Candle Range Theory) + Turtle Body Soup |
| Cách sử dụng Fibo.png | Xem | Vùng OTE 0.5 / 0.618 / 0.786 |
| 9 video trong "Video Trade Gold" | Xem bằng ảnh cắt khung hình (không có âm thanh) | Nhận xét riêng ở file Playbook |
| 11 video .mp4 trong Trade For Beginer (OB, FVG, IFVG, MSS, thanh khoản, tin tức, setup A+) | **Chưa xem được** (file 100–340MB, môi trường không có công cụ chuyển giọng nói) | Mình dùng định nghĩa ICT chuẩn cho các chủ đề trong tên video |
| Sách PDF lớn (Nến Nhật, Ichimoku, Trend Following, Volume Profile, Wyckoff/Pruden, Bẫy giá, Bán khống, Cẩm nang Price Action) | Không đưa vào | Là kiến thức nền, không phải ICT; nên đọc dần sau |

Nếu bạn muốn mình tổng hợp nội dung chính xác của từng video, hãy cho mình biết, mình sẽ tìm cách xem bản ghi chữ (ví dụ phụ đề) của chúng.

---

## 1. Ý tưởng cốt lõi của ICT (một câu)

**Giá di chuyển từ vùng thanh khoản này sang vùng thanh khoản khác. Trước khi chạy thật, giá thường "lừa" một nhịp để quét stop-loss (thanh khoản) của đám đông, rồi mới dịch chuyển mạnh (displacement) về phía mục tiêu thật.**

Video số 1 trong thư mục tóm gọn điều này: *"Nếu bạn không nhìn thấy thanh khoản, BẠN CHÍNH LÀ THANH KHOẢN"*, và *"SL của bạn là entry của big boys"*.

---

## 2. Các khái niệm bắt buộc phải hiểu

### 2.1 Cấu trúc thị trường (Market Structure)
- Xu hướng tăng: đỉnh cao hơn (HH) + đáy cao hơn (HL). Xu hướng giảm: LH + LL.
- **BOS (Break of Structure)**: phá đỉnh/đáy theo cùng xu hướng, nghĩa là xu hướng tiếp diễn.
- **MSS / CHoCH (Market Structure Shift)**: giá phá cấu trúc **ngược** xu hướng ngắn hạn, bằng một cây nến thân lớn. Đây là tín hiệu xác nhận đảo chiều ở khung nhỏ.
- HLZ gọi đây là *Structure Breaker / SDE (vùng cầu bị nhấn chìm)*. Lưu ý từ HLZ: **phá cấu trúc chưa phải là điểm vào lệnh**, nó chỉ là tín hiệu sớm; điểm vào là khi giá hồi lại.

### 2.2 Thanh khoản (Liquidity)
- **BSL (Buy-side liquidity)**: stop của phe bán nằm **trên** các đỉnh cũ, đỉnh bằng nhau (equal highs).
- **SSL (Sell-side liquidity)**: stop của phe mua nằm **dưới** các đáy cũ, đáy bằng nhau (equal lows).
- Các vùng thanh khoản cần đánh dấu mỗi ngày: **PDH/PDL** (đỉnh/đáy ngày hôm trước), **đỉnh/đáy phiên Á**, **đỉnh/đáy phiên London**, đỉnh/đáy tuần trước, đỉnh/đáy bằng nhau rõ ràng.
- **Sweep (quét thanh khoản)**: giá xuyên qua mức đó bằng râu nến hoặc vài nến rồi quay lại. Theo tài liệu quản trị rủi ro: *"Một liquidity sweep không phải entry"*. Cần thêm displacement và MSS.

### 2.3 Displacement
Nhịp di chuyển mạnh, nến thân dài, đi một mạch, thường để lại FVG. Đây là "dấu chân" của dòng tiền lớn và là bằng chứng thị trường thật sự đổi hướng.

### 2.4 PD Arrays (vùng giá để vào lệnh)
| Vùng | Định nghĩa ngắn | Cách dùng |
|---|---|---|
| **FVG (Fair Value Gap)** | Mẫu 3 nến: khoảng trống giữa râu nến 1 và râu nến 3, nến 2 là nến displacement | Đặt lệnh limit ở mép FVG hoặc ở điểm giữa (CE 50%) |
| **Order Block (OB)** | Cây nến ngược màu cuối cùng trước nhịp displacement | Giá hồi về OB thì vào lệnh; SL ngoài OB |
| **IFVG (FVG đảo ngược)** | FVG bị giá đóng cửa xuyên qua và đổi vai trò (hỗ trợ thành kháng cự hoặc ngược lại) | Rất hay gặp ở vàng sau cú quét; dùng như vùng vào lệnh |
| **Breaker** | OB bị phá, đổi vai trò | Giống "Flippy" của HLZ |

Đối chiếu HLZ với ICT (cùng ý tưởng, khác tên):
- **Base / SGB** (vùng đi ngang trước khi giá phá vỡ) ≈ **Order Block**
- **SDE** (vùng cầu bị nhấn chìm) ≈ **MSS / BOS bằng displacement**
- **Flippy** (cung thành cầu, vùng thao túng) ≈ **Breaker / vùng nhiễu**. HLZ: *không trade trong vùng Flippy*
- **FTB** (giá hồi về lần đầu) ≈ ICT chỉ dùng OB/FVG **lần chạm đầu tiên**. HLZ: *sau FTB không trade lại vùng đó*
- **Quasimodo / Over-Under (H, L, HH, LL)** ≈ **Sweep đỉnh rồi MSS**, đây chính là mô hình vào lệnh chính bên dưới
- **Golden Zone giữa H và HH** ≈ vùng Premium / OTE

### 2.5 Premium / Discount và OTE (Fibo)
- Kéo Fibo từ đáy đến đỉnh của nhịp vừa tạo. Trên 50% là **Premium** (vùng đắt, ưu tiên bán), dưới 50% là **Discount** (vùng rẻ, ưu tiên mua).
- **OTE (Optimal Trade Entry)**: chỉ bật 3 mức **0.5, 0.618, 0.786**, chờ giá vào vùng này và có phản ứng (theo ảnh "Cách sử dụng Fibo").
- Lệnh mua đẹp nhất: FVG/OB nằm **trong Discount**, trùng vùng OTE.

### 2.6 Chu kỳ trong ngày: IPDA / Power of 3 (AMD)
Theo tài liệu IPDA Market Cycle:

```
Consolidation (phiên Á)  →  Manipulation / Judas Swing (đầu London)  →  Expansion (London)
→  Consolidation (giữa giờ)  →  Retracement (8:00–8:30 NY)  →  Reversal hoặc Expansion (phiên Mỹ)
→  Reversal (10–11h NY, London close)  →  Consolidation (cuối ngày)
```
- **Phiên Á** tạo range, gom thanh khoản ở cả hai phía.
- **Judas Swing**: cú chạy giả quanh nửa đêm NY đến đầu London, quét một phía của range Á (thường kèm tin tức).
- **Expansion**: sau cú lừa, giá chạy mạnh về phía ngược lại.
- **Phiên Mỹ**: hoặc tiếp diễn hướng London sau một nhịp hồi, hoặc đảo chiều sau khi quét đỉnh/đáy London.

### 2.7 CRT: Candle Range Theory (ảnh HTF-LTF)
- Lấy một cây nến khung lớn (D1/H4). Đỉnh của nó là **CRTH**, đáy là **CRTL**.
- Nến tiếp theo **quét qua CRTH (hoặc CRTL) rồi đóng cửa quay lại bên trong range** (Turtle Soup / Turtle Body Soup).
- Xuống khung nhỏ (H4 → M5, D1 → H1…), chờ **Model #1**: phá cấu trúc ngược lại → vào lệnh.
- Mục tiêu: **50% của range**, sau đó là **phía đối diện** (CRTL hoặc CRTH).

### 2.8 Ba điều cho một setup A+ (tổng hợp)
1. **Context**: bias khung lớn rõ, đang ở Premium (để bán) hoặc Discount (để mua).
2. **Thanh khoản**: vừa có cú quét một mức thanh khoản quan trọng, **trong killzone**.
3. **Xác nhận**: displacement + MSS để lại FVG/OB, vào lệnh khi giá hồi lại.

---

## 3. Quản trị rủi ro (tóm tắt tài liệu "Quản trị rủi ro + Quản lí lệnh")

- **Rủi ro mỗi lệnh cố định: 0.5% đến 1% tài khoản.** Chuỗi 10 lệnh thua ở 0.5% chỉ mất khoảng 4.9%; ở 5% sẽ mất khoảng 40%.
- **Thứ tự đúng**: xác định điểm sai của setup, đặt SL ở đó, rồi tính lot. *Lot là kết quả, không phải điểm bắt đầu.*
- **TP đặt tại thanh khoản / PD array đối diện**. Nếu RR < 2 thì bỏ lệnh.
- **Giới hạn ngày**: tối đa 1 lệnh/ngày cho người mới. Thua thì dừng, không gỡ.
- **BE**: chỉ dời SL về hòa vốn khi chạm TP1 hoặc có cấu trúc xác nhận, không dời quá sớm.
- **Chấm điểm hành vi trước P&L.** Thua đúng hệ thống là lệnh tốt; thắng do phá luật là lệnh xấu.
- **Nhật ký**: Ngày | Setup | Long/Short | Entry | SL | TP | RR | Kết quả (R) | Tuân thủ | Ảnh | Ghi chú. Đã có sẵn trong file Excel.

---

## 4. Quy trình 4 bước gộp tất cả lại

```
1. CONTEXT    (D1/H4)  : Bias là gì? Giá đang ở Premium hay Discount? Mục tiêu thanh khoản kế tiếp ở đâu?
2. LOCATION   (H1/M15) : Đánh dấu PDH/PDL, range phiên Á, đỉnh/đáy London, FVG/OB H1.
3. TRIGGER    (M5/M1)  : Trong killzone: sweep, rồi displacement + MSS, rồi giá hồi về FVG/OB.
4. EXECUTION           : SL sau đỉnh/đáy quét, TP tại thanh khoản đối diện, RR ≥ 2, risk ≤ 1%.
```

Áp dụng cụ thể cho vàng: xem **02_Playbook_XAUUSD.md**.
