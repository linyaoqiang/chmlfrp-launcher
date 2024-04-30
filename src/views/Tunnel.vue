<template>
    <div class="tunnel-container" v-loading="tunnelDetailLoading">
        <el-scrollbar>
            <div class="tunnel-header">
                <el-card>
                    <div class="tunnel-header-content">
                        <span>隧道列表</span>
                        <el-button type="primary" @click="toCreate">添加隧道</el-button>
                    </div>
                </el-card>
            </div>



            <div class="tunnel-content" v-loading="pageLoading">
                <div class="tunnel-item" v-for="(item, index) in userTunnels" :key="index">
                    <el-card>
                        <div class="tunnel-flag">
                            <span>#{{ item.id }} | {{ item.name }}</span>
                            <div class="tunnel-flag-state"
                                :style="{ 'background-color': item.state === 'true' ? 'green' : '#ccc' }"></div>
                        </div>

                        <div class="tunnel-location">
                            <el-tag>{{ item.node }}</el-tag>
                            <el-switch @change="toggleFrp(item.id)" v-model="tunnelProcessInfoList[item.id]" />
                        </div>

                        <div class="tunnel-net">
                            连接地址：{{ item.ip }}
                        </div>

                        <div class="tunnel-create-time">
                            {{ item['uptime'] }}
                        </div>
                        <div class="tunnel-line"></div>
                        <div class="tunnel-data">
                            <span>
                                <el-icon><i-ep-sort-up /></el-icon>{{ item['today_traffic_in'] }}B
                            </span>
                            <span>
                                <el-icon><i-ep-sort-down /></el-icon>{{ item['today_traffic_out'] }}B
                            </span>
                            <span>连接数量{{ item['cur_conns'] }}</span>
                        </div>

                        <div class="tunnel-line"></div>
                        <div class="tunnel-operator">
                            <el-button type="primary" plain @click="toUpdate(item.id)">
                                <el-icon>
                                    <i-ep-edit />
                                </el-icon>
                                修改
                            </el-button>
                            <el-button type="primary" plain @click="openDetail(item.id)">
                                <el-icon>
                                    <i-ep-view />
                                </el-icon>
                                查看
                            </el-button>
                            <el-button type="primary" plain @click="openLog(item)">
                                <el-icon><i-ep-memo /></el-icon>
                                日志
                            </el-button>
                            <el-button type="danger" plain @click="openDelete(item)">
                                <el-icon><i-ep-delete /></el-icon>
                                删除
                            </el-button>
                        </div>
                    </el-card>
                </div>

            </div>
        </el-scrollbar>


        <el-drawer v-model="tunnelDetailDisplay" direction="ltr" size="auto">
            <template #header>
                <h4>隧道详情</h4>
            </template>
            <template #default>
                <div class="tunnel-detail">
                    <div class="line"></div>

                    <div class="state">
                        <div class="state-node">
                            <span>节点状态</span>
                            <el-icon :color="tunnelDetail['state'] === 'online' ? 'green' : '#ccc'"
                                :size="40"><i-ep-finished /></el-icon>
                            <span :style="{ 'color': tunnelDetail['state'] === 'online' ? 'green' : '#ccc' }">
                                {{ tunnelDetail['state'] }}
                            </span>
                        </div>

                        <div class="state-tunnel">
                            <span>隧道状态</span>
                            <el-icon :color="tunnelDetail['tunnel_state'] === 'true' ? 'green' : '#ccc'"
                                :size="40"><i-ep-switch-button /></el-icon>
                            <span :style="{ 'color': tunnelDetail['tunnel_state'] === 'true' ? 'green' : '#ccc' }">
                                {{ tunnelDetail['tunnel_state'] }}
                            </span>
                        </div>
                    </div>

                    <div class="line"></div>

                    <el-descriptions size="default" :column="3" border>
                        <el-descriptions-item label="隧道ID">{{ tunnelDetail['tunnel_id'] }}</el-descriptions-item>
                        <el-descriptions-item label="隧道名">{{ tunnelDetail['tunnel_name'] }}</el-descriptions-item>
                        <el-descriptions-item label="类型" :span="2">{{ tunnelDetail['tunnel_type']
                            }}</el-descriptions-item>
                        <el-descriptions-item label="内网IP">
                            <el-tag size="small">{{ tunnelDetail['tunnel_localip'] }}</el-tag>
                        </el-descriptions-item>

                        <el-descriptions-item label="内网端口">
                            <el-tag size="small">{{ tunnelDetail['tunnel_nport'] }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="外网端口/域名">
                            <el-tag size="small">{{ tunnelDetail['tunnel_dorp'] }}</el-tag>
                        </el-descriptions-item>

                        <el-descriptions-item label="节点">
                            <el-tag size="small">{{ tunnelDetail['name'] }}</el-tag>
                        </el-descriptions-item>

                        <el-descriptions-item label="连接地址">
                            <el-tag size="small">{{ tunnelDetail['iparea'] }}</el-tag>
                        </el-descriptions-item>
                    </el-descriptions>

                    <div class="line"></div>


                    <el-descriptions :column="3" border>
                        <el-descriptions-item label="今日上传流量">{{ tunnelDetail['today_traffic_in']
                            }}B</el-descriptions-item>
                        <el-descriptions-item label="今日下载流量">{{ tunnelDetail['today_traffic_out']
                            }}B</el-descriptions-item>
                        <el-descriptions-item label="当前连接数量" :span="2">{{ tunnelDetail['cur_conns']
                            }}</el-descriptions-item>
                        <el-descriptions-item label="使用客户端">
                            {{ tunnelDetail['client_version'] }}
                        </el-descriptions-item>
                    </el-descriptions>

                    <div class="line"></div>


                    <div class="boot-tip">
                        <h4>启动代码</h4>
                        <el-input style="width: 100%;" v-model="tunnelDetailBootCode" :readonly="true"
                            type="textarea" />
                    </div>
                </div>
            </template>
            <template #footer>
                <div style="display: flex; justify-content: center">
                    <el-button style="width: 80%;" type="primary"
                        v-if="!tunnelProcessInfoList[tunnelDetail['tunnel_id']]"
                        @click="toggleFrp(tunnelDetail['tunnel_id'])">
                        启动
                    </el-button>

                    <el-button style="width: 80%;" type="danger" v-else @click="toggleFrp(tunnelDetail['tunnel_id'])">
                        关闭
                    </el-button>
                </div>
            </template>
        </el-drawer>

        <el-drawer v-model="tunnelLogDetail.display" :title="tunnelLogDetail.title" direction="btt"
            :before-close="onLogClose" size="auto">
            <el-scrollbar height="300px">
                <div style="text-align: start;" v-loading="tunnelLogDetail.loading">
                    {{ tunnelLogDetail.log }}
                </div>
            </el-scrollbar>
            <template #footer>
                <div style="flex: auto">
                    <el-button type="primary" @click="clearLog">清除</el-button>
                </div>
            </template>

        </el-drawer>
    </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { chmlfrUserTunnel, chmlfrpTunnelDelete, chmlfrpTunnelInfo, chmlfrpUserInfo } from '@/api';
import { useRouter } from "vue-router";
import { onMounted, reactive, ref, h } from 'vue';

const router = useRouter()
const pageLoading = ref(true)
const userToken = ref(null)
const userInfo = ref({})
const userTunnels = ref([])
const tunnelDetailDisplay = ref(false)
const tunnelDetailLoading = ref(false)
const tunnelDetail = ref({})
const tunnelDetailBootCode = ref('')
const tunnelProcessInfoList = ref({})
const tunnelLogDetail = ref(
    {
        id: '',
        title: '',
        loading: true,
        display: false,
        log: '',
        logInterval: 200,
        intervalInstance: 'log-interval'
    }
)


onMounted(() => {
    window.ipcRenderer.invoke('token-get').then((ret) => {
        userToken.value = ret
        chmlfrpUserInfo(ret).then(data => {
            userInfo.value = data
        })
        chmlfrUserTunnel(ret).then(data => {
            userTunnels.value = data
            window.ipcRenderer.invoke('frpc-configuration', ret).then(data => {
                tunnelProcessInfoList.value = data
                userTunnels.value.forEach((item) => {
                    if (!tunnelProcessInfoList.value.hasOwnProperty(item.id)) {
                        tunnelProcessInfoList.value[item.id] = false;
                    }
                })
            })
        }).finally(() => {
            pageLoading.value = false
        })
    })
})

function openDetail(id) {
    tunnelDetailDisplay.value = true;
    tunnelDetailLoading.value = true;
    tunnelDetailBootCode.value = `frpc -u ${userToken.value} -p ${id}`

    chmlfrpTunnelInfo(id).then(data => {
        if (data.code != 200) {
            tunnelDetailDisplay.value = false;
            toast('error', '获取隧道信息失败:', error)
        } else {
            tunnelDetail.value = data
        }
    }).finally(() => {
        tunnelDetailLoading.value = false
    })
}

function toggleFrp(tunnelId) {
    window.ipcRenderer.invoke('frpc-toggle', userToken.value, tunnelId).then(data => {
        tunnelProcessInfoList.value = data.configuration
        if (data.code === 200) {
            const frpFlag = data.configuration[tunnelId]
            toast('success', `${frpFlag ? '开启' : '关闭'}FRPC成功!`)
        } else {
            toast('error', `发生错误: ${data.msg}`)
        }
    })
}

function openLog(item) {


    tunnelLogDetail.value.id = item.id
    tunnelLogDetail.value.display = true;
    tunnelLogDetail.value.loading = true;
    tunnelLogDetail.value.title = `${item['node']}-${item['name']}-${item['id']}`

    const executeLog = () => {
        window.ipcRenderer.invoke('frpc-log', userToken.value, item.id).then(data => {
            if (tunnelLogDetail.value.log != data) {
                tunnelLogDetail.value.log = data
            }

            if (!tunnelDetail.value.loading) {
                tunnelLogDetail.value.loading = false;
            }
        })
    }

    executeLog()

    window.ipcRenderer.invoke('settings-read').then(data => {
        const logInterval = data.logInterval
        tunnelLogDetail.value.logInterval = logInterval
        tunnelLogDetail.value.intervalInstance = setInterval(() => {
            executeLog()
        }, logInterval)
    })
}

function clearLog() {
    const tunnelId = tunnelLogDetail.value.id
    const token = userToken.value
    
    window.ipcRenderer.invoke('frpc-log-clear', token, tunnelId).then(data=>{
        if (data.code === 200) {
            toast('success', '清除日志成功')
            tunnelLogDetail.value.log = ''
        }else {
            toast('error', data.msg)
        }
    })
}

function openDelete(item) {

    if (tunnelProcessInfoList.value[item.id]) {
        toast('wraning', '删除隧道错误:', '当前隧道正在运行中...')
        return
    }

    const userid = userInfo.value['userid']
    if (!userid) {
        toast('wraning', '加载失败: ', '当前程序加载用户失败,请检查!')
        return
    }


    const deleteName = `${item.node}-${item.name}-实例-[${item.id}]`
    ElMessageBox.confirm(`您确定要删除隧道吗?`, '删除提醒', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
    }).then(() => {
        chmlfrpTunnelDelete(userToken.value, item.id, userInfo.value['userid']).then(data => {
            if (data.code === 200) {
                toast('success', '删除成功: ', data.error)
                window.location.reload()
            } else {
                toast('error', '删除失败: ', data.error)
            }
        })
    }).catch(err => {
        toast('info', '删除取消: ', '你已经取消删除隧道了😘')
    })

}


function onLogClose() {
    clearInterval(tunnelLogDetail.value.intervalInstance)
    tunnelLogDetail.value.display = false
}

function toUpdate(tunnelId) {
    if (tunnelProcessInfoList.value[tunnelId]) {
        toast('wraning', '编辑隧道详情错误:', '当前隧道正在运行中...')
        return
    }

    router.push({
        path: `/tunnel/update/${tunnelId}`
    })
}


function toCreate() {
    router.push({
        path: `/tunnel/create`
    })
}

function toast(type: string, title: string, msg: string) {
    ElMessage({
        message: h('p', { style: 'line-height: 1; font-size: 14px' }, [
            h('span', null, title),
            h('i', { style: 'color: teal' }, msg),
        ]),
        type
    })
}

</script>

<style scoped>
.tunnel-container {
    width: 100%;
    height: 100%;

}



.el-scrollbar {
    position: relative;
}


.tunnel-header {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    box-sizing: border-box;
    z-index: 999;
}

.tunnel-header-content {
    width: 100%;
    display: flex;
    justify-content: space-between;
    box-sizing: border-box;
}



.tunnel-content {
    margin-top: 80px;
    width: 100%;
    padding: 10px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    box-sizing: border-box;
    justify-content: space-between;

}

.tunnel-item {
    margin: 10px 0;
    width: 33%;
    text-align: start;
}

@media screen and (max-width: 1080px) {
    .tunnel-item {
        width: 49%;
    }
}

@media screen and (max-width: 768px) {
    .tunnel-item {
        width: 99%;
    }
}

.tunnel-flag {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 5px 0;
}

.tunnel-flag span {
    font-size: 12px;
}

.tunnel-flag .tunnel-flag-state {
    width: 10px;
    height: 10px;
    background-color: #CCC;
    border-radius: 10px;
}

.tunnel-location {
    margin: 5px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.tunnel-net {
    margin: 5px 0;
}

.tunnel-create-time {
    font-size: 10px;
    margin: 5px 0;
    color: #CCC;
}

.tunnel-line {
    width: 100%;
    height: 1px;
    background-color: #CCC;
}

.tunnel-data {
    display: flex;
    justify-content: space-between;
    align-items: center;

}

.tunnel-data span {
    margin: 15px 5px;
}

.tunnel-operator {
    display: flex;
    margin-top: 20px;
}

.tunnel-operator .el-button {
    flex: 1;
    margin: 0;
    padding: 0;
    border-left: 0;
    border-right: 0;
    border-radius: 0;
}

.tunnel-detail .line {
    width: 100%;
    height: 1px;
    background-color: black;
}

.tunnel-detail .state {
    display: flex;
    justify-content: space-between;
    margin: 20px 40px;
}

.tunnel-detail .state>div {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.tunnel-detail .state>div span {
    font-size: 14px;
}

.tunnel-detail .el-descriptions {
    margin: 30px 0;
}


.tunnel-detail .boot-tip .el-button {
    width: 100%;

}
</style>