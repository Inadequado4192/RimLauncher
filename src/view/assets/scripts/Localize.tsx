import React from "react"
import { LocalContext } from "./Context/LocalContext"

/** @deprecated */
export function Localize(key: keyof SomeLocal["keys"] | (string & {}), args?: any[]) {
    const context = React.useContext(LocalContext);
    return context.Localize(key, args);
}