import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { google } from "googleapis";
import { z } from "zod";

// Khởi tạo Google Auth sử dụng file JSON key dùng chung với GA4
const auth = new google.auth.GoogleAuth({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
  ],
});

const sheets = google.sheets({ version: "v4", auth });
const drive = google.drive({ version: "v3", auth });

const server = new McpServer({
  name: "google-sheets-mcp",
  version: "1.0.0",
});

// Tool 1: Tạo một file Google Sheets mới
server.registerTool(
  "create_spreadsheet",
  {
    description: "Tạo một file Google Sheets (bảng tính) mới trên Google Drive",
    inputSchema: {
      title: z.string().describe("Tiêu đề/Tên của file bảng tính mới (ví dụ: 'Báo cáo doanh thu tháng 7')"),
    }
  },
  async ({ title }) => {
    try {
      const response = await sheets.spreadsheets.create({
        requestBody: {
          properties: { title: title },
        },
      });
      
      const spreadsheetId = response.data.spreadsheetId;
      const url = response.data.spreadsheetUrl;
      
      let result = `✅ Đã tạo thành công file Google Sheets mới!\n`;
      result += `- **Tên file:** ${title}\n`;
      result += `- **Spreadsheet ID:** \`${spreadsheetId}\`\n`;
      result += `- **Link truy cập:** [Bấm vào đây để mở bảng tính](${url})\n\n`;
      result += `> *Lưu ý:* Để tôi có thể ghi dữ liệu vào file này sau này, hãy chia sẻ file Sheets này (Share) cho email Service Account của bạn với quyền Editor nhé.`;

      return { content: [{ type: "text", text: result }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Lỗi khi tạo bảng tính: ${error.message}` }], isError: true };
    }
  }
);

// Tool 2: Đọc dữ liệu từ một file Google Sheets
server.registerTool(
  "read_sheet_data",
  {
    description: "Đọc toàn bộ dữ liệu từ một dải ô (range) trong file Google Sheets",
    inputSchema: {
      spreadsheet_id: z.string().describe("ID của file Google Sheets (lấy từ URL của file Sheets trên trình duyệt)"),
      range: z.string().default("Sheet1!A1:Z100").describe("Dải ô cần đọc (ví dụ: 'Trang_tính_1!A1:D20' hoặc mặc định 'Sheet1!A1:Z100')"),
    }
  },
  async ({ spreadsheet_id, range }) => {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheet_id,
        range: range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return { content: [{ type: "text", text: `Không tìm thấy dữ liệu nào trong dải ô: ${range}` }] };
      }

      // Format dữ liệu thành bảng Markdown để gửi cho Claude đọc
      let report = `### Dữ liệu đọc được từ dải ô \`${range}\`:\n\n`;
      rows.forEach((row, index) => {
        report += `${index + 1}. ${row.join(" | ")}\n`;
      });

      return { content: [{ type: "text", text: report }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Lỗi khi đọc bảng tính: ${error.message}` }], isError: true };
    }
  }
);

// Tool 3: Thêm các dòng dữ liệu mới vào cuối bảng tính (Append Data)
server.registerTool(
  "append_sheet_data",
  {
    description: "Thêm các hàng dữ liệu mới vào cuối bảng tính hiện tại",
    inputSchema: {
      spreadsheet_id: z.string().describe("ID của file Google Sheets"),
      range: z.string().default("Sheet1!A1").describe("Vị trí bắt đầu tìm kiếm dòng trống để ghi thêm (ví dụ: 'Sheet1!A1')"),
      values: z.array(z.array(z.string())).describe("Mảng chứa các hàng dữ liệu cần thêm (ví dụ: [['15/07/2026', 'Facebook Ads', '150000']])"),
    }
  },
  async ({ spreadsheet_id, range, values }) => {
    try {
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheet_id,
        range: range,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: values,
        },
      });

      const updatedRows = response.data.updates?.updatedRows || 0;
      return { content: [{ type: "text", text: `✅ Đã thêm thành công **${updatedRows}** hàng dữ liệu vào bảng tính!` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Lỗi khi thêm dữ liệu vào bảng tính: ${error.message}` }], isError: true };
    }
  }
);

// Tool 4: Cập nhật / Ghi đè dữ liệu vào một dải ô cụ thể (Update Data)
server.registerTool(
  "update_sheet_data",
  {
    description: "Cập nhật hoặc ghi đè dữ liệu vào một dải ô (range) cụ thể chỉ định trên bảng tính",
    inputSchema: {
      spreadsheet_id: z.string().describe("ID của file Google Sheets"),
      range: z.string().describe("Dải ô cần ghi đè dữ liệu (ví dụ: 'Sheet1!A1:B2')"),
      values: z.array(z.array(z.string())).describe("Mảng chứa các hàng dữ liệu mới cần ghi"),
    }
  },
  async ({ spreadsheet_id, range, values }) => {
    try {
      const response = await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheet_id,
        range: range,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: values,
        },
      });

      const updatedCells = response.data.updatedCells || 0;
      return { content: [{ type: "text", text: `✅ Đã cập nhật thành công **${updatedCells}** ô dữ liệu trong dải ô \`${range}\`!` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Lỗi khi cập nhật dữ liệu bảng tính: ${error.message}` }], isError: true };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
