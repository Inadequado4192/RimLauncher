import { LocaleDict } from "./translate";

// export interface LanguageOption { code: string; name: string }   


export enum LocalizationIpc {
    Get = "localization:get",
    Changed = "localization:changed",
    GetLanguages = "localization:get-languages",
    SetLanguage = "localization:set-language",
}

declare module "#features/base/shared" {
    interface IpcInvokeMap { [LocalizationIpc.Get]: () => LocaleDict }
    interface IpcEventMap { [LocalizationIpc.Changed]: (dict: LocaleDict) => void }
}

declare module "#features/base/shared" {
    interface IpcInvokeMap {
        [LocalizationIpc.Get]: () => LocaleDict;
        [LocalizationIpc.GetLanguages]: () => LocaleDict[];
        [LocalizationIpc.SetLanguage]: (code: string) => void;
    }
    interface IpcEventMap { [LocalizationIpc.Changed]: (dict: LocaleDict) => void }
}