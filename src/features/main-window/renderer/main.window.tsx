import "./index.css";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { startFeatures } from "#features/base/renderer";
import { initGit } from "#features/git/renderer";
import { initModsConfig } from "#features/mods-config/renderer";
import { initGameInfo } from "#features/game-info/renderer";
import { initUserConfig } from "#features/user-config/renderer";
import { initLocalization } from "#features/localization/renderer";
import { showError } from "#features/overlays/renderer";
import { initModCore } from "#features/mod-core/renderer";
import { initSteam } from "#features/steam/renderer";


startFeatures([
    initModCore,
    initSteam,
    initGit,
    initModsConfig,
    initGameInfo,
    initUserConfig,
    initLocalization,
]);

const root = createRoot(document.getElementById("root")!);
root.render(createElement(App));

addEventListener("focusin", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.matches('button, [role="button"], input[type="button"], input[type="submit"], input[type="reset"]')) {
        t.blur();
    }
});


addEventListener("unhandledrejection", (e) => {
    e.preventDefault();
    void showError(e.reason);
});