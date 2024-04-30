import {app, Notification } from 'electron'
import { readSettings } from "./settings"
const TITLE = "ChmlfrpLaucher"
export function notification(body: string, title: string = TITLE, display: boolean = readSettings().notification) {
    if (!display) {
        return display
    }

    if(!app.isPackaged) {
        app.setAppUserModelId(app.getName())
    }
    new Notification({
        title,
        body
    }).show()
    

    return display
}