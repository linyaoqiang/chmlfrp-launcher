import { spawn, ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import { getToken } from './token'
import { readSettings, saveSettings, setFrpcFindPath } from './settings'
import { notification } from './notification'

interface FrpcConfiguration {
    [key: string]: boolean,
    autoEnable: boolean
}


interface FrpcProcessList {
    [key: string]: ChildProcess
}


interface FrpcResult {
    code: number,
    msg: string,
    configuration: FrpcConfiguration | null
}

const childProcessList: FrpcProcessList = {}

let profilePath = ''

/**
* {
*  '18999': true,
*  '18222': false,
*  '20000': false,
*  'autoEnable' true
* }
*/
export function getFrpcConfiguration(token: string): FrpcConfiguration {
    const configurationPath = path.resolve(profilePath, token + '.json')
    let configuration: FrpcConfiguration = { autoEnable: false }
    try {
        configuration = JSON.parse(fs.readFileSync(configurationPath, 'utf-8'));
    } catch (err) {
        console.log(`读取用户配置文件${configuration}失败:`);
    }
    return configuration;
}



export function toggleFrpc(token: string, tunnelId: string) {
    let configuration = getFrpcConfiguration(token)
    let processFlag = `${token}@${tunnelId}`
    let enabled = configuration[tunnelId]
    let childProcess = childProcessList[processFlag]

    let frpResult: FrpcResult = {
        code: 200,
        msg: '操作成功',
        configuration
    }

    if (!enabled && !childProcess) {
        configuration[tunnelId] = openProcess(token, tunnelId)
        if (!configuration[tunnelId]) {
            frpResult.code = 500
            frpResult.msg = '创建FRP进程失败、请检查配置是否正确!!!'

        }

    } else if (enabled && childProcess) {
        try {
            if (childProcess.kill()) {
                configuration[tunnelId] = false
            }
        } catch (err) {
            console.log(err);
            frpResult.code = 500
            frpResult.msg = `关闭FRPC进程失败!`
        }
    }

    // 保存到文件中
    saveFrpcConfiguration(token, configuration)
    notification(frpResult.msg)
    return frpResult
}



function openProcess(token: string, tunnelId: string, frpPath: string = readSettings().frpcPath): boolean {

    try {
        let processFlag = `${token}@${tunnelId}`
        const outPath = path.resolve(profilePath, processFlag + '.log')
        // const frpPath = 'C:\\Users\\20331\\Desktop\\frp\\frpc.exe'

        // 启动子进程
        const child = spawn(frpPath, ['-u', token, '-p', tunnelId]);

        // 捕获标准输出
        child.stdout.on('data', (data) => {
            console.log(`标准输出：\n${data}`)
            fs.appendFile(outPath, data, err => {
                if (err) {
                    console.log(`写入[${data}]到${outPath}文件失败`, err)
                    notification(`写入[${data}]到${outPath}文件失败 [${err}]`)
                } else {
                    console.error('写入成功')
                }
            })
        });


        // 捕获标准错误输出
        child.stderr.on('data', (data) => {
            console.error(`标准错误输出：\n${data}`)
            fs.appendFile(outPath, data, err => {
                if (err) {
                    console.log(`写入[${data}]到${outPath}文件失败`, err)
                    notification(`写入[${data}]到${outPath}文件失败 [${err}]`)
                } else {
                    console.error('写入成功')
                }
            })
        });

        // 注册子进程关闭事件
        child.on('close', (code) => {
            if (code == null) {
                code = 0
            }
            const exitText = `子进程退出码：${code}`
            fs.appendFile(outPath, exitText, err => {
                if (err) {
                    console.log(`写入[${exitText}]到${outPath}失败`, err)
                    notification(`写入[${exitText}]到${outPath}文件失败 [${err}]`)
                } else {
                    console.error('写入成功')
                }
            })
            closeProcess(token, tunnelId)
        });

        childProcessList[processFlag] = child
        notification(`创建进程[${child.pid}]-${processFlag}成功!`)
        return true
    } catch (err) {
        console.log('创建FRP进程时发生错误!', err)
        notification(`创建FRP进程时发生错误! [${err}]`)
        return false
    }
}


function closeProcess(token: string, tunnelId: string) {
    let frpcConfiguration = getFrpcConfiguration(token)
    let processFlag = `${token}@${tunnelId}`
    notification(`关闭进程[${childProcessList[processFlag].pid}]-${processFlag}成功!`)
    delete childProcessList[processFlag]
    frpcConfiguration[tunnelId] = false
    saveFrpcConfiguration(token, frpcConfiguration)

}





function saveFrpcConfiguration(token: string, processData: object) {
    const configurationPath = path.resolve(profilePath, token + '.json')
    fs.writeFile(configurationPath, JSON.stringify(processData), err => {
        if (err) {
            console.log(`写入${processData}到文件${configurationPath}失败`, err)
            notification(`写入${processData}到文件${configurationPath}失败 [${err}]`)
        } else {
            console.error(`写入${configurationPath}成功`)
        }
    });
}

export function getFrpcLog(token: string, tunnelId: string) {
    let processFlag = `${token}@${tunnelId}`
    const filePath = path.resolve(profilePath, processFlag + '.log')
    let logData = ''
    try {
        logData = fs.readFileSync(filePath).toString()
    } catch (err) {
        console.error(`读取文件${filePath}失败`, err)
        notification(`读取文件${filePath}失败 [${err}]`)
    }

    return logData
}

export function clearFrpcLog(token: string, tunnelId: string) {
    let processFlag = `${token}@${tunnelId}`
    const filePath = path.resolve(profilePath, processFlag + '.log')

    const ret = {
        code :200,
        msg: '操作成功',
    }
    
    try {
        fs.unlinkSync(filePath)
    }catch(err) {
        ret.code = 500
        ret.msg = `清除文件${filePath}时发生错误![${err}]`
        console.error(ret.msg)
        notification(ret.msg)
    }


    return ret
}


export function toggleAutoEnable(userToken: string): FrpcResult {
    const frpcConfiguration = getFrpcConfiguration(userToken)
    frpcConfiguration.autoEnable = !frpcConfiguration.autoEnable
    saveFrpcConfiguration(userToken, frpcConfiguration)

    return {
        code: 200,
        msg: '操作成功',
        configuration: frpcConfiguration
    }
}


export async function initFrpc(): Promise<boolean> {

    const settings = readSettings()
    if (settings.frpcPaths.length === 0) {
        Object.assign(settings, (await setFrpcFindPath(settings.frpcFindPath)).settings)
    }

    if (!settings.frpcPath) {

        if (settings.frpcPaths.length === 0) {
            notification('无法找到可以使用FRP实例!!!')
            return false
        }

        settings.frpcPath = settings.frpcPaths[0]
        saveSettings(settings)
    }


    const userToken = getToken()
    if (!userToken) {
        notification('用户未登录、无法完成初始化!!!')
        return false
    }

    reProfilePath()

    let frpcConfiguration = getFrpcConfiguration(userToken)
    let autoEnable = frpcConfiguration['autoEnable']

    if (!autoEnable) {
        Object.keys(frpcConfiguration).forEach(item => {
            frpcConfiguration[item] = false
        })
    } else {
        Object.keys(frpcConfiguration).forEach(item => {
            if (frpcConfiguration[item] && item != 'autoEnable') {
                if (!openProcess(userToken, item)) {
                    console.error(`开启${frpcConfiguration[item]}时出错,已重置其状态`);
                    delete frpcConfiguration[item]
                    notification(`初始化时抛出错误:${frpcConfiguration[item]} 已经重置其状态`)
                }
            }
        })
    }

    saveFrpcConfiguration(userToken, frpcConfiguration)

    return true
}

export function reProfilePath(){
    profilePath = readSettings().profilePath
}

export function hasChildProcess() {
    return Object.keys(childProcessList).length >= 1
}


export default {
    toggleFrpc,
    toggleAutoEnable,
    initFrpc,
    getFrpcLog,
    getFrpcConfiguration,
    reProfilePath
}