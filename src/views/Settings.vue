<template>
    <div class="settings-container" >
        <el-scrollbar>
            <el-form :model="settings" style="box-sizing: border-box;padding: 40px;" label-width="auto">
                <el-form-item label="隧道用户自启动">
                    <el-switch v-model="autoEnable" @change="onAutoEnableChanged" />
                </el-form-item>
                <el-form-item label="开机(登录)自启">
                    <el-switch v-model="settings.openAtLogin" @change="onOpenAtLoginChanged" />
                </el-form-item>
                <el-form-item label="显示系统通知">
                    <el-switch v-model="settings.notification" @change="onNotificationChanged" />
                </el-form-item>
                <el-form-item label="保持窗口状态">
                    <el-switch v-model="settings.windowState" @change="onWindowStateChanged" />
                </el-form-item>
                <el-form-item label="关闭时退出程序">
                    <el-switch v-model="settings.exitOnClose" @change="onExitOnCloseChanged" />
                </el-form-item>
                <el-form-item label="FRPC实例">
                    <el-col :span="18">
                        <el-select v-model="settings.frpcPath" placeholder="请选择适合运行的实例" @change="onFrpcPathChanged">
                            <el-option :disabled="deleteEnter[item]" v-for="item in settings.frpcPaths" :key="item"
                                :value="item" :label="item">
                                <div style="display: flex; justify-content: space-between;">
                                    <span>{{ item }}</span>
                                    <span @mouse="deleteEnter[item] = true" @mouseover="deleteEnter[item] = false"
                                        @click.native="onDeleteFrpcPath(item)">
                                        <el-icon :size="20"><i-ep-close /></el-icon>
                                    </span>
                                </div>
                            </el-option>
                        </el-select>
                    </el-col>
                    <el-col :span="6" class="text-center">
                        <el-button type="primary" plain @click="chooseFrpcFile">选择执行文件</el-button>
                    </el-col>
                </el-form-item>

                <el-form-item label="FRPC遍历路径">
                    <el-col :span="18">
                        <el-input v-model="settings.frpcFindPath" :readonly="true"></el-input>
                    </el-col>
                    <el-col :span="6" class="text-center">
                        <el-button type="primary" plain @click="chooseFrpcFindPath">选择目录</el-button>
                    </el-col>
                </el-form-item>

                <el-form-item label="用户数据目录">
                    <el-col :span="18">
                        <el-input v-model="settings.profilePath" :readonly="true"></el-input>
                    </el-col>
                    <el-col :span="6" class="text-center">
                        <el-button type="primary" plain @click="chooseProfilePath">选择目录</el-button>
                    </el-col>
                </el-form-item>

                <el-form-item label="日志刷新间隔时间">
                    <el-input-number v-model="settings.logInterval" :min="100" :max="5000" @blur="onLogIntervalBlur" />
                </el-form-item>

                <el-form-item label="下载FRP">
                    <el-col :span="18">
                        <el-select v-model="dwFileName" placeholder="请选择需要下载的实例">
                            <template v-for="item in Object.keys(systemEntity)" :key="item">
                                <el-option :disabled="downloadOptionDisabled(item, subItem)"
                                    v-for="subItem in systemEntity[item]" :key="subItem" :value="subItem"
                                    :label="subItem.route">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>{{ subItem.route }}</span>
                                        <span>{{ subItem.architecture }}</span>
                                    </div>
                                </el-option>
                            </template>
                        </el-select>
                    </el-col>
                    <el-col :span="6" class="text-center">
                        <el-button type="primary" plain @click="doDownload">下载</el-button>
                    </el-col>
                </el-form-item>




                <!-- <el-form-item label="FRP安装位置">
                <el-col :span="18">
                    <el-input>
                    </el-input v-model="settings.downloadLocation">
                </el-col>
                <el-col :span="6" class="text-center">
                    <el-button type="primary" plain>选择文件夹</el-button>
                </el-col>
            </el-form-item>


            <el-form-item label="FRP下载位置">
                <el-col :span="18">
                    <el-input>
                    </el-input v-model="settings.installLocation">
                </el-col>
                <el-col :span="6" class="text-center">
                    <el-button type="primary" plain>选择文件夹</el-button>
                </el-col>
            </el-form-item> -->



            </el-form>
        </el-scrollbar>
    </div>
</template>

<script setup lang="ts">
// @ts-nocheck

import { chmlfrpDownload } from '@/api';
import { onMounted, reactive, ref } from 'vue';
const userToken = ref('')
const autoEnable = ref(false)
const dwFileName = ref('')
const deleteEnter = ref({

})

interface Settings {
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

interface SystemEntity {
    windows: ArchEntity[];
    linux: ArchEntity[];
    freebsd: ArchEntity[];
    darwin: ArchEntity[];
}

interface ArchEntity {
    architecture: string;
    route: string;
}

function testHover() {
    console.log('testHover');

}


const settings: Settings = reactive({
    openAtLogin: false,
    notification: false,
    windowState: false,
    exitOnClose: false,
    logInterval: 200,
    frpcPaths: [],
    frpcPath: '',
    frpcFindPath: '',
    profilePath: '',
    userToken: '',
})



let systemEntity: SystemEntity = reactive({
    windows: [],
    linux: [],
    freebsd: [],
    darwin: []
})

const compatibilities = {
    'x64': ['amd64', '386'],
    'ia32': ['386'],
    'arm64': ['arm', 'arm64'],
    'arm': ['arm'],
    'mips': ['mips', 'mips64'],
    'mipsel': ['mipsle', 'mips64le'],
};


const platforms = {
    'darwin': 'darwin',
    'freebsd': 'freebsd',
    'linux': 'linux',
    'win32': 'windows'
}

const currentPlatform = ref({
    platform: 'win32',
    arch: 'x64'
})

onMounted(() => {
    chmlfrpDownload().then(data => {
        if (data.code === 200) {
            Object.assign(systemEntity, data.system)
        } else {
            toast('error', '获取下载信息失败!')
        }
    })

    window.ipcRenderer.invoke('system-platform').then(data => {
        currentPlatform.value = data
    })

    window.ipcRenderer.invoke('settings-read').then(data => {
        Object.assign(settings, data)
    })

    window.ipcRenderer.invoke('token-get').then(ret => {
        userToken.value = ret

        window.ipcRenderer.invoke('frpc-configuration', ret).then(data => {
            autoEnable.value = data['autoEnable']
        })
    })


})

function onAutoEnableChanged() {
    window.ipcRenderer.invoke('frpc-auto-enable-toggle', userToken.value).then(data => {
        if (data.code === 200) {
            autoEnable.value = data.configuration['autoEnable']
            toast('success', `${autoEnable.value ? '打开' : '关闭'}自启成功`)
        } else {
            toast('error', data.msg)
        }
    })
}

function onOpenAtLoginChanged() {
    window.ipcRenderer.invoke('settings-open-at-login').then(ret => {
        Object.assign(settings, ret.settings)
        if (ret.code === 200) {
            toast('success', `${settings.openAtLogin ? '打开' : '关闭'}登录自启成功!`)
        } else {
            toast('error', `${settings.openAtLogin ? '打开' : '关闭'}登录自启失败! 原因：${ret.msg}`)
        }
    })
}

function onNotificationChanged() {
    // todo
    window.ipcRenderer.invoke('settings-notification').then(ret => {
        Object.assign(settings, ret.settings)
        if (ret.code === 200) {
            toast('success', `${settings.notification ? '打开' : '关闭'}通知成功!`)
        } else {
            toast('error', `${settings.notification ? '打开' : '关闭'}通知失败! 原因：${ret.msg}`)
        }
    })
}

function onWindowStateChanged() {
    // todo
    window.ipcRenderer.invoke('settings-window-state').then(ret => {
        Object.assign(settings, ret.settings)
        if (ret.code === 200) {
            toast('success', `${settings.windowState ? '打开' : '关闭'}窗口状态成功!`)
        } else {
            toast('error', `${settings.windowState ? '打开' : '关闭'}窗口状态失败! 原因：${ret.msg}`)
        }
    })
}

function onExitOnCloseChanged() {
    // todo
    window.ipcRenderer.invoke('settings-exit-on-close').then(ret => {
        Object.assign(settings, ret.settings)
        if (ret.code === 200) {
            toast('success', `${settings.exitOnClose ? '打开' : '关闭'}成功!`)
        } else {
            toast('error', `${settings.exitOnClose ? '打开' : '关闭'}失败! 原因：${ret.msg}`)
        }
    })
}

function onFrpcPathChanged() {
    window.ipcRenderer.invoke('settings-frpc-path', settings.frpcPath).then(ret => {
        Object.assign(settings, ret.settings)
        if (ret.code === 200) {
            toast('success', `更换FRPC实例为${settings.frpcPath}成功!`)
        } else {
            toast('error', `${ret.msg}`)
        }
    })
}

function onLogIntervalBlur() {
    window.ipcRenderer.invoke('settings-log-interval', settings.logInterval).then(ret => {
        Object.assign(settings, ret.settings)
        if (ret.code === 200) {
            toast('success', `更新日志间隔时间${settings.logInterval}成功!`)
        } else {
            toast('error', `${ret.msg}`)
        }
    })

}

function chooseFrpcFile() {
    window.ipcRenderer.invoke('choose-single-file').then(ret => {
        if (ret.canceled) {
            toast('wraning', '取消了')
        } else {
            const exists = settings.frpcPaths.includes(ret.filePaths[0])

            if (exists) {
                toast('wraning', '未能通过浏览器本地的检查!')
            } else {
                settings.frpcPaths.push(ret.filePaths[0])
                const data = settings.frpcPaths.filter(() => true)
                window.ipcRenderer.invoke('settings-frpc-paths', data).then(ret => {
                    Object.assign(settings, ret.settings)
                    if (ret.code === 200) {
                        toast('success', `添加FRPC实例路径成功!`)
                    } else {
                        toast('error', `${ret.msg}`)
                    }
                })
            }
        }
    })
}

function chooseFrpcFindPath() {
    window.ipcRenderer.invoke('choose-single-directory').then(ret => {
        console.log(ret);
        if (ret.canceled) {
            toast('wraning', '取消了')
        } else {
            window.ipcRenderer.invoke('settings-frpc-find-path', ret.filePaths[0]).then(ret => {
                Object.assign(settings, ret.settings)
                if (ret.code === 200) {
                    toast('success', `遍历FRPC目录成功!`)
                } else {
                    toast('error', `${ret.msg}`)
                }
            })
        }
    })
}

function chooseProfilePath() {


    ElMessageBox.confirm(
        `你真的要更换用户数据目录(用户配置和日志)吗?\n
        我们不建议更换这个目录`,
        '警告',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(() => {

        window.ipcRenderer.invoke('choose-single-directory').then(ret => {
        console.log(ret);
        if (ret.canceled) {
            toast('wraning', '取消了')
        } else {
            const filePath = ret.filePaths[0]
            window.ipcRenderer.invoke('settings-profile-path', filePath).then(ret => {
                Object.assign(settings, ret.settings)
                if (ret.code === 200) {
                    toast('success', `更换用户数据目录到${filePath}成功!`)
                }else {
                    toast('error', ret.msg)
                }
            })

            
        }
    })
    }).catch(() => {
        toast('info', '更换取消了')
    })

    
}

function onDeleteFrpcPath(item: string) {
    ElMessageBox.confirm(
        `你确定要移除此FRPC实例${item}吗(非物理删除)?`,
        '警告',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(() => {

        const data = settings.frpcPaths.filter((innerItem) => {
            return item != innerItem
        })
        window.ipcRenderer.invoke('settings-frpc-paths', data).then(ret => {
            Object.assign(settings, ret.settings)
            if (ret.code === 200) {
                toast('success', `删除RPC实例路径成功!`)
            } else {
                toast('error', `${ret.msg}`)
            }
        })
    }).catch(() => {
        toast('info', '移除取消')
    })
}


function downloadOptionDisabled(platform, downloadOptions) {
    const realPlatform = platforms[currentPlatform.value.platform]

    if (platform !== realPlatform) {
        return true
    }
    const mappingArchs = compatibilities[currentPlatform.value.arch]
    if (mappingArchs.includes(downloadOptions.architecture)) {
        return false
    }
    return true
}


function doDownload() {
    const downloadURL = `https://chmlfrp.cn/dw/${dwFileName.value.route}`
    console.log(downloadURL);

    window.ipcRenderer.invoke('download-file', downloadURL)

}



function toast(type: string, message: string) {
    ElMessage({
        message: message,
        type: type,
    })
}


</script>

<style scoped>
.settings-container {
    width: 100%;
    height: 100%;
}

.settings-container .el-scrollbar {
    width: 100%;
    height: 100%;
}
.settings-container .el-button {
    width: 100%;
    box-sizing: border-box;
    margin: 0 10px;
}
</style>