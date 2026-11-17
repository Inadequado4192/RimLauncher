import { getModActions } from "#features/mod-type/renderer";
import { ModEntry } from "#features/mod-type/shared";
import { ButtonGroup } from "@mui/joy";


export function ModActions({ mod }: { mod: ModEntry }) {
    const actions = getModActions(mod);

    return (
        <ButtonGroup size="sm" variant="plain">
            {actions.map((a) =>  <a.Component key={a.id} mod={mod} />)}
        </ButtonGroup>
    );
}
