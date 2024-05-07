import { app, nativeImage, NativeImage, Notification } from 'electron'
import { confidentialityLog, settings } from "./settings"
import { APPLICATION_TITLE, APPLICATION_ICON_DIST } from './constant'
import log, { LevelOption } from 'electron-log'

let icon: NativeImage
export function notifiAndLog(type: LevelOption, body: string, title: string = APPLICATION_TITLE, notification = settings.notification) {


    if (!app.isPackaged) {
        app.setAppUserModelId('Chmlfrp Launcher')
    }

    if (!icon) {
        icon = nativeImage.createFromPath(APPLICATION_ICON_DIST)
    }

   


    if (notification) {
        let next = notifiLevelNum(notification) >= notifiLevelNum(type)

        if (next) {
            new Notification({ body, title, icon }).show()
        }
    }

    if (settings.logConfidentiality === 'writing') {
        body = confidentialityLog(body)
    }


    if (type) {
        log[type](body)
    }



}

function notifiLevelNum(type: LevelOption) {
    let num = 0
    switch (type) {
        case 'silly':
            num = 5
            break
        case 'debug':
            num = 4
            break
        case 'info':
            num = 3
            break
        case 'verbose':
            num = 2
            break
        case 'warn':
            num = 1
            break
        case 'error':
            num = 0
            break
    }


    return num
}