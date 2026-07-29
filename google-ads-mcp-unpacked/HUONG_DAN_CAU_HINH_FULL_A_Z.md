# 📘 CẨM NANG HƯỚNG DẪN CẤU HÌNH GOOGLE ADS MCP CHO CLAUDE DESKTOP (TỪ A-Z)

Tài liệu này được biên soạn chi tiết từng bước, kèm theo link trang web và thao tác cụ thể để bất kỳ ai (dù không chuyên về lập trình) cũng có thể làm theo và tự tích hợp thành công tài khoản **Google Ads** vào **Claude Desktop**.

---

## 🎯 1. NGUYÊN LIỆU CẦN CHUẨN BỊ (5 THÔNG SỐ)

Để kết nối Google Ads vào Claude Desktop, bạn cần lấy đủ **5 thông số sau**:

| STT | Tên thông số | Mô tả | Nơi lấy |
|---|---|---|---|
| 1 | `GOOGLE_ADS_CUSTOMER_ID` | ID tài khoản Google Ads (10 số) | Trang Google Ads |
| 2 | `GOOGLE_ADS_DEVELOPER_TOKEN` | Token nhà phát triển | Trang Google Ads Manager (MCC) |
| 3 | `GOOGLE_ADS_CLIENT_ID` | OAuth 2.0 Client ID (Desktop app) | Google Cloud Console |
| 4 | `GOOGLE_ADS_CLIENT_SECRET` | OAuth 2.0 Client Secret | Google Cloud Console |
| 5 | `GOOGLE_ADS_REFRESH_TOKEN` | Mã cấp quyền truy cập lâu dài | Script xác thực 1-click |

---

## 📌 BƯỚC 1: LẤY GOOGLE ADS CUSTOMER ID (10 SỐ)

1. Truy cập vào trang quản trị: 👉 **[https://ads.google.com](https://ads.google.com)**
2. Đăng nhập tài khoản Google của bạn.
3. Nhìn lên **góc trên cùng bên phải màn hình** (hoặc trên thanh địa chỉ URL):
   - Bạn sẽ thấy dãy số dạng `123-456-7890`.
   - **Lưu ý:** Copy 10 chữ số này và bỏ các dấu gạch ngang `-` đi (Ví dụ: `1234567890` hoặc `4508222841`).

---

## 📌 BƯỚC 2: TẠO TÀI KHOẢN MANAGER (MCC) & LẤY DEVELOPER TOKEN

*(Google chỉ cấp Developer Token cho tài khoản Quản lý MCC)*

1. Truy cập trang tạo tài khoản Quản lý: 👉 **[https://ads.google.com/home/tools/manager-accounts/](https://ads.google.com/home/tools/manager-accounts/)**
2. Bấm nút màu xanh **"Chuyển đến Tài khoản người quản lý"** (hoặc *Bắt đầu ngay*).
3. Điền các thông tin cơ bản:
   - **Tên hiển thị của tài khoản**: Gõ tên bất kỳ (Ví dụ: `MCC Của Tôi` hoặc `Tài Khoản Quản Lý`).
   - Mục đích sử dụng: Chọn *Quản lý tài khoản của tôi* hoặc *Quản lý tài khoản người khác*.
   - Quốc gia / Múi giờ / Tiền tệ: Giữ nguyên Việt Nam / GMT+7 / VNĐ.
   - Bấm **Gửi** ➔ Bấm **Khám phá tài khoản của bạn**.
4. Khi đã vào giao diện chính của tài khoản MCC:
   - Ở menu bên trái (hoặc bánh răng góc trên), chọn **Cài đặt** *(Setup)* ➔ Chọn **Trung tâm API** *(API Center)*.
   - Hoặc truy cập trực tiếp link: 👉 **[https://ads.google.com/aw/apicenter](https://ads.google.com/aw/apicenter)**
5. Điền form đăng ký API ngắn:
   - Tên công ty / Người đại diện: Điền tên của bạn.
   - Trang web: Điền trang web của bạn (hoặc link Facebook/Zalo).
   - Loại hình: Chọn **Các nhà phát triển Google Ads độc lập**.
   - Mục đích sử dụng: Gõ `Báo cáo và quản lý nội bộ`.
   - Tích chọn điều khoản ➔ Bấm **Tạo mã thông báo** *(Create token)*.
6. Mã **Developer Token** (chuỗi khoảng 22 ký tự, ví dụ: `4ZZ4fwjX51cIndShglOdcg`) sẽ hiển thị. **Copy mã này lại**.

---

## 📌 BƯỚC 3: TẠO OAUTH 2.0 CREDENTIALS TRÊN GOOGLE CLOUD CONSOLE

1. Truy cập trang Google Cloud Credentials: 👉 **[https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)**
2. Nhấn vào nút xanh **`+ Create credentials`** ở góc trên ➔ Chọn **`OAuth client ID`**.
3. **Cấu hình OAuth Consent Screen (Nếu Google yêu cầu):**
   - Nếu màn hình hiện cảnh báo màu vàng *To create an OAuth client ID, you must first configure your consent screen*, bấm **`Configure consent screen`**.
   - Chọn **External** (Bên ngoài) ➔ Bấm **Create**.
   - Điền tên ứng dụng: `Claude Ads`.
   - Chọn Email của bạn ở ô Support Email và Developer Contact Info.
   - Bấm **Save and Continue** đến khi hoàn tất.
4. **Thêm Email của bạn vào Test Users (Quan trọng để tránh lỗi 403 access_denied):**
   - Vào link: 👉 **[https://console.cloud.google.com/auth/audience](https://console.cloud.google.com/auth/audience)**
   - Ở mục **Test users**, bấm **`+ ADD USERS`**.
   - Nhập Email của bạn (Ví dụ: `baohoaitran3112@gmail.com`) ➔ Bấm **Save**.
5. **Tạo Client ID Desktop:**
   - Quay lại trang [Credentials](https://console.cloud.google.com/apis/credentials) ➔ Bấm **`+ Create credentials`** ➔ Chọn **`OAuth client ID`**.
   - Tại ô **Application type**: Chọn **Desktop app** *(Ứng dụng dành cho máy tính)*.
   - Đặt tên: `Claude MCP Client`.
   - Bấm **Create**.
6. Màn hình sẽ hiện ra bảng chứa:
   - **Client ID**: Dạng `755614054363-ktmv...apps.googleusercontent.com`
   - **Client Secret**: Dạng `GOCSPX-x4Wt...`
   - 👉 **Copy 2 mã này lưu lại**.

---

## 📌 BƯỚC 4: BẬT GOOGLE ADS API SERVICE

1. Truy cập thư viện Google Ads API: 👉 **[https://console.cloud.google.com/apis/library/googleads.googleapis.com](https://console.cloud.google.com/apis/library/googleads.googleapis.com)**
2. Bấm vào nút màu xanh **"ENABLE"** (hoặc *BẬT*).

---

## 📌 BƯỚC 5: BIÊN DỊCH CODE & LẤY REFRESH TOKEN

1. Mở Cửa sổ **PowerShell** trên máy tính, gõ các lệnh sau để cài đặt và biên dịch:

```powershell
cd d:\TrangWebCongTy\.agents\google-ads-mcp
npm install
npm run build
```

2. Chạy script hỗ trợ lấy `Refresh Token` 1-click:

```powershell
$env:GOOGLE_ADS_CLIENT_ID="DÁN_CLIENT_ID_BƯỚC_3_VÀO_ĐÂY"
$env:GOOGLE_ADS_CLIENT_SECRET="DÁN_CLIENT_SECRET_BƯỚC_3_VÀO_ĐÂY"

npm run get-token
```

3. Màn hình sẽ in ra một đường link đăng nhập Google. Bạn giữ phím `Ctrl` + Click vào đường link đó.
4. Chọn tài khoản Google của bạn ➔ Bấm **Tiếp tục** (Continue) ➔ Bấm **Cho phép** (Allow).
5. Màn hình trình duyệt báo *"Thành công!"* và trong Terminal sẽ tự động hiển thị mã **`GOOGLE_ADS_REFRESH_TOKEN`** (dạng `1//0gEdp...`). Copy mã này.

---

## 📌 BƯỚC 6: XIN NÂNG CẤP BASIC ACCESS (ĐỂ ĐỌC TÀI KHOẢN THẬT)

1. Mở trang [Trung tâm API (API Center)](https://ads.google.com/aw/apicenter).
2. Tại dòng **Cấp truy cập** *(Access level)*, bấm **Xin cấp quyền truy cập cơ bản** *(Apply for Basic Access)*.
3. Mở form đăng ký: 👉 **[Link Form Xin Basic Access](https://support.google.com/adspolicy/contact/new_token_application)**
4. Điền các mục chính:
   - **Project Number**: Nhập mã số Project Number từ Google Cloud (Ví dụ: `755614054363`).
   - **MCC ID**: `450-822-2841`
   - **Is this internal or external tool?**: Chọn `Internal users - employees only`.
   - **Mô tả công cụ**: `An internal reporting tool integrated with Claude Desktop via MCP protocol for personal account performance analytics.`
   - **File thiết kế (.doc)**: Đính kèm file `Claude_Ads_MCP_Design.doc`.
   - **Campaign types**: `Search, Performance Max, Display, Video`
   - **Capabilities**: Tích chọn `Campaign Management` và `Reporting`.
5. Tích đồng ý điều khoản và bấm **Submit**.

---

## 📌 BƯỚC 7: CẤU HÌNH VÀO CLAUDE DESKTOP

1. Nhấn `Win + R`, gõ `%APPDATA%\Claude\claude_desktop_config.json` và ấn Enter.
2. Thêm đoạn cấu hình sau vào mục `"mcpServers"`:

```json
{
  "mcpServers": {
    "google-ads": {
      "command": "node",
      "args": [
        "d:/TrangWebCongTy/.agents/google-ads-mcp/dist/index.js"
      ],
      "env": {
        "GOOGLE_ADS_DEVELOPER_TOKEN": "DÁN_DEVELOPER_TOKEN_BƯỚC_2",
        "GOOGLE_ADS_CLIENT_ID": "DÁN_CLIENT_ID_BƯỚC_3",
        "GOOGLE_ADS_CLIENT_SECRET": "DÁN_CLIENT_SECRET_BƯỚC_3",
        "GOOGLE_ADS_REFRESH_TOKEN": "DÁN_REFRESH_TOKEN_BƯỚC_5",
        "GOOGLE_ADS_CUSTOMER_ID": "DÁN_CUSTOMER_ID_BƯỚC_1",
        "MAX_DAILY_BUDGET_VND": "5000000"
      }
    }
  }
}
```

3. **Khởi động lại Claude Desktop**:
   - Tắt ứng dụng Claude Desktop ở góc dưới khay hệ thống (System Tray).
   - Mở lại Claude Desktop.
   - Biểu tượng chiếc búa 🔨 sẽ tự động xuất hiện!

---

## ❓ 8. CÁC LỖI THƯỜNG GẶP & CÁCH XỬ LÝ (TROUBLESHOOTING)

### 🔴 Lỗi 1: Claude báo "Google Ads MCP chưa kết nối" hoặc "The developer token is approved for test accounts only"
- **Nguyên nhân**: Mã Developer Token mới tạo mặc định ở cấp độ **Test Access** (chỉ đọc được tài khoản thử nghiệm). Khi gọi đọc tài khoản thật, Google Ads API sẽ phản hồi từ chối. Nhận thông báo từ chối này, con bot AI Claude bị nhầm tưởng là chưa kết nối ứng dụng nên khuyên bạn vào Settings.
- **Cách xử lý**: **Không cần sửa code hay kết nối lại**. Bạn đã hoàn thành Bước 6 (Gửi đơn xin Basic Access). Chỉ cần chờ Google duyệt đơn và gửi email thông báo thành công (thường 24h). Ngay khi được duyệt, câu lệnh sẽ tự động chạy mượt mà.

### 🔴 Lỗi 2: Lỗi `redirect_uri_mismatch` (Lỗi 400) khi lấy token
- **Nguyên nhân**: Tạo nhầm Client ID loại *Web Application* thay vì *Desktop app*.
- **Cách xử lý**: Thực hiện đúng Bước 3 -> Chọn loại ứng dụng là **Desktop app** (Ứng dụng dành cho máy tính).

### 🔴 Lỗi 3: Lỗi `403: access_denied` (Claude Ads chưa hoàn tất xác minh)
- **Nguyên nhân**: Ứng dụng Google Cloud đang ở chế độ Testing và chưa thêm email cá nhân vào danh sách kiểm thử.
- **Cách xử lý**: Thực hiện Bước 3.4 -> Truy cập trang [Test Users](https://console.cloud.google.com/auth/audience) và bấm **+ ADD USERS** thêm email của bạn vào.

---

## 💬 MẪU CÂU LỆNH HỎI CLAUDE ĐỂ QUẢN LÝ ADS

Sau khi được duyệt Basic Access, bạn có thể chat bằng tiếng Việt tự nhiên:

- 📊 *"Cho tôi xem báo cáo tổng quan Google Ads 7 ngày qua."*
- 🔍 *"Liệt kê danh sách các chiến dịch đang chạy kèm ngân sách ngày."*
- 💡 *"Tìm giúp tôi các cụm từ tìm kiếm thực tế ngốn tiền nhất tuần này."*
- 🎯 *"Từ khóa nào đang có Điểm chất lượng (Quality Score) thấp dưới 5 điểm?"*
- ⏸️ *"Tạm dừng chiến dịch ID 123456 giúp tôi."*
- 💸 *"Nâng ngân sách chiến dịch ID 987654 lên 1.000.000 VNĐ/ngày."*
