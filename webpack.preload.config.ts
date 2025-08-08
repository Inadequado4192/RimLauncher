import type { Configuration } from "webpack";
import path from "path";
import { commmon, rules } from "./webpack.common";

export default {
    target: "electron-preload",
    entry: "./src/view/preload.ts",
    output: {
        filename: "preload.js",
        path: path.resolve(__dirname, ".webpack"),
    },
    module: { rules },
    ...commmon,
} satisfies Configuration;
