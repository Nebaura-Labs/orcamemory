import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
	"cleanup-expired-memories",
	{ hourUTC: 3, minuteUTC: 0 },
	internal.memory.cleanupExpiredMemories
);

export default crons;
