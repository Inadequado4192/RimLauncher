import z from "zod";

export const localeFileSchema = z.object({
    code: z.string().regex(/^[a-z]{2,3}(-[A-Z]{2})?$/),   // "uk", "pt-BR"
    name: z.string().min(1),
    keys: z.record(z.string(), z.any()),
});