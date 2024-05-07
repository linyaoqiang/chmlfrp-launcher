<template>

    <el-scrollbar class="home-container" v-loading="loading">
        <h4>{{ HELLO_WORLD }}</h4>
        <div class="home-content" >
            <div class="info-wrapper">
                <el-card shadow="always">
                    <el-descriptions title="用户信息"  direction="vertical">
                        <el-descriptions-item label="用户名">{{ userInfo.username }}</el-descriptions-item>
                        <el-descriptions-item label="隧道数">{{ userInfo.tunnelstate + '/' + userInfo.tunnel
                            }}</el-descriptions-item>
                        <el-descriptions-item label="带宽限制">
                            国内:{{ userInfo.bandwidth }}m | 国外:{{ userInfo.bandwidth * 4 }}m
                        </el-descriptions-item>

                        <el-descriptions-item label="用户邮箱">
                            {{ userInfo.email }}
                        </el-descriptions-item>
                        <el-descriptions-item label="用户标签">
                            <el-tag size="small">{{ userInfo.realname }}</el-tag>
                            &nbsp;
                            <el-tag size="small">{{ userInfo.usergroup }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="用户密钥">
                            <el-tag size="small" v-if="!showToken" @click="showToken = !showToken">
                                <el-icon><i-ep-view /></el-icon>点击查看用户密钥
                            </el-tag>
                            <el-tag size="small" v-else @click="copyTokenToClipboard">{{ userToken }}</el-tag>
                        </el-descriptions-item>
                    </el-descriptions>
                </el-card>
                <el-button style="width: 100%; margin: 10px 0 0 0;" type="primary" @click="doLogout">退出登录</el-button>
                <el-button style="width: 100%; margin: 10px 0 0 0;" type="primary" @click="reLogin">重新登录刷新令牌</el-button>
            </div>
            <div class="launcher-about-wrapper">
                <el-card shadow="always">
                    <el-image src="/favicon.ico"></el-image>
                    <p class="version">{{ packageData.name }} v{{ packageData.version }}</p>
                    <p class="description">{{ packageData.description }}</p>


                    <div class="total">
                        <span>隧道数: {{ sinfoData['tunnel_count'] }}</span>
                        <span>用户数: {{ sinfoData['user_count'] }}</span>
                        <span>节点数: {{ sinfoData['node_count'] }}</span>
                    </div>

                    <div class="line">

                    </div>


                    <div class="friends" v-if="sinfoData.blogroll">
                        <h4> 友情连接 </h4>
                        <div class="friends-container">
                            <a :key="index" v-for="(item, index) in Object.keys(sinfoData.blogroll)"
                                :href="sinfoData.blogroll[item]" target="_blank"> {{ item }}</a>
                        </div>
                    </div>

                </el-card>


            </div>

        </div>
    </el-scrollbar>
</template>

<script setup lang="ts">
// @ts-nocheck
import { chmlfrpFlowZong, chmlfrpLogin, chmlfrpSinfo, chmlfrpUserInfo, uapisSay } from '@/api';
import { ref, onMounted, reactive } from 'vue'
import { UserInfo } from '@/api/types'
import { router } from '@/router'
const HELLO_WORLD = ref('')
const userToken = ref('')
const userInfo = ref({})
const loading = ref(true)
const showToken = ref(false)
const packageData = ref({})
const sinfoData = ref({})
const chartDoc = ref({})

onMounted(async () => {
    try {
        userToken.value = await window.ipcRenderer.invoke('token-get')
        const sayPro = uapisSay()
        const sinfoPro = chmlfrpSinfo()
        const userInfoPro = chmlfrpUserInfo(userToken.value)
        const packDataPro = window.ipcRenderer.invoke('package-data')

        sinfoData.value = await sinfoPro
        userInfo.value = await userInfoPro
        packageData.value = await packDataPro
        HELLO_WORLD.value = await sayPro

        loading.value = false
    } catch (error) {
        log.error(error)
    }
})

function copyTokenToClipboard() {
    navigator.clipboard.writeText(userToken.value).then(() => {
        toast('success', '拷贝成功')
    }).catch(reason => {
        toast('error', `拷贝失败:${reason}`)
    }).finally(() => {
        showToken.value = false
    })

}

function toast(type: string, message: string) {
    ElMessage({
        message: message,
        type: type,
    })
}

function doLogout() {
    ElMessageBox.confirm(
        `你确定要退出登录吗?`,
        '警告',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(() => {

        window.ipcRenderer.invoke('token-clear').then(ret => {
            if (ret.code === 200) {
                toast('success', '退出登录成功!')
                router.replace({
                    path: '/login'
                })
            } else {
                toast('error', ret.msg)
            }
        })
    }).catch(() => {
        toast('info', '取消退出登录')
    })
}

function reLogin() {
    doReLogin()
}

async function doReLogin() {
    const account: {username:string, password:string} = await window.ipcRenderer.invoke('settings-get-account')
    const data = await chmlfrpLogin(account.username, account.password)

    if (data.error) {
        toast('error', data.error)
    }else {
        const ret = await window.ipcRenderer.invoke('token-save', data.token)

        if (ret.code === 200) {
            toast('success', '重新登录成功!')
            setTimeout(()=>{
                window.location.href = '/'
            }, 1000)
            
        }else {
            toast('error', '未知原因!')
        }
    }
}


</script>

<style scoped>
.home-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    box-sizing: border-box;
    padding: 10px;

    .home-content {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;

        >div {
            width: 49%;
        }

        @media screen and (max-width: 768px) {
            >div {
                width: 99%;
            }
        }

        .launcher-about-wrapper p {
            margin: 5px;
        }

        .launcher-about-wrapper .el-image {
            width: 100px;
        }

        .launcher-about-wrapper .version {
            font-size: 24px;
        }

        .launcher-about-wrapper .description {
            font-size: 16px;
            color: #CCC;
        }

        .launcher-about-wrapper .line {
            width: 100%;
            height: 1px;
            background-color: black;
            margin: 20px 0;
        }

        .launcher-about-wrapper .total {
            display: flex;
            justify-content: space-between;
            align-items: center
        }

        .launcher-about-wrapper .total span {
            margin: 5px;
        }

        .friends-container {
            display: flex;
            justify-content: space-between;
            align-items: center
        }

        .friends-container a {
            font-size: 12px;
        }
    }


}
</style>