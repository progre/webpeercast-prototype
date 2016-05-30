/// <reference path="../typings/index.d.ts" />
try { require("source-map-support").install(); } catch (e) { /* empty */ }
import * as http from "http";
const log4js = require("log4js");
const st = require("st");
import {server as WebSocketServer} from "websocket";
import { app, BrowserWindow, ipcMain } from "electron";

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

    initHTTPServer();
    initIpc();
}

function initHTTPServer() {
    let httpServer = http.createServer(st({
        path: `${__dirname}/public`,
        index: "index.html"
    }));
    let wsServer = new WebSocketServer({
        httpServer,
        autoAcceptConnections: true
    });
    wsServer.on("request", request => {
        // if (!originIsAllowed(request.origin)) {
        //     // Make sure we only accept requests from an allowed origin 
        //     request.reject();
        //     console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        //     return;
        // }

        let connection = request.accept("echo-protocol", request.origin);
        connection.on("message", message => {
            if (message.type === "utf8") {
                console.log("Received Message: " + message.utf8Data);
                connection.sendUTF(message.utf8Data);
            } else if (message.type === "binary") {
                console.log("Received Binary Message of " + message.binaryData.length + " bytes");
                connection.sendBytes(message.binaryData);
            }
        });
        connection.on("close", (reasonCode, description) => {
            console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
        });
    });
    httpServer.listen(80);
}

function initIpc() {
    ipcMain.on("offer", (e, arg) => {
        e.sender.send("offer", arg);
    });
    ipcMain.on("answer", (e, arg) => {
        e.sender.send("answer", arg);
    });
    ipcMain.on("icecandidate", (e, arg) => {
        e.sender.send("icecandidate", arg);
    });
}

main().catch(e => log4js.getLogger().error(e.stack != null ? e.stack : e));
