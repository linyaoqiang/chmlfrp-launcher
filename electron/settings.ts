import { app } from "electron"
import fs from 'fs'
import path from 'path'
import { notification } from "./notification"
import { manage, unmanage } from "./window"
import { hasChildProcess, reProfilePath } from "./chmlfrp"

const definePath = app.isPackaged ? path.dirname(app.getPath('exe')) : app.getAppPath()
const configurationFile = 'settings.json'
const configurationPath = path.resolve(definePath, configurationFile)
const frpcFindPathName = 'frpc'
const profilePathName = 'profiles'

export interface Settings {
    openAtLogin: boolean,
    notification: boolean,
    windowState: boolean,
    exitOnClose: boolean,
    logInterval: number,
    frpcPaths: string[],
    frpcPath: string,
    frpcFindPath: string,
    profilePath: string,
    userToken: string,
}


// code 200 true
export interface SettingsResult {
    code: number,
    msg: string,
    settings: Settings | null
}




export function saveSettings(configuration: Settings, _call:Function | null = null) {
    const json = JSON.stringify(configuration)
    fs.writeFile(configurationPath, json, err => {
        if (err) {
            console.error(`写入系统设置文件[${configurationPath}]失败, 数据: [${json}]`, err);
            notification(`写入系统设置文件[${configurationPath}]失败, 数据: [${json}], 错误${err}`)
        } else {
            console.log(`写入系统设置文件[${configurationPath}]成功`)
            if (_call) {
                _call()
            }
        }
    })
}


export function readSettings() {
    let configuration: Settings = {
        openAtLogin: false,
        notification: false,
        windowState: false,
        exitOnClose: false,
        logInterval: 1000,
        frpcPaths: [],
        frpcPath: '',
        frpcFindPath: path.resolve(definePath, frpcFindPathName),
        profilePath: path.resolve(definePath, profilePathName),
        userToken: ''
    }
    try {
        Object.assign(configuration, JSON.parse(fs.readFileSync(configurationPath).toString()))
    } catch (err) {
        console.error(`读取系统设置文件[${configurationPath}]失败`, err);
    }

    

    // if(process.platform === 'win32') {
    //     const { openAtLogin } = app.getLoginItemSettings({
    //         args: ["--openAsHidden"],
    //     });
    //     configuration.openAtLogin = openAtLogin
    // }else if (process.platform === 'darwin') {
    //     const { openAtLogin } = app.getLoginItemSettings()
    //     configuration.openAtLogin = openAtLogin
    // }
    return configuration
}

export function toggleOpenAtLogin(): SettingsResult {
    const settings = readSettings()
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
        notification(ret.msg)
        return ret
    }


    // 是否windows||macos
    if (process.platform != 'win32' && process.platform != 'darwin') {
        //获取是否开机启动
        ret.code = 403
        ret.msg = '该功能无法非windows和darwin(MACOS)上运行!'
        notification(ret.msg)
        return ret
    }

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
    ret.settings = settings
    saveSettings(settings)
    notification(`${settings.openAtLogin? '打开' : '关闭'}登录自启成功!`)
    return ret
}




export function toggleNotification(): SettingsResult {
    const settings = readSettings()
    settings.notification = !settings.notification
    saveSettings(settings)
    notification(`${settings.notification? '打开' : '关闭'}通知成功!`)
    return {
        code: 200,
        msg: '操作成功',
        settings
    }
    
}

export function toggleWindowState() {
    const settings = readSettings()
    settings.windowState = !settings.windowState
    saveSettings(settings)
    notification(`${settings.notification? '打开' : '关闭'}窗口状态成功!`)

    if (settings.windowState) {
        manage()
    }else {
        unmanage()
    }

    return {
        code: 200,
        msg: '操作成功',
        settings
    }
}

export function toggleExitOnClose() {
    const settings = readSettings()
    settings.exitOnClose = !settings.exitOnClose
    saveSettings(settings)
    notification(`${settings.notification? '打开' : '关闭'}直接退出程序成功!`)
    return {
        code: 200,
        msg: '操作成功',
        settings
    }
}

export function setFrpcPaths(frpcPaths: string[]): SettingsResult {
    const settings = readSettings()
    const ret: SettingsResult = {
        code: 200,
        msg: '更新FRPC列表成功!',
        settings
    }
    const realFrpcPaths = frpcPaths.filter(item => {
        try {
            fs.accessSync(item, fs.constants.X_OK)
            return true
        } catch (err) {
            ret.code = 500
            ret.msg += `${item}文件不可用、已经过滤了\r\n`
            console.error(`${item}文件不可用、已经过滤了`);
            notification(`${item}文件不可用、已经过滤了`)
            return false
        }
    })
    settings.frpcPaths = realFrpcPaths
    saveSettings(settings)
    return ret
}

export function setLogInterval(logInterval: number): SettingsResult {
    const settings = readSettings()
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
        saveSettings(settings)
    }

    notification(ret.msg)
    return ret
}

export function setFrpcPath(frpcPath: string): SettingsResult {
    const settings = readSettings()
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
        console.error(ret.msg)
        notification(ret.msg)
        return ret
    }
    saveSettings(settings)
    notification(ret.msg)
    return ret
}

export async function setFrpcFindPath(frpcFindPath: string): Promise<SettingsResult> {
    const settings = readSettings()
    const ret: SettingsResult = {
        code: 200,
        msg: '修改FRPC寻找路径成功!',
        settings
    }

    if (!fs.existsSync(frpcFindPath)) {
        ret.msg = '路径不存在!'
        ret.code = 500
        notification(ret.msg)
        return ret
    }

    
    const stat = fs.statSync(frpcFindPath)

    if (!stat.isDirectory()) {
        ret.code = 500
        ret.msg = '不是一个有效目录!'
        notification(ret.msg)
        return ret
    }


    settings.frpcFindPath = frpcFindPath
    const frpcPaths:string[] = await findFrpcFromFindPath(frpcFindPath)
    settings.frpcPaths = settings.frpcPaths.concat(frpcPaths)
    settings.frpcPaths = [...new Set(settings.frpcPaths)];
    saveSettings(settings)
    notification(ret.msg)
    return ret
}


export async function findFrpcFromFindPath(frpcFindPath: string | null):Promise<string[]> {
    const settings = readSettings()
    if (!frpcFindPath) {
        frpcFindPath = settings.frpcFindPath
    }
    
    const frpsPaths: string[] = await findExecutableFiles(frpcFindPath, process.platform === 'win32' ? 'frpc.exe' : 'frpc')
    return frpsPaths;

}


export function setProfilePath(profilePath: string): SettingsResult {



    const settings = readSettings()
    const ret: SettingsResult = {
        code: 200,
        msg: '修改FRPC寻找路径成功!',
        settings
    }

    if (hasChildProcess()) {
        ret.code = 500
        ret.msg = '当前有子进程任务正在运行中!'
        notification(ret.msg)
        return ret
    }


    if (!fs.existsSync(profilePath)) {
        ret.code = 500
        ret.msg = '路径不存在!'
        notification(ret.msg)
        return ret
    }


    const stat = fs.statSync(profilePath)

    if (!stat.isDirectory()) {
        ret.code = 500
        ret.msg = '不是一个有效目录!'
        notification(ret.msg)
        return ret
    }

    copyFolder(settings.profilePath, profilePath)
    settings.profilePath = profilePath
    saveSettings(settings, ()=>{
        reProfilePath()
    })
    notification(ret.msg)
    
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
        console.error('查找可执行文件时发生错误:', err);
        notification(`查找可执行文件时发生错误:${err}`, )
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
                        console.log(`${sourceFile} 已经拷贝到了 ${targetFile}`);
                    });
                }
            });
        });
    });
}

export default {

    readSettings,
    saveSettings,
    toggleOpenAtLogin,
    toggleNotification,
    toggleWindowState,
    toggleExitOnClose,
    setFrpcPaths,
    setFrpcPath,
    setFrpcFindPath,
    setProfilePath,
    setLogInterval,
}