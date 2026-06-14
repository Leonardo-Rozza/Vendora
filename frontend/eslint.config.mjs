import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

// jsx-a11y recommended rules, downgraded to "warn" so they never break a build.
const jsxA11yWarnRules = Object.fromEntries(
  Object.keys(jsxA11y.flatConfigs.recommended.rules).map((rule) => [rule, "warn"]),
);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next already registers the jsx-a11y plugin; only override the
  // rule severities here (re-registering the plugin would error).
  {
    rules: {
      ...jsxA11yWarnRules,
      // `label-has-for` is deprecated upstream and superseded by
      // `label-has-associated-control` (kept on, passes clean). It demands BOTH
      // nesting AND htmlFor and fires false positives on our correctly
      // associated labels, so we turn it off explicitly.
      "jsx-a11y/label-has-for": "off",
      // The accurate label<->control rule; keep it on as our source of truth.
      "jsx-a11y/label-has-associated-control": "warn",
      // Redundant with the rule above and unable to read JSX-expression label
      // text ({copy.x}, {value.name}), so it false-fires on controls that ARE
      // correctly associated. label-has-associated-control already guards us.
      "jsx-a11y/control-has-associated-label": "off",
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
