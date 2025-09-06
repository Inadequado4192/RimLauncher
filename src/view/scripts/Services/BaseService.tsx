import React, { JSX } from "react";


export type ServiceData_Internal<Data extends {}, Res> = Data & {
    _id: number,
    _close(result: Res | void): void,
    // _endPromise: Promise<Res>,
}


export function createService<
    Data extends {},
    Res = void
>(params: {
    element: (props: ServiceData_Internal<Data, Res>) => React.ReactNode,
    container?: (props: { children: React.ReactNode[] }) => React.ReactNode,
}, opt: {
    fnName: string,
}) {
    abstract class Service {
        private static listeners = new Set<(alerts: ServiceData_Internal<Data, Res>[]) => void>();
        private static list: ServiceData_Internal<Data, Res>[] = [];
        private static idCounter = 0;

        public static subscribe(listener: (alerts: ServiceData_Internal<Data, Res>[]) => void) {
            this.listeners.add(listener);
            listener(this.list); // Передати початковий стан
            return () => void this.listeners.delete(listener);
        }

        public static remove(id: number) {
            let ind = this.list.findIndex(obj => obj._id === id);

            if (ind >= 0) this.list[ind]!._close(undefined);
            else console.error("Window not found");
        }



        public static create(rootProps: Data) {
            const id = this.idCounter++;

            const endPromise = new Promise<Res | void>((t, f) => {
                try {
                    let itm = {
                        ...rootProps,
                        _id: id,
                        _close: result => {
                            this.list = this.list.filter(obj => obj._id !== id);
                            this.listeners.forEach((listener) => listener(this.list));
                            t(result);
                        },
                    } satisfies ServiceData_Internal<Data, Res>;

                    this.list = [...this.list, itm];
                    this.listeners.forEach((listener) => listener(this.list));
                } catch (e) { f(e) }
            })

            return { id, endPromise };
        }
    }


    function Container() {
        const [alerts, setAlerts] = React.useState<ServiceData_Internal<Data, Res>[]>([]);

        React.useEffect(() => {
            return Service.subscribe(setAlerts);
        }, []);

        const children = alerts.map((props) => <params.element key={props._id} {...props} />);
        if (params.container) return <params.container children={children} />;
        return children;
    }


    Object.defineProperty(Container, "name", { value: opt.fnName });


    const cnt = <Container key={opt.fnName} />;
    if (containersList.set)
    {
        delete containersList.def;
        containersList.set(containersList => [...containersList, cnt]);
    } else {
        containersList.def?.push(cnt)
    }

    return { Service, Container };
}

const containersList = {
    def: [] as JSX.Element[] | undefined,
    set: null as React.Dispatch<React.SetStateAction<JSX.Element[]>> | null,
}

createService.Containers = function ServicesContainer() {
    const [containers, setContainers] = React.useState<JSX.Element[]>(containersList.def ?? []);

    containersList.set = setContainers;

    return containers;
}
createService.FV = function (Comp: (() => React.ReactNode) | React.ReactNode): React.ReactNode {
    return Comp instanceof Function ? <Comp /> : Comp;
}