/// <reference path="../typings/index.d.ts" />
try { require("source-map-support").install(); } catch (e) { /* empty */ }
import * as http from "http";
const log4js = require("log4js");
const st = require("st");
import * as WebSocket from "ws";
import {app, BrowserWindow, ipcMain} from "electron";
log4js.configure({
    appenders: [{ type: "console", layout: { type: "basic" } }]
});
const logger = log4js.getLogger();

async function main() {
    await new Promise((resolve, reject) => app.once("ready", resolve));
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: true,
        show: true
    });
    win.loadURL(`file://${__dirname}/renderer/index.html`);

    initHTTPServer(win.webContents);
    initIpc();
}

let globalWebSocket: WebSocket;

function initHTTPServer(webContents: Electron.WebContents) {
    let httpServer = http.createServer(st({
        path: `${__dirname}/public`,
        index: "index.html"
    }));
    let wsServer = new WebSocket.Server({ server: httpServer });
    wsServer.on("connection", client => {
        try {
            client.on("message", message => {
                let obj = JSON.parse(message);
                switch (obj.type) {
                    case "offer":
                        webContents.send(obj.type, obj.data);
                        globalWebSocket = client;
                        break;
                    case "icecandidate":
                        webContents.send(obj.type, obj.data);
                        break;
                }
                client.send(message.utf8Data);
            });
            client.on("close", (code, message) => {
                logger.info("Closed.", code, message);
            });
        } catch (e) {
            logger.error(e.stack || e);
        }
    });
    httpServer.listen(80);
}

function initIpc() {
    ipcMain.on("answer", (e, arg) => {
        globalWebSocket.send(JSON.stringify({ type: "answer", data: JSON.parse(arg) }));
    });
    ipcMain.on("icecandidate", (e, arg) => {
        globalWebSocket.send(JSON.stringify({ type: "icecandidate", data: JSON.parse(arg) }));
    });
}

main().catch(e => log4js.getLogger().error(e.stack != null ? e.stack : e));
