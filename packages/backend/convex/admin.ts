import { mutation } from "./_generated/server";

const legacyAuthTables = [
  "user",
  "session",
  "account",
  "verification",
  "twoFactor",
  "passkey",
  "oauthApplication",
  "oauthAccessToken",
  "oauthConsent",
  "jwks",
  "rateLimit",
] as const;

type LegacyDoc = { _id: string };

export const purgeLegacyAuthTables = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const db = ctx.db as unknown as {
      query: (tableName: string) => { collect: () => Promise<LegacyDoc[]> };
    };

    let deleted = 0;
    for (const tableName of legacyAuthTables) {
      const rows = await db.query(tableName).collect();
      for (const row of rows) {
        await ctx.db.delete(row._id as any);
        deleted += 1;
      }
    }

    return { deleted };
  },
});
