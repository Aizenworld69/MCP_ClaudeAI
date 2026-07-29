# 📘 CẨM NANG CHI TIẾT A-Z: CÀI ĐẶT & CẤU HÌNH FACEBOOK FANPAGE MCP (V2.0)
### 🚀 ÁP DỤNG CHO: MÁY TÍNH WINDOWS & MACBOOK (macOS) | CLAUDE DESKTOP & ANTIGRAVITY IDE

Tài liệu này hướng dẫn chi tiết từng thao tác click chuột ("vào đâu, lấy cái gì, ấn vào đâu") để cấu hình và sử dụng thành công công cụ **Facebook Fanpage MCP (v2.0)**. Công cụ cho phép AI đăng bài, quản lý ảnh/video, tương tác bình luận, quản lý Inbox tin nhắn và xem báo cáo chỉ số thống kê Fanpage tự động.

---

## 📋 MỤC LỤC
1. **Danh Sách 19 Tính Năng (MCP Tools) Đã Hỗ Trợ**
2. **Hướng Dẫn Chi Tiết Lấy 3 Mã Bảo Mật Facebook Graph API (A-Z)**
   - *Bước 2.1:* Tạo App trên Meta for Developers
   - *Bước 2.2:* Chọn các Quyền Hạn (Permissions) cần thiết
   - *Bước 2.3:* Sử dụng Graph API Explorer lấy User Access Token
   - *Bước 2.4:* Tạo Long-Lived Page Access Token (Kéo dài hạn token / Không hết hạn)
   - *Bước 2.5:* Lấy `FB_PAGE_ID` và `FB_PAGE_ACCESS_TOKEN`
3. **Điều Kiện Nền Tảng Cần Có Trên Máy Tính**
4. **Hướng Dẫn Cấu Hình File JSON (Windows & macOS)**
   - Trường hợp 1: Claude Desktop
   - Trường hợp 2: Antigravity IDE (hoặc Cursor / VS Code)
5. **Kích Hoạt & Các Câu Lệnh Mẫu Thực Tế (Prompts)**
6. **Bảng Xử Lý Lỗi Thường Gặp (Troubleshooting)**

---

## 🛠️ 1. DANH SÁCH 19 TÍNH NĂNG (MCP TOOLS)

| Nhóm chức năng | Tên Tool MCP | Công dụng | Quyền FB yêu cầu |
|---|---|---|---|
| **Thông tin Fanpage** | `get_page_info` | Xem thông tin chi tiết Fanpage (Tên, Like, Category...) | `pages_read_engagement` |
| **Quản lý Bài đăng** | `list_posts` | Lấy danh sách bài viết đã đăng | `pages_read_engagement` |
| | `create_post` | Đăng bài viết chữ (có thể gắn Link, hẹn giờ đăng) | `pages_manage_posts` |
| | `create_photo_post` | Đăng bài kèm 01 hình ảnh (URL công khai) | `pages_manage_posts` |
| | `create_multi_photo_post` | Đăng bài kèm nhiều hình ảnh cùng lúc | `pages_manage_posts` |
| | `publish_video` | Đăng Video lên Fanpage | `pages_manage_posts` |
| | `delete_post` | Xóa bài viết trên Fanpage theo Post ID | `pages_manage_posts` |
| **Quản lý Bình luận** | `list_comments` | Xem danh sách bình luận của bài viết | `pages_read_engagement` |
| | `create_comment` | Đăng bình luận hoặc Trả lời bình luận của khách | `pages_manage_engagement` |
| | `delete_comment` | Xóa bình luận | `pages_manage_engagement` |
| | `hide_comment` | Ẩn bình luận rác / bảo mật thông tin khách | `pages_manage_engagement` |
| | `unhide_comment` | Bỏ ẩn bình luận | `pages_manage_engagement` |
| | `like_comment` | Thích (Like) bình luận của khách | `pages_manage_engagement` |
| | `unlike_comment` | Bỏ thích bình luận | `pages_manage_engagement` |
| **Quản lý Inbox** | `list_conversations` | Lấy danh sách cuộc trò chuyện trong Inbox | `pages_messaging` |
| | `get_conversation_messages` | Đọc tin nhắn chi tiết trong từng cuộc hội thoại | `pages_messaging` |
| | `send_inbox_message` | Trả lời tin nhắn trực tiếp cho khách hàng | `pages_messaging` |
| **Thống kê & Insights** | `get_post_insights` | Xem chỉ số tương tác, lượt xem của 1 bài viết | `read_insights` |
| | `get_page_insights` | Xem tổng quan hiệu suất Fanpage (Lượt xem, Reach...) | `read_insights` |

---

## 🔑 2. HƯỚNG DẪN LẤY BỘ MÃ FB GRAPH API (CHI TIẾT TỪNG BƯỚC)

Để MCP Server kết nối được với Fanpage, bạn cần 3 thông số:
- `FB_PAGE_ID`: ID đại diện của Fanpage.
- `FB_PAGE_ACCESS_TOKEN`: Mã xác thực có quyền đăng bài & quản lý trang.
- `FB_GRAPH_API_VERSION`: Phiên bản API (Mặc định: `v21.0`).

---

### 📌 BƯỚC 2.1: Tạo Ứng Dụng (App) Trên Meta For Developers

1. Truy cập vào trang web: 👉 **[https://developers.facebook.com/](https://developers.facebook.com/)**
2. Đăng nhập bằng tài khoản Facebook của bạn (Tài khoản đang làm **Quản trị viên / Admin** của Fanpage).
3. Ở góc trên bên phải màn hình, bấm vào **My Apps** (Ứng dụng của tôi).
4. Bấm nút màu xanh **Create App** (Tạo ứng dụng).
5. Tại màn hình chọn mục đích:
   - Chọn **Other** (Khác) hoặc **Business** (Doanh nghiệp) ➔ Bấm **Next** (Tiếp theo).
   - Chọn loại ứng dụng: **Business** (Doanh nghiệp) ➔ Bấm **Next**.
6. Nhập tên ứng dụng tại mục **App Name** (Ví dụ: `Fanpage AI Assistant`) ➔ Bấm nút **Create App**. (Nhập mật khẩu Facebook nếu hệ thống yêu cầu).

---

### 📌 BƯỚC 2.2: Lấy User Access Token Tại Graph API Explorer

1. Mở công cụ **Graph API Explorer** của Meta tại liên kết:
   👉 **[https://developers.facebook.com/tools/explorer/](https://developers.facebook.com/tools/explorer/)**
2. Nhìn sang cột bên phải **Meta App**: Chọn đúng Tên App bạn vừa tạo ở Bước 2.1 (ví dụ: `Fanpage AI Assistant`).
3. Tại ô **User or Page**: Chọn **User Token**.
4. Tại mục **Permissions** (Quyền hạn), bấm nút **Add a Permission** và lần lượt tìm + bấm chọn **6 quyền** sau:
   - `pages_show_list` (Cho phép xem danh sách các Fanpage bạn quản lý)
   - `pages_read_engagement` (Cho phép đọc bài viết, tương tác, bình luận)
   - `pages_manage_posts` (Cho phép đăng bài, upload ảnh, video)
   - `pages_manage_engagement` (Cho phép trả lời bình luận, ẩn/hiện, like bình luận)
   - `pages_messaging` (Cho phép đọc và gửi tin nhắn Inbox)
   - `read_insights` (Cho phép xem báo cáo thống kê Fanpage)
5. Sau khi chọn đủ 6 quyền, bấm nút màu xanh **Generate Access Token**.
6. Cửa sổ Facebook sẽ hiện ra hỏi xác nhận:
   - Bấm **Tiếp tục dưới tên [Tên Facebook của bạn]**.
   - Tick chọn các Fanpage bạn muốn cấp quyền cho AI ➔ Bấm **Tiếp theo** ➔ Bấm **Đã xong** ➔ Bấm **OK**.

---

### 📌 BƯỚC 2.3: Lấy Page ID & Page Access Token Tạm Thời

1. Vẫn tại màn hình **Graph API Explorer**:
   - Ở ô nhập URL ở giữa (cạnh chữ **GET** và **v21.0**), nhập đoạn mã sau:
     ```text
     me/accounts
     ```
   - Bấm nút **Submit** màu xanh ở bên phải.
2. Tại khung **Response** bên dưới, bạn sẽ thấy kết quả dạng JSON chứa danh sách Fanpage của bạn:

```json
{
  "data": [
    {
      "access_token": "EAAG...",
      "category": "E-commerce Website",
      "name": "Tên Fanpage Của Bạn",
      "id": "123456789012345",
      "tasks": [...]
    }
  ]
}
```

3. **LƯU LẠI 2 THÔNG SỐ:**
   - Giá trị trong trường `"id"` ➔ Đây chính là **`FB_PAGE_ID`** (Ví dụ: `123456789012345`).
   - Giá trị trong trường `"access_token"` ➔ Đây là **`FB_PAGE_ACCESS_TOKEN`** (Tạm thời).

> [!WARNING]
> Token lấy trực tiếp theo cách trên chỉ có hạn dùng ngắn (**1 đến 2 giờ**). Nếu muốn dùng lâu dài (không lo hết hạn), bạn phải làm tiếp **Bước 2.4** bên dưới!

---

### 📌 BƯỚC 2.4: Đổi Sang Token Dùng Lâu Dài (Long-Lived Page Access Token)

Để tạo Token **KHÔNG HẾT HẠN** (Dùng vĩnh viễn trừ khi đổi mật khẩu FB):

1. **Lấy App ID và App Secret:**
   - Vào lại trang [Meta Developers Dashboard](https://developers.facebook.com/apps/) ➔ Chọn App của bạn.
   - Ở menu bên trái: Bấm **App settings** (Cài đặt ứng dụng) ➔ Chọn **Basic** (Cơ bản).
   - Copy mã **App ID** và bấm **Show** để copy mã **App Secret**.

2. **Tạo Long-Lived User Token (Hạn 60 ngày):**
   - Mở tab trình duyệt mới, dán đường dẫn sau (thay thế 3 giá trị tương ứng):
     ```text
     https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_USER_TOKEN
     ```
     *(Trong đó: `YOUR_SHORT_LIVED_USER_TOKEN` là cái User Access Token copy từ bước 2.2)*.
   - Trình duyệt sẽ trả về đoạn JSON có chứa `"access_token"`. Đây là Long-Lived User Token.

3. **Lấy Long-Lived Page Access Token (Vĩnh Viễn):**
   - Vào lại [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
   - Dán mã **Long-Lived User Token** ở trên vào ô **Access Token**.
   - Gõ lại lệnh: `me/accounts` ➔ Bấm **Submit**.
   - Mã `access_token` nằm trong chuỗi JSON trả về cho Fanpage lúc này chính là **LONG-LIVED PAGE ACCESS TOKEN**. Mã này sẽ **dùng mãi mãi** mà không lo bị ngắt kết nối!

---

## 🛠️ 3. ĐIỀU KIỆN NỀN TẢNG CẦN CÓ TRÊN MÁY TÍNH

Trước khi gắn cấu hình vào Claude Desktop hoặc Antigravity IDE, máy tính cần đáp ứng 2 điều kiện:

1. **Đã cài đặt Node.js (Phiên bản >= 18):**
   - **Mở Terminal / PowerShell** và kiểm tra lệnh: `node -v`
   - Nếu chưa có hoặc phiên bản cũ: Tải bản cài đặt mới nhất tại 👉 **[https://nodejs.org](https://nodejs.org)**.
2. **Đã giải nén gói mã nguồn `fb-fanpage-mcp_v2.mcpb`:**
   - Giải nén file `.mcpb` (hoặc đổi đuôi thành `.zip` rồi giải nén).
   - *Ví dụ đường dẫn thư mục giải nén:*
     - **Windows:** `C:\mcp\fb-fanpage-mcp_v2-unpacked`
     - **macOS:** `/Users/ten_user_mac/mcp/fb-fanpage-mcp_v2-unpacked`

---

## 🖥️ 4. HƯỚNG DẪN CẤU HÌNH CHI TIẾT

### 📍 TRƯỜNG HỢP 1: Cấu Hình Cho Claude Desktop

#### 1. Trên Hệ Điều Hành Windows
- Đường dẫn file cấu hình:
  `C:\Users\<Tên_User>\AppData\Roaming\Claude\claude_desktop_config.json`
- Mở **PowerShell** hoặc **Run (Win + R)**, gõ: `notepad %APPDATA%\Claude\claude_desktop_config.json`
- Dán nội dung JSON sau vào file (Nhớ thay đường dẫn `C:\\...` và các Token của bạn):

```json
{
  "mcpServers": {
    "fb-fanpage": {
      "command": "node",
      "args": [
        "C:\\mcp\\fb-fanpage-mcp_v2-unpacked\\index.js"
      ],
      "env": {
        "FB_PAGE_ID": "123456789012345",
        "FB_PAGE_ACCESS_TOKEN": "EAAG...",
        "FB_GRAPH_API_VERSION": "v21.0"
      }
    }
  }
}
```

> [!IMPORTANT]
> **Quy tắc đường dẫn trên Windows:** Phải dùng dấu **xuyệt kép `\\`** trong đường dẫn tập tin (Ví dụ: `C:\\mcp\\fb-fanpage-mcp_v2-unpacked\\index.js`).

---

#### 2. Trên Hệ Điều Hành macOS (MacBook / Mac mini)
- Đường dẫn file cấu hình:
  `~/Library/Application Support/Claude/claude_desktop_config.json`
- Mở ứng dụng **Terminal** trên Mac, gõ lệnh:
  ```bash
  open -e "~/Library/Application Support/Claude/claude_desktop_config.json"
  ```
- Dán đoạn JSON sau (thay đường dẫn `/Users/ten_user_mac/` và token tương ứng):

```json
{
  "mcpServers": {
    "fb-fanpage": {
      "command": "node",
      "args": [
        "/Users/ten_user_mac/mcp/fb-fanpage-mcp_v2-unpacked/index.js"
      ],
      "env": {
        "FB_PAGE_ID": "123456789012345",
        "FB_PAGE_ACCESS_TOKEN": "EAAG...",
        "FB_GRAPH_API_VERSION": "v21.0"
      }
    }
  }
}
```

---

### 📍 TRƯỜNG HỢP 2: Cấu Hình Trong Antigravity IDE (Hoặc Cursor / VS Code)

Nếu sử dụng **Antigravity IDE**:

1. Mở phần mềm **Antigravity IDE**.
2. Vào **Settings (Cài đặt) ➔ MCP Servers** (hoặc mở file cấu hình `.mcp_settings.json` trong thư mục dự án).
3. Thêm cấu hình như bên dưới:

```json
{
  "mcpServers": {
    "fb-fanpage": {
      "command": "node",
      "args": [
        "C:\\mcp\\fb-fanpage-mcp_v2-unpacked\\index.js"
      ],
      "env": {
        "FB_PAGE_ID": "123456789012345",
        "FB_PAGE_ACCESS_TOKEN": "EAAG...",
        "FB_GRAPH_API_VERSION": "v21.0"
      }
    }
  }
}
```
*(Lưu ý điều chỉnh đường dẫn `args` phù hợp với OS Windows hay macOS như hướng dẫn ở trên).*

---

## 🚀 5. KÍCH HOẠT VÀ MẪU CÂU LỆNH RA LỆNH CHO AI (PROMPTS)

### Các bước kích hoạt:
1. **Tắt hoàn toàn** Claude Desktop / Antigravity IDE (Nhấn chuột phải biểu tượng ở khay hệ thống chọn Exit, sau đó mở lại).
2. Kiểm tra biểu tượng chiếc búa **🛠️ (MCP Tools)** ở góc dưới ô chat xem đã xuất hiện 19 công cụ của `fb-fanpage` chưa.

---

### 💡 Các câu lệnh mẫu thực tế có thể dùng ngay:

1. **Xem thông tin trang & Lấy bài đăng:**
   > *"Kiểm tra thông tin Fanpage của tôi và liệt kê 5 bài viết gần đây nhất."*

2. **Soạn & Đăng bài viết mới:**
   > *"Đăng một bài viết giới thiệu chương trình khuyến mãi giảm giá 20% cho sản phẩm mới lên Fanpage giúp tôi."*

3. **Đăng bài kèm hình ảnh:**
   > *"Đăng bài viết kèm hình ảnh từ URL `https://example.com/banner.jpg` với nội dung: Chúc mọi người một ngày làm việc tràn đầy năng lượng!"*

4. **Quản lý bình luận & Phản hồi khách:**
   > *"Xem các bình luận mới nhất của bài đăng gần đây, nếu có ai hỏi giá thì tự động trả lời: 'Dạ shop đã gửi thông tin chi tiết vào tin nhắn cho mình rồi ạ!'"*

5. **Đọc & Trả lời Inbox:**
   > *"Lấy danh sách các cuộc trò chuyện Inbox chưa đọc và tóm tắt yêu cầu của từng khách hàng."*

6. **Báo cáo chỉ số thống kê:**
   > *"Tổng hợp chỉ số lượt tương tác và tầm nhìn (reach) của Fanpage trong tháng vừa qua."*

---

## ❓ 6. BẢNG GIẢI MÃ CÁC LỖI THƯỜNG GẶP (TROUBLESHOOTING)

| Lỗi hiển thị | Nguyên nhân chính | Cách xử lý chi tiết |
|---|---|---|
| `(#190) The access token was invalidated` | Token đã hết hạn sử dụng (Thường do dùng Short-Lived Token quá 2 giờ). | Thực hiện lại **Bước 2.4** để tạo Long-Lived Token vĩnh viễn và cập nhật lại file JSON config. |
| `(#200) Permissions error` / `(#200) Requires pages_manage_posts` | Token thiếu một trong các quyền hạn bắt buộc (như `pages_manage_posts` hoặc `pages_messaging`). | Vào lại Graph API Explorer, chọn đủ 6 quyền ở **Bước 2.2**, bấm *Generate Access Token* lại và cấp quyền lại cho App. |
| `command not found: node` | Hệ điều hành chưa nhận biến môi trường Node.js. | Mở Terminal/CMD gõ `where node` (Windows) hoặc `which node` (Mac). Thay đường dẫn tuyệt đối đó vào mục `"command"` (Ví dụ: `"C:\\Program Files\\nodejs\\node.exe"`). |
| `Cannot find module .../index.js` | Sai đường dẫn trong ô `"args"` của file cấu hình JSON. | Kiểm tra lại xem file `index.js` có nằm đúng trong thư mục đã giải nén hay không. Nhớ dùng `\\` trên Windows và `/` trên Mac. |
| `(#10) Application does not have permission for this action` | Bạn chưa làm admin của Fanpage hoặc Fanpage đang ở trạng thái Bị khóa / Hạn chế. | Kiểm tra lại tài khoản Facebook đang lấy token có vai trò **Quản trị viên (Admin)** trên Fanpage đó hay không. |

---

> [!TIP]
> **BẢO MẬT AN TOÀN:** Không chia sẻ file `claude_desktop_config.json` chứa `FB_PAGE_ACCESS_TOKEN` cho người khác. Token này có đầy đủ quyền hạn đăng bài và trả lời tin nhắn thay mặt Fanpage của bạn.
