# Hướng Dẫn Giữ Web Server "Tỉnh Giấc" 24/7 (Miễn Phí)

Vì Render/Replit bản miễn phí sẽ tự tắt server sau 15 phút nếu không ai vào, nên bạn cần một dịch vụ bên ngoài "ping" (gọi) vào web của bạn liên tục.

Cách tốt nhất và miễn phí là dùng **UptimeRobot**. Nó hoạt động độc lập, không cần Bot của bạn phải đang chạy.

### Bước 1: Đăng ký UptimeRobot
1. Truy cập [uptimerobot.com](https://uptimerobot.com/).
2. Nhấn **"Register for FREE"**.
3. Đăng ký tài khoản và đăng nhập.

### Bước 2: Tạo Monitor mới
1. Nhấn nút **"+ Add New Monitor"** màu xanh.
2. Chọn **Monitor Type**: `HTTP(s)`.
3. Điền thông tin:
   - **Friendly Name**: Tên tùy ý (ví dụ: `Key Server`).
   - **URL (or IP)**: Dán link web server Render của bạn vào (ví dụ: `https://my-key-server.onrender.com/ping`).
     > **Lưu ý:** Thêm `/ping` vào cuối link để server trả lời nhanh nhất.
   - **Monitoring Interval**: Để mặc định `5 minutes` (5 phút check 1 lần).
4. Nhấn **"Create Monitor"**.

🎉 **Xong!** Bây giờ UptimeRobot sẽ tự động vào web của bạn mỗi 5 phút. Server sẽ không bao giờ bị ngủ nữa, kể cả khi bạn tắt máy tính hay tắt Bot.

---

### Endpoint Ping đã thêm:
Trong code server tôi đã thêm sẵn đường dẫn `/ping`:
- URL: `https://<link-web-của-bạn>/ping`
- Nó sẽ trả về chữ `pong` rất nhẹ, giúp server không bị quá tải.
