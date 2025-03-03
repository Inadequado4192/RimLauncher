import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import type { Configuration } from "webpack";
import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";

rules.push({
    test: /\.css$/,
    use: [{ loader: "style-loader" }, { loader: "css-loader" }],
});

export const rendererConfig: Configuration = {
    module: {
        rules,
    },
    plugins,
    resolve: {
        extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
        plugins: [
            new TsconfigPathsPlugin({
                 extensions: [".ts", ".tsx", ".js"]
            })
        ]
    },
    devtool: "inline-source-map",
    optimization: {
        minimize: true, // Мінімізувати ваш код для зменшення розміру
        splitChunks: {
            chunks: "all", // Розділяти код на окремі частини
        },
    },
    cache: {
        type: "filesystem",
    },
};
