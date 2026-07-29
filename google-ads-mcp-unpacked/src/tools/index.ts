import { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  getAccountSummary,
  listCampaigns,
  listSubAccounts,
  getSearchTermsReport,
  getQualityScoreBreakdown,
  executeGaqlQuery,
  updateCampaignStatus,
  updateCampaignBudget,
} from '../googleAdsClient.js';

export const TOOLS: Tool[] = [
  {
    name: 'list_sub_accounts',
    description: 'Liệt kê danh sách các tài khoản quảng cáo con thuộc tài khoản Quản lý MCC (Manager Account).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_account_summary',
    description: 'Lấy báo cáo tổng quan tài khoản Google Ads (Tổng chi tiêu VNĐ, lượt nhấp, lượt hiển thị, chuyển đổi, ROAS, CTR, CPC trung bình).',
    inputSchema: {
      type: 'object',
      properties: {
        dateRange: {
          type: 'string',
          description: 'Khoảng thời gian (TODAY, YESTERDAY, LAST_7_DAYS, LAST_30_DAYS, THIS_MONTH). Mặc định là LAST_7_DAYS.',
          default: 'LAST_7_DAYS',
        },
      },
    },
  },
  {
    name: 'list_campaigns',
    description: 'Danh sách các chiến dịch Google Ads đang chạy hoặc tạm dừng, kèm loại chiến dịch, ngân sách ngày VNĐ và chi tiêu gần đây.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_search_terms_report',
    description: 'Lấy báo cáo các cụm từ tìm kiếm thực tế mà khách hàng gõ trên Google dẫn đến quảng cáo hiển thị.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Số lượng cụm từ muốn lấy (mặc định: 30).',
          default: 30,
        },
      },
    },
  },
  {
    name: 'get_quality_score_breakdown',
    description: 'Phân tích chi tiết điểm chất lượng (Quality Score 1-10) của từ khóa và 3 thành phần: Expected CTR, Ad Relevance, Landing Page Experience.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Số lượng từ khóa muốn lấy (mặc định: 30).',
          default: 30,
        },
      },
    },
  },
  {
    name: 'query_gaql',
    description: 'Thực thi câu lệnh GAQL (Google Ads Query Language) trực tiếp để truy vấn bất kỳ thông tin nâng cao nào.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Câu lệnh GAQL hợp lệ (ví dụ: SELECT campaign.id, campaign.name FROM campaign LIMIT 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'update_campaign_status',
    description: 'Thay đổi trạng thái chiến dịch Google Ads (Bật - ENABLED, Tạm dừng - PAUSED).',
    inputSchema: {
      type: 'object',
      properties: {
        campaignId: {
          type: 'string',
          description: 'ID chiến dịch Google Ads (ví dụ: "123456789")',
        },
        status: {
          type: 'string',
          enum: ['ENABLED', 'PAUSED'],
          description: 'Trạng thái mới: "ENABLED" hoặc "PAUSED"',
        },
      },
      required: ['campaignId', 'status'],
    },
  },
  {
    name: 'update_campaign_budget',
    description: 'Điều chỉnh ngân sách ngày của chiến dịch (bằng VNĐ). Có kiểm tra an toàn theo biến giới hạn MAX_DAILY_BUDGET_VND.',
    inputSchema: {
      type: 'object',
      properties: {
        budgetId: {
          type: 'string',
          description: 'ID ngân sách chiến dịch (campaign_budget.id)',
        },
        newBudgetVnd: {
          type: 'number',
          description: 'Số tiền ngân sách ngày mới tính bằng VNĐ (ví dụ: 500000 cho 500k/ngày)',
        },
      },
      required: ['budgetId', 'newBudgetVnd'],
    },
  },
];

export async function handleToolCall(name: string, args: any) {
  try {
    switch (name) {
      case 'list_sub_accounts':
        return await listSubAccounts();

      case 'get_account_summary':
        return await getAccountSummary(args?.dateRange || 'LAST_7_DAYS');

      case 'list_campaigns':
        return await listCampaigns();

      case 'get_search_terms_report':
        return await getSearchTermsReport(args?.limit || 30);

      case 'get_quality_score_breakdown':
        return await getQualityScoreBreakdown(args?.limit || 30);

      case 'query_gaql':
        if (!args?.query) throw new Error('Tham số query không được để trống.');
        return await executeGaqlQuery(args.query);

      case 'update_campaign_status':
        if (!args?.campaignId || !args?.status) {
          throw new Error('Thiếu tham số campaignId hoặc status.');
        }
        return await updateCampaignStatus(args.campaignId, args.status);

      case 'update_campaign_budget':
        if (!args?.budgetId || typeof args?.newBudgetVnd !== 'number') {
          throw new Error('Thiếu tham số budgetId hoặc newBudgetVnd.');
        }
        return await updateCampaignBudget(args.budgetId, args.newBudgetVnd);

      default:
        throw new Error(`Tool không tồn tại: ${name}`);
    }
  } catch (error: any) {
    return {
      error: true,
      message: error.message || String(error),
    };
  }
}
