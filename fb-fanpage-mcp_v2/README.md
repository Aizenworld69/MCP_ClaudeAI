# MCP Server đăng bài Facebook Fanpage

MCP server chạy local, cho phép Claude Desktop đăng bài (text hoặc kèm ảnh) lên một Fanpage Facebook thông qua Graph API.

## 1. Cài Node.js

Cần Node.js bản 18 trở lên. Kiểm tra bằng:
```
node -v
```
Nếu chưa có, tải tại https://nodejs.org

## 2. Cài thư viện

Mở terminal, vào thư mục chứa 2 file `index.js` và `package.json`, chạy:
```
npm install
```

## 3. Lấy Facebook Page Access Token

Đây là bước quan trọng nhất và hơi mất công vì Facebook yêu cầu app + quyền hạn rõ ràng:

1. Vào https://developers.facebook.com/ → tạo một **App** mới (loại "Business").
2. Trong App, thêm sản phẩm **Facebook Login** và **Pages API**.
3. Vào **Graph API Explorer** (https://developers.facebook.com/tools/explorer/):
   - Chọn App bạn vừa tạo.
   - Chọn "User Token", cấp quyền: `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`.
   - Bấm "Generate Access Token", đăng nhập bằng tài khoản admin của Fanpage.
4. Sau khi có User Token, gọi endpoint sau để lấy danh sách Page + **Page Access Token**:
   ```
   GET /me/accounts
   ```
   Kết quả trả về sẽ có `id` (Page ID) và `access_token` (Page Access Token) cho từng Fanpage bạn quản lý.
5. **Lưu ý:** Page Access Token lấy theo cách trên thường hết hạn sau 1-2 giờ. Để dùng lâu dài, bạn nên đổi sang **long-lived token** (hạn ~60 ngày) hoặc xin App Review để có token không hết hạn cho production. Tài liệu: https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived

## 4. Cấu hình vào Claude Desktop

Mở Claude Desktop → Settings → Developer → Edit Config. Thêm đoạn sau vào `claude_desktop_config.json` (thay đường dẫn và token cho đúng):

```json
{
  "mcpServers": {
    "fb-fanpage": {
      "command": "node",
      "args": ["/duong-dan-toi/fb-fanpage-mcp/index.js"],
      "env": {
        "FB_PAGE_ID": "123456789012345",
        "FB_PAGE_ACCESS_TOKEN": "dan_token_page_vao_day",
        "FB_GRAPH_API_VERSION": "v21.0"
      }
    }
  }
}
```

Lưu file, **tắt hoàn toàn** Claude Desktop rồi mở lại (không chỉ đóng cửa sổ).

## 5. Kiểm tra

Trong Claude Desktop, bấm nút "+" cạnh ô chat → "Connectors" → sẽ thấy `fb-fanpage` đang chạy với 2 tool:
- `create_post` — đăng bài text (kèm link tùy chọn)
- `create_photo_post` — đăng bài kèm ảnh (theo URL ảnh công khai)

Thử hỏi Claude: "Đăng lên Fanpage dòng chữ: Xin chào mọi người!" — Claude sẽ gọi tool `create_post` để thực hiện.

## Bảo mật

- Không chia sẻ Page Access Token cho ai, không commit lên GitHub công khai.
- Token có toàn quyền đăng bài thay mặt Fanpage — hãy giữ file config an toàn.
