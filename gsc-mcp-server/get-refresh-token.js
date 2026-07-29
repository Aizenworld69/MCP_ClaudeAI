#!/usr/bin/env node
/**
 * One-time helper: run `npm run auth` to obtain a Google OAuth refresh token
 * for Search Console access. Prints the refresh token so you can copy it
 * into your .env file (or MCP client config) as GSC_REFRESH_TOKEN.
 *
 * Requires GSC_CLIENT_ID and GSC_CLIENT_SECRET to already be set in .env
 * (see README.md for how to create them in Google Cloud Console).
 */
import "dotenv/config";
import http from "node:http";
import { URL } from "node:url";
import { google } from "googleapis";
import open from "open";

const CLIENT_ID = process.env.GSC_CLIENT_ID;
const CLIENT_SECRET = process.env.GSC_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:8765/oauth2callback";
const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];
// Use the read-write scope instead if you want to submit/delete sitemaps:
// const SCOPES = ["https://www.googleapis.com/auth/webmasters"];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Missing GSC_CLIENT_ID / GSC_CLIENT_SECRET.\n" +
      "Create a .env file (see .env.example) before running `npm run auth`."
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent", // forces Google to always return a refresh_token
  scope: SCOPES,
});

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, REDIRECT_URI);
    if (url.pathname !== "/oauth2callback") {
      res.writeHead(404);
      res.end();
      return;
    }
    const code = url.searchParams.get("code");
    if (!code) {
      res.writeHead(400);
      res.end("Missing ?code param");
      return;
    }
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      "<h2>Success</h2>You can close this tab and return to the terminal."
    );
    console.log("\n=== Copy this into your .env as GSC_REFRESH_TOKEN ===\n");
    console.log(tokens.refresh_token || "(no refresh_token returned — see note below)");
    console.log("\n======================================================\n");
    if (!tokens.refresh_token) {
      console.log(
        "No refresh_token was returned. This usually means you already granted\n" +
          "consent before. Go to https://myaccount.google.com/permissions, remove\n" +
          "access for this app, and run `npm run auth` again."
      );
    }
    server.close();
    process.exit(0);
  } catch (err) {
    console.error("Auth error:", err.message);
    res.writeHead(500);
    res.end("Auth failed, check terminal.");
    server.close();
    process.exit(1);
  }
});

server.listen(8765, () => {
  console.log("Opening browser for Google sign-in...");
  console.log("If it doesn't open automatically, visit:\n");
  console.log(authUrl, "\n");
  open(authUrl).catch(() => {});
});
