import ModuleTabs from "@Modules/ModuleTabs";
import { createService } from "./Services/BaseService";
import { CssVarsProvider } from "@mui/joy";
import LoadingFrame from "./Components/layouts/LoadingFrame";
import { theme } from "./Context/Theme";
import { __GlobalStore__ } from "./Context/__GlobalStore__";
import TitleBar from "@Components/layouts/TitleBar";
import Footer from "@Components/layouts/Footer";

export default function App() {
    return (
        <CssVarsProvider theme={theme} defaultMode="dark">
            <TitleBar />
            <LoadingFrame>
                <__GlobalStore__.Providers />
                <ModuleTabs />
                <Footer />

            </LoadingFrame>
            {<createService.Containers />}
        </CssVarsProvider>
    )
}

// import React from 'react';
// import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
// console.log(process);

// export default function App() {
//     // const objname = useSyncExternalStoreWithSelector(
//     //     storeObj.sub.bind(storeObj),
//     //     storeObj.get.bind(storeObj),
//     //     storeObj.get.bind(storeObj),
//     //     obj => obj.name
//     // );
//     const [objname] = React.useSyncExternalStore(
//         storeObj.sub.bind(storeObj),
//         () => [storeObj.get().name],
//     );
//     console.log("Render")
//     return (
//         <React.StrictMode>
//             <div className='App'>
//                 <h1>Hello React.</h1>
//                 <h2>Start editing to see some magic happen!</h2>
//                 <button onClick={() => console.clear()}>cls</button>
//                 <button onClick={() => {
//                     storeObj._data.name = "Sasha";
//                     // storeObj.val = { name: "Sasha" };
//                     storeObj.emit();
//                 }}>Value: {objname}</button>
//             </div>
//         </React.StrictMode>
//     );
// }

// const storeObj = {
//     listeners: new Set<() => void>(),
//     subscribe(listener: () => void) {
//         this.listeners.add(listener);
//     },
//     unsubscribe(listener: () => void) {
//         this.listeners.delete(listener);
//     },
//     sub(listener: () => void) {
//         this.subscribe(listener);
//         console.log("storeString sub");
//         return () => this.unsubscribe(listener);
//     },
//     get() {
//         console.log("storeString get", this._data);
//         // return selector ? selector(this._data) : this._data;
//         return this._data;
//     },
//     emit() {
//         for (const l of this.listeners) l();
//     },

//     _data: {
//         name: "Vlad"
//     },
// }