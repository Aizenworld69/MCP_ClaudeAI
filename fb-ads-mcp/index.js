import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from "axios";
import { z } from "zod";

const ACCESS_TOKEN = process.env.FB_ADS_ACCESS_TOKEN;
const DEFAULT_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID;

const server = new McpServer({
  name: "facebook-ads-mcp",
  version: "1.0.0",
});

// Hàm helper để lấy Ad Account ID đầu tiên nếu không được cung cấp
async function getAdAccountId(providedId) {
  if (providedId) return providedId.startsWith("act_") ? providedId : `act_${providedId}`;
  if (DEFAULT_AD_ACCOUNT_ID) return DEFAULT_AD_ACCOUNT_ID.startsWith("act_") ? DEFAULT_AD_ACCOUNT_ID : `act_${DEFAULT_AD_ACCOUNT_ID}`;
  
  // Tự động fetch từ /me/adaccounts nếu không có sẵn
  try {
    const response = await axios.get("https://graph.facebook.com/v21.0/me/adaccounts", {
      params: { 
        access_token: ACCESS_TOKEN, 
        fields: "account_id,name" 
      }
    });
    const accounts = response.data.data || [];
    if (accounts.length === 0) {
      throw new Error("Tài khoản Facebook của bạn không quản lý bất kỳ tài khoản quảng cáo nào.");
    }
    return `act_${accounts[0].account_id}`;
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    throw new Error(`Không thể tự động tìm Ad Account ID: ${errMsg}`);
  }
}

// Tool 1: Liệt kê các tài khoản quảng cáo (Ad Accounts) có quyền truy cập
server.registerTool(
  "list_ad_accounts",
  {
    description: "Liệt kê danh sách tất cả các tài khoản quảng cáo Facebook Ads mà bạn có quyền quản lý",
    inputSchema: {}
  },
  async () => {
    try {
      const response = await axios.get("https://graph.facebook.com/v21.0/me/adaccounts", {
        params: { 
          access_token: ACCESS_TOKEN, 
          fields: "id,account_id,name,account_status,currency" 
        }
      });
      const accounts = response.data.data || [];
      if (accounts.length === 0) {
        return { content: [{ type: "text", text: "Tài khoản Facebook của bạn không có quyền quản lý tài khoản quảng cáo nào." }] };
      }
      
      let report = `### Danh sách tài khoản quảng cáo Facebook Ads của bạn:\n\n`;
      report += `| Tên tài khoản | Ad Account ID (Dùng cho MCP) | Tiền tệ | Trạng thái |\n`;
      report += `| :--- | :--- | :--- | :--- |\n`;
      accounts.forEach(acc => {
        let status = "Không rõ";
        if (acc.account_status === 1) status = "Đang hoạt động (Active)";
        else if (acc.account_status === 2) status = "Bị vô hiệu hóa (Disabled)";
        else if (acc.account_status === 3) status = "Đang chờ thanh toán (Pending risk review)";
        else if (acc.account_status === 7) status = "Bị khóa do vi phạm (In Grace Period)";
        else if (acc.account_status === 9) status = "Đang tạm dừng (Pending Settlement)";
        else status = `Mã trạng thái: ${acc.account_status}`;

        report += `| **${acc.name}** | \`${acc.id}\` | ${acc.currency} | ${status} |\n`;
      });
      return { content: [{ type: "text", text: report }] };
    } catch (error) {
      const errMsg = error.response?.data?.error?.message || error.message;
      return { content: [{ type: "text", text: `Lỗi khi lấy danh sách Ad Accounts: ${errMsg}` }], isError: true };
    }
  }
);

// Tool 2: Lấy báo cáo hiệu suất ở cấp độ Chiến dịch (Campaign Insights)
server.registerTool(
  "get_ads_performance",
  {
    description: "Lấy báo cáo chi tiết hiệu suất quảng cáo (chi phí spend, click, hiển thị, CPC, CPM, CTR) của các chiến dịch",
    inputSchema: {
      ad_account_id: z.string().optional().describe("ID tài khoản quảng cáo (ví dụ: 'act_123456789'). Nếu bỏ trống sẽ tự động lấy tài khoản đầu tiên."),
      date_preset: z.enum([
        "today", "yesterday", "this_week_mon_today", "last_week", 
        "this_month", "last_month", "last_30d", "maximum"
      ]).default("last_30d").describe("Khoảng thời gian báo cáo (mặc định 30 ngày qua)"),
    }
  },
  async ({ ad_account_id, date_preset }) => {
    try {
      const activeAdAccountId = await getAdAccountId(ad_account_id);
      
      const url = `https://graph.facebook.com/v21.0/${activeAdAccountId}/insights`;
      const response = await axios.get(url, {
        params: {
          access_token: ACCESS_TOKEN,
          level: "campaign",
          date_preset: date_preset,
          fields: "campaign_id,campaign_name,spend,impressions,clicks,cpc,cpm,ctr",
          limit: 50
        }
      });

      const data = response.data.data || [];
      if (data.length === 0) {
        return { content: [{ type: "text", text: `Không tìm thấy dữ liệu quảng cáo nào cho tài khoản ${activeAdAccountId} trong khoảng thời gian: ${date_preset}` }] };
      }

      let report = `### Báo cáo hiệu suất Chiến dịch Facebook Ads cho tài khoản \`${activeAdAccountId}\` (${date_preset})\n\n`;
      report += `| Tên chiến dịch | Campaign ID | Chi phí đã tiêu (VND) | Lượt hiển thị | Lượt Click | CTR (%) | CPC (VND) | CPM (VND) |\n`;
      report += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

      let totalSpend = 0;
      let totalClicks = 0;
      let totalImpressions = 0;

      data.forEach(item => {
        const spend = parseFloat(item.spend || 0);
        const clicks = parseInt(item.clicks || 0);
        const impressions = parseInt(item.impressions || 0);

        totalSpend += spend;
        totalClicks += clicks;
        totalImpressions += impressions;

        report += `| **${item.campaign_name}** | \`${item.campaign_id}\` | ${spend.toLocaleString()} | ${impressions.toLocaleString()} | ${clicks.toLocaleString()} | ${parseFloat(item.ctr || 0).toFixed(2)}% | ${parseFloat(item.cpc || 0).toFixed(0)} | ${parseFloat(item.cpm || 0).toFixed(0)} |\n`;
      });

      report += `\n**TỔNG CỘNG CHI TIÊU:** **${totalSpend.toLocaleString()} VND**\n`;
      report += `- Tổng lượt hiển thị: ${totalImpressions.toLocaleString()}\n`;
      report += `- Tổng lượt click: ${totalClicks.toLocaleString()}\n`;

      return { content: [{ type: "text", text: report }] };
    } catch (error) {
      const errMsg = error.response?.data?.error?.message || error.message;
      return { content: [{ type: "text", text: `Lỗi kết nối Facebook Ads API: ${errMsg}` }], isError: true };
    }
  }
);

// Tool 3: Lấy báo cáo hiệu suất ở cấp độ Nhóm quảng cáo (Ad Set Insights)
server.registerTool(
  "get_adsets_performance",
  {
    description: "Lấy báo cáo chi tiết hiệu suất quảng cáo ở cấp độ các Nhóm quảng cáo (Ad Set)",
    inputSchema: {
      ad_account_id: z.string().optional().describe("ID tài khoản quảng cáo. Nếu bỏ trống sẽ tự động lấy tài khoản đầu tiên."),
      date_preset: z.enum([
        "today", "yesterday", "this_week_mon_today", "last_week", 
        "this_month", "last_month", "last_30d", "maximum"
      ]).default("last_30d").describe("Khoảng thời gian báo cáo"),
    }
  },
  async ({ ad_account_id, date_preset }) => {
    try {
      const activeAdAccountId = await getAdAccountId(ad_account_id);
      const url = `https://graph.facebook.com/v21.0/${activeAdAccountId}/insights`;
      const response = await axios.get(url, {
        params: {
          access_token: ACCESS_TOKEN,
          level: "adset",
          date_preset: date_preset,
          fields: "adset_name,campaign_name,spend,impressions,clicks,cpc,ctr",
          limit: 50
        }
      });

      const data = response.data.data || [];
      if (data.length === 0) {
        return { content: [{ type: "text", text: "Không tìm thấy dữ liệu Nhóm quảng cáo nào." }] };
      }

      let report = `### Báo cáo Nhóm quảng cáo (Ad Sets) cho tài khoản \`${activeAdAccountId}\` (${date_preset})\n\n`;
      report += `| Tên nhóm | Thuộc chiến dịch | Chi phí (VND) | Hiển thị | Click | CTR | CPC |\n`;
      report += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

      data.forEach(item => {
        const spend = parseFloat(item.spend || 0);
        const clicks = parseInt(item.clicks || 0);
        const impressions = parseInt(item.impressions || 0);
        report += `| **${item.adset_name}** | ${item.campaign_name} | ${spend.toLocaleString()} | ${impressions.toLocaleString()} | ${clicks.toLocaleString()} | ${parseFloat(item.ctr || 0).toFixed(2)}% | ${parseFloat(item.cpc || 0).toFixed(0)} |\n`;
      });

      return { content: [{ type: "text", text: report }] };
    } catch (error) {
      const errMsg = error.response?.data?.error?.message || error.message;
      return { content: [{ type: "text", text: `Lỗi kết nối Facebook Ads API: ${errMsg}` }], isError: true };
    }
  }
);

// Tool 4: Lấy báo cáo hiệu suất ở cấp độ Mẫu quảng cáo (Ads/Creatives Insights)
server.registerTool(
  "get_ads_creative_performance",
  {
    description: "Lấy báo cáo hiệu suất chi tiết của từng Mẫu quảng cáo cụ thể (Ads/Creatives)",
    inputSchema: {
      ad_account_id: z.string().optional().describe("ID tài khoản quảng cáo. Nếu bỏ trống sẽ tự động lấy tài khoản đầu tiên."),
      date_preset: z.enum([
        "today", "yesterday", "this_week_mon_today", "last_week", 
        "this_month", "last_month", "last_30d", "maximum"
      ]).default("last_30d").describe("Khoảng thời gian báo cáo"),
    }
  },
  async ({ ad_account_id, date_preset }) => {
    try {
      const activeAdAccountId = await getAdAccountId(ad_account_id);
      const url = `https://graph.facebook.com/v21.0/${activeAdAccountId}/insights`;
      const response = await axios.get(url, {
        params: {
          access_token: ACCESS_TOKEN,
          level: "ad",
          date_preset: date_preset,
          fields: "ad_name,adset_name,spend,impressions,clicks,ctr",
          limit: 50
        }
      });

      const data = response.data.data || [];
      if (data.length === 0) {
        return { content: [{ type: "text", text: "Không tìm thấy dữ liệu Mẫu quảng cáo nào." }] };
      }

      let report = `### Báo cáo Mẫu quảng cáo (Ads/Creatives) cho tài khoản \`${activeAdAccountId}\` (${date_preset})\n\n`;
      report += `| Tên mẫu quảng cáo | Thuộc nhóm quảng cáo | Chi phí (VND) | Hiển thị | Click | CTR |\n`;
      report += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

      data.forEach(item => {
        const spend = parseFloat(item.spend || 0);
        const clicks = parseInt(item.clicks || 0);
        const impressions = parseInt(item.impressions || 0);
        report += `| **${item.ad_name}** | ${item.adset_name} | ${spend.toLocaleString()} | ${impressions.toLocaleString()} | ${clicks.toLocaleString()} | ${parseFloat(item.ctr || 0).toFixed(2)}% |\n`;
      });

      return { content: [{ type: "text", text: report }] };
    } catch (error) {
      const errMsg = error.response?.data?.error?.message || error.message;
      return { content: [{ type: "text", text: `Lỗi kết nối Facebook Ads API: ${errMsg}` }], isError: true };
    }
  }
);

// Tool 5: Bật hoặc Tắt chiến dịch quảng cáo (ACTIVE / PAUSED)
server.registerTool(
  "toggle_campaign_status",
  {
    description: "Bật hoặc Tắt (Tạm dừng) một chiến dịch quảng cáo cụ thể bằng ID chiến dịch",
    inputSchema: {
      campaign_id: z.string().describe("ID của chiến dịch quảng cáo (ví dụ: '1202113271109012')"),
      status: z.enum(["ACTIVE", "PAUSED"]).describe("Trạng thái mong muốn: 'ACTIVE' (Bật) hoặc 'PAUSED' (Tắt)"),
    }
  },
  async ({ campaign_id, status }) => {
    try {
      const url = `https://graph.facebook.com/v21.0/${campaign_id}`;
      const response = await axios.post(url, null, {
        params: {
          access_token: ACCESS_TOKEN,
          status: status
        }
      });

      if (response.data.success) {
        const statusText = status === "ACTIVE" ? "BẬT hoạt động" : "TẮT (Tạm dừng)";
        return { content: [{ type: "text", text: `✅ Đã chuyển trạng thái chiến dịch (ID: \`${campaign_id}\`) sang: **${statusText}** thành công!` }] };
      } else {
        return { content: [{ type: "text", text: `❌ Cập nhật trạng thái thất bại.` }], isError: true };
      }
    } catch (error) {
      const errMsg = error.response?.data?.error?.message || error.message;
      return { content: [{ type: "text", text: `Lỗi API khi thay đổi trạng thái chiến dịch: ${errMsg}` }], isError: true };
    }
  }
);

// Tool 6: Cập nhật ngân sách hàng ngày (Daily Budget) của chiến dịch
server.registerTool(
  "update_campaign_budget",
  {
    description: "Cập nhật ngân sách chi tiêu hàng ngày (Daily Budget) của một chiến dịch cụ thể",
    inputSchema: {
      campaign_id: z.string().describe("ID của chiến dịch quảng cáo"),
      daily_budget_vnd: z.number().describe("Số tiền ngân sách hàng ngày mới bằng VNĐ (ví dụ: 100000 cho 100.000 VNĐ)"),
    }
  },
  async ({ campaign_id, daily_budget_vnd }) => {
    try {
      // Bẫy API: Meta Marketing API yêu cầu ngân sách gửi lên bằng Cent (1 VNĐ = 100 Cents của Meta)
      const budgetInCents = daily_budget_vnd * 100;

      const url = `https://graph.facebook.com/v21.0/${campaign_id}`;
      const response = await axios.post(url, null, {
        params: {
          access_token: ACCESS_TOKEN,
          daily_budget: budgetInCents
        }
      });

      if (response.data.success) {
        return { content: [{ type: "text", text: `✅ Đã cập nhật ngân sách hàng ngày của chiến dịch (ID: \`${campaign_id}\`) thành: **${daily_budget_vnd.toLocaleString()} VNĐ** thành công!` }] };
      } else {
        return { content: [{ type: "text", text: `❌ Cập nhật ngân sách thất bại.` }], isError: true };
      }
    } catch (error) {
      const errMsg = error.response?.data?.error?.message || error.message;
      return { content: [{ type: "text", text: `Lỗi API khi cập nhật ngân sách: ${errMsg}` }], isError: true };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
