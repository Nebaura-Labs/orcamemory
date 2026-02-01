"use node";

import { render } from "@react-email/render";
import * as React from "react";
import { v } from "convex/values";

import { action } from "./_generated/server";
import WaitlistConfirmationEmail from "./emails/waitlistConfirmation";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RATE_LIMIT_STATUS = 429;
const CONTACT_EXISTS_STATUS = 409;

export const join = action({
  args: {
    email: v.string(),
  },
  handler: async (_ctx, { email }) => {
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email address.");
    }

    const contactsApiKey = process.env.RESEND_CONTACTS_API_KEY;
    const sendApiKey = process.env.RESEND_SEND_API_KEY;
    const audienceId = process.env.RESEND_AUDIENCE_ID;

    if (!audienceId || !contactsApiKey || !sendApiKey) {
      throw new Error("Missing Resend configuration.");
    }

    const contactResponse = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${contactsApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      },
    );

    if (contactResponse.status === RATE_LIMIT_STATUS) {
      return { ok: false, status: "rate_limited" as const };
    }

    const contactErrorBody = contactResponse.ok ? "" : await contactResponse.text();
    const alreadyExists =
      contactResponse.status === CONTACT_EXISTS_STATUS ||
      (contactResponse.status === 422 && contactErrorBody.toLowerCase().includes("exists"));

    if (!contactResponse.ok && !alreadyExists) {
      throw new Error(`Resend error: ${contactResponse.status} ${contactErrorBody}`);
    }

    const emailHtml = await render(React.createElement(WaitlistConfirmationEmail));
    if (!alreadyExists) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Orca Memory <team@orcamemory.com>",
          to: [email],
          subject: "Welcome to the Future of AI Memory",
          html: emailHtml,
        }),
      });

      if (emailResponse.status === RATE_LIMIT_STATUS) {
        return { ok: false, status: "rate_limited" as const };
      }

      if (!emailResponse.ok) {
        const errorBody = await emailResponse.text();
        throw new Error(`Resend error: ${emailResponse.status} ${errorBody}`);
      }
    }

    return { ok: true, status: alreadyExists ? "exists" : "created" };
  },
});
