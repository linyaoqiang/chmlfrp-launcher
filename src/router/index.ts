import { createRouter, createWebHashHistory } from "vue-router";
const historyMode = createWebHashHistory();

const routes = [
    {
        path: '/',
        name: '首页',
        component: () => import('@/views/Home.vue')
    },

    {
        path: '/login',
        name: '登录',
        component: () => import('@/views/Login.vue'),
    },

    {
        path: '/tunnel',
        name: '隧道',
        children: [
            {
                path: '',
                name: '隧道节点',
                component: () => import('@/views/Tunnel.vue')
            },

            {
                path: 'update/:id',
                name: '编辑隧道',
                component: () => import('@/views/Tunnel-Update.vue')
            },
        
            {
                path: 'create',
                name: '创建隧道',
                component: () => import('@/views/Tunnel-Create.vue')
            },

        ]
    },

  

    {
        path: '/settings',
        name: '设置',
        component: () => import('@/views/Settings.vue')
    }



]
const router = createRouter({
    history: historyMode,
    routes
})
//export default router
export { router }
