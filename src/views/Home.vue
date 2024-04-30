<template>
    <el-scrollbar class="home-container">
        <h4>{{ HELLO_WORLD }}</h4>
        <div class="home-main">
            <div class="home-content">
                <div class="info-wrapper">
                    <el-card shadow="always">
                        <el-descriptions title="用户信息">
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
                    <el-button style="width: 100%; margin: 20px 0;" type="primary" @click="doLogout">退出登录</el-button>
                </div>

                <div class="flow-zong-wrapper">
                    <el-card shadow="always">
                        <div id="flow-zong-echarts"></div>
                    </el-card>
                </div>


                <div class="launcher-about-wrapper">
                    <el-card shadow="always">
                        <el-image src="https://chmlfrp.cn/favicon.ico"></el-image>
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
        </div>

    </el-scrollbar>
</template>

<script setup lang="ts">
// @ts-nocheck
import { chmlfrpFlowZong, chmlfrpSinfo, chmlfrpUserInfo, uapisSay } from '@/api';
import { ref, onMounted, reactive } from 'vue';
import { UserInfo } from '@/api/types'
import * as echarts from 'echarts'
import { router } from '@/router';
const HELLO_WORLD = ref('')
const userToken = ref('')
const userInfo = ref({})
const showToken = ref(false)
const flowZongData = ref(null)
const packageData = ref({})
const sinfoData = ref({})
const chartDoc = ref({})

onMounted(() => {
    uapisSay().then(data => {
        HELLO_WORLD.value = data.data
    })

    window.ipcRenderer.invoke('token-get').then((ret) => {
        userToken.value = ret
        chmlfrpUserInfo(ret).then(data => {
            userInfo.value = data
        })

        chmlfrpFlowZong(ret).then(data => {
            if (data.status != 'success') {
                return
            }
            flowZongData.value = data.data

            let chartDoc = echarts.init(document.getElementById('flow-zong-echarts'))

            let timeData = []
            let inData = []
            let outData = []

            flowZongData.value.forEach((item, _index) => {
                timeData.push(item.time)
                inData.push(item['traffic_in'])
                outData.push(item['traffic_out'])
            })
            chartDoc.setOption({
                title: { text: '流量消耗' },
                legend: {
                    orient: 'horizontal',
                    right: 50,
                    top: 'top'

                },
                toolbox: {

                    feature: {
                        saveAsImage: {}
                    }
                },
                xAxis: {
                    data: timeData
                },
                yAxis: {
                    type: 'value'
                },
                series: [
                    {
                        name: '入口流量',
                        type: 'line',
                        stack: 'Total',
                        data: inData
                    },
                    {
                        name: '出口流量',
                        type: 'line',
                        stack: 'Total',
                        data: outData
                    },
                ]
            });

        })
    })

    window.ipcRenderer.invoke('package-data').then((ret) => {
        packageData.value = ret
    })

    chmlfrpSinfo().then(data => {
        sinfoData.value = data
    })


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
            }else {
                toast('error', ret.msg)
            }
        })



    }).catch(() => {
        toast('info', '取消退出登录')
    })
}


</script>

<style scoped>
.home-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    box-sizing: border-box;
    padding: 10px;

    .home-main {
        width: 100%;
        display: flex;
        justify-content: center;
    }


    .home-content {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;

        >div {
            width: 33%;
        }

        @media screen and (max-width: 1080px) {
            >div {
                width: 49%;
            }
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

#flow-zong-echarts {
    width: 100%;
    height: 350px;
}
</style>