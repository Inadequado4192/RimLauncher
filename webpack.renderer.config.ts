import type { Configuration } from "webpack";
import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { commmon, rules } from "./webpack.common";



module.exports = {
    entry: "./src/view/renderer.ts",
    target: "electron-renderer",
    output: {
        path: path.resolve(__dirname, ".webpack"),
        filename: "renderer.js"
    },
    module: {
        rules: [
            ...rules,
            {
                test: /\.css$/,
                use: [{ loader: "style-loader" }, { loader: "css-loader" }],
            }
        ]
    },
    devServer: {
        // static: path.join(__dirname, ".webpack"),
        hot: true,
        port: 3000
    },
    infrastructureLogging: {
        level: "warn",
    },
    ...commmon,
    plugins: [
        ...commmon.plugins,
        new HtmlWebpackPlugin({
            template: "./src/view/index.html",
            inject: "body",
            // scriptLoading: "blocking",
            // додаємо React DevTools скрипт тільки у dev
            templateParameters: {
                DEVTOOLS_SCRIPT:
                    process.env.NODE_ENV !== "production"
                        ? '<script src="http://localhost:8097"></script>'
                        : "",
            },
        }),
        // new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)()
    ],
} satisfies Configuration & { devServer?: any };
