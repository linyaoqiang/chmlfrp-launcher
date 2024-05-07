import { spawn, ChildProcess,exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { getToken } from './token'
import { settings, saveSettings, setFrpcFindPath, confidentialityLog } from './settings'
import { notifiAndLog } from './notification'

export interface FrpcConfiguration {
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
        notifiAndLog('debug', `读取用户配置文件${configuration}失败:${err}`)
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

    if (!childProcess) {
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
            frpResult.code = 500
            frpResult.msg = `关闭FRPC进程失败!`
        }
    }

    // 保存到文件中
    saveFrpcConfiguration(token, configuration)
    notifiAndLog('info', frpResult.msg)
    return frpResult
}


export function executeText(token: string, tunnelId: string, frpcPath: string = settings.frpcPath) {
    return `${frpcPath} -u ${token} -p ${tunnelId}`
}



function openProcess(token: string, tunnelId: string, frpPath: string = settings.frpcPath): boolean {

    try {
        let processFlag = `${token}@${tunnelId}`
        const outPath = path.resolve(profilePath, processFlag + '.log')
        // 启动子进程
        const child = spawn(frpPath, ['-u', token, '-p', tunnelId]);

        // 捕获标准输出
        child.stdout.on('data', (data) => {
            if (settings.logConfidentiality === 'writing') {
                data = confidentialityLog(data)
            }
            fs.appendFile(outPath, data, err => {
                if (err) {
                    notifiAndLog('debug', `写入[${data}]到${outPath}文件失败 [${err}]`)
                } else {
                    notifiAndLog('debug', `写入[${data}]到${outPath}文件成功`)
                }
            })
        });


        // 捕获标准错误输出
        child.stderr.on('data', (data) => {
            if (settings.logConfidentiality === 'writing') {
                data = confidentialityLog(data)
            }
            fs.appendFile(outPath, data, err => {
                if (err) {
                    notifiAndLog('debug', `写入[${data}]到${outPath}文件失败 [${err}]`)
                } else {
                    notifiAndLog('debug', `写入[${data}]到${outPath}文件成功`)
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
                    notifiAndLog('debug', `写入[${exitText}]到${outPath}文件失败 [${err}]`)
                } else {
                    notifiAndLog('debug', `写入[${exitText}]到${outPath}文件成功`)
                }
            })
            closeProcess(token, tunnelId)
        });

        childProcessList[processFlag] = child
        notifiAndLog('verbose', `创建进程[${child.pid}]-${processFlag}成功!`)
        return true
    } catch (err) {
        notifiAndLog('error', `创建FRP进程时发生错误! [${err}]`)
        return false
    }
}


function closeProcess(token: string, tunnelId: string) {
    let frpcConfiguration = getFrpcConfiguration(token)
    let processFlag = `${token}@${tunnelId}`
    notifiAndLog('verbose', `关闭进程[${childProcessList[processFlag].pid}]-${processFlag}成功!`)
    delete childProcessList[processFlag]
    frpcConfiguration[tunnelId] = false
    saveFrpcConfiguration(token, frpcConfiguration)

}





function saveFrpcConfiguration(token: string, processData: object) {
    const configurationPath = path.resolve(profilePath, token + '.json')
    fs.writeFile(configurationPath, JSON.stringify(processData), err => {
        if (err) {
            notifiAndLog('error', `写入${processData}到文件${configurationPath}失败 [${err}]`)
        } else {
            notifiAndLog('debug', `写入${configurationPath}成功`)
        }
    });
}

export function getFrpcLog(token: string, tunnelId: string) {
    let processFlag = `${token}@${tunnelId}`
    const filePath = path.resolve(profilePath, processFlag + '.log')
    let logData = ''
    try {
        logData = fs.readFileSync(filePath).toString()
        if (settings.logConfidentiality === 'reading' || settings.logConfidentiality === 'writing') {
            logData = confidentialityLog(logData)
        }
    } catch (err) {
        notifiAndLog('error', `读取文件${filePath}失败 [${err}]`)
    }

    return logData
}

export function clearFrpcLog(token: string, tunnelId: string) {
    let processFlag = `${token}@${tunnelId}`
    const filePath = path.resolve(profilePath, processFlag + '.log')
    const ret = {
        code: 200,
        msg: '操作成功',
    }

    try {
        fs.unlinkSync(filePath)
    } catch (err) {
        ret.code = 500
        ret.msg = `清除文件${filePath}时发生错误![${err}]`
        console.error(ret.msg)

    }
    notifiAndLog('info', ret.msg)
    return ret
}


export function toggleAutoEnable(userToken: string): FrpcResult {
    const frpcConfiguration = getFrpcConfiguration(userToken)
    frpcConfiguration.autoEnable = !frpcConfiguration.autoEnable
    const msg = `${frpcConfiguration.autoEnable ? '打开' : '关闭'}自启动成功!`
    saveFrpcConfiguration(userToken, frpcConfiguration)
    notifiAndLog('info', msg)
    return {
        code: 200,
        msg,
        configuration: frpcConfiguration
    }
}


export async function initFrpc(): Promise<boolean> {
    if (settings.frpcPaths.length === 0) {
        Object.assign(settings, (await setFrpcFindPath(settings.frpcFindPath)).settings)
    }

    if (!settings.frpcPath) {

        if (settings.frpcPaths.length === 0) {
            notifiAndLog('error', '无法找到可以使用FRP实例!!!')
            return false
        }

        settings.frpcPath = settings.frpcPaths[0]
        saveSettings()
        reProfilePath()
    }


    const userToken = getToken()
    if (!userToken) {
        notifiAndLog('info', '用户未登录、无法完成初始化!!!')
        return false
    }



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
                    delete frpcConfiguration[item]
                    notifiAndLog('error', `初始化时抛出错误:${frpcConfiguration[item]} 已经重置其状态`)
                }
            }
        })
    }

    saveFrpcConfiguration(userToken, frpcConfiguration)

    return true
}

export function reProfilePath() {
    profilePath = settings.profilePath
    if (!fs.existsSync(profilePath)) {
        fs.mkdirSync(profilePath)
    }
}

export function execPromise(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error)
            } else {
                if (stdout) {
                    resolve(stdout)
                } else {
                    resolve(stderr)
                }
            }
        })
    })
}

export function getExeData(exeTexts: string[]) {
    const data: string[][] = []
    exeTexts.forEach(item => {
        data.push(item.split(/\s+/))
    })

    return data
}

export function findFromPid(exeData: string[][], pid: string): string[] {
    return exeData.find(item => {
        if (item[1] === pid) {
            return true
        }

        return false
    }) as string[]
}

export async function systemProcessinformation(): Promise<string[][]> {

    if (process.platform != 'win32') {
        return []
    }

    const processes: string[][] = []
    const ret = await execPromise('netstat -ano')
    const texts: string[] = ret.split('\r\n')
    const exeRet = await execPromise('tasklist')
    const exeTexts = exeRet.split('\r\n')
    texts.splice(0, 2)
    exeTexts.splice(0, 2)
    const exeTextData = getExeData(exeTexts)

    for (let i = 0; i < texts.length; i++) {
        const proInfo = texts[i].split(/\s+/)
        if (proInfo[1] === 'TCP' && proInfo[4] === 'LISTENING') {
            proInfo.splice(4, 1)
            proInfo.splice(3, 1)
        } else if (proInfo[1] === 'UDP') {
            proInfo.splice(3, 1)
        } else {
            continue
        }
        const index = proInfo[2].lastIndexOf(':')
        const netAndPort = proInfo[2]
        proInfo.splice(2, 1, netAndPort.substring(0, index), netAndPort.substring(index + 1))
        const exeInfo = findFromPid(exeTextData, proInfo[4])
        proInfo[0] = exeInfo[0]
        processes.push(proInfo)
    }

    return processes
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