<template>
    <div class="tunnel-edit-container" v-loading="loading">
        <el-scrollbar style="width: 100%;text-align: center;">
            <el-form class="tunnel-edit-form" ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="auto"
                :size="formSize" status-icon>
                <el-form-item label="隧道名称" prop="name">
                    <el-input v-model="ruleForm.name" />
                </el-form-item>
                <el-form-item label="本地IP" prop="localip">
                    <el-input v-model="ruleForm.localip" />

                </el-form-item>
                <el-form-item label="节点选择" prop="node"  >
                    <!-- <el-input v-model="ruleForm.node" :readonly="true" /> -->
                    <el-select @change="nodeChanged" v-model="ruleForm.node" placeholder="请选择节点">
                        <el-option v-for="(item, index) in nodes" :disabled="nodeDisabled(item)" :key="index"
                            :label="nodeLabel(item)" :value="item.name" />
                    </el-select>
                </el-form-item>
                <el-form-item label="端口类型" prop="type" required>
                    <el-select v-model="ruleForm.type" placeholder="请选择端口类型">
                        <el-option v-for="item in networkTypes" :key="item" :label="item" :value="item"
                            :disabled="networkDisabled(item)">

                        </el-option>
                    </el-select>
                </el-form-item>

                <el-form-item label="系统端口模式">
                    <el-switch v-model="useSystemProcess"/>
                </el-form-item>

                <el-form-item label="内网端口" prop="nport">
                    <!-- <el-input v-model="ruleForm.nport" /> -->

                    <el-select v-show="!useSystemProcess" v-model="ruleForm.nport" filterable allow-create default-first-option
                        placeholder="请选择或输入端口">
                        <el-option :disabled="item.disabled" v-for="item in portOptions" :key="item.value"
                            :label="item.label" :value="item.value">
                            <div style="display: flex; justify-content: space-between;">

                                <span>{{ item.label }}</span>
                                <span>{{ item.value }}</span>
                            </div>
                        </el-option>
                    </el-select>

                    <el-select  v-show="useSystemProcess" v-model="ruleForm.nport" filterable allow-create default-first-option
                        placeholder="请选择或输入端口">
                        <el-option :disabled="item[5]" v-for="item in systemProcesses" :key="item[4]"
                           :label="item[0]" :value="item[3]">
                            <div style="display: flex; justify-content: space-between;text-align: center;">

                                <span style="flex: 1;">{{ item[0] }}</span>
                                <span style="flex: 1;">{{ item[1] }}</span>
                                <span style="flex: 1;">{{ item[2] }}</span>
                                <span style="flex: 1;">{{ item[3] }}</span>
                                <span style="flex: 1;">{{ item[4] }}</span>
                            </div>
                        </el-option>
                    </el-select>

                </el-form-item>

                <el-form-item label="外网端口" prop="mappingPort" v-if="dorpTypeFlag">
                    <el-input v-model="ruleForm.mappingPort" />
                </el-form-item>

                <div v-else>
                    <el-form-item label="域名映射" prop="mappingDomain">
                        <el-input v-model="ruleForm.mappingDomain" />
                    </el-form-item>

                    <div style="padding: 20px;">
                        请将域名使用CNAME|SRV解析到 {{ curNode['ip'] }}
                    </div>
                </div>



                <div class="setttings-tip">
                    <div class="line"></div>
                    <span>高级设置请不要乱填,否则可能会导致无法正常运行</span>
                    <div class="line"></div>
                </div>

                <el-collapse>
                    <el-collapse-item title="高级设置" name="1">
                        <el-form-item label="数据加密" prop="encryption">
                            <el-switch v-model="ruleForm.encryptionFlag" />
                        </el-form-item>

                        <el-form-item label="数据压缩" prop="compression">
                            <el-switch v-model="ruleForm.compressionFlag" />
                        </el-form-item>

                        <el-form-item label="额外参数" prop="ap">
                            <el-input type="textarea" v-model="ruleForm.ap" />
                        </el-form-item>

                    </el-collapse-item>


                </el-collapse>


                <el-form-item>
                    <el-button type="primary" plain @click="randomName">随机隧道名</el-button>
                    <el-button type="primary" v-if="dorpTypeFlag" plain @click="randomPort">随机端口名</el-button>
                    <el-button type="primary" @click="update">更新</el-button>
                    <el-button @click="$router.back()">返回</el-button>
                </el-form-item>

            </el-form>
        </el-scrollbar>
    </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted, reactive, ref } from 'vue'
import type { ComponentSize, FormInstance, FormRules } from 'element-plus'
import { useRoute, useRouter } from "vue-router";
import { NodeInfo, TunnelUpdate } from '@/api/types'
import { chmlfrpNodes, chmlfrpTunnelInfo, chmlfrpTunnelUpdate, chmlfrpUserInfo } from '@/api';

const route = useRoute()
const router = useRouter()
const formSize = ref<ComponentSize>('default')
const loading = ref(true)
const ruleFormRef = ref<FormInstance>()
const userInfo = ref({})
const nodes = ref<NodeInfo[]>([])
const curNode = ref({})
const tunnelId = route.params.id
const useSystemProcess = ref(false)
const systemProcesses:string[][] = ref([
    ['进程', '协议', '监听地址', '端口号', 'PID', true]
])
const ruleForm = reactive<TunnelUpdate>({
    tunnelid: tunnelId,
    usertoken: '',
    userid: 0,
    localip: '127.0.0.1',
    name: '',
    node: '',
    type: '',
    nport: '',
    dorp: '',
    mappingDomain: '',
    mappingPort: '',
    ap: '',
    encryption: '',
    compression: '',
    encryptionFlag: false,
    compressionFlag: false,
})


onMounted(() => {

    window.ipcRenderer.invoke('frpc-system-process').then(ret=>{
        systemProcesses.value = systemProcesses.value.concat(ret)
    })


    window.ipcRenderer.invoke('token-get').then((ret) => {
        if (!ret) {
            router.replace('/login')
        }
        ruleForm.usertoken = ret

        let workCount = 2

        chmlfrpNodes().then(data => {
            nodes.value = data
            chmlfrpTunnelInfo(tunnelId).then(data => {

                curNode.value = nodes.value.find(item => {
                    if (item.name === data.name) {
                        return true
                    }
                })

                ruleForm.localip = data['tunnel_localip']
                ruleForm.name = data['tunnel_name']
                ruleForm.node = data['name']
                ruleForm.type = data['tunnel_type']
                ruleForm.nport = data['tunnel_nport']
                const dorp = data['tunnel_dorp']
                ruleForm.dorp = dorp
                ruleForm.mappingDomain = dorpTypeFlag.value ? '' : dorp
                ruleForm.mappingPort = dorpTypeFlag.value ? dorp : ''
                ruleForm.ap = data['tunnel_ap']
                const encryption = data['tunnel_encryption']
                const compression = data['tunnel_compression']
                ruleForm.encryption = encryption
                ruleForm.compression = compression
                ruleForm.encryptionFlag = (encryption === 'true')
                ruleForm.compressionFlag = (compression === 'true')

            })

        }).finally(()=>{
            workCount -= 1
            if (workCount <= 0) {
                loading.value = false
            }
        })


        chmlfrpUserInfo(ret).then(data=>{
            userInfo.value = data
            ruleForm.userid = userInfo.value.userid
        }).finally(()=>{
            workCount -= 1
            if (workCount <= 0) {
                loading.value = false
            }
        })
        

    })



})

const validateDomain = (_rule: any, value: any, callback: Function) => {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    if (domainRegex.test(value)) {
        callback();
    } else {
        callback(new Error('请输入有效的域名'));
    }
}
const validateIP = (_rule: any, value: any, callback: Function) => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipRegex.test(value)) {
        callback();
    } else {
        callback(new Error('请输入有效的IP地址'));
    }
}
const validateMappingPort = (_rule: any, value: any, callback: Function) => {
    const number = parseInt(value)
    if (!isNaN(number) && number >= 10000 && number <= 65535) {
        callback()
    } else {
        callback(new Error('请输入10000-65535之间的端口!'))
    }
}


const validatePort = (_rule: any, value: any, callback: Function) => {
    const number = parseInt(value)
    if (!isNaN(number) && number >= 1 && number <= 65535) {
        callback()
    } else {
        callback(new Error('请输入一个正确的端口!'))
    }
}


let rules = reactive<FormRules<TunnelUpdate>>({
    tunnelid: [
        { required: true, message: '隧道ID必须存在!' },
    ],
    usertoken: [
        {
            required: true,
            message: '用户令牌必须存在',
        },
    ],
    userid: [
        {
            required: true,
            message: '用户ID必须存在',
        },
    ],
    localip: [
        { required: true, message: '请输入有效IP地址', trigger: 'blur' },
        { validator: validateIP, trigger: 'blur' }
    ],
    name: [
        {
            required: true,
            message: '请输入有效的隧道名',
            trigger: 'blur',
        },
    ],
    node: [
        {
            required: true,
            message: '请选择一个有效的隧道节点',
            trigger: 'change',
        },
    ],
    type: [
        {
            required: true,
            message: '请选择一个有效的网络类型',
            trigger: 'change',
        },
    ],
    nport: [
        {
            required: true,
            message: '请输入一个正确的端口!',
            trigger: 'change',
        },
        {
            validator: validatePort, trigger: 'change'
        }
    ],

    mappingDomain: [
        {

            required: true, message: '请输入正确的域名', trigger: 'blur'
        },
        {
            validator: validateDomain, trigger: 'blur'
        }
    ],
    mappingPort: [
        {
            required: true,
            message: '请输入10000-65535的端口',
            trigger: 'change',
        },
        {
            validator: validateMappingPort, trigger: 'change'
        }
    ],

    ap: [
        {
            required: false,
        }
    ]

})


const portOptions = [

    {
        value: '',
        label: '如果自定义输入并选择即可',
        disabled: true,
    },

    {
        label: 'FTP',
        value: '21'
    },
    {
        label: 'SSH',
        value: '22'
    },
    {
        label: 'HTTPWeb',
        value: '80'
    },
    {
        label: 'HTTPSWeb',
        value: '443'
    },
    {
        label: 'MySQL',
        value: '3306'
    },
    {
        label: 'RDP群晖DMS',
        value: '5001'
    },
    {
        label: '铁锈战争联机',
        value: '5123'
    },
    {
        label: '像素工厂联机',
        value: '6567'
    },
    {
        label: '泰拉瑞亚联机',
        value: '7777'
    },

    {
        label: '基岩版MC服务器',
        value: '19132'
    },
    {
        label: 'JavaMC服务器',
        value: '25565'
    },
]

const networkTypes = ['tcp', 'udp', 'http', 'https']

function networkDisabled(netType) {
    if (curNode.value['web'] === 'no' && (netType === 'http' || netType === 'https')) {
        return true;
    }

    return false
}

const dorpTypeFlag = computed(() => {
    return ruleForm.type === 'tcp' || ruleForm.type === 'udp'
})

function nodeLabel(node: NodeInfo) {
    let nodeText = node.name

    if (node.china === 'yes') {
        nodeText += '-中国大陆'
    } else {
        nodeText += '-海外'
    }

    if (node.udp === 'true') {
        nodeText += '-UDP'
    }

    if (node.web === 'yes') {
        nodeText += '-支持建站'
    }

    if (node.nodegroup != 'user') {
        nodeText += '-会员专享'
    }

    nodeText += '-' + node.notes
    return nodeText
}

function nodeChanged(value: string) {
    curNode.value = nodes.value.find((item=>{
        if (item.name === value) {
            return true
        }
    }))

    if (networkDisabled(ruleForm.type)) {
        ruleForm.type = 'tcp'
    }
}


function nodeDisabled(node: NodeInfo) {
    if (node.nodegroup === 'user') {
        return false
    }
    if (userInfo.value['usergroup'] === '免费用户') {

        return true
    }
    return false
}

function update() {
    let updateObject = Object.assign(ruleForm)
    updateObject.encryption = updateObject.encryptionFlag ? 'true' : 'false'
    updateObject.compression = updateObject.compressionFlag ? 'true' : 'false'
    updateObject.dorp = dorpTypeFlag.value ? updateObject.mappingPort : updateObject.mappingDomain

    ruleFormRef.value?.validate((valid, fields) => {
        if (!valid) {
            toast('error', '错误字段:' + fields)
        }
    }).then(valid => {
        if (valid) {
            chmlfrpTunnelUpdate(updateObject).then(data => {
                if (data.code === 200) {
                    toast('success', data.error)
                    router.back()
                } else {
                    toast('success', data.error)
                }
            })
        }
    }).finally(() => {
        loading.value = false
    })
}


function toast(type: string, message: string) {
    ElMessage({
        message: message,
        type: type,
    })
}

function randomPort() {
    ruleForm.mappingPort = `${genRandomNumber(10000, 65535)}`
}

function genRandomNumber(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function randomName() {
    ruleForm.name = genRandomText()
}

function genRandomText() {
    let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let stringLength = 8;
    let randomText = '';

    for (let i = 0; i < stringLength; i++) {
        let randomIndex = Math.floor(Math.random() * chars.length);
        randomText += chars.charAt(randomIndex);
    }

    return randomText;
}


</script>

<style scoped>
.tunnel-edit-container {
    width: 100vw;
    height: 100vh;
}

.setttings-tip {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 20px;
    padding-top: 10px;
}

.setttings-tip .line {
    height: 1px;
    flex: 1;
    background-color: black;
}

.setttings-tip span {
    flex: 2;
}

.tunnel-edit-form {
    width: 60%;
    height: 100%;
    margin: 20px auto;
}

.tunnel-edit-form .el-form-item {
    margin: 10px;
    padding: 10px
}
</style>