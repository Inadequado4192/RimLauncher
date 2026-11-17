import type { Configuration } from "webpack";
import path from "path";
import { common, findFiles, rulesMain } from "./webpack.common.mjs";

const FEATURES = path.resolve(__dirname, "src/features");
const preloads = findFiles(FEATURES, ".preload.ts");

export default {
    ...common,
    entry: preloads,
    target: "electron-preload",
    output: { path: path.resolve(__dirname, ".webpack/preload"), filename: "[name].js" },
    module: { rules: rulesMain },
} satisfies Configuration;
