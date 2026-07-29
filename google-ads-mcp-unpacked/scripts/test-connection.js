import { GoogleAdsApi } from 'google-ads-api';
import { rawConfig } from '../dist/config.js';

console.log('Testing Google Ads API connection with full config:');
console.log('Customer ID:', rawConfig.customer_id);
console.log('Developer Token:', rawConfig.developer_token);
console.log('Client ID:', rawConfig.client_id);
console.log('Refresh Token:', rawConfig.refresh_token.substring(0, 15) + '...');

const client = new GoogleAdsApi({
  client_id: rawConfig.client_id,
  client_secret: rawConfig.client_secret,
  developer_token: rawConfig.developer_token,
});

const customer = client.Customer({
  customer_id: rawConfig.customer_id,
  refresh_token: rawConfig.refresh_token,
});

async function test() {
  try {
    const results = await customer.query(`
      SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1
    `);
    console.log('🎉🎉 KẾT NỐI THÀNH CÔNG RỰC RỠ! Dữ liệu tài khoản:');
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('❌ CỐT LÕI LỖI:', err);
  }
}

test();
