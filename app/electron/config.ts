import {  BrowserWindowConstructorOptions } from "electron";
import { StoreGet } from "../types/setting";

export const BrowserConfig: BrowserWindowConstructorOptions = {
    width: 900,
    height: 640,

    minWidth: 900,
    minHeight: 640,

    maximizable: false,
 
    frame: false,
    center: true,
    show: false,
    alwaysOnTop: !!StoreGet("setting")?.system?.win?.isAlwaysOnTop,
    webPreferences: {
        // 关闭拼写矫正
        spellcheck: false,
        webSecurity: false,
        // 开启node
        nodeIntegration: true,
        contextIsolation: false,
    },
};
