import { GoogleAdsApi, Customer } from 'google-ads-api';
import { config, formatMicrosToAmount, formatAmountToMicros } from './config.js';

let customerInstance: Customer | null = null;

export function getCustomer(): Customer {
  if (customerInstance) return customerInstance;

  if (!config.developer_token || !config.client_id || !config.client_secret || !config.refresh_token || !config.customer_id) {
    throw new Error('Thiếu thông tin cấu hình Google Ads API trong biến môi trường (.env hoặc claude_desktop_config.json)');
  }

  const client = new GoogleAdsApi({
    client_id: config.client_id,
    client_secret: config.client_secret,
    developer_token: config.developer_token,
  });

  customerInstance = client.Customer({
    customer_id: config.customer_id,
    refresh_token: config.refresh_token,
  });

  return customerInstance;
}

/**
 * Thực thi câu lệnh GAQL (Google Ads Query Language)
 */
export async function executeGaqlQuery(query: string) {
  try {
    const customer = getCustomer();
    const results = await customer.query(query);
    return results;
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (msg.includes('Metrics cannot be requested for a manager account')) {
      throw new Error(`ID ${config.customer_id} là Tài khoản Quản lý (MCC). Google Ads API không cho phép đọc chỉ số trực tiếp trên ID MCC. Hãy đổi GOOGLE_ADS_CUSTOMER_ID thành ID tài khoản quảng cáo con đã hoàn tất kích hoạt (hoặc tài khoản Test).`);
    }
    if (msg.includes("can't be accessed because it is not yet enabled or has been deactivated")) {
      throw new Error(`Tài khoản ${config.customer_id} hiện đang ở trạng thái 'Đang thiết lập' hoặc chưa hoàn tất khởi tạo trên ads.google.com. Hãy mở trang ads.google.com hoàn tất thiết lập hoặc tạo 1 tài khoản quảng cáo con đã kích hoạt.`);
    }
    throw error;
  }
}

/**
 * Liệt kê danh sách các tài khoản con thuộc MCC
 */
export async function listSubAccounts() {
  const query = `
    SELECT
      customer_client.id,
      customer_client.descriptive_name,
      customer_client.status,
      customer_client.manager
    FROM customer_client
  `;
  const results = await executeGaqlQuery(query);
  return results.map((row: any) => ({
    id: String(row.customer_client.id),
    name: row.customer_client.descriptive_name || 'Tài khoản chưa đặt tên',
    is_manager: row.customer_client.manager ? 'Có (Tài khoản Quản lý MCC)' : 'Không (Tài khoản Quảng cáo con)',
    status: row.customer_client.status === 2 ? 'ENABLED (Đang hoạt động)' : 'DRAFT / INACTIVE (Đang thiết lập / Chưa kích hoạt)',
  }));
}

/**
 * Lấy báo cáo tổng quan tài khoản
 */
export async function getAccountSummary(dateRange: string = 'LAST_7_DAYS') {
  const query = `
    SELECT
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions_value
    FROM customer
    WHERE segments.date DURING ${dateRange}
  `;

  const results = await executeGaqlQuery(query);
  if (!results || results.length === 0) {
    return { message: 'Không có dữ liệu trong khoảng thời gian này.' };
  }

  const totalCost = results.reduce((acc: number, row: any) => acc + (row.metrics?.cost_micros || 0), 0);
  const totalClicks = results.reduce((acc: number, row: any) => acc + (row.metrics?.clicks || 0), 0);
  const totalImpressions = results.reduce((acc: number, row: any) => acc + (row.metrics?.impressions || 0), 0);
  const totalConversions = results.reduce((acc: number, row: any) => acc + (row.metrics?.conversions || 0), 0);
  const totalConvValue = results.reduce((acc: number, row: any) => acc + (row.metrics?.conversions_value || 0), 0);

  const spendVnd = formatMicrosToAmount(totalCost);
  const roas = spendVnd > 0 ? (totalConvValue / spendVnd).toFixed(2) : '0';
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '0%';
  const avgCpc = totalClicks > 0 ? formatMicrosToAmount(totalCost / totalClicks) : 0;

  return {
    date_range: dateRange,
    spend_vnd: spendVnd,
    clicks: totalClicks,
    impressions: totalImpressions,
    conversions: totalConversions,
    conversion_value: totalConvValue,
    roas: roas,
    ctr: ctr,
    average_cpc_vnd: avgCpc,
  };
}

/**
 * Danh sách chiến dịch & Trạng thái
 */
export async function listCampaigns() {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign_budget.amount_micros,
      metrics.cost_micros,
      metrics.clicks,
      metrics.conversions
    FROM campaign
    WHERE campaign.status IN ('ENABLED', 'PAUSED')
    ORDER BY metrics.cost_micros DESC
    LIMIT 50
  `;

  const results = await executeGaqlQuery(query);
  return results.map((row: any) => ({
    id: row.campaign.id,
    name: row.campaign.name,
    status: row.campaign.status,
    channel_type: row.campaign.advertising_channel_type,
    daily_budget_vnd: formatMicrosToAmount(row.campaign_budget?.amount_micros),
    cost_micros_recent: row.metrics?.cost_micros || 0,
    spend_recent_vnd: formatMicrosToAmount(row.metrics?.cost_micros),
    clicks: row.metrics?.clicks || 0,
    conversions: row.metrics?.conversions || 0,
  }));
}

/**
 * Cụm từ tìm kiếm thực tế (Search Terms)
 */
export async function getSearchTermsReport(limit: number = 30) {
  const query = `
    SELECT
      search_term_view.search_term,
      campaign.name,
      ad_group.name,
      metrics.clicks,
      metrics.impressions,
      metrics.cost_micros,
      metrics.conversions
    FROM search_term_view
    WHERE metrics.cost_micros > 0
    ORDER BY metrics.cost_micros DESC
    LIMIT ${limit}
  `;

  const results = await executeGaqlQuery(query);
  return results.map((row: any) => ({
    search_term: row.search_term_view.search_term,
    campaign_name: row.campaign.name,
    ad_group_name: row.ad_group.name,
    clicks: row.metrics.clicks,
    impressions: row.metrics.impressions,
    spend_vnd: formatMicrosToAmount(row.metrics.cost_micros),
    conversions: row.metrics.conversions,
  }));
}

/**
 * Chi tiết điểm chất lượng từ khóa (Quality Score Breakdown)
 */
export async function getQualityScoreBreakdown(limit: number = 30) {
  const query = `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.quality_info.quality_score,
      ad_group_criterion.quality_info.creative_quality_score,
      ad_group_criterion.quality_info.post_click_quality_score,
      ad_group_criterion.quality_info.search_predicted_ctr,
      campaign.name,
      ad_group.name
    FROM keyword_view
    WHERE ad_group_criterion.status = 'ENABLED'
      AND ad_group_criterion.quality_info.quality_score IS NOT NULL
    ORDER BY ad_group_criterion.quality_info.quality_score ASC
    LIMIT ${limit}
  `;

  const results = await executeGaqlQuery(query);
  return results.map((row: any) => ({
    keyword: row.ad_group_criterion.keyword.text,
    quality_score: row.ad_group_criterion.quality_info.quality_score,
    expected_ctr: row.ad_group_criterion.quality_info.search_predicted_ctr,
    ad_relevance: row.ad_group_criterion.quality_info.creative_quality_score,
    landing_page_experience: row.ad_group_criterion.quality_info.post_click_quality_score,
    campaign_name: row.campaign.name,
    ad_group_name: row.ad_group.name,
  }));
}

/**
 * Cập nhật trạng thái chiến dịch (ENABLED / PAUSED)
 */
export async function updateCampaignStatus(campaignId: string, status: 'ENABLED' | 'PAUSED') {
  const customer = getCustomer();
  const resourceName = `customers/${config.customer_id}/campaigns/${campaignId}`;

  await customer.campaigns.update([
    {
      resource_name: resourceName,
      status: status,
    },
  ]);

  return {
    success: true,
    campaign_id: campaignId,
    new_status: status,
    message: `Đã cập nhật trạng thái chiến dịch ${campaignId} thành ${status}`,
  };
}

/**
 * Cập nhật ngân sách chiến dịch (có kiểm tra hạn mức an toàn MAX_DAILY_BUDGET_VND)
 */
export async function updateCampaignBudget(budgetId: string, newBudgetVnd: number) {
  if (newBudgetVnd > config.max_daily_budget_vnd) {
    throw new Error(
      `CẢNH BÁO AN TOÀN: Ngân sách yêu cầu (${newBudgetVnd.toLocaleString()} VNĐ) vượt quá hạn mức tối đa cho phép (${config.max_daily_budget_vnd.toLocaleString()} VNĐ). Vui lòng điều chỉnh biến MAX_DAILY_BUDGET_VND nếu muốn nâng giới hạn.`
    );
  }

  const customer = getCustomer();
  const resourceName = `customers/${config.customer_id}/campaignBudgets/${budgetId}`;
  const amountMicros = formatAmountToMicros(newBudgetVnd);

  await customer.campaignBudgets.update([
    {
      resource_name: resourceName,
      amount_micros: amountMicros,
    },
  ]);

  return {
    success: true,
    budget_id: budgetId,
    new_budget_vnd: newBudgetVnd,
    message: `Đã cập nhật ngân sách ngày thành ${newBudgetVnd.toLocaleString()} VNĐ`,
  };
}
