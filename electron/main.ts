import { app, BrowserWindow, ipcMain, dialog, Menu, nativeTheme, nativeImage } from 'electron'
import { createWindow } from './window'
import { createTray } from './tray'
import { clearToken, getToken, saveToken } from "./token";
import {
    readSettings, toggleOpenAtLogin, setFrpcPaths, setFrpcPath, setLogInterval,
    toggleExitOnClose, setNotification, toggleWindowState, setFrpcFindPath, setProfilePath,
    initSettings,
    setLogFilePath,
    setLogLevel,
    setLogConfidentiality,
    saveAccount,
    getAccount
} from './settings'
import { getFrpcLog, getFrpcConfiguration, toggleFrpc, toggleAutoEnable, initFrpc, clearFrpcLog, reProfilePath, executeText, systemProcessinformation } from './chmlfrp'
import { LevelOption } from 'electron-log'

// 判断是否重复打开应用
if (!app.requestSingleInstanceLock()) {
    app.exit()
}


// 当开启第二个实例时显示窗口
app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    let windows: BrowserWindow[] = BrowserWindow.getAllWindows()
    if (windows.length >= 1) {
        windows[0].focus()
    } else {
        createWindow()
    }
})

// 当所有的窗口关闭时，不声明该事件，则直接退出程序
app.on('window-all-closed', () => {
    // if (process.platform !== 'darwin') {
    //   app.quit()
    //   win = null
    // }

    if (readSettings().exitOnClose) {
        app.quit()
    }

})

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

export function registerHandler() {
    ipcMain.handle('token-get', async (_event) => {
        return getToken()
    })

    ipcMain.handle('token-save', async (_event, token: string) => {
        return saveToken(token)
    })

    ipcMain.handle('token-clear', async (_event) => {
        return clearToken()
    })


    ipcMain.handle('package-data', async (_event) => {
        return {
            name: app.getName(),
            version: app.getVersion()
        }
    })

    ipcMain.handle('frpc-configuration', async (_event, token: string) => {
        return getFrpcConfiguration(token)
    })

    ipcMain.handle('frpc-toggle', (_event, token: string, tunnelId: string) => {
        return toggleFrpc(token, tunnelId)
    })

    ipcMain.handle('frpc-log', async (_event, token: string, tunnelId: string) => {
        return getFrpcLog(token, tunnelId)
    })


    ipcMain.handle('frpc-log-clear', async (_event, token: string, tunnelId: string) => {
        return clearFrpcLog(token, tunnelId)
    })

    ipcMain.handle('frpc-auto-enable-toggle', async (_event, token: string) => {
        return toggleAutoEnable(token)
    })

    ipcMain.handle('frpc-execute-text', async (_event, token: string, tunnelId: string) => {
        return executeText(token, tunnelId)
    })

    ipcMain.handle('frpc-system-process', async () => {
        return await systemProcessinformation()
    })




    ipcMain.handle('system-platform', async (_event) => {
        return {
            platform: process.platform,
            arch: process.arch
        }
    })



    ipcMain.handle('settings-read', (_event) => {
        return readSettings()
    })

    ipcMain.handle('settings-open-at-login', (_event) => {
        return toggleOpenAtLogin()
    })

    ipcMain.handle('settings-exit-on-close', () => {
        return toggleExitOnClose()
    })

    ipcMain.handle('settings-notification', async (_event, type: LevelOption) => {
        console.log(type);
        return setNotification(type)
    })

    ipcMain.handle('settings-window-state', () => {
        return toggleWindowState()
    })

    ipcMain.handle('settings-frpc-paths', (_event, frpcPaths: string[]) => {
        return setFrpcPaths(frpcPaths)
    })


    ipcMain.handle('settings-frpc-path', (_event, frpcPath: string) => {
        return setFrpcPath(frpcPath)
    })

    ipcMain.handle('settings-frpc-find-path', (_event, frpcFindPath: string) => {
        return setFrpcFindPath(frpcFindPath)
    })

    ipcMain.handle('settings-profile-path', async (_event, profilePath: string) => {
        return setProfilePath(profilePath)
    })


    ipcMain.handle('settings-log-interval', (_event, logInterval: number) => {
        return setLogInterval(logInterval)
    })

    ipcMain.handle('settings-log-file-path', (_event, logFilePath: string) => {
        return setLogFilePath(logFilePath)
    })

    ipcMain.handle('settings-log-file-level', (_event, level: LevelOption) => {
        return setLogLevel('file', level)
    })

    ipcMain.handle('settings-log-console-level', (_event, level: LevelOption) => {
        return setLogLevel('console', level)
    })

    ipcMain.handle('settings-log-confidentiality', (_event, level: 'writing' | 'reading' | false) => {
        return setLogConfidentiality(level)
    })

    ipcMain.handle('settings-save-account', (_event, username, password) => {
        return saveAccount(username, password)
    })

    ipcMain.handle('settings-get-account', () => {
        return getAccount()
    })
    ipcMain.handle('download-file', (_event, url: string) => {
        BrowserWindow.getAllWindows()[0].webContents.downloadURL(url)
        return url
    })

    ipcMain.handle('choose-single-file', async (_event) => {
        return await dialog.showOpenDialog(BrowserWindow.getAllWindows()[0], {
            title: '选择文件',
            message: '选择一个你需要的文件',
            defaultPath: app.getPath('desktop'),
            properties: ['openFile']
        })
    })

    ipcMain.handle('choose-single-directory', async (_event) => {
        return await dialog.showOpenDialog(BrowserWindow.getAllWindows()[0], {
            title: '选择目录',
            message: '选择一个你需要的目录',
            defaultPath: app.getPath('desktop'),
            properties: ['openDirectory', 'createDirectory', 'promptToCreate']
        })
    })
}

app.whenReady().then(() => {
    Menu.setApplicationMenu(null)
    initSettings()
    createWindow()
    createTray()
    registerHandler()
    initFrpc()
    
})
