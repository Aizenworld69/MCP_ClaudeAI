import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---- Cấu hình lấy từ biến môi trường (khai báo trong claude_desktop_config.json) ----
const PAGE_ID = process.env.FB_PAGE_ID;
const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const GRAPH_API_VERSION = process.env.FB_GRAPH_API_VERSION || "v21.0";

if (!PAGE_ID || !PAGE_ACCESS_TOKEN) {
  console.error(
    "[fb-fanpage-mcp] THIẾU FB_PAGE_ID hoặc FB_PAGE_ACCESS_TOKEN trong biến môi trường."
  );
}

const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const server = new McpServer({
  name: "fb-fanpage-mcp",
  version: "2.0.0",
});

/**
 * Hàm phân tích định dạng thời gian scheduled_publish_time thành Unix timestamp (seconds)
 */
function parseScheduledTime(time) {
  if (!time) return undefined;
  if (!isNaN(time)) {
    const val = Number(time);
    // Nếu là mili-giây (độ dài khoảng 13 số), đổi thành giây
    if (val > 9999999999) {
      return Math.floor(val / 1000);
    }
    return val;
  }
  const parsed = Date.parse(time);
  if (isNaN(parsed)) {
    throw new Error(`Định dạng scheduled_publish_time không hợp lệ: ${time}`);
  }
  return Math.floor(parsed / 1000);
}


/**
 * Hàm chung thực hiện gọi Facebook Graph API
 */
async function fbRequest(path, method = "GET", params = {}) {
  if (!PAGE_ID || !PAGE_ACCESS_TOKEN) {
    throw new Error("Chưa cấu hình FB_PAGE_ID hoặc FB_PAGE_ACCESS_TOKEN.");
  }

  const urlParams = new URLSearchParams(params);
  urlParams.set("access_token", PAGE_ACCESS_TOKEN);

  let url = `${GRAPH_BASE}${path}`;
  let options = { method };

  if (method === "GET" || method === "DELETE") {
    url += `?${urlParams.toString()}`;
  } else {
    options.body = urlParams;
  }

  const res = await fetch(url, options);
  const data = await res.json();

  if (data.error) {
    throw new Error(`${data.error.message} (code ${data.error.code})`);
  }

  return data;
}

// 1. ---- Tool: Xem thông tin tổng quan Fanpage ----
server.registerTool(
  "get_page_info",
  {
    title: "Xem thông tin Fanpage",
    description: "Lấy thông tin tổng quan của Fanpage đang quản lý (Tên, Lượt thích, Lượt theo dõi, URL...).",
    inputSchema: {},
  },
  async () => {
    try {
      const data = await fbRequest(`/${PAGE_ID}`, "GET", {
        fields: "id,name,username,fan_count,followers_count,about,link",
      });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 2. ---- Tool: Xem danh sách các bài đăng (Feed) ----
server.registerTool(
  "list_posts",
  {
    title: "Lấy danh sách bài đăng",
    description: "Lấy danh sách các bài đăng (feed) gần đây trên Fanpage.",
    inputSchema: {
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Số lượng bài viết tối đa cần lấy (mặc định 10, tối đa 100)"),
    },
  },
  async ({ limit }) => {
    try {
      const data = await fbRequest(`/${PAGE_ID}/feed`, "GET", {
        fields: "id,message,created_time,permalink_url,shares",
        limit: String(limit || 10),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 3. ---- Tool: Đăng bài viết thường (có thể kèm link) ----
server.registerTool(
  "create_post",
  {
    title: "Đăng bài lên Facebook Fanpage",
    description: "Đăng một bài viết (dạng văn bản, có thể đính kèm link) lên Fanpage.",
    inputSchema: {
      message: z.string().describe("Nội dung bài đăng"),
      link: z
        .string()
        .url()
        .optional()
        .describe("Link đính kèm tùy chọn (ví dụ link website, bài viết blog, sản phẩm)"),
      published: z
        .boolean()
        .optional()
        .default(true)
        .describe("true = đăng công khai ngay, false = lưu bản nháp"),
      scheduled_publish_time: z
        .union([z.number(), z.string()])
        .optional()
        .describe("Hẹn giờ đăng bài (Unix timestamp hoặc chuỗi ISO thời gian tương lai, yêu cầu published=false)"),
    },
  },
  async ({ message, link, published, scheduled_publish_time }) => {
    try {
      const scheduleTime = parseScheduledTime(scheduled_publish_time);
      const body = {
        message,
        published: String(published ?? true),
      };
      if (link) body.link = link;
      if (scheduleTime) {
        body.published = "false";
        body.scheduled_publish_time = String(scheduleTime);
      }

      const data = await fbRequest(`/${PAGE_ID}/feed`, "POST", body);
      return {
        content: [
          {
            type: "text",
            text: `Đăng bài thành công.${scheduleTime ? ` Bài viết đã được lên lịch lúc ${new Date(scheduleTime * 1000).toLocaleString()}.` : ""} Post ID: ${data.id}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 4. ---- Tool: Đăng bài kèm hình ảnh ----
server.registerTool(
  "create_photo_post",
  {
    title: "Đăng bài kèm ảnh lên Facebook Fanpage",
    description: "Đăng một bài viết kèm theo một hình ảnh lên Fanpage dựa trên URL ảnh công khai.",
    inputSchema: {
      image_url: z.string().url().describe("URL hình ảnh công khai cần đăng"),
      message: z.string().optional().describe("Chú thích (caption) đính kèm cho bức ảnh"),
      published: z
        .boolean()
        .optional()
        .default(true)
        .describe("true = đăng công khai ngay, false = lưu nháp"),
      scheduled_publish_time: z
        .union([z.number(), z.string()])
        .optional()
        .describe("Hẹn giờ đăng bài (Unix timestamp hoặc chuỗi ISO thời gian tương lai, yêu cầu published=false)"),
    },
  },
  async ({ image_url, message, published, scheduled_publish_time }) => {
    try {
      const scheduleTime = parseScheduledTime(scheduled_publish_time);
      const body = {
        url: image_url,
        published: String(published ?? true),
      };
      if (message) body.caption = message;
      if (scheduleTime) {
        body.published = "false";
        body.scheduled_publish_time = String(scheduleTime);
      }

      const data = await fbRequest(`/${PAGE_ID}/photos`, "POST", body);
      return {
        content: [
          {
            type: "text",
            text: `Đăng ảnh thành công.${scheduleTime ? ` Ảnh đã được lên lịch đăng lúc ${new Date(scheduleTime * 1000).toLocaleString()}.` : ""} Post/Photo ID: ${data.post_id || data.id}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 5. ---- Tool: Xóa bài viết đã đăng ----
server.registerTool(
  "delete_post",
  {
    title: "Xóa bài đăng trên Fanpage",
    description: "Xóa một bài viết đã đăng trên Fanpage theo ID bài đăng.",
    inputSchema: {
      post_id: z.string().describe("ID của bài đăng cần xóa (ví dụ: PAGEID_POSTID)"),
    },
  },
  async ({ post_id }) => {
    try {
      const data = await fbRequest(`/${post_id}`, "DELETE");
      return {
        content: [{ type: "text", text: `Đã xóa bài đăng thành công. Kết quả: ${JSON.stringify(data)}` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 6. ---- Tool: Xem danh sách các bình luận của bài viết ----
server.registerTool(
  "list_comments",
  {
    title: "Xem danh sách bình luận",
    description: "Lấy danh sách các bình luận của một bài đăng cụ thể trên Fanpage.",
    inputSchema: {
      post_id: z.string().describe("ID của bài viết cần xem bình luận"),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Số bình luận tối đa cần lấy (mặc định 10, tối đa 100)"),
    },
  },
  async ({ post_id, limit }) => {
    try {
      const data = await fbRequest(`/${post_id}/comments`, "GET", {
        fields: "id,message,from,created_time,like_count,comment_count",
        limit: String(limit || 10),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 7. ---- Tool: Đăng bình luận hoặc trả lời bình luận ----
server.registerTool(
  "create_comment",
  {
    title: "Bình luận hoặc trả lời bình luận",
    description: "Đăng bình luận vào bài đăng, hoặc trả lời một bình luận khác của khách hàng trên Fanpage.",
    inputSchema: {
      object_id: z.string().describe("ID của bài viết hoặc bình luận cần phản hồi"),
      message: z.string().describe("Nội dung bình luận"),
    },
  },
  async ({ object_id, message }) => {
    try {
      const data = await fbRequest(`/${object_id}/comments`, "POST", {
        message,
      });
      return {
        content: [{ type: "text", text: `Đăng phản hồi bình luận thành công. Comment ID: ${data.id}` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 8. ---- Tool: Xóa bình luận ----
server.registerTool(
  "delete_comment",
  {
    title: "Xóa bình luận",
    description: "Xóa một bình luận trên Fanpage bằng ID bình luận.",
    inputSchema: {
      comment_id: z.string().describe("ID của bình luận cần xóa"),
    },
  },
  async ({ comment_id }) => {
    try {
      const data = await fbRequest(`/${comment_id}`, "DELETE");
      return {
        content: [{ type: "text", text: `Đã xóa bình luận thành công. Kết quả: ${JSON.stringify(data)}` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 9. ---- Tool: Xem chỉ số đo lường bài viết (Reach, Impressions, Engagement) ----
server.registerTool(
  "get_post_insights",
  {
    title: "Xem chỉ số bài đăng (Insights)",
    description: "Lấy các chỉ số tương tác, tiếp cận (impressions, reach, engagements) của bài đăng từ Graph API.",
    inputSchema: {
      post_id: z.string().describe("ID của bài đăng cần xem chỉ số"),
    },
  },
  async ({ post_id }) => {
    try {
      const data = await fbRequest(`/${post_id}/insights`, "GET", {
        metric: "post_impressions,post_impressions_unique,post_engagements",
      });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 10. ---- Tool: Ẩn bình luận ----
server.registerTool(
  "hide_comment",
  {
    title: "Ẩn bình luận trên Fanpage",
    description: "Ẩn một bình luận của khách hàng trên Fanpage theo ID bình luận.",
    inputSchema: {
      comment_id: z.string().describe("ID của bình luận cần ẩn"),
    },
  },
  async ({ comment_id }) => {
    try {
      const data = await fbRequest(`/${comment_id}`, "POST", { is_hidden: "true" });
      return {
        content: [{ type: "text", text: `Đã ẩn bình luận thành công. Kết quả: ${JSON.stringify(data)}` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 11. ---- Tool: Hiện bình luận bị ẩn ----
server.registerTool(
  "unhide_comment",
  {
    title: "Hiện bình luận bị ẩn trên Fanpage",
    description: "Hiện một bình luận đã bị ẩn trước đó trên Fanpage theo ID bình luận.",
    inputSchema: {
      comment_id: z.string().describe("ID của bình luận cần hiện lại"),
    },
  },
  async ({ comment_id }) => {
    try {
      const data = await fbRequest(`/${comment_id}`, "POST", { is_hidden: "false" });
      return {
        content: [{ type: "text", text: `Đã hiển thị lại bình luận thành công. Kết quả: ${JSON.stringify(data)}` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 12. ---- Tool: Thích bình luận ----
server.registerTool(
  "like_comment",
  {
    title: "Thích bình luận",
    description: "Thích bình luận của người dùng trên Fanpage.",
    inputSchema: {
      comment_id: z.string().describe("ID của bình luận cần thích"),
    },
  },
  async ({ comment_id }) => {
    try {
      const data = await fbRequest(`/${comment_id}/likes`, "POST");
      return {
        content: [{ type: "text", text: `Đã thích bình luận thành công. Kết quả: ${JSON.stringify(data)}` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 13. ---- Tool: Bỏ thích bình luận ----
server.registerTool(
  "unlike_comment",
  {
    title: "Bỏ thích bình luận",
    description: "Bỏ thích bình luận của người dùng trên Fanpage.",
    inputSchema: {
      comment_id: z.string().describe("ID của bình luận cần bỏ thích"),
    },
  },
  async ({ comment_id }) => {
    try {
      const data = await fbRequest(`/${comment_id}/likes`, "DELETE");
      return {
        content: [{ type: "text", text: `Đã bỏ thích bình luận thành công. Kết quả: ${JSON.stringify(data)}` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 14. ---- Tool: Lấy danh sách các cuộc trò chuyện (Page Inbox) ----
server.registerTool(
  "list_conversations",
  {
    title: "Lấy danh sách các cuộc trò chuyện",
    description: "Lấy danh sách các cuộc trò chuyện Inbox (hội thoại) gần đây của Fanpage.",
    inputSchema: {
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Số cuộc hội thoại tối đa cần lấy (mặc định 10, tối đa 100)"),
    },
  },
  async ({ limit }) => {
    try {
      const data = await fbRequest(`/${PAGE_ID}/conversations`, "GET", {
        fields: "id,participants,updated_time,unread_count,snippet",
        limit: String(limit || 10),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 15. ---- Tool: Xem tin nhắn chi tiết trong cuộc trò chuyện ----
server.registerTool(
  "get_conversation_messages",
  {
    title: "Xem tin nhắn chi tiết",
    description: "Lấy lịch sử tin nhắn chi tiết trong một cuộc hội thoại (conversation) qua ID cuộc trò chuyện.",
    inputSchema: {
      conversation_id: z.string().describe("ID của cuộc trò chuyện cần xem tin nhắn"),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Số lượng tin nhắn tối đa cần lấy (mặc định 10, tối đa 100)"),
    },
  },
  async ({ conversation_id, limit }) => {
    try {
      const data = await fbRequest(`/${conversation_id}/messages`, "GET", {
        fields: "id,message,from,created_time,sticker,attachments",
        limit: String(limit || 10),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 16. ---- Tool: Gửi tin nhắn Inbox cho khách hàng ----
server.registerTool(
  "send_inbox_message",
  {
    title: "Gửi tin nhắn trả lời",
    description: "Gửi tin nhắn phản hồi cho khách hàng trong cuộc hội thoại (Inbox).",
    inputSchema: {
      conversation_id: z.string().describe("ID của cuộc trò chuyện (conversation_id) cần phản hồi"),
      message: z.string().describe("Nội dung tin nhắn cần gửi"),
    },
  },
  async ({ conversation_id, message }) => {
    try {
      const data = await fbRequest(`/${conversation_id}/messages`, "POST", {
        message,
      });
      return {
        content: [{ type: "text", text: `Gửi tin nhắn thành công. Message ID: ${data.id}` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 17. ---- Tool: Đăng bài viết kèm nhiều hình ảnh ----
server.registerTool(
  "create_multi_photo_post",
  {
    title: "Đăng bài viết kèm nhiều ảnh",
    description: "Đăng bài viết mới đính kèm nhiều hình ảnh (qua danh sách URL ảnh công khai).",
    inputSchema: {
      message: z.string().describe("Nội dung chú thích của bài đăng"),
      image_urls: z.array(z.string().url()).describe("Mảng chứa các URL ảnh công khai cần đăng"),
      published: z
        .boolean()
        .optional()
        .default(true)
        .describe("Đăng công khai ngay (true) hoặc lưu nháp (false)"),
      scheduled_publish_time: z
        .union([z.number(), z.string()])
        .optional()
        .describe("Hẹn giờ đăng bài (Unix timestamp hoặc chuỗi ISO thời gian tương lai, yêu cầu published=false)"),
    },
  },
  async ({ message, image_urls, published, scheduled_publish_time }) => {
    try {
      if (!image_urls || image_urls.length === 0) {
        throw new Error("Vui lòng cung cấp ít nhất một URL hình ảnh.");
      }

      const scheduleTime = parseScheduledTime(scheduled_publish_time);
      const mediaIds = [];

      // 1. Upload từng ảnh lên Page (ở trạng thái chưa đăng public)
      for (const url of image_urls) {
        const photoData = await fbRequest(`/${PAGE_ID}/photos`, "POST", {
          url,
          published: "false",
        });
        mediaIds.push(photoData.id);
      }

      // 2. Tạo một bài viết dạng feed liên kết các ID ảnh đã upload
      const body = {
        message,
        published: String(published ?? true),
      };

      if (scheduleTime) {
        body.published = "false";
        body.scheduled_publish_time = String(scheduleTime);
      }

      body.attached_media = JSON.stringify(
        mediaIds.map((id) => ({ media_fbid: id }))
      );

      const feedData = await fbRequest(`/${PAGE_ID}/feed`, "POST", body);
      return {
        content: [
          {
            type: "text",
            text: `Đăng bài nhiều ảnh thành công.${scheduleTime ? ` Bài viết đã được lên lịch lúc ${new Date(scheduleTime * 1000).toLocaleString()}.` : ""} Post ID: ${feedData.id}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 18. ---- Tool: Đăng video lên Fanpage ----
server.registerTool(
  "publish_video",
  {
    title: "Đăng video lên Fanpage",
    description: "Đăng video mới lên Fanpage từ một đường dẫn URL video công khai.",
    inputSchema: {
      video_url: z.string().url().describe("URL chứa file video công khai cần đăng"),
      title: z.string().optional().describe("Tiêu đề của video (tùy chọn)"),
      description: z.string().optional().describe("Mô tả hoặc chú thích đi kèm video"),
      published: z
        .boolean()
        .optional()
        .default(true)
        .describe("Đăng công khai ngay (true) hoặc lưu nháp (false)"),
      scheduled_publish_time: z
        .union([z.number(), z.string()])
        .optional()
        .describe("Hẹn giờ đăng video (Unix timestamp hoặc chuỗi ISO thời gian tương lai, yêu cầu published=false)"),
    },
  },
  async ({ video_url, title, description, published, scheduled_publish_time }) => {
    try {
      const scheduleTime = parseScheduledTime(scheduled_publish_time);
      const body = {
        file_url: video_url,
        published: String(published ?? true),
      };
      if (title) body.title = title;
      if (description) body.description = description;
      if (scheduleTime) {
        body.published = "false";
        body.scheduled_publish_time = String(scheduleTime);
      }

      const data = await fbRequest(`/${PAGE_ID}/videos`, "POST", body);
      return {
        content: [
          {
            type: "text",
            text: `Đăng video thành công.${scheduleTime ? ` Video đã được lên lịch lúc ${new Date(scheduleTime * 1000).toLocaleString()}.` : ""} Video ID: ${data.id}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 19. ---- Tool: Thống kê hiệu suất Fanpage (Insights) ----
server.registerTool(
  "get_page_insights",
  {
    title: "Xem thống kê Fanpage",
    description: "Xem các chỉ số thống kê (Insights) tổng quan của Fanpage trong khoảng thời gian gần đây.",
    inputSchema: {
      period: z
        .enum(["day", "week", "days_28"])
        .optional()
        .default("day")
        .describe("Khoảng thời gian thống kê: day (theo ngày), week (theo tuần), days_28 (28 ngày qua)"),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe("Số lượng chỉ số cần lấy"),
    },
  },
  async ({ period, limit }) => {
    try {
      const metrics = [
        "page_impressions",
        "page_impressions_unique",
        "page_post_engagements",
        "page_engaged_users",
        "page_views_total",
        "page_fan_adds"
      ].join(",");

      const data = await fbRequest(`/${PAGE_ID}/insights`, "GET", {
        metric: metrics,
        period: period || "day",
        limit: String(limit || 20)
      });

      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Lỗi: ${err.message}` }],
        isError: true,
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
