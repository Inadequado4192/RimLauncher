import { UpdateInfo } from "electron-updater";

export interface CheckForUpdatesResult {
    isUpdateAvailable: boolean;
    updateInfo: UpdateInfo;
}