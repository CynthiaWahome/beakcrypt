import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	target: "node20",
	platform: "node",
	splitting: false,
	clean: true,
	noExternal: ["@beakcrypt/shared", "@beakcrypt/crypto"],
	banner: {
		js: "#!/usr/bin/env node",
	},
});
