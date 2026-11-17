import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import type { Linter } from "eslint";

const FEAT_RENDERER = "^#features/[^/]+/renderer(/.*)?$";
const FEAT_MAIN = "^#features/[^/]+/main(/.*)?$";

const BOOTSTRAP = "(^|/)bootstrap(/.*)?$";
const BOOTSTRAP_MSG = "Features cannot import bootstrap.";


const restrict = (...patterns: { regex: string; message: string }[]): Linter.RulesRecord => ({
    "no-restricted-imports": ["error", { patterns }],
});

export default defineConfig(
    globalIgnores([".webpack/", "build"]),

    tseslint.configs.recommended,

    {
        files: ["src/**/*.{ts,tsx}"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",

            "@typescript-eslint/no-unused-vars": ["warn", {
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
                caughtErrorsIgnorePattern: "^_",
            }],

            "@typescript-eslint/no-unused-expressions": ["error", { allowTernary: true }],

            "prefer-const": "warn",
            "no-var": "error",
            eqeqeq: ["warn", "smart"],
        },
    },

    
    {
        files: ["src/bootstrap/**/*.{ts,tsx}"],
        rules: restrict(
            { regex: FEAT_RENDERER, message: "Bootstrap cannot import renderer." },
        ),
    },
    {
        files: ["src/features/**/main/**/*.{ts,tsx}"],
        rules: restrict(
            { regex: FEAT_RENDERER, message: "Main part of a feature cannot import renderer." },
            { regex: BOOTSTRAP, message: BOOTSTRAP_MSG },
        ),
    },
    {
        files: ["src/features/**/renderer/**/*.{ts,tsx}"],
        rules: {
            ...restrict(
                { regex: FEAT_MAIN, message: "Renderer part of a feature cannot import main." },
                { regex: BOOTSTRAP, message: BOOTSTRAP_MSG },
            ),
            "no-console": "error",
        },
    },
    {
        files: ["src/**/shared/**/*.{ts,tsx}"],
        rules: restrict(
            { regex: FEAT_MAIN, message: "Shared can only import other shared code or third-party libraries." },
            { regex: FEAT_RENDERER, message: "Shared can only import other shared code or third-party libraries." },
            { regex: BOOTSTRAP, message: "Shared can only import other shared code or third-party libraries." },
        ),
    },
);
