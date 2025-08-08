import React from "react";


type Data_Internal<Data extends {}, Res> = Data & {
    _id: number,
    _close(result: Res): void
}


export function createService<
    Data extends {},
    Res = void
>(params: {
    dialog: (props: Data_Internal<Data, Res>) => React.ReactNode
}) {

    interface Control {
        endPromise: Promise<Res>,
        id: number
    }
    abstract class Service {
        private static listeners = new Set<(alerts: Data_Internal<Data, Res>[]) => void>();
        private static list: Data_Internal<Data, Res>[] = [];
        private static idCounter = 0;

        public static subscribe(listener: (alerts: Data_Internal<Data, Res>[]) => void) {
            this.listeners.add(listener);
            listener(this.list); // Передати початковий стан
            return () => void this.listeners.delete(listener);
        }

        public static remove(id: number) {
            this.list = this.list.filter((obj) => obj._id !== id);
            this.listeners.forEach((listener) => listener(this.list));
        }



        public static create(rootProps: Data) {
            const id = this.idCounter++;
            return {
                id, endPromise: new Promise<Res>((t, f) => {
                    try {
                        let itm = {
                            ...rootProps,
                            // ...params.initInternalData,
                            _id: id,
                            _close: result => {
                                this.remove(id);
                                t(result);
                            },
                        } satisfies Data_Internal<Data, Res>;

                        this.list = [...this.list, itm];
                        this.listeners.forEach((listener) => listener(this.list));
                    } catch (e) { f(e) }
                })
            };
        }
    }


    function Container() {
        const [alerts, setAlerts] = React.useState<Data_Internal<Data, Res>[]>([]);

        React.useEffect(() => {
            return Service.subscribe(setAlerts);
        }, []);

        return alerts.map((props) => React.createElement(params.dialog, { ...props, key: props._id }));
    }

    return { Service, Container };
}