import { app } from "electron"
import fs from 'fs'
import path from 'path'
import { notifiAndLog } from "./notification"
import { manage, unmanage } from "./window"
import { hasChildProcess, reProfilePath } from "./chmlfrp"
import log, { LevelOption } from 'electron-log'
import crypto from 'crypto'


const definePath = app.isPackaged ? path.dirname(app.getPath('exe')) : app.getAppPath()
const settingsFile = 'settings.json'
const logFile = 'log.log'
const settingsPath = path.resolve(definePath, settingsFile)
const frpcFindPathName = 'frpc'
const profilePathName = 'profiles'

export interface Settings {
    openAtLogin: boolean
    notification: LevelOption
    windowState: boolean
    exitOnClose: boolean
    logInterval: number
    frpcPaths: string[]
    frpcPath: string
    frpcFindPath: string
    profilePath: string

    logFilePath: string
    logFileLevel: LevelOption
    logConsoleLevel: LevelOption

    logConfidentiality: LogConfidentiality
    userToken: string

    username: string
    password: string
    saltKey: string
}

type LogConfidentiality = 'writing' | 'reading' | false


export let settings: Settings = {
    openAtLogin: false,
    notification: false,
    windowState: false,
    exitOnClose: false,
    logInterval: 1000,
    frpcPaths: [],
    frpcPath: '',
    frpcFindPath: path.resolve(definePath, frpcFindPathName),
    profilePath: path.resolve(definePath, profilePathName),

    logFilePath: path.resolve(definePath, logFile),
    logFileLevel: log.transports.file.level,
    logConsoleLevel: log.transports.console.level,

    logConfidentiality: 'writing',

    userToken: '',

    username: '',
    password: '',
    saltKey: ''
}

export interface SettingsResult {
    code: number,
    msg: string,
    settings: Settings | null
}

function generateRandomText(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}


// 加密函数
function encrypt(text: string, password: string) {
    const iv = crypto.randomBytes(16); // 初始化向量
    const cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(password).digest(), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// 解密函数
function decrypt(text: string, password: string) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift() as string, 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(password).digest(), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

export function getAccount() {
    const username = decrypt(settings.username, settings.saltKey)
    const password = decrypt(settings.password, settings.saltKey)
    return {
        username,
        password
    }
}


export function saveAccount(username: string, password: string): SettingsResult {
    const saltKey = generateRandomText(16)
    username = encrypt(username, saltKey)
    password = encrypt(password, saltKey)

    settings.username = username
    settings.password = password
    settings.saltKey = saltKey
    saveSettings()

    return {
        code: 200,
        msg: '保存用户成功!',
        settings
    }
}



export function saveSettings() {
    const json = JSON.stringify(settings)
    try {
        fs.writeFileSync(settingsPath, json)
        notifiAndLog('debug', `写入配置文件${settingsPath}成功!`)
    } catch (error) {
        notifiAndLog('error', `写入配置文件${settingsPath}失败! 数据:${json} 错误:${error}`)
    }
}


export function readSettings() {
    try {
        Object.assign(settings, JSON.parse(fs.readFileSync(settingsPath).toString()))
        notifiAndLog('debug', `读取配置文件[${settingsPath}]成功`)
    } catch (err) {
        notifiAndLog('debug', `读取配置文件[${settingsPath}]失败 错误:${err}`)
    }
    return settings
}

export function toggleOpenAtLogin(): SettingsResult {
    let ret: SettingsResult = {
        code: 200,
        msg: '操作成功',
        settings
    }

    //应用是否打包
    if (!app.isPackaged) {
        //获取是否开机启动
        ret.code = 404
        ret.msg = '应用未打包，打包后再尝试本功能!'
        return ret
    } else {
        if (process.platform != 'win32' && process.platform != 'darwin') {
            //获取是否开机启动
            ret.code = 403
            ret.msg = '该功能无法非windows和darwin(MACOS)上运行!'
        } else {
            let currentOpenAtLogin = false
            if (process.platform === 'win32') {
                const { openAtLogin } = app.getLoginItemSettings({
                    args: ["--openAsHidden"],
                });
                currentOpenAtLogin = !openAtLogin
                app.setLoginItemSettings({
                    openAtLogin: currentOpenAtLogin,
                    args: ["--openAsHidden"],
                })
            } else if (process.platform === 'darwin') {
                const { openAtLogin } = app.getLoginItemSettings()
                currentOpenAtLogin = !openAtLogin
                app.setLoginItemSettings({
                    openAtLogin: currentOpenAtLogin,
                    openAsHidden: true,
                });
            }
            settings.openAtLogin = currentOpenAtLogin
            ret.msg = `${settings.openAtLogin ? '打开' : '关闭'}登录自启成功!`
        }
    }

    saveSettings()
    notifiAndLog('verbose', `${ret.msg}`)
    return ret
}




export function setNotification(type: LevelOption): SettingsResult {
    settings.notification = type
    saveSettings()
    const msg = `${settings.notification ? '打开' : '关闭'}通知成功!`
    notifiAndLog('verbose', msg)
    return {
        code: 200,
        msg: msg,
        settings
    }
}

export function toggleWindowState() {
    settings.windowState = !settings.windowState
    saveSettings()
    const msg = `${settings.windowState ? '打开' : '关闭'}窗口状态成功!`
    notifiAndLog('verbose', msg)
    if (settings.windowState) {
        manage()
    } else {
        unmanage()
    }

    return {
        code: 200,
        msg: msg,
        settings
    }
}

export function toggleExitOnClose() {
    settings.exitOnClose = !settings.exitOnClose
    const msg = `${settings.notification ? '打开' : '关闭'}直接退出程序成功!`
    saveSettings()
    notifiAndLog('verbose', msg)
    return {
        code: 200,
        msg,
        settings
    }
}

export function setFrpcPaths(frpcPaths: string[]): SettingsResult {
    const ret: SettingsResult = {
        code: 200,
        msg: '操作成功',
        settings
    }
    const realFrpcPaths = frpcPaths.filter(item => {
        try {
            fs.accessSync(item, fs.constants.X_OK)
            return true
        } catch (err) {
            ret.code = 500
            ret.msg += `${item}文件不可用、已经过滤了\r\n`
            notifiAndLog('debug', ret.msg)
            return false
        }
    })
    settings.frpcPaths = realFrpcPaths
    notifiAndLog('verbose', ret.msg)
    saveSettings()
    return ret
}

export function setLogInterval(logInterval: number): SettingsResult {
    const ret: SettingsResult = {
        code: 200,
        msg: '修改日志间隔时间成功!',
        settings
    }

    if (logInterval < 100) {
        ret.code = 500
        ret.msg = '日志刷新间隔时间不能大于100ms'

    } else {
        settings.logInterval = logInterval
        saveSettings()
    }

    notifiAndLog('info', ret.msg)
    return ret
}

export function setFrpcPath(frpcPath: string): SettingsResult {
    const ret: SettingsResult = {
        code: 200,
        msg: '修改FRPC成功!',
        settings

    }

    try {
        fs.accessSync(frpcPath, fs.constants.X_OK)
        settings.frpcPath = frpcPath
    } catch (err) {
        ret.code = 500
        ret.msg = `${frpcPath}文件不可用、已经过滤了`
        notifiAndLog('error', ret.msg)
    }
    saveSettings()
    notifiAndLog('verbose', ret.msg)
    return ret
}

export async function setFrpcFindPath(frpcFindPath: string): Promise<SettingsResult> {
    const ret: SettingsResult = {
        code: 200,
        msg: '修改FRPC寻找路径成功!',
        settings
    }

    if (!fs.existsSync(frpcFindPath)) {
        ret.msg = '路径不存在!'
        ret.code = 500
        notifiAndLog('verbose', ret.msg)
        return ret
    }


    const stat = fs.statSync(frpcFindPath)

    if (!stat.isDirectory()) {
        ret.code = 500
        ret.msg = '不是一个有效目录!'
        notifiAndLog('verbose', ret.msg)
        return ret
    }


    settings.frpcFindPath = frpcFindPath
    const frpcPaths: string[] = await findFrpcFromFindPath(frpcFindPath)
    settings.frpcPaths = settings.frpcPaths.concat(frpcPaths)
    settings.frpcPaths = [...new Set(settings.frpcPaths)];
    saveSettings()
    notifiAndLog('verbose', ret.msg)
    return ret
}


export async function findFrpcFromFindPath(frpcFindPath: string | null): Promise<string[]> {
    if (!frpcFindPath) {
        frpcFindPath = settings.frpcFindPath
    }

    const frpsPaths: string[] = await findExecutableFiles(frpcFindPath, process.platform === 'win32' ? 'frpc.exe' : 'frpc')
    return frpsPaths;

}


export function setProfilePath(profilePath: string): SettingsResult {
    const ret: SettingsResult = {
        code: 200,
        msg: '修改FRPC寻找路径成功!',
        settings
    }

    if (hasChildProcess()) {
        ret.code = 500
        ret.msg = '当前有子进程任务正在运行中!'
        notifiAndLog('verbose', ret.msg)
        return ret
    }
    const stat = fs.statSync(profilePath)

    if (!stat.isDirectory()) {
        ret.code = 500
        ret.msg = '不是一个有效目录!'
        notifiAndLog('verbose', ret.msg)
        return ret
    }

    copyFolder(settings.profilePath, profilePath)
    settings.profilePath = profilePath
    saveSettings()
    reProfilePath()
    notifiAndLog('verbose', ret.msg)
    return ret
}


export function setLogFilePath(logFilePath: string): SettingsResult {

    const ret: SettingsResult = {
        code: 200,
        msg: '修改日志文件路径成功!',
        settings
    }

    const stat = fs.statSync(logFilePath)

    if (stat.isDirectory()) {
        settings.logFilePath = path.resolve(logFilePath, logFile)
    } else {
        settings.logFilePath = logFilePath
    }

    saveSettings()
    resetLog()
    return ret
}

export function setLogLevel(type: 'file' | 'console', level: LevelOption): SettingsResult {
    const ret: SettingsResult = {
        code: 200,
        msg: `切换${type}日志级别为${level}成功`,
        settings
    }

    if (type === 'file') {
        settings.logFileLevel = level
    } else {
        settings.logConsoleLevel = level
    }
    saveSettings()
    resetLog()
    return ret
}

export function setLogConfidentiality(confidentiality: LogConfidentiality) {
    const ret: SettingsResult = {
        code: 200,
        msg: `${confidentiality === 'writing' ? '写入读取时' : confidentiality === 'reading' ? '读取时' : '不'}隐藏Token`,
        settings
    }
    settings.logConfidentiality = confidentiality
    saveSettings()
    return ret
}

// 检查文件是否是可执行文件
const isExecutable = (filePath: string): Promise<boolean> => {
    return new Promise((resolve, _reject) => {
        fs.access(filePath, fs.constants.X_OK, (err) => {
            if (err) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
};

// 遍历目录并查找可执行文件
const findExecutableFiles = async (dirPath: string, filename: string): Promise<string[]> => {
    let results: string[] = [];

    try {
        const files = await fs.promises.readdir(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = await fs.promises.stat(filePath);
            if (stats.isDirectory()) {
                const subdirResults = await findExecutableFiles(filePath, filename);
                results = results.concat(subdirResults);
            } else if (file === filename && await isExecutable(filePath)) {
                results.push(filePath);
            }
        }
    } catch (err) {
        notifiAndLog('debug', `查找可执行文件时发生错误:${err}`)
    }

    return results;
};



function copyFolder(sourcePath: string, targetPath: string) {
    fs.readdir(sourcePath, (err, files) => {
        if (err) throw err;

        files.forEach(file => {
            const sourceFile = path.join(sourcePath, file);
            const targetFile = path.join(targetPath, file);

            fs.stat(sourceFile, (err, stats) => {
                if (err) throw err;

                if (stats.isDirectory()) {
                    // 如果是子文件夹，递归复制子文件夹中的内容
                    fs.mkdir(targetFile, { recursive: true }, err => {
                        if (err) throw err;
                        copyFolder(sourceFile, targetFile);
                    });
                } else {
                    // 如果是文件，直接复制文件
                    fs.copyFile(sourceFile, targetFile, err => {
                        if (err) throw err;
                        notifiAndLog('debug', `${sourceFile} 已经拷贝到了 ${targetFile}`)
                    });
                }
            });
        });
    });
}

export function confidentialityLog(text: string) {
    if (settings.userToken) {
        text = text.toString()
        return text.replaceAll(settings.userToken, '******')
    }

    return text
}


export function initSettings() {
    readSettings()
    resetLog()
    reProfilePath()
}

export function resetLog() {
    log.initialize()
    log.transports.file.resolvePathFn = () => {
        return settings.logFilePath
    }

    log.transports.file.level = settings.logFileLevel
    log.transports.console.level = settings.logConsoleLevel
}

export default {

    readSettings,
    saveSettings,
    toggleOpenAtLogin,
    setNotification,
    toggleWindowState,
    toggleExitOnClose,
    setFrpcPaths,
    setFrpcPath,
    setFrpcFindPath,
    setProfilePath,
    setLogInterval,
    initSettings
}