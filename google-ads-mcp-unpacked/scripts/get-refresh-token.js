import http from 'http';
import url from 'url';

/**
 * Script hướng dẫn và hỗ trợ lấy OAuth2 Refresh Token cho Google Ads API
 */
console.log(`
===================================================================
   HƯỚNG DẪN LẤY GOOGLE ADS REFRESH TOKEN (OAUTH 2.0)
===================================================================

1. Đảm bảo bạn đã tạo OAuth 2.0 Client ID trên Google Cloud Console:
   - Application type: Web application
   - Authorized redirect URIs: http://localhost:3000/oauth2callback

2. Điền CLIENT_ID và CLIENT_SECRET của bạn dưới đây:
`);

const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';
const SCOPE = 'https://www.googleapis.com/auth/adwords';

if (CLIENT_ID === 'YOUR_CLIENT_ID') {
  console.log('⚠️ Hãy đặt GOOGLE_ADS_CLIENT_ID và GOOGLE_ADS_CLIENT_SECRET trong file .env trước khi chạy script này!');
  console.log('Hoặc chạy: $env:GOOGLE_ADS_CLIENT_ID="xxx"; $env:GOOGLE_ADS_CLIENT_SECRET="yyy"; npm run get-token\n');
  process.exit(1);
}

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
  REDIRECT_URI
)}&response_type=code&scope=${encodeURIComponent(SCOPE)}&access_type=offline&prompt=consent`;

console.log('👉 Bước 1: Mở URL sau trên trình duyệt để cấp quyền Google Ads:');
console.log('\n' + authUrl + '\n');
console.log('Đang chờ phản hồi trên http://localhost:3000/oauth2callback ...');

const server = http.createServer(async (req, res) => {
  const reqUrl = url.parse(req.url, true);
  if (reqUrl.pathname === '/oauth2callback') {
    const code = reqUrl.query.code;
    if (code) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>Thành công!</h1><p>Vui lòng kiểm tra màn hình Terminal để lấy Refresh Token.</p>');

      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code: String(code),
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
          }),
        });

        const tokens = await tokenRes.json();
        console.log('\n===================================================================');
        console.log('🎉 ĐÃ LẤY REFRESH TOKEN THÀNH CÔNG!');
        console.log('===================================================================');
        console.log('GOOGLE_ADS_REFRESH_TOKEN =', tokens.refresh_token);
        console.log('===================================================================\n');
      } catch (err) {
        console.error('Lỗi khi đổi mã authorization_code lấy refresh_token:', err);
      } finally {
        server.close();
        process.exit(0);
      }
    }
  }
});

server.listen(3000);
