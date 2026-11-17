import path from "path";
import fs from "fs";
import type { ModuleOptions, Configuration } from "webpack";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

const mode: Configuration["mode"] =
    process.env.NODE_ENV === "production" ? "production" : "development";

export const isDev = mode === "development";

// main: ts-loader, бо потрібні метадані декораторів для tsyringe
export const rulesMain: Required<ModuleOptions>["rules"] = [
    {
        test: /\.tsx?$/,
        exclude: /(node_modules|\.webpack)/,
        use: { loader: "ts-loader", options: { transpileOnly: true } },
    },
];

// renderer: esbuild швидший, DI там немає
export const rulesRenderer: Required<ModuleOptions>["rules"] = [
    { test: /\.css$/, use: ["style-loader", "css-loader"] },
    {
        test: /\.ts$/,
        exclude: /(node_modules|\.webpack)/,
        use: { loader: "esbuild-loader", options: { loader: "ts", target: "es2022" } },
    },
    {
        test: /\.tsx$/,
        exclude: /(node_modules|\.webpack)/,
        use: { loader: "esbuild-loader", options: { loader: "tsx", target: "es2022" } },
    },
];

export const common = {
    mode,
    stats: {
        all: false,
        assets: true,
        warnings: true,
        errors: true,
        reasons: true,
    },
    resolve: {
        extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
        plugins: [new TsconfigPathsPlugin({ extensions: [".ts", ".tsx", ".js"] })],
    },
    optimization: {
        minimize: mode === "production",
        concatenateModules: process.env.ANALYZE !== "true",
    },
    infrastructureLogging: { level: "warn" },
    plugins: [
        ...(process.env.ANALYZE
            ? [new BundleAnalyzerPlugin({
                generateStatsFile: true,
                statsFilename: "stats.json",
            })]
            : []),
    ],
} satisfies Configuration;




/**
 * Шукає в `root` (рекурсивно) усі файли, що закінчуються на `suffix`.
 * Повертає { id: абсолютний шлях }, де id = ім'я файлу без суфікса.
 * Приклад: findFiles("src/features", ".window.tsx") -> { splash: "D:/.../splash.window.tsx" }
 */
export function findFiles(root: string, suffix: string): Record<string, string> {
    const result: Record<string, string> = {};

    for (const file of fs.readdirSync(root, { recursive: true, encoding: "utf8" })) {
        if (!file.endsWith(suffix)) continue;

        const id = path.basename(file, suffix);
        const full = path.join(root, file);

        if (result[id]) {
            throw new Error(`Duplicate id "${id}" for "${suffix}":\n  ${result[id]}\n  ${full}`);
        }
        result[id] = full;
    }
    return result;
}