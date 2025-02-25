import { app } from "electron";

import { CurrentWindow } from ".";
import { Setting, StoreSchema } from "../types";
import { store, StoreSet } from "../types/setting";
import { Version } from "../types/version";
import { Logger } from "./logger";
import { join, resolve } from "path";
import { existsSync, mkdirSync } from "fs";
const logger = Logger.of("setting");

export function InitSetting() {
    let setting: Setting | undefined = store.get("setting");
    // 版本比较，如果当前版本不比本地版本高，则不更新

    if (setting && setting.version) {
        const update = new Version(app.getVersion()).greaterThan(new Version(setting.version));
        logger.info(update ? "检测到设置版本需要更新!" : "本地设置无需更新");

        if (update) {
            const defaultSetting = GetDefaultSetting();
            logger.info("本地设置:", JSON.stringify(setting));
            logger.info("更新设置值:", JSON.stringify(defaultSetting));
            // 合并设置，除了 version 字段 , 其他以原有设置为准，添加新的配置
            setting.version = app.getVersion();
            const newValue: Setting = deepMerge(defaultSetting, setting);
            StoreSet("setting", newValue);
            logger.info("合并后的设置值:", JSON.stringify(newValue));

            // 更新赋值
            setting = newValue;
        }
    } else {
        const defaultSetting = GetDefaultSetting();

        logger.info("初始化设置值:", JSON.stringify(defaultSetting));
        // 初始化配置
        StoreSet("setting", defaultSetting);
        StoreSet("tasks", []);
        StoreSet("users", []);
        initPath(defaultSetting.system.path);
        // 初始化赋值
        setting = defaultSetting;
    }

    const { path, win } = setting.system;
    if (path) initPath(path);
    if (win) CurrentWindow?.setAlwaysOnTop(win.isAlwaysOnTop);

    // 清空任务列表
    StoreSet("tasks", []);
}

export function GetDefaultSetting() {
    const initSetting: Setting = {
        version: app.getVersion(),
        common: {
            task: {
                maxTasks: 4,
            },
        },
        script: {
            // 启动设置
            launch: {
                // 浏览器执行路径
                binaryPath: getChromePath() || "",
            },
            // 脚本设置
            script: {
                // 任务点超时检测 单位小时
                taskTimeoutPeriod: 1,
                cx: {
                    // 是否形成队列
                    study: {
                        enable: true,
                        queue: true,
                        // 复习模式
                        review: false,
                        media: {
                            enable: true,
                            playbackRate: 2,
                            mute: true,
                        },
                        ppt: true,
                        book: true,
                        qa: {
                            enable: true,
                            autoReport: true,
                            passRate: 60,
                        },
                    },

                    work: {
                        enable: true,
                    },
                    exam: {
                        enable: true,
                    },
                },
                zhs: {
                    // 半个小时自动停止
                    autoStop: 0.5,

                    video: {
                        enable: true,
                        playbackRate: 2,
                        mute: true,
                    },
                    qa: {
                        enable: true,
                        autoReport: true,
                        passRate: 60,
                    },
                    work: {
                        enable: true,
                    },
                    exam: {
                        enable: true,
                    },
                },
            },
            // 信息设置
            account: {
                // 查题码
                queryToken: "",
                // ocr 设置
                ocr: {
                    username: "",
                    password: "",
                },
            },
        },
        system: {
            win: {
                isAlwaysOnTop: CurrentWindow?.isAlwaysOnTop() || true,
            },
            path: {
                userData: app.getPath("userData"),
                logs: app.getPath("logs"),
                courseImg: resolve(join(app.getPath("userData"), "./course-img/")),
            },
        },
    };

    return initSetting;
}

function initPath(path: StoreSchema["setting"]["system"]["path"]) {
    if (path) {
        for (const key in path) {
            const p = (path as any)[key];
            logger.info("设置路径:" + key, p);
            // 如果文件夹不存在则创建
            if (!existsSync(p)) {
                logger.info("mkdirs", p);
                mkdirs(p);
            }
            try {
                app.setPath(key, p);
            } catch {}
        }
    }
}

// 获取 chrome 路径
export function getChromePath() {
    let paths = [process.env.ProgramFiles, process.env["ProgramFiles(x86)"], "C:\\Program Files", "C:\\Program Files (x86)"];
    let chromePath = paths.map((p) => join(p || "", "\\Google\\Chrome\\Application\\chrome.exe")).find((p) => existsSync(p));
    logger.info("获取本地chrome浏览器路径:", chromePath);
    return chromePath;
}

export function mkdirs(url: string) {
    if (!existsSync(url)) {
        mkdirs(resolve(url, "../"));
        mkdirSync(url);
    }
}

function deepMerge(obj1: any, obj2: any) {
    let key;
    for (key in obj2) {
        // 如果target(也就是obj1[key])存在，且是对象的话再去调用deepMerge，否则就是obj1[key]里面没这个对象，需要与obj2[key]合并
        // 如果obj2[key]没有值或者值不是对象，此时直接替换obj1[key]
        obj1[key] = obj1[key] && obj1[key].toString() === "[object Object]" && obj2[key] && obj2[key].toString() === "[object Object]" ? deepMerge(obj1[key], obj2[key]) : (obj1[key] = obj2[key]);
    }
    return obj1;
}
