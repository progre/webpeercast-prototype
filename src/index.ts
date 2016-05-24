/// <reference path="../typings/index.d.ts" />
try { require("source-map-support").install(); } catch (e) { /* empty */ }
import * as http from "http";
const log4js = require("log4js");
const st = require("st");
import {server as WebSocketServer} from "websocket";
import {app, BrowserWindow} from "electron";

log4js.configure({
    appenders: [{ type: "console", layout: { type: "basic" } }]
});
const logger = log4js.getLogger();

async function main() {
    await new Promise((resolve, reject) => app.once("ready", resolve));
    logger.info("Initializing...");
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: true,
        show: true
    });
    win.loadURL(`file://${__dirname}/renderer/index.html`);

    let httpServer = http.createServer(st({
        path: `${__dirname}/public`,
        index: "index.html"
    }));
    let wsServer = new WebSocketServer({
        httpServer,
        autoAcceptConnections: false
    });
    wsServer.on("request", request => {
        try {
            logger.info("WebSocket requesting.");
            let connection = request.accept("", request.origin);
            connection.on("message", message => {
                logger.debug(message);
                connection.sendUTF(message.utf8Data);
            });
            connection.on("close", (reasonCode, description) => {
                console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
            });
        } catch (e) {
            logger.error(e.stack || e);
        }
    });
    httpServer.listen(80);
    logger.info("Server started.");
}

main().catch(e => log4js.getLogger().error(e.stack != null ? e.stack : e));
