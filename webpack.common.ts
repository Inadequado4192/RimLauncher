import type { ModuleOptions, Configuration, ResolveOptions } from "webpack";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";

export const mode: Configuration["mode"] = process.env.NODE_ENV === "production" ? "production" : "development"

export const rules: Required<ModuleOptions>["rules"] = [
    {
        test: /\.tsx?$/,
        exclude: /(node_modules|\.webpack)/,
        use: {
            loader: "ts-loader",
            options: {
                transpileOnly: true,
            },
        },
    },
];
export const stats: Required<Configuration>["stats"] = {
    all: false,
    assets: true,
    warnings: true,
    errors: true
}

const resolve_extensions: ResolveOptions["extensions"] = [".js", ".ts", ".jsx", ".tsx", ".css"];
const resolve_plugins: ResolveOptions["plugins"] = [
    new TsconfigPathsPlugin({
        extensions: [".ts", ".tsx", ".js"]
    }),
];
export const resolve: Configuration["resolve"] = {
    extensions: resolve_extensions,
    plugins: resolve_plugins
}




export const commmon = {
    mode, stats, resolve,
    optimization: {
        minimize: mode === "production"
    },
    plugins: [
    ]
} satisfies Configuration;