import { google } from "googleapis";
import fs from "fs";

const keyContent = fs.readFileSync("../ga4-mcp-server/google-key.json", "utf8");
const key = JSON.parse(keyContent);
const auth = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
  ]
);

const sheets = google.sheets({ version: "v4", auth });

async function run() {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: "1jThVtcQ5ck7Qrap_rPQE5-TnqEgipTHlNaGfu38ueLs",
    });
    console.log("Thanh cong! Metadata Sheets:", JSON.stringify(response.data.properties, null, 2));
    console.log("Cac trang tinh co san:");
    response.data.sheets.forEach(s => {
      console.log("- " + s.properties.title);
    });
  } catch (error) {
    console.error("LOI API GET:", error.message);
    if (error.response && error.response.data) {
      console.error("Chi tiet:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

run();
