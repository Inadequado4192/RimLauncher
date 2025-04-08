
export let local: SomeLocal;

export default function Localize(key: keyof SomeLocal["keys"] | (string & {}), args?: any[]) {

    let string: string;
    if (process.type == "browser") {
        const Local = require("src/main/localization") as typeof import("src/main/localization").default;
        string = Local.getTargetLocal().keys[key as keyof SomeLocal["keys"]] ?? key;
    } else if (process.type == "renderer") {
        string = local?.keys[key as keyof SomeLocal["keys"]] ?? key;
    } else throw Error(`Unknown process type: ${process.type}`);

    return string;
}

export async function loadingLocal() {
    if (process.type != "renderer") return;
    local = await invoke.getTargetLocalJSON();
}