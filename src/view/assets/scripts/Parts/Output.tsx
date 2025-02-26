import { Box, List, ListItem, ListItemContent, Stack, Typography } from "@mui/joy";
import { MainContext } from "../Context/MainContext";
import React from "react";

export default function Output() {
    const context = React.useContext(MainContext);

    function Item({ data }: { data: typeof context.output[string] }) {
        const [color] = (() => {
            switch (data.type) {
                case "error": return ["danger"];
                case "info": return ["neutral"];
                case "success": return ["success"];
                case "warn": return ["warning"];
            }
        })() as [
                Parameters<typeof ListItem>[0]["color"]
            ];

        return (
            <ListItem color={color}>
                <ListItemContent>[{data.type.toUpperCase()}] {data.msg}</ListItemContent>
            </ListItem>
        )
    }

    return (
        null
        // <Stack
        //     id="output"
        //     sx={{
        //         position: "absolute",
        //         bottom: 0,
        //         width: "100vw",
        //         height: 100,
        //         minHeight: 100,
        //         overflowY: "auto",
        //         fontFamily: "monospace",
        //     }}
        // >
        //     <List
        //         variant="soft"
        //     >
        //         {Object.entries(context.output).map(([key, data]) => <Item key={key} data={data} />)}
        //     </List>
        // </Stack>
    )
}