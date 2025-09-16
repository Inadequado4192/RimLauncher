import React from "react";

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

    private listeners = new Set<() => void>();
    public subscribe(listener: () => void) {
        this.listeners.add(listener);
        return () => this.unsubscribe(listener)
    }
    public unsubscribe(listener: () => void) {
        this.listeners.delete(listener);
    }


    public constructor(params?: StoreCreatorParams_Base) {
        this.debugName = params?.debugName;
        // this.extendUse = params.extendUse;
    }

    public abstract use(...args: any[]): any


    public emit() {
        for (const l of this.listeners) l();
    }
}





type IStoreParamsActions<Data> = Record<string, (data: Data) => any>
interface IStoreParams<
    Data,
    Actions extends IStoreParamsActions<Data> | undefined
> extends StoreCreatorParams_Base {
    value: (() => Promise<Data> | Data) | Data,
    watcher?: (listener: (data: Data) => void) => void,
    clone?: (original: Data) => Data,
    // action?: Actions;
}
export class Store<
    Data,
    Actions extends IStoreParamsActions<Data> | undefined = undefined
> extends Store_Base {
    protected __data!: Data;
    
    public constructor(params: IStoreParams<Data, Actions>) {
        super(params);


        const upd = (data: Data) => {
            if (!deepEqual(this.__data, data)) {
                this.__data = data;
                this.emit();
            }
        }

        const res = params.value instanceof Function ? params.value() : params.value;
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
            upd(res);
        });

        if (params.clone) this.clone = params.clone;
    }


    public use<S extends any = Data>(
        selector?: (userConfig: Data) => S,
        isEqual: StoreCompareType | IsEqualCallback<S> = StoreCompareType.Primitive,
    ): S {
        if (this.debugName) console.log(this.debugName, "USED", selector);

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
        const get = () => this.__data;


        if (selector) {
            return useSyncExternalStoreWithCompare(sub, get, get, selector, compare);
            // return useSyncExternalStoreWithSelector(sub, get, get, selector, compare);
        } else {
            return React.useSyncExternalStore(sub, get, get) as unknown as S;
        }
    }

    public get() {
        return this.__data;
    }

    public set(value: SetType<Data>) {
        this.setWithoutEmit(value);
        this.emit();
    }
    public setWithoutEmit(data: SetType<Data>) {
        const value = data instanceof Function ? data(this.__data) : data;
        this.__data = value;
    }

    public clone: IStoreParams<Data, Actions>["clone"] & {} = () => { throw Error("Not implemented"); }

    public update(mutator: (draft: Data) => void) {
        const copy = this.clone(this.__data);
        mutator(copy);
        this.set(copy);
    }
}





// interface IStoreVersionParams extends StoreCreatorParams_Base { }
// class StoreVersion extends Store_Base {
//     private version = 0;
//     public use(): {} {
//         if (this.debugName) console.log(this.debugName, "USED");

//         const sub = React.useCallback((listener: () => void) => {
//             this.subscribe(listener);
//             return () => this.unsubscribe(listener);
//         }, []);

//         const get = () => this.version;

//         return useSyncExternalStore(sub, get, get);
//     }
//     public override emit() {
//         this.version++;
//         super.emit();
//     }
// }












export class ContextStore<D extends Record<string, Store<any>> = {}> {
    // public stores!: D;

    public constructor(
        public stores: D,
        // private storesCreator: () => D,
        public effects: (() => void)[]
    ) {

        Object.defineProperty(this._Providers, "name", { value: `ContextStoreProvider` });

        return new Proxy(this, {
            get(target, prop, receiver) {
                if (prop in target) {
                    return Reflect.get(target, prop, receiver);
                }
                if (target.stores && prop in target.stores) {
                    return (target.stores as any)[prop];
                }
            }
        }) as this & D;
    }

    public Providers = this._Providers.bind(this);
    private _Providers() {
        React.useEffect(() => {
            // this.stores = this.storesCreator();
            return () => this.stores = null!;
        }, []);

        return this.effects.map((e, key) => {
            // const name = `Store_${e.name}`;
            // const c = { [name]: () => (e(), null) }[name]!;
            const C = () => (e(), null);
            Object.defineProperty(C, "name", { value: `Store_${e.name}` });
            return React.createElement(C, { key })
        });
    }
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
    export function primitiveArraysEqual(a: any[], b: any[]): boolean {
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



function useSyncExternalStoreWithCompare<TStore, TSel>(
    subscribe: (onStoreChange: () => void) => () => void,
    getStoreSnapshot: () => TStore,
    getServerSnapshot: () => TStore,
    selector: (s: TStore) => TSel,
    isEqual: (a: TSel, b: TSel) => boolean,
) {
    const last = React.useRef<{ sel?: TSel; snap?: TSel }>({});

    const getSelected = () => {
        const storeSnap = getStoreSnapshot();
        const selected = selector(storeSnap);
        if (last.current.sel !== undefined && isEqual(last.current.sel, selected)) {
            return last.current.snap as TSel; // повертаємо попередній референс
        }
        last.current.sel = selected;
        last.current.snap = selected;
        return selected;
    };

    const getServerSelected = getServerSnapshot ? () => selector(getServerSnapshot()) : undefined;

    return React.useSyncExternalStore(subscribe, getSelected, getServerSelected ?? (() => selector(getStoreSnapshot())));
}
