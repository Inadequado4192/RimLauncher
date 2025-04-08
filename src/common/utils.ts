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