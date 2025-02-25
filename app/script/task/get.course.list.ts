import { createHash } from "crypto";
import { ScriptOptions, WaitForScript } from "@pioneerjs/core";
import { Task } from "../../electron/task";

import { Course } from "../../types/script/course";

import path from "path";
import { getElementClip } from "../common/utils";
import { StoreGet } from "../../types/setting";
import { Platform, User } from "../../types";
import { log } from "electron-log";
import { RunnableTask } from "../../electron/task/runnable.task";
import { ScriptTask } from "../../electron/task/script.task";

/**
 * 获取超星课程列表
 * @param script 脚本上下文
 * @returns
 */
export function getCXCourseList(uid: string): ScriptTask<Course[]> {
    return ScriptTask.createScript({
        name: "获取超星课程列表",
        timeout: 60 * 1000,
        target: async ({ task, script }) =>
            new Promise(async (resolve, reject) => {
                // 等待页面加载
                await new WaitForScript(script).documentReady();

                await script.page.goto("http://mooc1-1.chaoxing.com/visit/interaction");
                const waitFor = new WaitForScript(script);
                // 等待页面所有请求结束
                await waitFor.nextTick("request");

                const courses = await script.page.evaluate(() => {
                    // 获取课程信息
                    return Array.from(document.querySelectorAll("li[id*=course]"))
                    .map(
                        (el: any) =>
                            ({
                                id: "",
                                uid: "",
                                platform: "cx",
                                img: el.querySelector(".course-cover > a > img")?.src,
                                url: el.querySelector(".course-cover > a")?.href,
                                profile: el.querySelector(".course-info")?.innerText.split(/\n+/).splice(1).join(" "),
                                name: el.querySelector(".course-info")?.innerText.split(/\n+/)[0],
                            } as Course)
                    );
                });
                resolve(await initCourses({ script, courses, uid, platform: "cx" }));
                await script.page.close();
            }),
    });
}

/**
 * 获取智慧树课程列表
 * @param script 脚本上下文
 * @returns
 */
export function getZHSCourseList(uid: string): ScriptTask<Course[]> {
    return ScriptTask.createScript({
        name: "获取智慧树课程列表",
        timeout: 60 * 1000,
        target: async ({ task, script }) =>
            new Promise(async (resolve, reject) => {
                // 等待页面加载
                await new WaitForScript(script).documentReady();
                log(script.page.url());
                // 等待页面所有请求结束
                const courses = await script.page.evaluate(() => {
                    // 获取课程信息
                    const cs = Array.from(document.querySelectorAll("dl:not(.pos-rel)")).map(
                        (c: any) =>
                            ({
                                id: "",
                                uid: "",
                                platform: "zhs",
                                selector: `[src="${c.querySelector("img")?.src}"]`,
                                img: c.querySelector("img")?.src,
                                name: c.querySelector(".courseName")?.innerText,
                                profile: c.querySelector(".teacherName")?.innerText.split("\n").join("●"),
                            } as Course)
                    );
                    console.log("cs", cs);
                    return cs;
                });
                resolve(await initCourses({ script, courses, uid, platform: "zhs" }));
                await script.page.close();
            }),
    });
}

// 初始化课程数据
export async function initCourses({ script, courses, uid, platform }: { script: ScriptOptions; courses: Course[]; uid: string; platform: keyof Platform }) {
    log("img path:" + StoreGet("setting")?.system?.path?.courseImg);
    if (StoreGet("setting")?.system?.path?.courseImg) {
        for (const course of courses) {
            // 使用 url 或者 selector  作为加密信息来生成 hex id 值
            course.id = createHash("md5")
                .update(`${uid}-${platform}-${course.url || course.selector || Date.now()}-${course.profile}`)
                .digest("hex");
            // 账号id
            course.uid = uid;
            // 课程
            course.platform = platform;
            // 保存课程图片
            let clip = await getElementClip(script.page, `img[src="${course.img}"]`);
            if (clip) {
                const p = path.resolve(path.join(StoreGet("setting")?.system?.path?.courseImg, `${course.id}.png`));
                await script.page.screenshot({ clip, path: p });
                course.img = p;
            }
        }
        log("courses", courses);
        return courses;
    } else {
        throw new Error("获取课程失败，图片文件夹路径未设置！");
    }
}

export function GetCourseList(user: User): ScriptTask<Course[]> {
    if (user.platform === "cx") {
        return getCXCourseList(user.uid);
    } else if (user.platform === "zhs") {
        return getZHSCourseList(user.uid);
    } else {
        throw new Error("课程列表获取失败，请重试！ platform(" + user.platform + ") is not support");
    }
}
