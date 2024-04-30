import { hasChildProcess } from "./chmlfrp";
import { readSettings, saveSettings } from "./settings";

export interface TokenResult {
  code: number,
  msg: string,
  token: string
}


// 存储令牌
export function saveToken(token: string): TokenResult {
  const settings = readSettings()
  settings.userToken = token
  saveSettings(settings)
  return {
    code: 200,
    msg: '保存Token成功!',
    token
  }
}

// 获取存储的令牌
export function getToken(): string {
  return readSettings().userToken
}

// 清除存储的令牌
export function clearToken() {

  const ret = {
    code: 200,
    msg: '清除Token成功!',
    token: null
  }
  if (hasChildProcess()) {
    ret.code = 500
    ret.msg = '当前有子进程未退出!'
  }else {
    const settings = readSettings()
    settings.userToken = ''
    saveSettings(settings)
  }
  return ret
}

export default {
  saveToken,
  getToken,
  clearToken
}
