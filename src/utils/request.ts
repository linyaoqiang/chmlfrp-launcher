import axios from 'axios';
 
// 创建axios实例
const service = axios.create({
  // baseURL: process.env.VUE_APP_BASE_API, // api的base_url
  baseURL: 'https://panel.chmlfrp.cn',
  timeout: 5000 // 请求超时时间
});
 
// 请求拦截器
service.interceptors.request.use(
  config => {
    // 可以在这里添加请求头等信息
    return config;
  },
  error => {
    // 请求错误处理
    console.log(error); // for debug
    Promise.reject(error);
  }
);
 
// 响应拦截器
service.interceptors.response.use(
  response => {
    // 可以在这里对响应数据进行处理
    const res = response.data;
    // 根据返回的状态码做相应处理，例如401未授权等
    return res;
  },
  error => {
    // 响应错误处理
    console.log('err' + error); // for debug
    return Promise.reject(error);
  }
);
 
export default service;