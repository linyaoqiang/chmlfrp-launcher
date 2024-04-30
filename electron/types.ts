export interface R<T> {
    code: number;
    msg: string;
    data:T;
}

export const R_SUCCESS = 200
export const R_FAILED = 500