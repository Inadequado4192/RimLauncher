export let local: SomeLocal;

export default function Localize(key: keyof SomeLocal["keys"] | (string & {}), args?: any[]) {
    const string = local.keys[key as keyof SomeLocal["keys"]] ?? key;

    let newStr = string;
    if (args) {
        for (const m of string.match(/\{(\d+)\}/g) ?? []) {
            newStr = newStr.replace(m, args[+m.slice(1, -1)])
        }
    }
    return newStr;
}

export async function loadingLocal() {
    if (process.type == "renderer")
        local = await invoke.getTargetLocalJSON();
    else if (process.type == "browser") {
        local = (await import("src/main/localization")).default.getTargetLocal();
    }
}