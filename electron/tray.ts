import { app, nativeImage, Tray, Menu, BrowserWindow } from 'electron'
import { APPLICATION_ICON_DIST } from './constant'
import { toLocation, createWindow } from './window'


const contextMenu = Menu.buildFromTemplate([
    {

        label: '隧道管理',
        click: () => {
            const windows: BrowserWindow[] = BrowserWindow.getAllWindows()
            if (windows.length >= 1) {
                toLocation(windows[0], '/tunnel')
                windows[0].show()
            } else {
                const window = createWindow()
                toLocation(window, '/tunnel')
                window.show()
            }
        }
    },
    {
        label: '设置管理',
        click: () => {
            const windows: BrowserWindow[] = BrowserWindow.getAllWindows()
            if (windows.length >= 1) {
                toLocation(windows[0], '/settings')
                windows[0].show()
            } else {
                const window = createWindow()
                toLocation(window, '/settings')
                window.show()
            }
        }
    },
    {
        label: '创建隧道',
        click: () => {
            const windows: BrowserWindow[] = BrowserWindow.getAllWindows()
            if (windows.length >= 1) {
                toLocation(windows[0], '/tunnel/create')
                windows[0].show()
            } else {
                const window = createWindow()
                toLocation(window, '/tunnel/create')
                window.show()
            }
        }
    },
    {
        label: '退出程序',
        click: () => {
            app.quit()
        }
    }
])


export function createTray():Tray {
    const icon = nativeImage.createFromPath(APPLICATION_ICON_DIST)
    const tray = new Tray(icon)
    tray.setContextMenu(contextMenu)
    tray.addListener('click', () => {
        const windows: BrowserWindow[] = BrowserWindow.getAllWindows()
        if (windows.length >= 1) {
            windows[0].show()
        } else {
            const window = createWindow()
            window.show()
        }
    })

    return tray
}
