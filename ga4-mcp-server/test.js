import { BetaAnalyticsDataClient } from "@google-analytics/data";

const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: "./google-key.json",
});

async function run() {
  try {
    const [response] = await analyticsDataClient.runRealtimeReport({
      property: "properties/541762137",
      metrics: [{ name: "activeUsers" }],
    });
    console.log("Thành công! Kết quả:", JSON.stringify(response, null, 2));
  } catch (error) {
    console.error("LỖI API GA4:", error.message);
    if (error.metadata) {
      console.error("Metadata:", error.metadata);
    }
  }
}

run();
