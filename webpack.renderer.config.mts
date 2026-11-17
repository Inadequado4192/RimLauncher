import path from "path";
import type { Configuration } from "webpack";
import type { Configuration as DevServerConfiguration } from "webpack-dev-server";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { common, findFiles, rulesRenderer } from "./webpack.common.mjs";
import { csp } from "./webpack.csp.mjs";

const FEATURES = path.resolve(__dirname, "src/features");
const windows = findFiles(FEATURES, ".window.tsx");

module.exports = {
    ...common,
    entry: windows,
    target: "web",
    output: { path: path.resolve(__dirname, ".webpack/renderer"), filename: "[name]/index.js" },
    module: { rules: rulesRenderer },
    devServer: {
        port: 3000,
        hot: true,
        client: { overlay: { errors: true, warnings: false, runtimeErrors: false } },
    },
    plugins: [
        ...common.plugins,
        ...Object.keys(windows).map((id) =>
            new HtmlWebpackPlugin({
                filename: `${id}/index.html`,
                chunks: [id],
                inject: "body",
                templateContent:
                    `<!doctype html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta http-equiv="Content-Security-Policy" content="${csp}" />
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>`,
            })
        )
    ]
} satisfies Configuration & { devServer?: DevServerConfiguration };