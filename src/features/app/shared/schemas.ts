import z from "zod";




export type ShortVersion = `${bigint}.${bigint}`;
export type FullVersion = `${ShortVersion}${" " | "." | ""}${string}`;

const VERSION_PREFIX = String.raw`\d+\.\d+`;

export const fullVersionSchema = z
    .string()
    .trim()
    .regex(
        new RegExp(`^${VERSION_PREFIX}(?:$|[ .].*)$`),
        { message: "Unknown version format", }
    )
    .transform((value) => value as FullVersion);

export const shortVersionSchema = z
    .string()
    .trim()
    .regex(/^\d+\.\d+$/, { message: "Unknown version format" })
    .transform((value) => value as ShortVersion);

export const shortVersionFromFullSchema = z
    .string()
    .trim()
    .regex(
        new RegExp(`^${VERSION_PREFIX}(?:$|[ .].*)$`),
        { message: "Unknown version format", }
    )
    .transform((value) => value.match(/^\d+\.\d+/)![0] as ShortVersion);





export const PackageId = z.coerce.string()
    .min(1, "Package ID is required.")
    .max(60, "Package ID must be 60 characters or less.")
    .regex(/^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*$/, "Package ID must contain only alphanumeric characters and dots, with at least one dot, and no repeated, leading, or trailing dots.")
    .transform(id => id.toLowerCase() as PackageIdLower);



export type PackageIdAny = PackageId | PackageIdLower;
export type PackageId = string & { readonly __brand: unique symbol };
export type PackageIdLower = string & { readonly __brand: unique symbol };