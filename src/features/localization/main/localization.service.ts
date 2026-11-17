import { injectable } from "tsyringe";
import { emitAll, handle, type Initializable } from "#features/base/main";
import { UserConfigService } from "#features/user-config/main";
import { translate, LocalizationIpc, type LocaleDict, type LocalKey, LanguageField } from "../shared";
import en from "../shared/locales/en-US.json";
import uk from "../shared/locales/uk-UA.json";

const locales: LocaleDict[] = [en, uk];

@injectable()
export class LocalizationService implements Initializable {
    private dict: LocaleDict = en;

    public constructor(private userConfig: UserConfigService) { }

    public async initialize() {
        handle(LocalizationIpc.Get, () => this.dict);
        handle(LocalizationIpc.GetLanguages, () => locales);

        handle(LocalizationIpc.SetLanguage, async (_, code) => {
            if (!locales.some(l => l.code === code)) return;
            await this.userConfig.setField(LanguageField, code);
            await this.reload();
        });

        await this.reload();
    }

    public async reload() {
        const language = await this.userConfig.getField(LanguageField);
        this.dict = locales.find(l => l.code === language) ?? en;
        emitAll(LocalizationIpc.Changed, this.dict);
    }

    public t = (key: LocalKey, args?: unknown[]) => translate(this.dict, key, args);
}