import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { createWindow } from './window'
import { createTray } from './tray'
import { clearToken, getToken, saveToken } from "./token";
import { readSettings, toggleOpenAtLogin, setFrpcPaths, setFrpcPath, setLogInterval, 
    toggleExitOnClose, toggleNotification, toggleWindowState, setFrpcFindPath, setProfilePath } from './settings'
import { getFrpcLog, getFrpcConfiguration, toggleFrpc, toggleAutoEnable, initFrpc, clearFrpcLog } from './chmlfrp';

// 获取单例锁
if (!app.requestSingleInstanceLock()) {
    // 获取失败则退出程序
    app.exit()
}


app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    let windows:BrowserWindow[] = BrowserWindow.getAllWindows()
    if (windows.length >= 1) {
        windows[0].focus()
    }else {
        createWindow()
    }
})

// 使用Tray来退出，无需该方法
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
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
    ipcMain.handle('token-get', async (_event)=>{
        return getToken()
    })

    ipcMain.handle('token-save', async (_event, token: string)=>{
        return saveToken(token)
    })

    ipcMain.handle('token-clear',async (_event)=>{
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

    ipcMain.handle('settings-notification', () => {
        return toggleNotification()
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

    ipcMain.handle('settings-profile-path', async (_event, profilePath: string)=>{
        return setProfilePath(profilePath)
    })


    ipcMain.handle('settings-log-interval', (_event, logInterval: number) => {
        return setLogInterval(logInterval)
    })

    ipcMain.handle('download-file', (_event, url: string) => {
        BrowserWindow.getAllWindows()[0].webContents.downloadURL(url)
        return url
    })

    ipcMain.handle('choose-single-file', async (_event)=>{
        return await dialog.showOpenDialog(BrowserWindow.getAllWindows()[0], {
            title:'选择文件',
            message: '选择一个你需要的文件',
            defaultPath: app.getPath('desktop'),
            properties: ['openFile']
        })
    })

    ipcMain.handle('choose-single-directory', async (_event)=>{
        return await dialog.showOpenDialog(BrowserWindow.getAllWindows()[0], {
            title:'选择目录',
            message: '选择一个你需要的目录',
            defaultPath: app.getPath('desktop'),
            properties: ['openDirectory', 'createDirectory', 'promptToCreate']
        })
    })
}

app.whenReady().then(() => {
    createWindow()
    createTray()
    registerHandler()
    initFrpc()
    Menu.setApplicationMenu(null)
})
