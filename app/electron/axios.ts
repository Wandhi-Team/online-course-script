import axios from "axios";
import { Logger } from "./logger";
const logger = Logger.of("request");

// 添加请求拦截器
axios.interceptors.request.use(
    function (config: any) {
        // 在发送请求之前做些什么
        logger.info("网络请求:", JSON.stringify(config));
        return config;
    },
    function (err: any) {
        // 对请求错误做些什么
        logger.error("网络失败:", err);
        return Promise.reject(err);
    }
);

// 添加响应拦截器
axios.interceptors.response.use(
    function (response: any) {
        logger.info("网络响应成功:", JSON.stringify(response));
        // 对响应数据做点什么
        return response;
    },
    function (err: any) {
        logger.error("网络响应错误:", err);
        // 对响应错误做点什么
        return Promise.reject(err);
    }
);

export const AxiosGet = axios.create({
    method: "get",
    timeout: 2 * 60 * 1000,
});

export const AxiosPost = axios.create({
    method: "post",
    timeout: 2 * 60 * 1000,
});
export const request = axios.create({
    timeout: 1 * 60 * 1000,
});
