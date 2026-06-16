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