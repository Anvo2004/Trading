# ICT Gold Lab

Mở **index.html** bằng Chrome hoặc Edge (nhấp đúp). Lần đầu cần Internet để tải thư viện chart và font.

| Trang | Dùng để |
|---|---|
| Tổng quan | Tiến độ + lộ trình 8 tuần + giờ killzone hôm nay |
| Các chương (8) | Lý thuyết → Tài liệu (PDF/video trong `../Documents`) → Nhiệm vụ thực chiến → Bài kiểm tra (≥ 80%) |
| Ôn tập trắc nghiệm | 69 câu theo chương, chế độ "Ôn câu sai" |
| Kịch bản thực chiến | 24 bài lấy từ file Excel `03_Bo_du_lieu_luyen_tap_XAUUSD.xlsx` |
| Plan mỗi ngày | Tải giá vàng trực tuyến (PAXG/USDT ≈ XAUUSD, có ô bù chênh lệch) → bias D1, cấu trúc H4, Premium/Discount, mức thanh khoản, vùng S/R → kịch bản chính/phụ, điểm vô hiệu, giờ killzone; tự kiểm tra độ chính xác bias 30 ngày qua |
| Backtest Lab | Nạp CSV từ TradingView/MT5, tua từng nến, đặt lệnh, tự ghi nhật ký |
| Huấn luyện (trong Lab) | Replay tự dừng ở điểm cố định (trước killzone, khi quét, khi MSS) → hỏi xu hướng D1/H4, Premium/Discount, mức thanh khoản, yếu tố vào lệnh, vẽ FVG, đặt Entry/SL/TP → chấm điểm và tua tới kết quả |
| Công cụ vẽ (trong Lab) | Đường ngang, đường xu hướng, vùng chữ nhật, Fibo — phím H / T / R / F, Delete để xóa |
| Thử nghiệm chiến lược | Chạy tự động Mô hình A (Quét → MSS → FVG) hoặc Mô hình B (vùng S/R chạm ≥ 2 lần + EMA9 cắt EMA21 + Fibo 50%) với tham số tuỳ chỉnh |
| Báo cáo backtest | 6 năm XAUUSD M5 (2021–2026), ~30.000 lệnh mô phỏng, 71 cấu hình scalp/swing; mã nguồn Python trong `backtest/` |
| Chart TradingView | Chart trực tiếp XAUUSD |
| Nhật ký & thống kê | Winrate, kỳ vọng R, đường vốn, xuất CSV, sao lưu |
| Công cụ | Máy tính lot, đổi giờ server MT5, checklist in ra |

Dữ liệu (tiến độ, nhật ký) lưu trong trình duyệt. Dùng **Nhật ký → Sao lưu toàn bộ** định kỳ.

Các file: `index.html` (giao diện), `app.js` (logic), `content.js` (bài học + câu hỏi — sửa ở đây để thêm nội dung), `scenarios.js` (24 kịch bản).
