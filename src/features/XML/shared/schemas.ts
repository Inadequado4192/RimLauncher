import z from "zod";

export function XMLList<T extends z.ZodType>(t: T) {
    return z.union([
        z.literal("").transform(() => [] as never),
        z.object({ li: z.array(t) }).transform(l => l.li),
    ]).catch([]);
}