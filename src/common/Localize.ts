export let local: SomeLocal;

// export default function Localize(key: keyof SomeLocal["keys"] | (string & {}), args?: any[]) {
//     const string = local.keys[key as keyof SomeLocal["keys"]] ?? key;

//     let newStr = string;
//     if (args) {
//         for (const m of string.match(/\{(\d+)\}/g) ?? []) {
//             newStr = newStr.replace(m, args[+m.slice(1, -1)])
//         }
//     }
//     return newStr;
// }
export default function Localize(key: LeafPaths<typeof local.keys>, args?: any[]): string {
    // розбиваємо ключ по крапках
    const parts = key.split(".");
    let value: any = local.keys;

    for (const part of parts) {
        if (value && part in value) {
            value = value[part];
        } else {
            value = key; // fallback: повертаємо сам ключ
            break;
        }
    }

    let newStr = String(value);
    if (args) {
        for (const m of newStr.match(/\{(\d+)\}/g) ?? []) {
            newStr = newStr.replace(m, args[+m.slice(1, -1)]);
        }
    }

    return newStr;
}


export async function loadingLocal() {
    if (process.type == "renderer")
        local = await $invoke.getTargetLocalJSON();
    else if (process.type == "browser") {
        local = (await import("main/localization")).default.getTargetLocal();
    }
}





type LeafPaths<T, Prev extends string = ""> = {
  [K in keyof T & string]:
    T[K] extends string
      ? (Prev extends "" ? K : `${Prev}.${K}`)
      : T[K] extends Record<string, any>
        ? LeafPaths<T[K], Prev extends "" ? K : `${Prev}.${K}`>
        : never
}[keyof T & string];