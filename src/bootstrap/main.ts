import "reflect-metadata";
import { register, start } from "#features/base/main";

const context = require.context("../features", true, /^\.\/[^/]+\/main\/[^/]+\.service\.ts$/);

type Constructor = new (...args: any[]) => object;

const isClass = (x: unknown): x is Constructor =>
    typeof x === "function" && /^class/.test(Function.prototype.toString.call(x));

for (const key of context.keys()) {
    const module = context(key);

    for (const exported of Object.values(module)) {
        if (isClass(exported)) register(exported);
        else {
            console.error("Not Constructor" + Function.prototype.toString.call(exported).split("\n")[0])
        }
    }
}

console.log("starting...");
start();