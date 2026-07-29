# 🍎 CẨM NANG CHI TIẾT A-Z: CÀI ĐẶT GOOGLE ADS MCP CHO MÁY MACBOOK (macOS) & ANTIGRAVITY IDE

Tài liệu này được biên soạn riêng cho **máy tính chạy hệ điều hành macOS (MacBook / Mac mini / iMac)** và môi trường **Antigravity IDE / Claude Desktop**. Đã tích hợp sẵn trọn bộ 5 mã bảo mật đã tạo thành công của tài khoản `quynhleayp@gmail.com`.

---

## 🔑 1. BỘ 5 MÃ BẢO MẬT GOOGLE ADS ĐÃ TẠO SẴN

```env
GOOGLE_ADS_CUSTOMER_ID=1131632286
GOOGLE_ADS_DEVELOPER_TOKEN=YOUR_DEVELOPER_TOKEN_HERE
GOOGLE_ADS_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_ADS_REFRESH_TOKEN=YOUR_REFRESH_TOKEN_HERE
```

---

## 🛠️ 2. ĐIỀU KIỆN NỀN TẢNG CẦN CÓ TRÊN MÁY MACBOOK

Trước khi cài đặt, máy macOS cần đảm bảo 2 điều kiện sau:

1. **Đã cài đặt Node.js:**
   - Mở ứng dụng **Terminal** trên Mac và gõ lệnh: `node -v`
   - Nếu chưa có Node.js, tải bản macOS PKG tại: 👉 **[https://nodejs.org](https://nodejs.org)** (hoặc dùng Homebrew: `brew install node`).
2. **Đã tải thư mục mã nguồn Google Ads MCP:**
   - Tải thư mục `google-ads-mcp-unpacked` và giải nén vào một vị trí trên Mac.
   - *Ví dụ đường dẫn trên Mac:* `/Users/ten_user_mac/mcp/google-ads-mcp-unpacked`

---

## 🖥️ 3. HƯỚNG DẪN CẤU HÌNH TRÊN MÁY macOS

### 📍 TRƯỜNG HỢP 1: Cấu Hình Cho Claude Desktop Trên macOS

Trên máy macOS, file cấu hình Claude Desktop nằm tại đường dẫn:
`~/Library/Application Support/Claude/claude_desktop_config.json`

1. Mở ứng dụng **Terminal** trên Mac, gõ lệnh sau để tạo/mở file:
   ```bash
   open -e "~/Library/Application Support/Claude/claude_desktop_config.json"
   ```

2. Dán đoạn mã JSON dưới đây vào file (thay `/Users/ten_user_mac/` bằng tên User thực tế trên máy Mac đó):

```json
{
  "mcpServers": {
    "google-ads": {
      "command": "node",
      "args": [
        "/Users/ten_user_mac/mcp/google-ads-mcp-unpacked/dist/index.js"
      ],
      "env": {
        "GOOGLE_ADS_CUSTOMER_ID": "1131632286",
        "GOOGLE_ADS_DEVELOPER_TOKEN": "YOUR_DEVELOPER_TOKEN_HERE",
        "GOOGLE_ADS_CLIENT_ID": "YOUR_CLIENT_ID.apps.googleusercontent.com",
        "GOOGLE_ADS_CLIENT_SECRET": "YOUR_CLIENT_SECRET_HERE",
        "GOOGLE_ADS_REFRESH_TOKEN": "YOUR_REFRESH_TOKEN_HERE",
        "MAX_DAILY_BUDGET_VND": "5000000"
      }
    }
  }
}
```

> [!IMPORTANT]
> **Định dạng đường dẫn trên macOS (UNIX Path):**
> Trên máy Mac, đường dẫn thư mục dùng dấu xuyệt đơn `/` (Ví dụ: `/Users/username/Desktop/...`), KHÔNG dùng dấu xuyệt ngược `\` của Windows.

---

### 📍 TRƯỜNG HỢP 2: Cấu Hình Trực Tiếp Trong Antigravity IDE Trên macOS

Nếu bạn đưa công cụ này vào **Antigravity IDE**:

1. Mở phần mềm **Antigravity IDE** trên Mac.
2. Mở phần **Settings (Cài đặt) ➔ MCP Servers** (hoặc mở file cấu hình `.mcp_settings.json` / `mcp.json` trong workspace).
3. Thêm cấu hình JSON sau:

```json
{
  "mcpServers": {
    "google-ads": {
      "command": "node",
      "args": [
        "/Users/ten_user_mac/mcp/google-ads-mcp-unpacked/dist/index.js"
      ],
      "env": {
        "GOOGLE_ADS_CUSTOMER_ID": "1131632286",
        "GOOGLE_ADS_DEVELOPER_TOKEN": "YOUR_DEVELOPER_TOKEN_HERE",
        "GOOGLE_ADS_CLIENT_ID": "YOUR_CLIENT_ID.apps.googleusercontent.com",
        "GOOGLE_ADS_CLIENT_SECRET": "YOUR_CLIENT_SECRET_HERE",
        "GOOGLE_ADS_REFRESH_TOKEN": "YOUR_REFRESH_TOKEN_HERE",
        "MAX_DAILY_BUDGET_VND": "5000000"
      }
    }
  }
}
```

---

## 🚀 4. KÍCH HOẠT VÀ KIỂM TRA

1. Khởi động lại **Claude Desktop** hoặc **Antigravity IDE** trên máy Mac.
2. Kiểm tra biểu tượng chiếc búa **🛠️ (MCP Tools)**.
3. Ra lệnh bằng tiếng Việt:
   - *"Liệt kê danh sách các tài khoản quảng cáo hoặc chiến dịch Google Ads."*
   - *"Tóm tắt chi tiêu và hiệu suất Google Ads."*

---

## ❓ XỬ LÝ LỖI PHỔ BIẾN TRÊN MACOS

| Lỗi thường gặp trên Mac | Nguyên nhân | Cách xử lý |
|---|---|---|
| `command not found: node` | macOS chưa nhận đường dẫn Node.js. | Mở Terminal gõ `which node` (thường ra `/usr/local/bin/node` hoặc `/opt/homebrew/bin/node`), thay giá trị này vào ô `"command"` thay cho chữ `"node"`. |
| `Permission denied` | File chưa có quyền thực thi. | Mở Terminal gõ: `chmod +x /Users/ten_user_mac/mcp/google-ads-mcp-unpacked/dist/index.js`. |
