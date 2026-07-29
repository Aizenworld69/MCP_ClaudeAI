#!/usr/bin/env node
/**
 * MCP server for Google Search Console.
 *
 * Exposes tools to:
 *  - list verified sites/properties
 *  - query Search Analytics (clicks, impressions, ctr, position by query/page/country/device/date)
 *  - inspect a URL's indexing status
 *  - list and submit sitemaps
 *
 * Auth: OAuth2 refresh token (see README.md / `npm run auth`).
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, ".env"), override: false });
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { google } from "googleapis";
import { z } from "zod";
import https from "node:https";
import http from "node:http";

const CLIENT_ID = process.env.GSC_CLIENT_ID;
const CLIENT_SECRET = process.env.GSC_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GSC_REFRESH_TOKEN;

function checkCredentials() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error(
      "Missing GSC API credentials. Please click the 'Configure' button on the Google Search Console Manager extension inside your AI assistant settings and fill in Client ID, Client Secret, and Refresh Token."
    );
  }
}

const agentOptions = {
  httpsAgent: new https.Agent({ keepAlive: false }),
  httpAgent: new http.Agent({ keepAlive: false }),
};

// Disable keepAlive globally for googleapis
google.options(agentOptions);

const oauth2Client = new google.auth.OAuth2({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  transporterOptions: agentOptions,
});

if (REFRESH_TOKEN) {
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
}

const webmasters = google.webmasters({ version: "v3", auth: oauth2Client });
const searchconsole = google.searchconsole({ version: "v1", auth: oauth2Client });

const server = new McpServer({
  name: "google-search-console",
  version: "1.0.0",
});

// ---------- Tool: list_sites ----------
server.registerTool(
  "list_sites",
  {
    title: "List Search Console sites",
    description:
      "List all sites/properties (domain or URL-prefix) this account has access to in Google Search Console, with permission level.",
    inputSchema: {},
  },
  async () => {
    checkCredentials();
    const res = await webmasters.sites.list();
    const sites = res.data.siteEntry || [];
    return {
      content: [{ type: "text", text: JSON.stringify(sites, null, 2) }],
    };
  }
);

// ---------- Tool: search_analytics ----------
server.registerTool(
  "search_analytics",
  {
    title: "Query Search Analytics",
    description:
      "Query Search Console performance data (clicks, impressions, CTR, average position) for a site, " +
      "broken down by one or more dimensions (query, page, country, device, date, searchAppearance) over a date range.",
    inputSchema: {
      siteUrl: z
        .string()
        .describe(
          "Property as registered in Search Console, e.g. 'https://example.com/' or 'sc-domain:example.com'"
        ),
      startDate: z.string().describe("YYYY-MM-DD"),
      endDate: z.string().describe("YYYY-MM-DD"),
      dimensions: z
        .array(z.enum(["query", "page", "country", "device", "date", "searchAppearance"]))
        .default(["query"])
        .describe("How to group the results"),
      rowLimit: z.number().int().min(1).max(25000).default(1000),
      searchType: z
        .enum(["web", "image", "video", "news"])
        .default("web")
        .describe("Which search type to report on"),
      pageFilter: z
        .string()
        .optional()
        .describe("Optional: only include rows where the page contains this substring"),
      queryFilter: z
        .string()
        .optional()
        .describe("Optional: only include rows where the query contains this substring"),
    },
  },
  async ({ siteUrl, startDate, endDate, dimensions, rowLimit, searchType, pageFilter, queryFilter }) => {
    checkCredentials();
    const dimensionFilterGroups = [];
    const filters = [];
    if (pageFilter) {
      filters.push({ dimension: "page", operator: "contains", expression: pageFilter });
    }
    if (queryFilter) {
      filters.push({ dimension: "query", operator: "contains", expression: queryFilter });
    }
    if (filters.length) {
      dimensionFilterGroups.push({ filters });
    }

    const res = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions,
        rowLimit,
        type: searchType,
        ...(dimensionFilterGroups.length ? { dimensionFilterGroups } : {}),
      },
    });

    const rows = res.data.rows || [];
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
    };
  }
);

// ---------- Tool: inspect_url ----------
server.registerTool(
  "inspect_url",
  {
    title: "Inspect URL indexing status",
    description:
      "Run the Search Console URL Inspection API on a single URL to see whether Google has indexed it, " +
      "how it was crawled, mobile usability, and any indexing issues.",
    inputSchema: {
      siteUrl: z
        .string()
        .describe("Property as registered in Search Console, e.g. 'https://example.com/' or 'sc-domain:example.com'"),
      inspectionUrl: z.string().describe("The exact URL to inspect, e.g. 'https://example.com/blog/post'"),
    },
  },
  async ({ siteUrl, inspectionUrl }) => {
    checkCredentials();
    const res = await searchconsole.urlInspection.index.inspect({
      requestBody: { siteUrl, inspectionUrl },
    });
    return {
      content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }],
    };
  }
);

// ---------- Tool: list_sitemaps ----------
server.registerTool(
  "list_sitemaps",
  {
    title: "List sitemaps",
    description: "List all sitemaps submitted for a site, including last submission/read status and error counts.",
    inputSchema: {
      siteUrl: z.string().describe("Property as registered in Search Console"),
    },
  },
  async ({ siteUrl }) => {
    checkCredentials();
    const res = await webmasters.sitemaps.list({ siteUrl });
    return {
      content: [{ type: "text", text: JSON.stringify(res.data.sitemap || [], null, 2) }],
    };
  }
);

// ---------- Tool: submit_sitemap ----------
server.registerTool(
  "submit_sitemap",
  {
    title: "Submit a sitemap",
    description:
      "Submit/resubmit a sitemap URL to Google Search Console for a site. Requires the read-write OAuth scope " +
      "(webmasters, not webmasters.readonly) — see README.md.",
    inputSchema: {
      siteUrl: z.string().describe("Property as registered in Search Console"),
      feedpath: z.string().describe("Full URL of the sitemap, e.g. 'https://example.com/sitemap.xml'"),
    },
  },
  async ({ siteUrl, feedpath }) => {
    checkCredentials();
    await webmasters.sitemaps.submit({ siteUrl, feedpath });
    return {
      content: [{ type: "text", text: `Submitted sitemap: ${feedpath}` }],
    };
  }
);

// ---------- Tool: delete_sitemap ----------
server.registerTool(
  "delete_sitemap",
  {
    title: "Delete a sitemap",
    description: "Delete a submitted sitemap from Google Search Console. Requires read-write OAuth scope.",
    inputSchema: {
      siteUrl: z.string().describe("Property as registered in Search Console, e.g. 'https://example.com/'"),
      feedpath: z.string().describe("Full URL of the sitemap to delete, e.g. 'https://example.com/sitemap.xml'"),
    },
  },
  async ({ siteUrl, feedpath }) => {
    checkCredentials();
    await webmasters.sitemaps.delete({ siteUrl, feedpath });
    return {
      content: [{ type: "text", text: `Deleted sitemap: ${feedpath}` }],
    };
  }
);

// ---------- Tool: add_site ----------
server.registerTool(
  "add_site",
  {
    title: "Add a site",
    description: "Add a site/property to the list of verified sites in Search Console.",
    inputSchema: {
      siteUrl: z.string().describe("Property URL or domain to add, e.g. 'https://example.com/'"),
    },
  },
  async ({ siteUrl }) => {
    checkCredentials();
    await webmasters.sites.add({ siteUrl });
    return {
      content: [{ type: "text", text: `Successfully added site: ${siteUrl}` }],
    };
  }
);

// ---------- Tool: delete_site ----------
server.registerTool(
  "delete_site",
  {
    title: "Delete a site",
    description: "Remove a site/property from the list of verified sites in Search Console.",
    inputSchema: {
      siteUrl: z.string().describe("Property URL or domain to remove, e.g. 'https://example.com/'"),
    },
  },
  async ({ siteUrl }) => {
    checkCredentials();
    await webmasters.sites.delete({ siteUrl });
    return {
      content: [{ type: "text", text: `Successfully removed site: ${siteUrl}` }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Google Search Console MCP server running on stdio");
