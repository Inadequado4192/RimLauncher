import path from "path";
import type { Configuration } from "webpack";
import { commmon, rules } from "./webpack.common";


module.exports = {
    entry: "./src/main/index.ts",
    target: "electron-main",
    output: {
        path: path.resolve(__dirname, ".webpack"),
        filename: "main.js"
    },
    module: { rules },
    externals: {
        "@aws-sdk/client-s3": "commonjs @aws-sdk/client-s3"
    },
    ...commmon,
} satisfies Configuration;
