<template>

    <div class="login-container">
        <h2>Chmlfrp <el-image style="width: 40px; margin-left: 10px;" src="https://chmlfrp.cn/favicon.ico"></el-image>
        </h2>

        <form class="login-form" action="#" method="post">
            <el-form-item prop="username">
                <el-input v-model="loginForm.username" placeholder="Username" prefix-icon="el-icon-user"></el-input>
            </el-form-item>
            <el-form-item prop="password">
                <el-input v-model="loginForm.password" type="password" placeholder="Password"
                    prefix-icon="el-icon-lock"></el-input>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" style="width:100%;" @click="login">登录</el-button>
            </el-form-item>

            <el-form-item>
                <a href="https://panel.chmlfrp.cn/register" target="_blank">还没有账号? 官网注册一个吧!!!</a>
            </el-form-item>
        </form>
    </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { reactive, h } from "vue"

import { chmlfrpLogin } from '@/api/index'
import { ElMessage } from "element-plus"
import { useRouter } from 'vue-router'


const router = useRouter()

const loginForm = reactive({
    username: '',
    password: ''
})

function login() {


    chmlfrpLogin(loginForm.username, loginForm.password).then((data) => {
        if (data.error) {
            ElMessage({
                message: h('p', { style: 'line-height: 1; font-size: 14px' }, [
                    h('span', null, '登录失败:'),
                    h('i', { style: 'color: teal' }, data.error),
                ]),
            })
        } else {

            window.ipcRenderer.invoke('token-save', data.token).then((data) => {
                if (data.code === 200) {
                    router.replace('/')
                } else {
                    ElMessage({
                        message: h('p', { style: 'line-height: 1; font-size: 14px' }, [
                            h('span', null, '登录失败:'),
                            h('i', { style: 'color: teal' }, '未知错误'),
                        ]),
                    })
                }
            })

        }

    })
}

</script>

<style scoped>
.login-container {
    background: rgba(235, 255, 255, 0.6);
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    overflow: hidden;
}

.login-background {
    width: 100vw;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.login-container h2 {
    margin-bottom: 20px;
    color: #333;
    display: flex;
    align-items: center;
}

.login-form {
    width: calc(60%);
}


.login-form input {
    width: calc(100% - 20px);
    padding: 10px;
    margin-bottom: 20px;
    border: none;
    border-radius: 5px;
    background-color: #f9f9f9;
    box-sizing: border-box;
    outline: none;
    font-size: 14px;
    color: #333;
}

.login-form input[type="submit"] {
    background-color: #007bff;
    border: none;
    border-radius: 5px;
    color: #fff;
    cursor: pointer;
    transition: background-color 0.3s ease;
    font-size: 16px;
}

.login-form input[type="submit"]:hover {
    background-color: #0056b3;
}

.el-form-item {
    margin: 20px;
}
</style>