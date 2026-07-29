import "dotenv/config";
import { google } from "googleapis";
import https from "node:https";
import http from "node:http";

const CLIENT_ID = process.env.GSC_CLIENT_ID;
const CLIENT_SECRET = process.env.GSC_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GSC_REFRESH_TOKEN;

const agentOptions = {
  httpsAgent: new https.Agent({ keepAlive: false }),
  httpAgent: new http.Agent({ keepAlive: false }),
};

// Set options globally for googleapis
google.options(agentOptions);

const oauth2Client = new google.auth.OAuth2({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  transporterOptions: agentOptions,
});
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const webmasters = google.webmasters({ version: "v3", auth: oauth2Client });

async function run() {
  try {
    console.log("Calling webmasters.sites.list()...");
    const res = await webmasters.sites.list();
    console.log("Success! Sites found:", res.data.siteEntry || []);
  } catch (err) {
    console.error("API Error status:", err.status || err.code);
    console.error("API Error message:", err.message);
    if (err.response && err.response.data) {
      console.error("API Error response data:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("API Error raw:", err);
    }
  }
}

run();
