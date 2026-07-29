import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { z } from "zod";

// Khởi tạo Google Analytics Client sử dụng file JSON key từ biến môi trường
const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const server = new McpServer({
  name: "google-analytics-mcp",
  version: "1.0.0",
});

// Tool 1: Lấy số lượng người dùng Realtime (hoạt động trong 30 phút qua)
server.registerTool(
  "get_realtime_active_users",
  {
    description: "Lấy số lượng người dùng hoạt động thời gian thực (Realtime trong 30 phút qua)",
    inputSchema: {
      property_id: z.string().describe("Property ID của GA4 (ví dụ: '412345678')"),
    }
  },
  async ({ property_id }) => {
    try {
      const [response] = await analyticsDataClient.runRealtimeReport({
        property: `properties/${property_id}`,
        metrics: [{ name: "activeUsers" }],
      });

      const activeUsers = response.rows?.[0]?.metricValues?.[0]?.value || "0";
      return {
        content: [{
          type: "text",
          text: `Số lượng người dùng hoạt động trên trang hiện tại (Realtime - 30 phút qua): **${activeUsers}**`
        }]
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Lỗi Realtime API: ${error.message}` }], isError: true };
    }
  }
);

// Tool 2: Lấy báo cáo lượng truy cập (Users, Sessions, Pageviews) theo khoảng thời gian
server.registerTool(
  "get_traffic_report",
  {
    description: "Lấy báo cáo lượng truy cập (Users, Sessions, Pageviews) theo khoảng thời gian",
    inputSchema: {
      property_id: z.string().describe("Property ID của GA4"),
      start_date: z.string().describe("Ngày bắt đầu (YYYY-MM-DD hoặc '30daysAgo', '7daysAgo')"),
      end_date: z.string().describe("Ngày kết thúc (YYYY-MM-DD hoặc 'today', 'yesterday')"),
    }
  },
  async ({ property_id, start_date, end_date }) => {
    try {
      const [response] = await analyticsDataClient.runReport({
        property: `properties/${property_id}`,
        dateRanges: [{ startDate: start_date, endDate: end_date }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" }
        ],
        dimensions: [{ name: "date" }],
      });

      // Format lại dữ liệu trả về cho dễ đọc
      const rows = response.rows || [];
      const data = rows.map(row => ({
        date: row.dimensionValues[0].value,
        activeUsers: parseInt(row.metricValues[0].value),
        sessions: parseInt(row.metricValues[1].value),
        pageviews: parseInt(row.metricValues[2].value),
      }));

      // Tính tổng số
      const totals = data.reduce((acc, curr) => {
        acc.activeUsers += curr.activeUsers;
        acc.sessions += curr.sessions;
        acc.pageviews += curr.pageviews;
        return acc;
      }, { activeUsers: 0, sessions: 0, pageviews: 0 });

      const summary = `### Báo cáo lượng truy cập từ ${start_date} đến ${end_date}\n` +
                      `- **Tổng số người dùng (Active Users):** ${totals.activeUsers}\n` +
                      `- **Tổng số phiên (Sessions):** ${totals.sessions}\n` +
                      `- **Tổng số lượt xem trang (Pageviews):** ${totals.pageviews}\n\n` +
                      `Chi tiết từng ngày:\n` +
                      JSON.stringify(data, null, 2);

      return { content: [{ type: "text", text: summary }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Lỗi API Báo cáo: ${error.message}` }], isError: true };
    }
  }
);

// Tool 3: Lấy danh sách các trang được xem nhiều nhất
server.registerTool(
  "get_top_pages",
  {
    description: "Lấy danh sách các trang được xem nhiều nhất trên website",
    inputSchema: {
      property_id: z.string().describe("Property ID của GA4"),
      start_date: z.string().describe("Ngày bắt đầu (YYYY-MM-DD hoặc '30daysAgo')"),
      end_date: z.string().describe("Ngày kết thúc (YYYY-MM-DD hoặc 'today')"),
      limit: z.number().optional().default(10).describe("Số lượng trang hiển thị (mặc định 10)"),
    }
  },
  async ({ property_id, start_date, end_date, limit }) => {
    try {
      const [response] = await analyticsDataClient.runReport({
        property: `properties/${property_id}`,
        dateRanges: [{ startDate: start_date, endDate: end_date }],
        metrics: [{ name: "screenPageViews" }],
        dimensions: [
          { name: "pagePath" },
          { name: "pageTitle" }
        ],
        limit: limit,
      });

      const rows = response.rows || [];
      const topPages = rows.map(row => ({
        url: row.dimensionValues[0].value,
        title: row.dimensionValues[1].value,
        views: parseInt(row.metricValues[0].value),
      }));

      const summary = `### Top ${limit} trang xem nhiều nhất từ ${start_date} đến ${end_date}:\n` +
                      topPages.map((page, idx) => `${idx + 1}. **${page.title}** (${page.url}) - *${page.views} lượt xem*`).join("\n");

      return { content: [{ type: "text", text: summary }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Lỗi API Top Pages: ${error.message}` }], isError: true };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
