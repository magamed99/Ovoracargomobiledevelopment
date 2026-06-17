import { Hono } from "npm:hono";
import { setupAviaRoutes } from "./aviaRoutes.tsx";
import * as bcryptAvia from "npm:bcryptjs"; // used by legacy dead-code block below
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import webpush from "npm:web-push";
import { SignJWT, jwtVerify } from "npm:jose";
import { rateLimitMiddleware, RL } from "./rateLimit.tsx";
import * as kv from "./kv_store.tsx";
import { handleSendOtp, handleVerifyOtp } from "./otp.tsx";
import { handleGenerateBackup, handleVerifyBackup, handleBackupExists } from "./backup.tsx";
import { handleEmailCheck, handleSetCode, handleVerifyPermCode, handleResetCode, handleAdminListCodes } from "./permCode.tsx";
import {
  sendEmail, throttleEmail,
  welcomeTemplate, newOfferTemplate,
  offerAcceptedTemplate, offerRejectedTemplate,
  tripCompletedTemplate, newMessageTemplate,
} from "./email.tsx";

const app = new Hono();
app.use('*', logger(console.log));

// ── Input sanitization helper ──────────────────────────────────────────────
function clampStr(s: unknown, max: number): string {
  if (typeof s !== 'string') return '';
  return s.trim().slice(0, max);
}
function assertMaxLen(fields: Record<string, unknown>, limits: Record<string, number>): string | null {
  for (const [key, max] of Object.entries(limits)) {
    const val = fields[key];
    if (typeof val === 'string' && val.length > max) {
      return `Field '${key}' exceeds maximum length of ${max} characters`;
    }
  }
  return null;
}