export class R<T> {
    code: number = R_SUCCESS
    msg: string = R_SUCCESS_MSG
    data?:T
}


export function failed<T>(msg: string, data?: T) {
    const ret = new R<T>()
    ret.code = R_FAILED
    ret.msg = msg
    ret.data = data

    return ret
}

export function success<T>(data?: T) {
    const ret = new R<T>()
    ret.data = data
    return ret
}

export const R_SUCCESS = 200
export const R_FAILED = 500
export const R_SUCCESS_MSG = '操作成功!'