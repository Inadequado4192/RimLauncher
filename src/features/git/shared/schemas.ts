import z from "zod";

export const gitProviderSchema = z.union([
    z.literal("gitgud"),
    z.literal("github"),
]);

export const gitRepoInfoWriteSchema = z.object({
    provider: gitProviderSchema,
    owner: z.string(),
    name: z.string(),
    ref: z.string(),
});

const gitInfoWriteBase = z.object({
    repo: gitRepoInfoWriteSchema,
    state: z.object({
        installedVersionCommit: z.string()
    }),
    // settings: z.object({
    //     modSubdir: z.string(),
    //     excludeFiles: z.array(z.string())
    // })
});


export const gitInfoWriteSchema = gitInfoWriteBase;
export const gitInfoCreateSchema = gitInfoWriteBase;
export const gitInfoReadSchema = gitInfoWriteBase.extend({
    // settings: gitInfoWriteBase.shape.settings.extend({
    //     modSubdir: gitInfoWriteBase.shape.settings.shape.modSubdir.default("./"),
    //     excludeFiles: gitInfoWriteBase.shape.settings.shape.excludeFiles.default([]),
    // })
});

export type GitProvider = z.output<typeof gitProviderSchema>;
export type GitInfo = z.output<typeof gitInfoReadSchema>;
export type GitRepoInfo = z.output<typeof gitRepoInfoWriteSchema>;
