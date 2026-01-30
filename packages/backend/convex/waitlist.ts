"use node";

import { render } from "@react-email/render";
import * as React from "react";
import { v } from "convex/values";

import { action } from "./_generated/server";
import WaitlistConfirmationEmail from "./emails/waitlistConfirmation";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const getResponse = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${contactsApiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!getResponse.ok && getResponse.status !== 404) {
      const errorBody = await getResponse.text();
      throw new Error(`Resend error: ${getResponse.status} ${errorBody}`);
    }

    const alreadyExists = getResponse.ok;

    if (!alreadyExists) {
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

      if (!contactResponse.ok) {
        const errorBody = await contactResponse.text();
        throw new Error(`Resend error: ${contactResponse.status} ${errorBody}`);
      }
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

      if (!emailResponse.ok) {
        const errorBody = await emailResponse.text();
        throw new Error(`Resend error: ${emailResponse.status} ${errorBody}`);
      }
    }

    return { ok: true, status: alreadyExists ? "exists" : "created" };
  },
});
