import { fileURLToPath } from 'node:url'
import path from 'node:path'
export const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.APP_ROOT = path.join(__dirname, '..')
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST
export const APPLICATION_ICON_DIST = path.join(process.env.VITE_PUBLIC, 'favicon.ico')

export function getIconPath(file: string) {
    return path.join(process.env.VITE_PUBLIC,  file)
}

export const APPLICATION_TITLE = 'Chmlfrp Launcher'