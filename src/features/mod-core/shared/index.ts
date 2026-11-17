export * from "./ipc";
export * from "./modFileProtocol";
export * from "./modType";
export * from "./utils";



export const ModFileStructure = {
    AboutFolder: "About",
    AboutFile: "About.xml",
    Preview: "Preview.png",
    Icon: "ModIcon.png",
} as const;

export const GameFileStructure = {
    Data: "Data",
    Mods: "Mods",
} as const;
