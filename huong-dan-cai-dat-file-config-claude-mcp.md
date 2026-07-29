# 📋 CẨM NANG HƯỚNG DẪN TỪ A-Z: CÁCH CẤU HÌNH FILE `claude_desktop_config.json` CHO MÁY MỚI HOÀN TOÀN

> **Dành cho người mới bắt đầu:** Tài liệu này hướng dẫn chi tiết cách tạo, chỉnh sửa và cài đặt file cấu hình **`claude_desktop_config.json`** trên ứng dụng **Claude Desktop** dành cho một máy tính hoàn toàn mới (chưa từng cài MCP Server).

---

## 💡 1. File `claude_desktop_config.json` Là Gì?

Hãy hình dung file **`claude_desktop_config.json`** như một **"Bảng công tắc điều khiển trung tâm"** của phần mềm Claude Desktop:
- File này cho Claude Desktop biết trên máy tính của bạn đang có những công cụ MCP nào (GA4, Google Search Console, Google Ads, Google Sheets...).
- Nó chỉ rõ cho Claude biết: **Code xử lý của tool nằm ở đâu trên ổ cứng** (`command` & `args`) và **dùng chìa khóa bảo mật nào để truy cập** (`env`).

---

## 🛠️ 2. Điều Kiện Bắt Buộc Trước Khi Cài Đặt (Prerequisites)

Trước khi chỉnh sửa file cấu hình này, người dùng trên máy tính mới **bắt buộc phải chuẩn bị 3 thứ sau**:

1. **Đã cài đặt ứng dụng Claude Desktop:**
   - Tải về tại: 👉 **[https://claude.ai/download](https://claude.ai/download)**
2. **Đã cài đặt môi trường Node.js (Bắt buộc):**
   - Các công cụ MCP chạy bằng mã nguồn JavaScript/TypeScript nên máy tính cần cài Node.js.
   - Tải bản Node.js LTS tại: 👉 **[https://nodejs.org/](https://nodejs.org/)** *(Chỉ cần tải về bấm Next ➔ Finish là xong)*.
3. **Đã có thư mục chứa mã nguồn MCP Server trên máy:**
   - Giải nén thư mục chứa các công cụ MCP (chứa các thư mục như `ga4-mcp-server`, `gsc-mcp-server`, `google-sheets-mcp`, `google-ads-mcp-unpacked`) vào một vị trí cố định trên ổ đĩa.
   - *Ví dụ:* Lưu tại `C:\MCP-Tools\` hoặc `D:\CongCuMCP\`.

---

## 📁 3. File `claude_desktop_config.json` Nằm Ở Đâu Trên Máy Tính?

File cấu hình này mặc định nằm trong thư mục cài đặt hệ thống của Claude trên Windows:

**Đường dẫn đầy đủ:**
`C:\Users\<Tên_Tài_Khoản_Windows>\AppData\Roaming\Claude\claude_desktop_config.json`

### ⚡ Cách mở thư mục chứa file nhanh nhất trong 3 giây:
1. Nhấn tổ hợp phím **`Windows + R`** trên bàn phím để mở hộp thoại *Run*.
2. Nhập chính xác dòng chữ sau và ấn **Enter**:
   ```text
   %APPDATA%\Claude
   ```
3. Thư mục cấu hình của Claude sẽ lập tức mở ra!
   - Nếu trong thư mục đã có sẵn file `claude_desktop_config.json`: Mở file đó ra bằng Notepad hoặc VS Code.
   - Nếu chưa có: Nhấp chuột phải ➔ Chọn **New** ➔ **Text Document** ➔ Đổi tên file thành chính xác: **`claude_desktop_config.json`** *(xóa bỏ đuôi `.txt` nếu có)*.

---

## ⚙️ 4. Mã Mẫu Cấu Hình Hoàn Chỉnh (Gộp 4 Dịch Vụ Google)

Dưới đây là đoạn mã cấu hình chuẩn mẫu. Người dùng chỉ cần copy đoạn mã này và dán vào file `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ga4-local": {
      "command": "node",
      "args": [
        "C:\\Path\\To\\Your\\Directory\\ga4-mcp-server\\index.js"
      ],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "C:\\Path\\To\\Your\\Directory\\ga4-mcp-server\\google-key.json"
      }
    },
    "google-sheets": {
      "command": "node",
      "args": [
        "C:\\Path\\To\\Your\\Directory\\google-sheets-mcp\\index.js"
      ],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "C:\\Path\\To\\Your\\Directory\\ga4-mcp-server\\google-key.json"
      }
    },
    "google-search-console": {
      "command": "node",
      "args": [
        "C:\\Path\\To\\Your\\Directory\\gsc-mcp-server\\index.js"
      ],
      "env": {
        "GSC_CLIENT_ID": "DIEN_CLIENT_ID_SEARCH_CONSOLE_CU_A_BAN",
        "GSC_CLIENT_SECRET": "DIEN_CLIENT_SECRET_SEARCH_CONSOLE_CU_A_BAN",
        "GSC_REFRESH_TOKEN": "DIEN_REFRESH_TOKEN_SEARCH_CONSOLE_CU_A_BAN"
      }
    },
    "google-ads": {
      "command": "node",
      "args": [
        "C:\\Path\\To\\Your\\Directory\\google-ads-mcp-unpacked\\dist\\index.js"
      ],
      "env": {
        "GOOGLE_ADS_DEVELOPER_TOKEN": "DIEN_DEVELOPER_TOKEN_ADS_CU_A_BAN",
        "GOOGLE_ADS_CLIENT_ID": "DIEN_CLIENT_ID_ADS_CU_A_BAN",
        "GOOGLE_ADS_CLIENT_SECRET": "DIEN_CLIENT_SECRET_ADS_CU_A_BAN",
        "GOOGLE_ADS_REFRESH_TOKEN": "DIEN_REFRESH_TOKEN_ADS_CU_A_BAN",
        "GOOGLE_ADS_CUSTOMER_ID": "1234567890",
        "MAX_DAILY_BUDGET_VND": "5000000"
      }
    }
  }
}
```

---

## 🚨 5. Quy Tắc Vàng Cần Nhớ Để Sửa File Không Bị Lỗi (Dành Cho Người Mới)

Khi chỉnh sửa file `claude_desktop_config.json`, người mới bắt buộc phải thay đổi 2 thông tin sau:

### 🔴 Quy Tắc 1: Đổi Đường Dẫn Ổ Đĩa Cho Đúng Máy Tính Của Bạn (`args`)
- Mã mẫu ghi: `"C:\\Path\\To\\Your\\Directory\\..."`
- Bạn phải đổi lại đúng nơi bạn lưu thư mục code trên máy mình.
- *Ví dụ:* Nếu bạn lưu thư mục ở ổ `D:\Tools\MCP-Tools\`:
  ➔ Phải sửa thành: `"D:\\Tools\\MCP-Tools\\ga4-mcp-server\\index.js"`

> [!CAUTION]
> **Chú ý về Dấu Xuyệt Ngược `\\` trong JSON:**
> Trong file JSON trên Windows, đường dẫn thư mục **bắt buộc phải dùng 2 dấu xuyệt ngược `\\`** (Ví dụ: `C:\\Users\\Admin\\...`) hoặc **1 dấu xuyệt đơn `/`** (Ví dụ: `C:/Users/Admin/...`).
> **KHÔNG ĐƯỢC** dùng 1 dấu xuyệt ngược `\` (như `C:\Users\...`) vì sẽ làm file JSON bị lỗi cú pháp!

---

### 🔴 Quy Tắc 2: Điền Các Mã Key / Token Cá Nhân (`env`)
Thay thế các chuỗi ký tự giữ chỗ (`DIEN_CLIENT_ID...`) bằng các mã bảo mật thật của bạn thu thập từ Google Cloud:
- `google-key.json`: Tệp chìa khóa JSON tải từ Google Cloud Service Account.
- `GSC_CLIENT_ID`, `GSC_CLIENT_SECRET`, `GSC_REFRESH_TOKEN`: Mã OAuth 2.0 lấy theo **Hướng dẫn Google Search Console (GSC)**.
- `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`...: Mã lấy theo **Hướng dẫn Google Ads**.

---

## 🚀 6. Kích Hoạt Cấu Hình & Kiểm Tra

1. Sau khi chỉnh sửa xong, bấm **Ctrl + S** để lưu lại file `claude_desktop_config.json`.
2. **Khởi động lại ứng dụng Claude Desktop:**
   - Tìm biểu tượng Claude ở khay hệ thống Taskbar (góc dưới bên phải gần đồng hồ).
   - Nhấp chuột phải vào biểu tượng Claude ➔ Chọn **Quit Claude**.
   - Mở lại ứng dụng **Claude Desktop**.
3. **Kiểm tra kết quả:**
   - Mở ô chat của Claude, nhìn xuống góc dưới bên phải sẽ thấy xuất hiện biểu tượng chiếc búa **🛠️ (MCP Tools)**.
   - Nhấn vào chiếc búa, nếu thấy danh sách các công cụ của GA4, GSC, Google Sheets, Google Ads liệt kê đầy đủ là bạn đã cài đặt thành công 100%!

---

## 📦 7. Hướng Dẫn Đóng Gói Bộ Công Cụ Để Gửi Cho Người Khác (Handoff Guide)

Nếu bạn muốn đóng gói trọn bộ hệ thống MCP này để chuyển giao cho đồng nghiệp hoặc khách hàng, hãy gửi cho họ tệp ZIP chứa:

1. 📂 **Thư mục chứa mã nguồn các MCP Server** (đã giải nén sẵn).
2. 📄 **Tệp mẫu `claude_desktop_config.json`** (đã chỉnh sẵn cấu trúc mẫu ở Bước 4).
3. 📚 **Bộ 4 file cẩm nang hướng dẫn Markdown (`.md`)** từng dịch vụ để họ tự tạo Key trên tài khoản Google của họ:
   - 📊 [huong-dan-setup-ga4-mcp.md](file:///c:/Users/PC/.gemini/antigravity-ide/scratch/huong-dan-setup-ga4-mcp.md)
   - 🔍 [huong-dan-setup-gsc-mcp.md](file:///c:/Users/PC/.gemini/antigravity-ide/scratch/huong-dan-setup-gsc-mcp.md)
   - 🎯 [huong-dan-setup-google-ads-mcp.md](file:///c:/Users/PC/.gemini/antigravity-ide/scratch/huong-dan-setup-google-ads-mcp.md)
   - 🟢 [huong-dan-setup-google-sheets-mcp.md](file:///c:/Users/PC/.gemini/antigravity-ide/scratch/huong-dan-setup-google-sheets-mcp.md)
   - 📋 [huong-dan-cai-dat-file-config-claude-mcp.md](file:///c:/Users/PC/.gemini/antigravity-ide/scratch/huong-dan-cai-dat-file-config-claude-mcp.md)
