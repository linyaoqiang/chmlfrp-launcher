import request from '@/utils/request'
import { TunnelCreate, TunnelUpdate } from './types';

export function chmlfrpLogin(username:string, password:string){
    return request({
        url: '/api/login.php',
        method: 'post',
        data: {
            username,
            password
        },
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

export function chmlfrpUserInfo(usertoken:any) {
    return request({
        url: '/api/userinfo.php',
        method: 'get',
        params: {
            usertoken
        }
    })
}

export function chmlfrpFlowZong(usertoken: string) {
    return request({
        url: '/api/flow_zong.php',
        method: 'get',
        params: {
            usertoken
        }
    })
}


export function chmlfrUserTunnel(token: string) {
    
    return request({
        url: '/api/usertunnel.php',
        method: 'get',
        params: {
            token
        }
    })
}

export function chmlfrpTunnelInfo(id: string) {
    return request({
        url: '/api/tunnelinfo.php',
        method: 'get',
        params: {
            id
        }
    })
}

export function chmlfrpTunnelUpdate(tunnelUpdate: TunnelUpdate) {
    return request({
        url: '/api/cztunnel.php',
        method: 'post',
        data: tunnelUpdate
    })
}

export function chmlfrpTunnelCreate(tunnelCreate: TunnelCreate) {
    return request({
        url: '/api/tunnel.php',
        method: 'post',
        data: tunnelCreate
    })
}

export function chmlfrpTunnelDelete(token: string, nodeid:string, userid:any) {
    return request({
        url: '/api/deletetl.php',
        method: 'get',
        params: {
            token,
            nodeid,
            userid
        }
    })
}

export function chmlfrpDownload() {
    
    return request({
        url: '/api/dw.php',
        method: 'get'
    })
}

export function chmlfrpNodes() {
    return request({
        url: '/api/unode.php',
        method: 'get'
    })
}

export function chmlfrpSinfo() {
    return request({
        url: '/api/sinfo.php',
        method: 'get'
    })
}


export function uapisSay() {
    return request({
        url:  'https://uapis.cn/api/say',
        proxy: false,
        method:'get'
    })
}