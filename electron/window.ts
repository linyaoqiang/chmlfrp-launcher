import { BrowserWindow } from 'electron'
import path from 'node:path'
import WindowState from 'electron-win-state';

import { VITE_DEV_SERVER_URL, RENDERER_DIST, APPLICATION_ICON_DIST, __dirname } from "./constant";
import { readSettings } from './settings';

let windowState: WindowState<BrowserWindow> | null = null

export function manage() {
    const window = BrowserWindow.getAllWindows()[0]
    windowState?.manage(window)
}

export function unmanage() {
    windowState?.unmanage()
}

export function createWindow() {

    windowState = new WindowState({
        defaultWidth: 600,
        defaultHeight: 400
    })

    let win: BrowserWindow | null = null

    if (readSettings().windowState) {
        win = new BrowserWindow({
            icon: APPLICATION_ICON_DIST,
            minWidth: 600,
            minHeight: 400,
            show: false,
            ...windowState.state,
            webPreferences: {
                preload: path.join(__dirname, 'preload.mjs')
            },
        })

        manage()

    } else {
        win = new BrowserWindow({
            icon: APPLICATION_ICON_DIST,
            minWidth: 600,
            minHeight: 400,
            show: false,
            webPreferences: {
                preload: path.join(__dirname, 'preload.mjs')
            },
        })
    }

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(RENDERER_DIST, 'index.html'))
    }

    win.webContents.send('win-resize', win.getSize())

    win.on('resize', () => {
        win?.webContents.send('win-resize', win.getSize())
    })


    if (process.platform === 'win32') {
        win.once("ready-to-show", () => {
            if (process.argv.indexOf("--openAsHidden") < 0)
                win.show();
        })
    } else {
        win.once('ready-to-show', () => {
            win.show()
        })
    }


    // win.webContents.session.on('will-download', (_event, item) => {
    //     console.log(item.getURL());
        
    //     item.on('updated', (_event, state) => {
    //         if (state === 'progressing') {
    //             console.log(`${item.getReceivedBytes()} / ${item.getTotalBytes()}`);
                
    //         }
    //     })
        
    // })

    // win.webContents.openDevTools()

    // win.setMenu(null)

    return win
}

export function toLocation(win: BrowserWindow, uri: string) {
    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL + '/#' + uri)
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(RENDERER_DIST, 'index.html'), {
            hash: uri
        })
    }
}