import Localize from "@Common/Localize";
import { AlertService } from "./Alert";
import { AlertBigService } from "./AlertBig";

namespace TemplateServices {
    export function createErrorAlert(message: string, err: unknown): ReturnType<typeof AlertService.create>;
    export function createErrorAlert(err: unknown): ReturnType<typeof AlertService.create>;
    export function createErrorAlert(a1: unknown, err?: unknown) {
        if (err != undefined) {
            return AlertService.create({
                message: String(a1),
                color: "danger",
                lifeTime: Infinity,
                actions: [{
                    label: Localize("common.details"),
                    onClick() {
                        if (err instanceof Error && err.stack) {
                            AlertBigService.create({ title: err.name, message: err.stack });
                        } else {
                            AlertBigService.create({ message: String(err) });
                        }
                    },
                }]
            });
        } else {
            return AlertService.create({
                message: String(a1),
                color: "danger",
                lifeTime: Infinity
            });
        }
    }
}

export default TemplateServices;