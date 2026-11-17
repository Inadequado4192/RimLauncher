/**
 * Чи минув ttl від timestamp (мс, Date.now()).
 * null/undefined = «ніколи не було», тож вважаємо застарілим.
 * Якщо годинник пішов назад (now < timestamp), теж застарілий: так безпечніше.
 */
export function isExpired(
    timestamp: number | null | undefined,
    ttl: number,
    now: number = Date.now(),
): boolean {
    if (timestamp == null) return true;
    const age = now - timestamp;
    return age < 0 || age >= ttl;
}

/** Скільки мс лишилось до закінчення (0, якщо вже минуло). Для «спробуйте через N с» */
export function remaining(
    timestamp: number | null | undefined,
    ttl: number,
    now: number = Date.now(),
): number {
    if (timestamp == null) return 0;
    return Math.max(0, ttl - (now - timestamp));
}