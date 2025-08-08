import React, { useSyncExternalStore } from "react";
import { useSyncExternalStoreWithSelector, } from "use-sync-external-store/with-selector";

/**@deprecated */
export interface IStoreBase {
    subscribe: (listener: () => void) => void;
    unsubscribe: (listener: () => void) => void;
    emit: () => void;
}
/**@deprecated */
export interface IStore<Data> extends IStoreBase {
    use: <C extends (userConfig: Data) => any = (userConfig: Data) => Data>(selector?: C, isEqual?: StoreCompareType | IsEqualCallback<ReturnType<C>>) => ReturnType<C>,
    get: () => Data;
    set: (value: SetType<Data>) => void;
    setWithoutEmit: (data: SetType<Data>) => void;
}


export enum StoreCompareType {
    /**@example (prev, next) => prev === next */
    Primitive,
    /** {@link StoreCompares.primitiveArraysEqual} */
    PrimitiveArray,
    PrimitiveObject,
    /**
     * @deprecated
     * @example (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
     */
    JSON,
}
type SetType<Data> = Data | ((current: Data) => Data);

type IsEqualCallback<T = any> = (a: T, b: T) => boolean






interface StoreCreatorParams_Base {
    debugName?: string
    // extendUse?: () => void,
}

abstract class Store_Base {
    protected debugName?: string;
    // protected extendUse?: () => void

    public listeners = new Set<() => void>();
    public subscribe(listener: () => void) {
        this.listeners.add(listener);
    }
    public unsubscribe(listener: () => void) {
        this.listeners.delete(listener);
    }


    public constructor(params: StoreCreatorParams_Base) {
        this.debugName = params.debugName;
        // this.extendUse = params.extendUse;
    }

    public abstract use(...args: any[]): any

    public get() {
        return Store;
    }

    public emit() {
        for (const l of this.listeners) l();
    }
}





interface IStoreParams<Data> extends StoreCreatorParams_Base {
    firstLoad: () => Promise<Data> | Data,
    watcher?: (listener: (data: Data) => void) => void,
}
export class Store<Data> extends Store_Base {
    public store!: Data;

    public constructor(params: IStoreParams<Data>) {
        super(params);


        const upd = (data: Data) => {
            if (!deepEqual(this.store, data)) {
                this.store = data;
                this.emit();
            }
        }

        const res = params.firstLoad();
        if (res instanceof Promise) {
            res.then(res => {
                if (params.debugName) console.log(params.debugName, "First Data", res);
                upd(res);
            });
        } else {
            if (params.debugName) console.log(params.debugName, "First Data", res);
            upd(res);
        }

        params.watcher?.(res => {
            if (params.debugName) console.log(params.debugName, "Watched Data", res);
            upd(res)
        });
    }




    public use<C extends (userConfig: Data) => any = (userConfig: Data) => Data>(
        selector?: C,
        isEqual: StoreCompareType | IsEqualCallback<ReturnType<C>> = StoreCompareType.Primitive
    ): ReturnType<C> {
        if (this.debugName) console.log(this.debugName, "USED", selector);
        // this.extendUse?.();

        const compare: IsEqualCallback = React.useMemo(() => {
            if (typeof isEqual !== "number") return isEqual;
            switch (isEqual) {
                case StoreCompareType.Primitive: return (prev: any, next: any) => prev === next;
                case StoreCompareType.JSON: return (prev: any, next: any) => JSON.stringify(prev) === JSON.stringify(next);
                case StoreCompareType.PrimitiveArray: return StoreCompares.primitiveArraysEqual;
                case StoreCompareType.PrimitiveObject: return StoreCompares.primitiveObjectsEqual;
            }
        }, [isEqual]);

        const sub = React.useCallback((listener: () => void) => {
            this.subscribe(listener);
            return () => this.unsubscribe(listener);
        }, []);
        const get = () => this.store;

        if (selector) {
            return useSyncExternalStoreWithSelector(sub, get, get, selector, compare);
        } else {
            return useSyncExternalStore(sub, get, get) as ReturnType<C>;
        }
    }

    public set(value: SetType<Data>) {
        this.setWithoutEmit(value);
        this.emit();
    }
    public setWithoutEmit(data: SetType<Data>) {
        const value = data instanceof Function ? data(this.store) : data;
        this.store = value;
    }
}





interface IStoreVersionParams extends StoreCreatorParams_Base { }
export class StoreVersion extends Store_Base {
    private version = 0;
    public use(): {} {
        if (this.debugName) console.log(this.debugName, "USED");

        const sub = React.useCallback((listener: () => void) => {
            this.subscribe(listener);
            return () => this.unsubscribe(listener);
        }, []);

        const get = () => this.version;

        return useSyncExternalStore(sub, get, get);
    }
    public override emit() {
        this.version++;
        super.emit();
    }
}

// interface PrimitiveStoreParams<Data> extends StoreCreatorParams_Base {
//     value: Data
// }
// export class PrimitiveStore<Data> extends Store_Base {
//     public store: Data;

//     public constructor(params: PrimitiveStoreParams<Data>) {
//         super(params);
//         this.store = params.value;
//     }


//     public use<T>(selector: (value: Data) => T): T {
//         if (this.debugName) console.log(this.debugName, "USED");
//         this.extendUse?.();

//         const sub = React.useCallback((listener: () => void) => {
//             this.subscribe(listener);
//             return () => this.unsubscribe(listener);
//         }, []);

//         const get = () => selector(this.store);

//         return useSyncExternalStore(sub, get, get);
//     }
// }













/**@deprecated use {@link Store} */
export function createStore<
    Data
>(params: IStoreParams<Data>): IStore<Data> {
    let store: Data;
    const listeners = new Set<() => void>();


    function subscribe(listener: () => void) {
        listeners.add(listener);
    }
    function unsubscribe(listener: () => void) {
        listeners.delete(listener);
    }


    function use<C extends (userConfig: Data) => any = (userConfig: Data) => Data>(
        selector?: C,
        isEqual: StoreCompareType | IsEqualCallback<ReturnType<C>> = StoreCompareType.Primitive
    ): ReturnType<C> {
        if (params.debugName) console.log(params.debugName, "USED", selector);

        const compare: IsEqualCallback = React.useMemo(() => {
            if (typeof isEqual !== "number") return isEqual;
            switch (isEqual) {
                case StoreCompareType.Primitive: return (prev: any, next: any) => prev === next;
                case StoreCompareType.JSON: return (prev: any, next: any) => JSON.stringify(prev) === JSON.stringify(next);
                case StoreCompareType.PrimitiveArray: return StoreCompares.primitiveArraysEqual;
                case StoreCompareType.PrimitiveObject: return StoreCompares.primitiveObjectsEqual;
            }
        }, [isEqual]);

        const sub = React.useCallback((listener: () => void) => {
            subscribe(listener);
            return () => unsubscribe(listener);
        }, []);
        const get = () => store;

        if (selector) {
            return useSyncExternalStoreWithSelector(sub, get, get, selector, compare);
        } else {
            return useSyncExternalStore(sub, get, get) as ReturnType<C>;
        }
    }




    function get() {
        return store;
    }

    function set(value: SetType<Data>) {
        setWithoutEmit(value);
        emit();
    }
    function setWithoutEmit(data: SetType<Data>) {
        const value = data instanceof Function ? data(store) : data;
        store = value;
    }

    function emit() {
        for (const l of listeners) l();
    }







    let inited = false;
    (function init() {
        if (inited) return console.warn("Already inited");
        inited = true;

        function upd(data: Data) {
            if (!deepEqual(store, data)) {
                store = data;
                emit();
            }
        }


        const res = params.firstLoad();
        if (res instanceof Promise) {
            res.then(res => {
                if (params.debugName) console.log(params.debugName, "First Data", res);
                upd(res);
            });
        } else {
            if (params.debugName) console.log(params.debugName, "First Data", res);
            upd(res);
        }

        params.watcher?.(res => {
            if (params.debugName) console.log(params.debugName, "Watched Data", res);
            upd(res)
        });
    })();


    return {
        subscribe, unsubscribe, use, get, set, setWithoutEmit, emit
    }
}



function deepUpdate(target: any, source: any): boolean {
    let changed = false;

    for (const key of Object.keys(source)) {
        const next = source[key];
        const prev = target[key];

        if (Array.isArray(next) && Array.isArray(prev)) {
            if (next.length !== prev.length) {
                target[key] = next;
                changed = true;
                continue;
            }

            const arrayChanged = next.some((item, i) => {
                const prevItem = prev[i];

                if (
                    typeof item === "object" &&
                    item !== null &&
                    typeof prevItem === "object" &&
                    prevItem !== null
                ) {
                    return deepUpdate(prevItem, item);
                }

                return item !== prevItem;
            });

            if (arrayChanged) {
                target[key] = next;
                changed = true;
            }

        } else if (
            typeof next === "object" &&
            next !== null &&
            typeof prev === "object" &&
            prev !== null
        ) {
            if (deepUpdate(prev, next)) changed = true;

        } else if (prev !== next) {
            target[key] = next;
            changed = true;
        }
    }

    return changed;
}
export function deepEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (typeof a !== typeof b) return false;

    if (a === null || b === null) return a === b;

    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
    }

    if (typeof a === "object" && typeof b === "object") {
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);

        if (aKeys.length !== bKeys.length) return false;

        for (let key of aKeys) {
            if (!bKeys.includes(key)) return false;
            if (!deepEqual(a[key], b[key])) return false;
        }

        return true;
    }

    return false;
}





export namespace StoreCompares {
    export function primitiveArraysEqual(a: string[], b: string[]): boolean {
        if (a.length !== b.length) return false;
        return a.every((v, i) => v === b[i]);
    }
    export function primitiveObjectsEqual(a: Record<string, any>, b: Record<string, any>): boolean {
        return primitiveArraysEqual(Object.values(a), Object.values(b));
    }
    export function isEqualAtArray<O extends any[], S extends (o1: O[number], o2: O[number]) => any>(o1: O, o2: O, s: S): boolean {
        if (o1.length !== o2.length) return false;
        return o1.every((v, i) => s(v, o2[i]));
    }
    // export function isEqualAtArray_P <O extends any[], S extends (o1: O[number], o2: O[number]) => any>(s: S, o1: O, o2: O, ): boolean {
    //     if (o1.length !== o2.length) return false;
    //     return o1.every((v, i) => s(v, o2[i]));
    // }


    export function _arraysEqualWithSelector<O, S extends (o: O) => any>(o1: O, o2: O, s: S): boolean {
        const a = s(o1), b = s(o2);
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
    export function _isEqualBy<T, V>(
        prev: T[],
        next: T[],
        select: (item: T) => V[],
        options?: { unordered?: boolean }
    ): boolean {
        if (prev.length !== next.length) return false;

        for (let i = 0; i < prev.length; i++) {
            const a = select(prev[i]!);
            const b = select(next[i]!);
            if (a.length !== b.length) return false;

            if (options?.unordered) {
                const setA = new Set(a);
                if (!b.every(x => setA.has(x))) return false;
            } else {
                for (let j = 0; j < a.length; j++) {
                    if (a[j] !== b[j]) return false;
                }
            }
        }

        return true;
    }

}