import { Typography } from "@mui/joy";

// type Compability = [status: string, modName: string, steamId: string, null: "", tag: string, message: string, lastChange: string];
// type CompabilityOpt = {
//     status: string;
//     modName: string;
//     steamId: string;
//     tag: string;
//     message: string | undefined;
//     lastChange: string | undefined;
// };
// type ModWithCompabilityOpt = {
//     mod: ModInfo,
//     compability: CompabilityOpt
// };
export default function MyltiplayerCompabilityDialog() {
    return <Typography>Temporarily disabled.</Typography>;
    // const { sortedMods } = React.useContext(MainBody.Context);
    // const [mods, setMods] = React.useState<ModWithCompabilityOpt[]>();
    // const [isError, setIsError] = React.useState(false);


    // React.useEffect(() => {
    //     if (!sortedMods) return;
    //     const API_KEY = "";
    //     const SPREADSHEET_ID = "1jaDxV8F7bcz4E9zeIRmZGKuaX7d0kvWWq28aKckISaY";
    //     const RANGE = "Modlist!A5:G";

    //     const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    //     fetch(url)
    //         .then(response => response.json())
    //         .then(data => {
    //             const values = data.values as Compability[];
    //             const list: ModWithCompabilityOpt[] = [];
    //             for (const mod of sortedMods.actives) {
    //                 const c = values.find(d => d[2] === mod.steamId);
    //                 if (c) {
    //                     list.push({
    //                         mod, compability: {
    //                             status: c[0],
    //                             modName: c[1],
    //                             steamId: c[2],
    //                             tag: c[4],
    //                             message: c[5] || void 0,
    //                             lastChange: c[6] || void 0
    //                         }
    //                     });
    //                 } else {
    //                     list.push({
    //                         mod, compability: {
    //                             status: "0",
    //                             modName: mod.about.name,
    //                             steamId: mod.steamId ?? "Unknown",
    //                             tag: "",
    //                             message: "",
    //                             lastChange: ""
    //                         }
    //                     });
    //                 }
    //             }

    //             setMods(list)
    //         })
    //         .catch(() => setIsError(true));
    // }, [sortedMods?.actives]);


    // const MCItem = React.useCallback(function ({ mc: { compability, mod } }: { mc: ModWithCompabilityOpt }) {
    //     const [isPanding, setIsPanding] = React.useState(false);

    //     let color: ColorPaletteProp;
    //     switch (compability.status) {
    //         case "4": color = "success"; break;
    //         case "3":
    //         case "2": color = "warning"; break;
    //         case "1": color = "danger"; break;
    //         case "0":
    //         default: color = "neutral"; break;
    //     }

    //     return (
    //         <Dropdown
    //         // open={contextmenu}
    //         // onClose={e => e.type !== "blur" && setContextmenu(false)}

    //         >
    //             <MenuButton
    //                 disabled={isPanding}
    //                 // ref={ref}

    //                 sx={{ display: "table-row" }}
    //                 variant="soft"
    //                 component="tr"
    //                 color={color}
    //             >
    //                 <td>{compability.modName}</td>
    //                 <td>{compability.status}</td>
    //                 <td>{compability.steamId}</td>
    //                 <td>{compability.tag}</td>
    //                 <td><Typography>{compability.message}</Typography></td>
    //                 <td>{compability.lastChange}</td>
    //             </MenuButton>
    //             <Menu sx={{ zIndex: 999999, maxWidth: 500 }} size="sm">
    //                 <ListItem variant="plain" color={color}>{compability.modName}</ListItem>
    //                 {compability.message && <ListItem>{compability.message}</ListItem>}
    //                 <ListDivider />
    //                 <MenuItem onClick={async () => {
    //                     setIsPanding(true);
    //                     await invoke.disableMod(mod.about.packageId);
    //                 }}>{Localize("toDisableMod")}</MenuItem>
    //             </Menu>
    //         </Dropdown>
    //     )
    // }, []);

    // return (
    //     <ModalDialog minWidth="md">
    //         <DialogTitle>{Localize("multiplayerCompability")}</DialogTitle>
    //         <DialogContent>
    //             <Typography>Here you can check if your modifications are compatible in multiplayer mode.</Typography>
    //             {
    //                 isError
    //                     ? <Typography color="danger">{Localize("error")}</Typography>
    //                     : !mods
    //                         ? <Stack alignItems="center"><CircularProgress /></Stack>
    //                         : (
    //                             <Sheet sx={{height: 500, overflow: "auto"}}>
    //                                 <Table
    //                                     sx={{ tableLayout: "auto" }}
    //                                     stickyHeader
    //                                 >
    //                                     <thead>
    //                                         <tr>
    //                                             <th>{Localize("modName")}</th>
    //                                             <th>{Localize("status")}</th>
    //                                             <th>{Localize("steamId")}</th>
    //                                             <th>{Localize("tag")}</th>
    //                                             <th>{Localize("message")}</th>
    //                                             <th>{Localize("lastChange")}</th>
    //                                         </tr>
    //                                     </thead>
    //                                     <tbody>
    //                                         {mods.map(mc => <MCItem mc={mc} key={mc.mod.about.packageId} />)}
    //                                     </tbody>
    //                                 </Table>
    //                             </Sheet>
    //                         )
    //             }
    //         </DialogContent>
    //     </ModalDialog>
    // )
}