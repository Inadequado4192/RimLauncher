export function formatCamelCase(name: string): string {
    return name
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Додаємо пробіл між маленькими та великими літерами
        .replace(/^./, match => match.toUpperCase()); // Робимо першу літеру великою
}


export function getContrastColor(hex: string) {
    hex = hex.replace(/^#/, "");

    // Конвертуємо HEX в RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Обчислюємо яскравість (Luminance)
    let brightness = (r * 0.299 + g * 0.587 + b * 0.114);

    // Якщо фон темний — текст білий, якщо світлий — текст чорний
    return brightness > 128 ? "#000000" : "#FFFFFF";
}


export const wait = (ms: number) => new Promise<void>(t => setTimeout(() => t(), ms));




// export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
//     const result = {} as Pick<T, K>;
//     for (const key of keys) {
//         if (key in obj) {
//             result[key] = obj[key];
//         }
//     }
//     return result;
// }

export function shallowEqual(prev: Record<string, any>, next: Record<string, any>): boolean {
    if (prev === next) {
        return true;
    }

    if (
        typeof prev !== "object" || prev === null ||
        typeof next !== "object" || next === null
    ) {
        return false;
    }

    const keysA = Object.keys(prev);
    const keysB = Object.keys(next);

    if (keysA.length !== keysB.length) {
        return false;
    }

    for (let key of keysA) {
        if (prev[key] !== next[key]) {
            return false;
        }
    }

    return true;
}
