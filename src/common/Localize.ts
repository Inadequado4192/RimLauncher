
let local: SomeLocal | "undefined" | "loading" = "undefined"; 

export default function Localize(key: keyof SomeLocal["keys"] | (string & {}), args?: any[]) {
    let string: string;
    if (process.type == "browser") {
        const Local = require("src/main/localization") as typeof import("src/main/localization").default;
        string = Local.getTargetLocal().keys[key as keyof SomeLocal["keys"]] ?? key;
    } else if (process.type == "renderer") {
        if (local === "undefined") {
            invoke.getTargetLocalJSON().then(l => local = l);
            local = "loading";
        }
        if (typeof local == "string") string = key;
        else string = local?.keys[key as keyof SomeLocal["keys"]] ?? key;
    } else throw Error(`Unknown process type: ${process.type}`);

    return string;
}