import { defineApp } from "convex/server";
import migrations from "@convex-dev/migrations/convex.config";
import betterAuth from "@convex-dev/better-auth/convex.config";

const app = defineApp();
app.use(betterAuth);
app.use(migrations);

export default app;
