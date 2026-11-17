import { injectable } from "tsyringe";
import { DefinedMod } from "../shared";
import { ModTypeProvider2, DetectContext, DetectResult } from "./types";

@injectable()
export class ModTypeRegistry {
    // private providers: ModTypeProvider[] = [];
    private providers: ModTypeProvider2[] = [];

    // public register(p: ModTypeProvider) {
    //     if (this.providers.some((x) => x.id === p.id)) {
    //         throw new Error(`Mod type "${p.id}" is already registered`);
    //     }
    //     this.providers.push(p);
    //     this.providers.sort((a, b) => a.priority - b.priority);
    // }

    public register<T extends DefinedMod>(modType: T, p: Omit<ModTypeProvider2<T>, "id">) {
        if (this.providers.some((x) => x.id === modType.id)) {
            throw new Error(`Mod type "${modType.id}" is already registered`);
        }
        this.providers.push({ id: modType.id, ...p });
        this.providers.sort((a, b) => a.priority - b.priority);
    }

    public async detect(ctx: DetectContext): Promise<{ type: string } & DetectResult | null> {
        for (const p of this.providers) {
            const data = await p.detect(ctx);
            if (data) return { type: p.id, data };
        }
        return null;
    }
}