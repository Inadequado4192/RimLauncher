import { Button, Typography } from "@mui/joy";
import { ModTagIpc, TagView } from "../shared";
import { createConfirm, createFormDialog, createPrompt, openContextMenu } from "#features/overlays/renderer";
import { localize } from "#features/localization/renderer";
import { ipc } from "#features/base/renderer";
import { HexColorPicker } from "react-colorful";
import { SxProps } from "@mui/joy/styles/types";

export function getContrastColor(hex: string) {
    hex = hex.replace(/^#/, "");

    // Конвертуємо HEX в RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Обчислюємо яскравість (Luminance)
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);

    // Якщо фон темний — текст білий, якщо світлий — текст чорний
    return brightness > 128 ? "#000000" : "#FFFFFF";
}

export function ModTagChip({ tag, onClick, disabled, sx }: {
    tag: TagView,
    onClick?: () => void,
    disabled?: boolean,
    sx?: SxProps
}) {

    return (
        <Button
            size="sm"
            variant="outlined"
            onClick={onClick}
            onContextMenu={e => {
                openContextMenu(e, [
                    {
                        id: "rename",
                        label: localize("common.actions.rename"),
                        async run() {
                            const newName = await createPrompt({
                                title: localize("common.actions.rename"),
                                defaultValue: tag.name
                            });
                            if (newName)
                                ipc.invoke(ModTagIpc.Patch, tag.id, { name: newName });
                        },
                    },
                    {
                        id: "recolor",
                        label: localize("common.actions.recolor"),
                        async run() {
                            const newColor = await createFormDialog({
                                title: localize("common.actions.recolor"),
                                initialValue: tag.color,
                                Field({ value, onChange }) {
                                    return (
                                        <HexColorPicker
                                            color={value}
                                            onChange={onChange}
                                        />
                                    )
                                },
                            });

                            if (newColor)
                                ipc.invoke(ModTagIpc.Patch, tag.id, { color: newColor });
                        },
                    },
                    {
                        id: "delete",
                        label: localize("common.actions.delete"),
                        color: "danger",
                        async run() {
                            if (!await createConfirm("common.confirm.delete")) return;

                            ipc.invoke(ModTagIpc.Delete, tag.id);
                        }
                    }
                ]);
            }}
            sx={[
                t => ({
                    opacity: disabled ? .25 : void 0,
                    pointerEvents: disabled ? "none" : void 0,
                    px: .5,
                    py: .25,
                    minHeight: 0,
                    minWidth: 50,
                    background: tag.color,
                    "&:hover": {
                        background: t.palette.neutral[800],
                        "& *": { color: t.palette.common.white }
                    }
                }),
                ...(Array.isArray(sx) ? sx : [sx])
            ]}
        >
            <Typography
                level="body-xs"
                sx={{
                    color: getContrastColor(tag.color),
                    fontSize: "10px"
                }}
                title={tag.name}
                maxWidth={100}
                noWrap
            >{tag.name}</Typography>
        </Button>
    );
}