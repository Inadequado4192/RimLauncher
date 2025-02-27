import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";
import path from "path";


// const iconPath = path.join(__dirname, "./icons/icon");

const config: ForgeConfig = {
    packagerConfig: {
        // icon: iconPath,
        asar: true,
        extraResource: ["./src/localization"],
        executableName: "rimlauncher"
    },
    rebuildConfig: {},
    makers: [
        new MakerZIP({}, ["darwin"]),
        new MakerSquirrel({
            // setupIcon: iconPath
        }),
        new MakerRpm({
            options: {
                // icon: iconPath
            }
        }),
        new MakerDeb({
            options: {
                // icon: iconPath
            }
        })
    ],
    plugins: [
        new AutoUnpackNativesPlugin({}),
        new WebpackPlugin({
            mainConfig,
            devContentSecurityPolicy: "connect-src 'self' * 'unsafe-eval'",
            renderer: {
                config: rendererConfig,
                entryPoints: [
                    {
                        html: "./src/view/index.html",
                        js: "./src/view/renderer.ts",
                        name: "main_window",
                        preload: {
                            js: "./src/view/preload.ts",
                        },
                        nodeIntegration: true
                    },
                ],
            },
        }),
        // Fuses are used to enable/disable various Electron functionality
        // at package time, before code signing the application
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
        }),
    ],
    hooks: {
        postPackage: async (forgeConfig, options) => {
            if (options.platform == "win32") {
                const fs = require("fs");
                const path = require("path");

                const filesToDelete = [
                    "locals",
                    "chrome_100_percent.pak", "chrome_200_percent.pak",
                    "d3dcompiler_47.dll",
                    "debug.log",
                    "LICENSES.chromium.html", "version",
                    "vk_swiftshader.dll", "vk_swiftshader_icd.json", "vulkan-1.dll", "libEGL.dll", "libGLESv2.dll",
                    "snapshot_blob.bin",
                    "Squirrel.exe",
                ];

                for (const file of filesToDelete) {
                    const filePath = path.join(options.outputPaths[0], file);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }
            }
        }
    }
};

export default config;
