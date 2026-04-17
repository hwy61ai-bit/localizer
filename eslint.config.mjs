import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "app/v/**/*.{ts,tsx}",
      "app/advance/**/*.{ts,tsx}",
      "app/report/**/*.{ts,tsx}",
      "app/api/download/**/*.{ts,tsx}",
      "app/api/download-all/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabaseServer",
              message:
                "supabaseServer() is session-bound and enforces RLS. These routes serve anonymous/public-token users, where RLS can silently return zero rows. Use supabaseAdmin() instead. See lib/supabaseAdmin.ts for the service-role pattern, and the 4/16 public-share auth refactor commits for reference.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
