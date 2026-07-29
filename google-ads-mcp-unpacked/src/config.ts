import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  developer_token: z.string().default(''),
  client_id: z.string().default(''),
  client_secret: z.string().default(''),
  refresh_token: z.string().default(''),
  customer_id: z.string().default(''),
  max_daily_budget_vnd: z.coerce.number().default(5000000),
});

export const rawConfig = {
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
  client_id: process.env.GOOGLE_ADS_CLIENT_ID || '',
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
  customer_id: (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, ''),
  max_daily_budget_vnd: Number(process.env.MAX_DAILY_BUDGET_VND) || 5000000,
};

export const config = configSchema.parse(rawConfig);

export function formatMicrosToAmount(micros: number | string | undefined | null): number {
  if (!micros) return 0;
  const num = typeof micros === 'string' ? parseFloat(micros) : micros;
  return Math.round(num / 1000000);
}

export function formatAmountToMicros(amount: number): number {
  return Math.round(amount * 1000000);
}
