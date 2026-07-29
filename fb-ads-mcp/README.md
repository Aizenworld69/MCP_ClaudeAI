# Facebook Ads MCP Server (mcpb bundle)

MCP Server tích hợp với Facebook / Meta Graph API để quản lý và theo dõi quảng cáo Facebook Ads.

## 🛠 Features / Tools

1. `list_ad_accounts`: Danh sách tất cả Ad Accounts được quản lý.
2. `get_ads_performance`: Báo cáo chi tiết chiến dịch (Chi phí spend, Clicks, Impressions, CTR, CPC, CPM).
3. `get_adsets_performance`: Báo cáo hiệu suất theo Nhóm quảng cáo (Ad Sets).
4. `get_ads_creative_performance`: Báo cáo hiệu suất theo Mẫu quảng cáo (Ads / Creatives).
5. `toggle_campaign_status`: Bật (`ACTIVE`) hoặc Tắt (`PAUSED`) chiến dịch quảng cáo.
6. `update_campaign_budget`: Cập nhật ngân sách chi tiêu hàng ngày (Daily Budget - VNĐ).

## ⚙️ Configuration Variables

- `FB_ADS_ACCESS_TOKEN`: Access Token từ Meta Graph API Explorer (Cần quyền `ads_read`, `ads_management`).
- `FB_AD_ACCOUNT_ID`: ID tài khoản quảng cáo (ví dụ `act_123456789`) - không bắt buộc, nếu trống MCP sẽ tự lấy tài khoản đầu tiên.
