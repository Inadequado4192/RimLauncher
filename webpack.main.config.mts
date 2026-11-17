import path from "path";
import type { Configuration } from "webpack";
import { common, rulesMain } from "./webpack.common.mts";


export default {
    ...common,
    entry: "./src/bootstrap/main.ts",
    target: "electron-main",
    output: {
        path: path.resolve(__dirname, ".webpack"),
        filename: "main.js"
    },
    module: { rules: rulesMain },
    node: { __dirname: false }
} satisfies Configuration;