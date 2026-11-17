export const modPackExtension = "rl-modpack.json";
export const modPack = (name: string) => `${name}.${modPackExtension}` as const;
export const isModPack = (f: string) => f.toLowerCase().endsWith(modPackExtension);
