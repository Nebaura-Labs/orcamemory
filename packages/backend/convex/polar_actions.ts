import { action } from "./_generated/server";
import { polar } from "./polar";

export const syncProducts = action({
  args: {},
  handler: async (ctx) => {
    if (!polar) {
      throw new Error("Polar is not configured. Please set the required environment variables.");
    }
    await polar.syncProducts(ctx);
    return { ok: true };
  },
});

export const pingPolar = action({
  args: {},
  handler: async () => {
    try {
      const response = await fetch("https://api.polar.sh/v1/products", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      const text = await response.text();
      return {
        ok: response.ok,
        status: response.status,
        body: text.slice(0, 500),
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const pingPolarAuthed = action({
  args: {},
  handler: async () => {
    const token = process.env.POLAR_ORGANIZATION_TOKEN;
    const server = process.env.POLAR_SERVER || "sandbox";
    
    if (!token) {
      return { ok: false, error: "Missing POLAR_ORGANIZATION_TOKEN" };
    }

    const baseUrl = server === "production" 
      ? "https://api.polar.sh" 
      : "https://sandbox-api.polar.sh";

    try {
      const response = await fetch(`${baseUrl}/v1/products`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const text = await response.text();
      return {
        ok: response.ok,
        status: response.status,
        server,
        baseUrl,
        body: text.slice(0, 500),
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
