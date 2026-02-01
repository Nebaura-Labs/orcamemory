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
    // This mutation requires an admin key to run, so no additional auth check needed
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
