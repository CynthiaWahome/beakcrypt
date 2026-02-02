/**
 * Reserved organization slugs that cannot be used by users.
 * These are reserved for system routes, branding, and potential future use.
 * https://github.com/outray-tunnel/outray/blob/957548988c07a514fb6350d67c5d855b97205ef0/shared/reserved-slugs.ts
 */
export const RESERVED_SLUGS = [
  // System & API routes
  "api",
  "app",
  "admin",
  "auth",
  "login",
  "logout",
  "signup",
  "register",
  "signin",
  "signout",
  "callback",
  "oauth",
  "sso",

  // Account & user management
  "account",
  "accounts",
  "user",
  "users",
  "profile",
  "settings",
  "preferences",
  "dashboard",
  "onboarding",

  // Organization-related
  "org",
  "orgs",
  "organization",
  "organizations",
  "team",
  "teams",
  "workspace",
  "workspaces",

  // Billing & subscriptions
  "billing",
  "subscription",
  "subscriptions",
  "pricing",
  "plans",
  "checkout",
  "payment",
  "payments",
  "invoice",
  "invoices",

  // Support & help
  "help",
  "support",
  "docs",
  "documentation",
  "faq",
  "contact",
  "feedback",

  // Legal & compliance
  "terms",
  "privacy",
  "legal",
  "security",
  "compliance",
  "gdpr",
  "cookies",

  // Marketing & public pages
  "about",
  "blog",
  "news",
  "press",
  "careers",
  "jobs",
  "partners",
  "enterprise",
  "pricing",
  "features",
  "home",
  "landing",

  // Product & branding
  "outray",
  "tunnel",
  "tunnels",
  "ray",
  "beam",
  "pulse",
  "status",
  "health",
  "healthcheck",

  // Infrastructure & technical
  "www",
  "mail",
  "email",
  "smtp",
  "ftp",
  "cdn",
  "assets",
  "static",
  "media",
  "files",
  "uploads",
  "download",
  "downloads",

  // Common reserved words
  "root",
  "system",
  "internal",
  "private",
  "public",
  "test",
  "testing",
  "demo",
  "example",
  "sample",
  "sandbox",
  "staging",
  "production",
  "dev",
  "development",

  // Webhooks & integrations
  "webhook",
  "webhooks",
  "integration",
  "integrations",
  "connect",
  "callback",

  // Misc reserved
  "new",
  "create",
  "edit",
  "delete",
  "remove",
  "update",
  "manage",
  "install",
  "uninstall",
  "invite",
  "invites",
  "join",
  "leave",
  "explore",
  "search",
  "notifications",
  "activity",
  "analytics",
  "metrics",
  "reports",
  "logs",
  "audit",
  "cli",
  "cron",

  // Programming languages
  "javascript",
  "typescript",
  "python",
  "java",
  "kotlin",
  "swift",
  "rust",
  "go",
  "golang",
  "ruby",
  "php",
  "csharp",
  "dotnet",
  "cpp",
  "cplusplus",
  "c",
  "scala",
  "elixir",
  "erlang",
  "haskell",
  "clojure",
  "perl",
  "lua",
  "r",
  "dart",
  "objective-c",
  "objectivec",
  "groovy",
  "julia",
  "fortran",
  "cobol",
  "assembly",
  "zig",
  "nim",
  "crystal",
  "fsharp",
  "ocaml",
  "racket",
  "scheme",
  "lisp",
  "prolog",
  "sql",
  "graphql",
  "wasm",
  "webassembly",

  // Frontend frameworks & libraries
  "react",
  "reactjs",
  "vue",
  "vuejs",
  "angular",
  "angularjs",
  "svelte",
  "sveltekit",
  "solid",
  "solidjs",
  "preact",
  "ember",
  "emberjs",
  "backbone",
  "jquery",
  "alpine",
  "alpinejs",
  "htmx",
  "lit",
  "stencil",
  "qwik",
  "astro",

  // Backend frameworks
  "express",
  "expressjs",
  "fastify",
  "koa",
  "hapi",
  "nest",
  "nestjs",
  "next",
  "nextjs",
  "nuxt",
  "nuxtjs",
  "remix",
  "gatsby",
  "rails",
  "rubyonrails",
  "django",
  "flask",
  "fastapi",
  "spring",
  "springboot",
  "laravel",
  "symfony",
  "phoenix",
  "gin",
  "echo",
  "fiber",
  "actix",
  "rocket",
  "axum",
  "warp",
  "sinatra",
  "tornado",
  "pyramid",
  "bottle",
  "sanic",
  "starlette",
  "adonisjs",
  "adonis",
  "strapi",
  "keystone",
  "redwood",
  "redwoodjs",
  "blitz",
  "blitzjs",

  // Mobile frameworks
  "flutter",
  "reactnative",
  "ionic",
  "capacitor",
  "cordova",
  "phonegap",
  "xamarin",
  "maui",
  "swiftui",
  "jetpack",
  "compose",
  "nativescript",
  "expo",

  // CSS frameworks & tools
  "tailwind",
  "tailwindcss",
  "bootstrap",
  "bulma",
  "foundation",
  "materialize",
  "chakra",
  "chakraui",
  "mui",
  "materialui",
  "antd",
  "antdesign",
  "styled",
  "emotion",
  "sass",
  "scss",
  "less",
  "postcss",
  "stylex",
  "panda",
  "pandacss",
  "vanilla-extract",
  "stitches",
  "radix",
  "shadcn",
  "daisyui",
  "headlessui",

  // Build tools & bundlers
  "webpack",
  "vite",
  "rollup",
  "parcel",
  "esbuild",
  "swc",
  "turbopack",
  "snowpack",
  "gulp",
  "grunt",
  "babel",
  "terser",
  "rome",
  "biome",
  "bun",
  "deno",
  "node",
  "nodejs",
  "npm",
  "yarn",
  "pnpm",

  // Testing frameworks
  "jest",
  "mocha",
  "jasmine",
  "vitest",
  "cypress",
  "playwright",
  "puppeteer",
  "selenium",
  "pytest",
  "unittest",
  "rspec",
  "minitest",
  "junit",
  "testng",
  "xunit",
  "nunit",
  "phpunit",
  "ava",
  "tap",
  "karma",
  "chai",
  "sinon",
  "msw",
  "supertest",
  "storybook",
  "chromatic",

  // Databases
  "postgres",
  "postgresql",
  "mysql",
  "mariadb",
  "sqlite",
  "mongodb",
  "redis",
  "memcached",
  "elasticsearch",
  "opensearch",
  "cassandra",
  "dynamodb",
  "couchdb",
  "couchbase",
  "neo4j",
  "arangodb",
  "influxdb",
  "timescaledb",
  "cockroachdb",
  "planetscale",
  "supabase",
  "firebase",
  "firestore",
  "fauna",
  "faunadb",
  "prisma",
  "drizzle",
  "typeorm",
  "sequelize",
  "knex",
  "mongoose",
  "sqlalchemy",
  "activerecord",
  "hibernate",
  "dapper",
  "neon",
  "turso",
  "libsql",
  "surrealdb",
  "tigerbeetle",
  "tigerdata",
  "clickhouse",
  "duckdb",

  // Cloud & infrastructure
  "aws",
  "amazon",
  "azure",
  "gcp",
  "google",
  "googlecloud",
  "digitalocean",
  "linode",
  "vultr",
  "heroku",
  "vercel",
  "netlify",
  "cloudflare",
  "railway",
  "render",
  "fly",
  "flyio",
  "docker",
  "kubernetes",
  "k8s",
  "terraform",
  "pulumi",
  "ansible",
  "chef",
  "puppet",
  "vagrant",
  "openstack",
  "proxmox",
  "vmware",
  "nginx",
  "apache",
  "caddy",
  "traefik",
  "haproxy",
  "envoy",
  "istio",
  "consul",
  "vault",
  "nomad",

  // DevOps & CI/CD
  "github",
  "gitlab",
  "bitbucket",
  "jenkins",
  "circleci",
  "travisci",
  "drone",
  "argo",
  "argocd",
  "tekton",
  "spinnaker",
  "harness",
  "buildkite",
  "teamcity",
  "bamboo",
  "octopus",
  "flux",
  "fluxcd",

  // API & communication
  "rest",
  "restful",
  "grpc",
  "trpc",
  "soap",
  "websocket",
  "websockets",
  "socket",
  "socketio",
  "mqtt",
  "amqp",
  "rabbitmq",
  "kafka",
  "nats",
  "zeromq",
  "pusher",
  "ably",
  "twilio",
  "sendgrid",
  "mailgun",
  "postmark",
  "stripe",
  "paypal",
  "braintree",
  "plaid",
  "openai",
  "anthropic",
  "claude",
  "gpt",
  "chatgpt",
  "langchain",
  "llamaindex",
  "huggingface",

  // State management
  "redux",
  "mobx",
  "zustand",
  "jotai",
  "recoil",
  "xstate",
  "valtio",
  "pinia",
  "vuex",
  "ngrx",
  "akita",
  "effector",
  "nanostores",

  // Auth & identity
  "oauth",
  "oauth2",
  "openid",
  "oidc",
  "saml",
  "jwt",
  "auth0",
  "okta",
  "clerk",
  "lucia",
  "nextauth",
  "passport",
  "keycloak",
  "cognito",
  "firebase-auth",

  // Monitoring & observability
  "datadog",
  "newrelic",
  "splunk",
  "grafana",
  "prometheus",
  "loki",
  "tempo",
  "jaeger",
  "zipkin",
  "sentry",
  "bugsnag",
  "rollbar",
  "logrocket",
  "fullstory",
  "hotjar",
  "mixpanel",
  "amplitude",
  "segment",
  "posthog",
  "plausible",
  "umami",
  "matomo",
  "pagerduty",
  "opsgenie",

  // SDKs & platforms
  "sdk",
  "sdks",
  "api",
  "apis",
  "framework",
  "frameworks",
  "library",
  "libraries",
  "plugin",
  "plugins",
  "extension",
  "extensions",
  "module",
  "modules",
  "package",
  "packages",
  "component",
  "components",
  "template",
  "templates",
  "boilerplate",
  "starter",
  "kit",
  "toolkit",
] as const;

export type ReservedSlug = (typeof RESERVED_SLUGS)[number];

const RESERVED_SLUG_SET = new Set(RESERVED_SLUGS);

/**
 * Check if a slug is reserved and cannot be used by organizations.
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUG_SET.has(slug.trim().toLowerCase() as ReservedSlug);
}

export type SlugValidationResult =
  | { valid: true }
  | { valid: false; error: string };

/**
 * Validates a slug for organization URLs.
 * Ensures the slug is safe for URL routing and doesn't conflict with reserved paths.
 *
 * Rules:
 * - Must be 3-32 characters long
 * - Can only contain lowercase letters, numbers, and single hyphens
 * - Cannot start or end with a hyphen
 * - Cannot contain consecutive hyphens
 * - Cannot contain URL-unsafe characters (/, ?, #, &, =, etc.)
 * - Cannot be a reserved slug
 */
export function validateSlug(slug: string): SlugValidationResult {
  if (!slug) {
    return { valid: false, error: "Slug is required" };
  }

  const trimmedSlug = slug.trim();

  if (trimmedSlug !== trimmedSlug.toLowerCase()) {
    return { valid: false, error: "Slug must be lowercase" };
  }

  if (/[\/\?#&=%@:;\[\]{}|\\<>^`~\s]/.test(trimmedSlug)) {
    return {
      valid: false,
      error:
        "Slug cannot contain special characters like /, ?, #, &, =, @, or spaces",
    };
  }

  const normalizedSlug = trimmedSlug.toLowerCase();

  if (normalizedSlug.length < 3) {
    return { valid: false, error: "Slug must be at least 3 characters" };
  }

  if (normalizedSlug.length > 32) {
    return { valid: false, error: "Slug cannot exceed 32 characters" };
  }

  if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
    return {
      valid: false,
      error: "Slug can only contain lowercase letters, numbers, and hyphens",
    };
  }

  if (normalizedSlug.startsWith("-")) {
    return { valid: false, error: "Slug cannot start with a hyphen" };
  }
  if (normalizedSlug.endsWith("-")) {
    return { valid: false, error: "Slug cannot end with a hyphen" };
  }

  if (/--/.test(normalizedSlug)) {
    return { valid: false, error: "Slug cannot contain consecutive hyphens" };
  }
  if (isReservedSlug(normalizedSlug)) {
    return { valid: false, error: "This URL is reserved and cannot be used" };
  }

  return { valid: true };
}

export function isValidSlug(slug: string): boolean {
  return validateSlug(slug).valid;
}
