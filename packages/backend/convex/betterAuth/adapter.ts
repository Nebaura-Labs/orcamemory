import { createApi } from "@convex-dev/better-auth";
import { createAuthOptions } from "./auth_options";
import schema from "./schema";

export const {
	create,
	findOne,
	findMany,
	updateOne,
	updateMany,
	deleteOne,
	deleteMany,
} = createApi(schema, (ctx) => createAuthOptions(ctx));
