import "dotenv/config";

const CLIENT_ID = process.env.GSC_CLIENT_ID;
const CLIENT_SECRET = process.env.GSC_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:8765/oauth2callback";

async function testWithHeader() {
  try {
    const params = new URLSearchParams({
      code: "dummy_code",
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code"
    });

    const authHeader = "Basic " + Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64");

    console.log("Sending diagnostic POST request with Basic Auth Header...");
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": authHeader
      },
      body: params.toString()
    });

    const data = await res.json();
    console.log("Response Status:", res.status);
    console.log("Response Body:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Diagnostic Fetch Error:", err);
  }
}

testWithHeader();
