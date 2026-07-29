import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---- Cấu hình lấy từ biến môi trường ----
const ACCESS_TOKEN = process.env.HARAVAN_ACCESS_TOKEN;
const DEFAULT_BLOG_ID = process.env.HARAVAN_BLOG_ID || "";

const API_BASE = "https://apis.haravan.com/web";

if (!ACCESS_TOKEN) {
  console.error("[haravan-blog-mcp] THIẾU HARAVAN_ACCESS_TOKEN trong biến môi trường.");
}

async function haravanRequest(path, method = "GET", body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const message =
      data?.errors ? JSON.stringify(data.errors) : `HTTP ${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  return data;
}

const server = new McpServer({
  name: "haravan-blog-mcp",
  version: "1.0.0",
});

// ---- Tool: Xem danh sách blog (chuyên mục blog) ----
server.registerTool(
  "list_blogs",
  {
    title: "Xem danh sách blog trên Haravan",
    description: "Lấy danh sách các blog (chuyên mục) hiện có trên store Haravan.",
    inputSchema: {},
  },
  async () => {
    try {
      const data = await haravanRequest("/blogs.json", "GET");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Xem danh sách bài viết (lọc nâng cao) ----
server.registerTool(
  "list_articles",
  {
    title: "Xem danh sách bài blog",
    description: "Lấy danh sách bài viết (article) trên shop Haravan, hỗ trợ lọc và phân trang nâng cao.",
    inputSchema: {
      blog_id: z
        .string()
        .optional()
        .describe("ID của blog cần xem. Nếu để trống sẽ lấy từ blog mặc định, hoặc lấy tất cả bài viết toàn shop nếu không cấu hình blog mặc định"),
      page: z.number().optional().describe("Số trang, mặc định trang 1"),
      limit: z.number().optional().describe("Số lượng bài viết trên mỗi trang (tối đa 250, mặc định 50)"),
      published_status: z
        .enum(["any", "published", "unpublished"])
        .optional()
        .describe("Trạng thái xuất bản: any (tất cả), published (đã đăng), unpublished (bản nháp/ẩn)"),
      tag: z.string().optional().describe("Lọc bài viết theo tag"),
      author: z.string().optional().describe("Lọc bài viết theo tác giả"),
      since_id: z.string().optional().describe("Lọc bài viết có ID lớn hơn mốc ID này"),
      updated_at_min: z
        .string()
        .optional()
        .describe("Lọc bài viết được cập nhật từ thời điểm này (định dạng ISO 8601, ví dụ: 2026-07-01T00:00:00Z)"),
    },
  },
  async ({ blog_id, page, limit, published_status, tag, author, since_id, updated_at_min }) => {
    try {
      const params = new URLSearchParams();
      if (page !== undefined) params.set("page", page.toString());
      if (limit !== undefined) params.set("limit", limit.toString());
      if (published_status !== undefined) params.set("published_status", published_status);
      if (tag !== undefined) params.set("tag", tag);
      if (author !== undefined) params.set("author", author);
      if (since_id !== undefined) params.set("since_id", since_id);
      if (updated_at_min !== undefined) params.set("updated_at_min", updated_at_min);

      const q = params.toString() ? `?${params.toString()}` : "";
      
      const bid = blog_id || DEFAULT_BLOG_ID;
      const path = bid ? `/blogs/${bid}/articles.json${q}` : `/articles.json${q}`;
      
      const data = await haravanRequest(path, "GET");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Đếm số bài viết trong 1 blog ----
server.registerTool(
  "count_articles",
  {
    title: "Đếm số bài viết trong blog",
    description: "Lấy tổng số bài viết (article) hiện có trong 1 blog trên Haravan.",
    inputSchema: {
      blog_id: z
        .string()
        .optional()
        .describe("ID của blog cần đếm (nếu để trống sẽ dùng blog mặc định đã cấu hình)"),
    },
  },
  async ({ blog_id }) => {
    const bid = blog_id || DEFAULT_BLOG_ID;
    if (!bid) {
      return {
        content: [{ type: "text", text: "Lỗi: chưa có blog_id (chưa cấu hình blog mặc định)." }],
        isError: true,
      };
    }
    try {
      const data = await haravanRequest(`/blogs/${bid}/articles/count.json`, "GET");
      return {
        content: [{ type: "text", text: `Blog ${bid} hiện có ${data?.count} bài viết.` }],
      };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Đếm tổng số blog ----
server.registerTool(
  "count_blogs",
  {
    title: "Đếm số blog",
    description: "Lấy tổng số blog (chuyên mục) hiện có trên store Haravan.",
    inputSchema: {},
  },
  async () => {
    try {
      const data = await haravanRequest("/blogs/count.json", "GET");
      return { content: [{ type: "text", text: `Store hiện có ${data?.count} blog.` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Xem chi tiết 1 blog ----
server.registerTool(
  "get_blog",
  {
    title: "Xem chi tiết 1 blog",
    description: "Lấy thông tin chi tiết 1 blog theo ID.",
    inputSchema: {
      blog_id: z.string().describe("ID của blog cần xem"),
    },
  },
  async ({ blog_id }) => {
    try {
      const data = await haravanRequest(`/blogs/${blog_id}.json`, "GET");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Tạo blog mới ----
server.registerTool(
  "create_blog",
  {
    title: "Tạo blog mới",
    description: "Tạo một blog (chuyên mục) mới trên Haravan.",
    inputSchema: {
      title: z.string().describe("Tiêu đề blog"),
      tags: z.string().optional().describe("Tag mặc định cho blog, cách nhau bởi dấu phẩy"),
      commentable: z
        .enum(["no", "moderate", "yes"])
        .optional()
        .describe("Chế độ bình luận: no (tắt), moderate (duyệt trước), yes (mở tự do)"),
    },
  },
  async ({ title, tags, commentable }) => {
    try {
      const blog = { title };
      if (tags) blog.tags = tags;
      if (commentable) blog.commentable = commentable;
      const data = await haravanRequest("/blogs.json", "POST", { blog });
      return {
        content: [{ type: "text", text: `Tạo blog thành công. Blog ID: ${data?.blog?.id}` }],
      };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Sửa blog ----
server.registerTool(
  "update_blog",
  {
    title: "Sửa thông tin blog",
    description: "Cập nhật tiêu đề/tag/chế độ bình luận của 1 blog đã có.",
    inputSchema: {
      blog_id: z.string().describe("ID của blog cần sửa"),
      title: z.string().optional().describe("Tiêu đề mới"),
      tags: z.string().optional().describe("Tag mới, cách nhau bởi dấu phẩy"),
      commentable: z.enum(["no", "moderate", "yes"]).optional().describe("Chế độ bình luận"),
    },
  },
  async ({ blog_id, title, tags, commentable }) => {
    try {
      const blog = {};
      if (title !== undefined) blog.title = title;
      if (tags !== undefined) blog.tags = tags;
      if (commentable !== undefined) blog.commentable = commentable;
      const data = await haravanRequest(`/blogs/${blog_id}.json`, "PUT", { blog });
      return {
        content: [{ type: "text", text: `Cập nhật blog thành công. Blog ID: ${data?.blog?.id}` }],
      };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Xóa blog ----
server.registerTool(
  "delete_blog",
  {
    title: "Xóa blog",
    description: "Xóa hẳn 1 blog (chuyên mục) khỏi Haravan, gồm toàn bộ bài viết trong đó.",
    inputSchema: {
      blog_id: z.string().describe("ID của blog cần xóa"),
    },
  },
  async ({ blog_id }) => {
    try {
      await haravanRequest(`/blogs/${blog_id}.json`, "DELETE");
      return { content: [{ type: "text", text: `Đã xóa blog ID: ${blog_id}` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Xem chi tiết 1 bài viết ----
server.registerTool(
  "get_article",
  {
    title: "Xem chi tiết 1 bài viết",
    description: "Lấy nội dung chi tiết 1 bài viết theo ID và blog chứa nó.",
    inputSchema: {
      blog_id: z
        .string()
        .optional()
        .describe("ID của blog chứa bài viết (nếu để trống dùng blog mặc định)"),
      article_id: z.string().describe("ID của bài viết cần xem"),
    },
  },
  async ({ blog_id, article_id }) => {
    const bid = blog_id || DEFAULT_BLOG_ID;
    if (!bid) {
      return {
        content: [{ type: "text", text: "Lỗi: chưa có blog_id (chưa cấu hình blog mặc định)." }],
        isError: true,
      };
    }
    try {
      const data = await haravanRequest(`/blogs/${bid}/articles/${article_id}.json`, "GET");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Xem danh sách bình luận ----
server.registerTool(
  "list_comments",
  {
    title: "Xem danh sách bình luận",
    description: "Lấy danh sách bình luận của 1 bài viết, 1 blog, hoặc toàn shop.",
    inputSchema: {
      blog_id: z.string().optional().describe("Lọc theo blog (tùy chọn)"),
      article_id: z.string().optional().describe("Lọc theo bài viết (tùy chọn)"),
      status: z
        .enum(["published", "unapproved"])
        .optional()
        .describe("Lọc theo trạng thái bình luận"),
    },
  },
  async ({ blog_id, article_id, status }) => {
    try {
      const params = new URLSearchParams();
      if (blog_id) params.set("blog_id", blog_id);
      if (article_id) params.set("article_id", article_id);
      if (status) params.set("status", status);
      const q = params.toString() ? `?${params.toString()}` : "";
      const data = await haravanRequest(`/comments.json${q}`, "GET");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Đếm số bình luận ----
server.registerTool(
  "count_comments",
  {
    title: "Đếm số bình luận",
    description: "Đếm tổng số bình luận của 1 bài viết, 1 blog, hoặc toàn shop.",
    inputSchema: {
      blog_id: z.string().optional().describe("Lọc theo blog (tùy chọn)"),
      article_id: z.string().optional().describe("Lọc theo bài viết (tùy chọn)"),
    },
  },
  async ({ blog_id, article_id }) => {
    try {
      const params = new URLSearchParams();
      if (blog_id) params.set("blog_id", blog_id);
      if (article_id) params.set("article_id", article_id);
      const q = params.toString() ? `?${params.toString()}` : "";
      const data = await haravanRequest(`/comments/count.json${q}`, "GET");
      return { content: [{ type: "text", text: `Số bình luận: ${data?.count}` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Xem chi tiết 1 bình luận ----
server.registerTool(
  "get_comment",
  {
    title: "Xem chi tiết bình luận",
    description: "Lấy nội dung chi tiết 1 bình luận theo ID.",
    inputSchema: {
      comment_id: z.string().describe("ID của bình luận cần xem"),
    },
  },
  async ({ comment_id }) => {
    try {
      const data = await haravanRequest(`/comments/${comment_id}.json`, "GET");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Tạo bình luận mới (thay mặt 1 người đọc) ----
server.registerTool(
  "create_comment",
  {
    title: "Tạo bình luận mới",
    description: "Tạo 1 bình luận mới cho 1 bài viết (thường dùng để test hoặc nhập liệu thủ công).",
    inputSchema: {
      blog_id: z.string().describe("ID của blog chứa bài viết"),
      article_id: z.string().describe("ID của bài viết"),
      body: z.string().describe("Nội dung bình luận"),
      author: z.string().describe("Tên người bình luận"),
      email: z.string().email().describe("Email người bình luận"),
    },
  },
  async ({ blog_id, article_id, body, author, email }) => {
    try {
      const comment = { blog_id: Number(blog_id), article_id: Number(article_id), body, author, email };
      const data = await haravanRequest("/comments.json", "POST", { comment });
      return {
        content: [{ type: "text", text: `Tạo bình luận thành công. Comment ID: ${data?.comment?.id}` }],
      };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Sửa bình luận ----
server.registerTool(
  "update_comment",
  {
    title: "Sửa bình luận",
    description: "Cập nhật nội dung 1 bình luận đã có.",
    inputSchema: {
      comment_id: z.string().describe("ID của bình luận cần sửa"),
      body: z.string().optional().describe("Nội dung mới"),
      author: z.string().optional().describe("Tên tác giả mới"),
      email: z.string().email().optional().describe("Email mới"),
    },
  },
  async ({ comment_id, body, author, email }) => {
    try {
      const comment = {};
      if (body !== undefined) comment.body = body;
      if (author !== undefined) comment.author = author;
      if (email !== undefined) comment.email = email;
      const data = await haravanRequest(`/comments/${comment_id}.json`, "PUT", { comment });
      return { content: [{ type: "text", text: `Cập nhật bình luận thành công.` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Đánh dấu spam ----
server.registerTool(
  "mark_comment_spam",
  {
    title: "Đánh dấu bình luận là spam",
    description: "Đánh dấu 1 bình luận là spam, ẩn khỏi người đọc.",
    inputSchema: { comment_id: z.string().describe("ID của bình luận") },
  },
  async ({ comment_id }) => {
    try {
      await haravanRequest(`/comments/${comment_id}/spam.json`, "POST", {});
      return { content: [{ type: "text", text: `Đã đánh dấu bình luận ${comment_id} là spam.` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Bỏ đánh dấu spam ----
server.registerTool(
  "mark_comment_not_spam",
  {
    title: "Bỏ đánh dấu spam",
    description: "Khôi phục 1 bình luận từng bị đánh dấu spam về trạng thái published.",
    inputSchema: { comment_id: z.string().describe("ID của bình luận") },
  },
  async ({ comment_id }) => {
    try {
      await haravanRequest(`/comments/${comment_id}/not_spam.json`, "POST", {});
      return { content: [{ type: "text", text: `Đã bỏ đánh dấu spam cho bình luận ${comment_id}.` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Duyệt bình luận ----
server.registerTool(
  "approve_comment",
  {
    title: "Duyệt bình luận",
    description: "Duyệt 1 bình luận đang chờ (unapproved) để hiển thị công khai.",
    inputSchema: { comment_id: z.string().describe("ID của bình luận") },
  },
  async ({ comment_id }) => {
    try {
      await haravanRequest(`/comments/${comment_id}/approve.json`, "POST", {});
      return { content: [{ type: "text", text: `Đã duyệt bình luận ${comment_id}.` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Xóa (ẩn) bình luận ----
server.registerTool(
  "remove_comment",
  {
    title: "Xóa bình luận",
    description: "Ẩn/xóa 1 bình luận khỏi bài viết (có thể khôi phục lại bằng restore_comment).",
    inputSchema: { comment_id: z.string().describe("ID của bình luận") },
  },
  async ({ comment_id }) => {
    try {
      await haravanRequest(`/comments/${comment_id}/remove.json`, "POST", {});
      return { content: [{ type: "text", text: `Đã xóa bình luận ${comment_id}.` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Khôi phục bình luận ----
server.registerTool(
  "restore_comment",
  {
    title: "Khôi phục bình luận",
    description: "Khôi phục lại 1 bình luận đã bị xóa (remove) trước đó.",
    inputSchema: { comment_id: z.string().describe("ID của bình luận") },
  },
  async ({ comment_id }) => {
    try {
      await haravanRequest(`/comments/${comment_id}/restore.json`, "POST", {});
      return { content: [{ type: "text", text: `Đã khôi phục bình luận ${comment_id}.` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Đăng bài blog mới ----
server.registerTool(
  "create_article",
  {
    title: "Đăng bài blog mới lên Haravan",
    description: "Tạo một bài viết (article) mới trong 1 blog trên Haravan, hỗ trợ cấu hình SEO và đường dẫn thân thiện.",
    inputSchema: {
      blog_id: z
        .string()
        .optional()
        .describe("ID của blog cần đăng vào (nếu để trống sẽ dùng blog mặc định đã cấu hình)"),
      title: z.string().describe("Tiêu đề bài viết"),
      body_html: z.string().describe("Nội dung bài viết (có thể chứa HTML)"),
      author: z.string().optional().describe("Tên tác giả"),
      tags: z.string().optional().describe("Tag, cách nhau bởi dấu phẩy"),
      published: z
        .boolean()
        .optional()
        .default(true)
        .describe("true = đăng công khai ngay, false = lưu nháp"),
      image_src: z.string().url().optional().describe("URL ảnh đại diện bài viết"),
      handle: z.string().optional().describe("Đường dẫn URL thân thiện (alias/handle, ví dụ: 'tin-tuc-khuyen-mai-he-2026')"),
      seo_title: z.string().optional().describe("Tiêu đề SEO (meta_title) hiển thị trên kết quả tìm kiếm"),
      seo_description: z.string().optional().describe("Mô tả SEO (meta_description) hiển thị trên kết quả tìm kiếm"),
    },
  },
  async ({ blog_id, title, body_html, author, tags, published, image_src, handle, seo_title, seo_description }) => {
    const bid = blog_id || DEFAULT_BLOG_ID;
    if (!bid) {
      return {
        content: [{ type: "text", text: "Lỗi: chưa có blog_id (chưa cấu hình blog mặc định)." }],
        isError: true,
      };
    }
    try {
      const article = {
        title,
        body_html,
      };
      if (published === false) {
        article.published_at = null;
      } else {
        article.published = true;
      }
      if (author) article.author = author;
      if (tags) article.tags = tags;
      if (image_src) article.image = { src: image_src };
      if (handle) article.handle = handle;

      const metafields = [];
      if (seo_title) {
        metafields.push({
          key: "title_tag",
          value: seo_title,
          value_type: "string",
          namespace: "global",
        });
      }
      if (seo_description) {
        metafields.push({
          key: "description_tag",
          value: seo_description,
          value_type: "string",
          namespace: "global",
        });
      }
      if (metafields.length > 0) {
        article.metafields = metafields;
      }

      const data = await haravanRequest(`/blogs/${bid}/articles.json`, "POST", { article });
      return {
        content: [
          {
            type: "text",
            text: `Đăng bài blog thành công. Article ID: ${data?.article?.id}`,
          },
        ],
      };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Sửa/cập nhật bài blog ----
server.registerTool(
  "update_article",
  {
    title: "Sửa bài blog trên Haravan",
    description: "Cập nhật nội dung 1 bài viết đã có trên Haravan, hỗ trợ sửa SEO và đường dẫn.",
    inputSchema: {
      blog_id: z
        .string()
        .optional()
        .describe("ID của blog chứa bài viết (nếu để trống sẽ dùng blog mặc định)"),
      article_id: z.string().describe("ID của bài viết cần sửa"),
      title: z.string().optional().describe("Tiêu đề mới (nếu muốn đổi)"),
      body_html: z.string().optional().describe("Nội dung mới (nếu muốn đổi)"),
      author: z.string().optional().describe("Tên tác giả mới"),
      tags: z.string().optional().describe("Tag mới, cách nhau bởi dấu phẩy"),
      published: z.boolean().optional().describe("true = công khai, false = ẩn/nháp"),
      image_src: z.string().url().optional().describe("URL ảnh đại diện mới"),
      handle: z.string().optional().describe("Đường dẫn URL thân thiện (alias/handle) mới"),
      seo_title: z.string().optional().describe("Tiêu đề SEO (meta_title) mới"),
      seo_description: z.string().optional().describe("Mô tả SEO (meta_description) mới"),
    },
  },
  async ({ blog_id, article_id, title, body_html, author, tags, published, image_src, handle, seo_title, seo_description }) => {
    const bid = blog_id || DEFAULT_BLOG_ID;
    if (!bid) {
      return {
        content: [{ type: "text", text: "Lỗi: chưa có blog_id (chưa cấu hình blog mặc định)." }],
        isError: true,
      };
    }
    try {
      const article = {};
      if (title !== undefined) article.title = title;
      if (body_html !== undefined) article.body_html = body_html;
      if (author !== undefined) article.author = author;
      if (tags !== undefined) article.tags = tags;
      if (published !== undefined) {
        if (published === false) {
          article.published_at = null;
        } else {
          article.published = true;
        }
      }
      if (image_src !== undefined) article.image = { src: image_src };
      if (handle !== undefined) article.handle = handle;

      const metafields = [];
      if (seo_title !== undefined) {
        metafields.push({
          key: "title_tag",
          value: seo_title,
          value_type: "string",
          namespace: "global",
        });
      }
      if (seo_description !== undefined) {
        metafields.push({
          key: "description_tag",
          value: seo_description,
          value_type: "string",
          namespace: "global",
        });
      }
      if (metafields.length > 0) {
        article.metafields = metafields;
      }

      const data = await haravanRequest(
        `/blogs/${bid}/articles/${article_id}.json`,
        "PUT",
        { article }
      );
      return {
        content: [
          { type: "text", text: `Cập nhật bài blog thành công. Article ID: ${data?.article?.id}` },
        ],
      };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

// ---- Tool: Xóa bài blog ----
server.registerTool(
  "delete_article",
  {
    title: "Xóa bài blog trên Haravan",
    description: "Xóa 1 bài viết khỏi blog trên Haravan.",
    inputSchema: {
      blog_id: z
        .string()
        .optional()
        .describe("ID của blog chứa bài viết (nếu để trống sẽ dùng blog mặc định)"),
      article_id: z.string().describe("ID của bài viết cần xóa"),
    },
  },
  async ({ blog_id, article_id }) => {
    const bid = blog_id || DEFAULT_BLOG_ID;
    if (!bid) {
      return {
        content: [{ type: "text", text: "Lỗi: chưa có blog_id (chưa cấu hình blog mặc định)." }],
        isError: true,
      };
    }
    try {
      await haravanRequest(`/blogs/${bid}/articles/${article_id}.json`, "DELETE");
      return { content: [{ type: "text", text: `Đã xóa bài viết ID: ${article_id}` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Lỗi: ${err.message}` }], isError: true };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
