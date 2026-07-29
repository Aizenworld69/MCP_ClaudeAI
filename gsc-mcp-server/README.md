# Google Search Console MCP Server

Kết nối Google Search Console vào Claude qua MCP. Sau khi cài đặt, bạn có thể hỏi Claude trực tiếp kiểu:
- "Top 20 query có nhiều impression nhất tháng trước cho site X"
- "Trang nào bị tụt vị trí trung bình trong 28 ngày qua?"
- "Kiểm tra xem URL /blog/abc đã được Google index chưa"
- "Liệt kê các sitemap đã submit và lỗi của chúng"

## Các tool có sẵn

| Tool | Chức năng |
|---|---|
| `list_sites` | Liệt kê các site/property bạn có quyền truy cập |
| `search_analytics` | Query clicks, impressions, CTR, position theo query/page/country/device/date |
| `inspect_url` | Kiểm tra tình trạng index của 1 URL cụ thể |
| `list_sitemaps` | Liệt kê sitemap đã submit + trạng thái/lỗi |
| `submit_sitemap` | Submit lại 1 sitemap (cần quyền read-write, xem bước 3) |

## Bước 1 — Tạo OAuth credentials trên Google Cloud

1. Vào https://console.cloud.google.com/ → tạo project mới (hoặc dùng project có sẵn).
2. Vào **APIs & Services → Library**, bật **Google Search Console API**.
3. Vào **APIs & Services → OAuth consent screen**:
   - Chọn **External** (nếu dùng Gmail cá nhân) hoặc **Internal** (nếu Google Workspace).
   - Điền tên app, email — không cần submit verify vì chỉ bạn tự dùng (chọn **Testing** mode và thêm email của bạn vào **Test users**).
4. Vào **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: thêm `http://localhost:8765/oauth2callback`
   - Sau khi tạo, copy **Client ID** và **Client Secret**.

## Bước 2 — Cấu hình local

```bash
cd gsc-mcp
npm install
cp .env.example .env
```

Mở `.env` và điền `GSC_CLIENT_ID`, `GSC_CLIENT_SECRET` vừa lấy ở Bước 1.

## Bước 3 — Lấy refresh token

Mặc định script xin quyền **read-only** (`webmasters.readonly`) — đủ cho `list_sites`, `search_analytics`, `inspect_url`, `list_sitemaps`.

Nếu bạn muốn dùng `submit_sitemap` (cần ghi/submit), mở `src/get-refresh-token.js`, đổi dòng scope sang:
```js
const SCOPES = ["https://www.googleapis.com/auth/webmasters"];
```

Sau đó chạy:
```bash
npm run auth
```
Trình duyệt sẽ mở ra để bạn đăng nhập Google và cấp quyền. Sau khi xong, terminal in ra `refresh_token` — copy giá trị đó vào `.env` ở dòng `GSC_REFRESH_TOKEN`.

> Lưu ý: tài khoản Google bạn dùng để đăng nhập phải là tài khoản **đã được verify quyền sở hữu/quản lý** property đó trong Search Console (hoặc được thêm làm user với quyền phù hợp).

## Bước 4 — Test server độc lập (tùy chọn)

```bash
npm start
```
Nếu thấy dòng `Google Search Console MCP server running on stdio` là server đã sẵn sàng (server này giao tiếp qua stdio, không phải HTTP, nên không có gì hiện thêm — đó là bình thường).

## Bước 5 — Gắn vào Claude Desktop / Claude Code

Mở file cấu hình MCP của Claude Desktop (`claude_desktop_config.json`) và thêm:

```json
{
  "mcpServers": {
    "google-search-console": {
      "command": "node",
      "args": ["/duong/dan/tuyet-doi/toi/gsc-mcp/src/index.js"],
      "env": {
        "GSC_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "GSC_CLIENT_SECRET": "your-client-secret",
        "GSC_REFRESH_TOKEN": "your-refresh-token"
      }
    }
  }
}
```

Thay `/duong/dan/tuyet-doi/toi/gsc-mcp/src/index.js` bằng đường dẫn thực tế trên máy bạn. Khởi động lại Claude Desktop — tool sẽ xuất hiện trong danh sách MCP tools.

Nếu dùng **Claude Code**, thêm server tương tự vào `~/.claude/mcp_settings.json` (hoặc dùng lệnh `claude mcp add`), theo cùng cấu trúc command/args/env ở trên.

## Ghi chú bảo mật

- File `.env` chứa secret — không commit lên Git, không chia sẻ.
- Refresh token có hiệu lực cho tới khi bạn thu hồi quyền tại https://myaccount.google.com/permissions.
- Nếu đổi máy hoặc nghi ngờ lộ secret, thu hồi quyền và tạo lại credentials/refresh token.
