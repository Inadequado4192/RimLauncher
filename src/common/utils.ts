export function formatCamelCase(name: string): string {
    return name
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Додаємо пробіл між маленькими та великими літерами
        .replace(/^./, match => match.toUpperCase()); // Робимо першу літеру великою
}