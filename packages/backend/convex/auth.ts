import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { emailOTP, organization } from "better-auth/plugins";

import type { DataModel } from "./_generated/dataModel";

import { components } from "./_generated/api";
import authConfig from "./auth.config";
import betterAuthSchema from "./betterAuth/schema";

const siteUrl = process.env.SITE_URL!;
const frontendUrl = process.env.FRONTEND_URL!;
const frontendUrls = (process.env.FRONTEND_URLS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

if (!githubClientId || !githubClientSecret) {
  throw new Error("Missing GitHub OAuth configuration.");
}

export const authComponent = createClient<DataModel, typeof betterAuthSchema>(
  components.betterAuth as any,
  { local: { schema: betterAuthSchema } },
);

type VerificationType = "sign-in" | "email-verification" | "forget-password";

const otpSubjects: Record<VerificationType, string> = {
  "sign-in": "Your Orca Memory sign-in code",
  "email-verification": "Verify your Orca Memory email",
  "forget-password": "Reset your Orca Memory password",
};

const sendOtpEmail = async (email: string, otp: string, type: VerificationType) => {
  const sendApiKey = process.env.RESEND_SEND_API_KEY;
  if (!sendApiKey) {
    throw new Error("Missing Resend configuration.");
  }

  const subject = otpSubjects[type];
  const bodyText = `Your Orca Memory code is ${otp}. It expires in 5 minutes.`;
  const heading =
    type === "sign-in"
      ? "Confirm your sign in"
      : type === "forget-password"
        ? "Reset your Orca Memory password"
        : "Verify your Orca Memory email";
  const subtitle =
    type === "sign-in"
      ? "Use this code to finish signing in."
      : type === "forget-password"
        ? "Use this code to reset your password."
        : "Use this code to verify your email address.";
  const bodyHtml = `
    <div style="background:#000;font-family:Arial,Helvetica,sans-serif;padding:40px">
      <div style="max-width:600px;margin:0 auto;background:#090909;border:1px solid #1f1f1f;border-radius:8px;padding:32px;color:#e5e5e5">
        <div style="text-align:center;margin-bottom:32px">
          <img src="https://di867tnz6fwga.cloudfront.net/brand-kits/3c944035-7983-47ec-af14-a67d15ad8b13/primary/0f2cc255-cd58-454d-9709-c1f776ed8278.png" alt="Orca Memory" style="max-width:200px;width:100%;height:auto"/>
        </div>

        <div style="text-align:center;margin-bottom:32px">
          <h2 style="margin:0 0 12px;color:#fff;font-size:28px">${heading}</h2>
          <p style="margin:0;color:#bdbdbd;font-size:16px">${subtitle}</p>
        </div>

        <div style="background:#000;border:1px solid #1f1f1f;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px">
          <div style="font-size:28px;letter-spacing:6px;color:#29d4ff;font-weight:700">${otp}</div>
        </div>
        <p style="margin:0 0 24px;color:#9e9e9e;text-align:center;font-size:13px">This code expires in 5 minutes.</p>

        <p style="margin:0 0 24px;color:#bdbdbd;text-align:center;font-size:14px">
          Didn’t request this? You can safely ignore this email.
        </p>

        <div style="margin-top:12px">
          <p style="margin:0 0 12px;color:#bdbdbd;text-align:center">Stay connected and follow our journey:</p>
          <div style="text-align:center">
            <a href="https://x.com/orcamemoryai" style="display:inline-block;margin:0 8px">
              <img src="https://new.email/static/emails/social/social-x.png" alt="Follow us on X" style="width:32px;height:32px"/>
            </a>
            <a href="https://github.com/Nebaura-Labs/orcamemory" style="display:inline-block;margin:0 8px">
              <img src="https://new.email/static/emails/social/social-github.png" alt="Star us on GitHub" style="width:32px;height:32px"/>
            </a>
          </div>
        </div>

        <hr style="border:0;border-top:1px solid #1f1f1f;margin:32px 0"/>

        <div style="text-align:center">
          <p style="margin:0 0 8px;color:#9e9e9e;font-size:14px">Persistent memory for OpenClaw agents.</p>
          <p style="margin:0 0 16px;color:#9e9e9e;font-size:14px">Questions? Reply to this email — we’d love to hear from you.</p>
          <p style="margin:0;color:#6f6f6f;font-size:12px">
            <a href="#" style="color:#6f6f6f;text-decoration:underline">Unsubscribe</a> | © 2026 Nebaura Labs - All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `.trim();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Orca Memory <team@orcamemory.com>",
      to: [email],
      subject,
      text: bodyText,
      html: bodyHtml,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend error: ${response.status} ${errorBody}`);
  }

  const responseBody = await response.text();
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[Resend] email=${email} type=${type} status=${response.status} body=${responseBody}`,
    );
  }
};


function createAuth(ctx: GenericCtx<DataModel>) {
  const trustedOrigins = [siteUrl, frontendUrl, ...frontendUrls].filter(Boolean);
  return betterAuth({
    baseURL: siteUrl,
    trustedOrigins,
    advanced: {
      useSecureCookies: siteUrl.startsWith("https"),
      crossSubdomainCookies: {
        enabled: false,
      },
      generateId: undefined,
    },
    rateLimit: {
      enabled: false,
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    database: authComponent.adapter(ctx),
    socialProviders: {
      github: {
        clientId: githubClientId ?? "",
        clientSecret: githubClientSecret ?? "",
      },
    },
    emailVerification: {
      sendOnSignUp: false,
      sendOnSignIn: false,
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      autoSignIn: false,
    },
    plugins: [
      convex({
        authConfig,
        jwksRotateOnTokenGenerationError: true,
      }),
      organization({
        allowUserToCreateOrganization: async () => true,
        requireEmailVerificationOnInvitation: true,
      }),
      emailOTP({
        overrideDefaultEmailVerification: true,
        async sendVerificationOTP({ email, otp, type }) {
          if (process.env.NODE_ENV !== "production") {
            console.log(`[OTP] sendVerificationOTP email=${email} type=${type}`);
          }
          await sendOtpEmail(email, otp, type);
        },
      }),
    ],
  });
}

export { createAuth };
