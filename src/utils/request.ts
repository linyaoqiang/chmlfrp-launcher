import axios from 'axios';
import { ElMessage } from 'element-plus';
 
// 创建axios实例
const service = axios.create({
  // baseURL: process.env.VUE_APP_BASE_API, // api的base_url
  baseURL: 'https://panel.chmlfrp.cn',
  timeout: 5000 // 请求超时时间
});

service.interceptors.response.use(
  response=>{
    return response.data
  }, error=>{
    ElMessage({
      type:'error',
      message: error
    })
  }
)
 
// 请求拦截器
export default service;