/// <reference path="../typings/index.d.ts" />
try { require("source-map-support").install(); } catch (e) { /* empty */ }
const log4js = require("log4js");
import {app, BrowserWindow} from "electron";
import * as http from "http";
const st = require("st");

log4js.configure({
    appenders: [{ type: "console", layout: { type: "basic" } }]
});

async function main() {
    await new Promise((resolve, reject) => app.once("ready", resolve));
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: true,
        show: true
    });
    win.loadURL(`file://${__dirname}/renderer/index.html`);

    http.createServer(st({
        path: `${__dirname}/public`,
        index: "index.html"
    })).listen(80);
}

main().catch(e => log4js.getLogger().error(e.stack != null ? e.stack : e));
