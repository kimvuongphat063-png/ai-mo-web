import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local manually for Prisma CLI commands
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Session-mode pooler (port 5432) required for DDL operations like db push
    url: process.env.DIRECT_URL!,
  },
});
