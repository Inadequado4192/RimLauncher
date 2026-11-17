import { container } from "tsyringe";

export interface Initializable { initialize(): Promise<void> | void }

type Ctor<T = any> = new (...args: any[]) => T;
const registered: Ctor[] = [];

export function register(cls: Ctor) {
    container.registerSingleton(cls);
    registered.push(cls);
}

export function start() {
    registered
        .filter((c) => typeof c.prototype.initialize === "function")
        .map((c) => container.resolve(c) as Initializable)
        .forEach((s) => Promise.resolve(s.initialize()).catch(console.error));
}