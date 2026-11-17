export interface IpcInvokeMap { }   // renderer -> main
export interface IpcEventMap { }    // main -> renderer


export type Result<T, E = string> = ResultOk<T> | ResultFail<E>

export type ResultOk<T> = { success: true; data: T; error?: never }
export type ResultFail<E> = { success: false; error: E; data?: never };


export interface PathError {
    path: string;
    message: string;
}

export const ok = <T>(data: T): ResultOk<T> => ({ success: true, data });
export const fail = <E>(error: E): ResultFail<E> => ({ success: false, error });


export type UnwrapResult<R> = R extends ResultFail<any> ? never
    : R extends ResultOk<infer D> ? D : R;

export const isResult = (v: unknown): v is Result<unknown, unknown> =>
    !!v && typeof v === "object" && typeof (v as any).success === "boolean" &&
    ("data" in v || "error" in v);


export type Promisable<T> = T | Promise<T>;