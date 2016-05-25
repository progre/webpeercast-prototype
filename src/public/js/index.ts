/// <reference path="../../../typings/index.d.ts" />
import "babel-polyfill";
import "webrtc-adapter";
import { EventEmitter } from "events";
import Offerer from "./offerer.ts";

async function main() {
    let socket = new WebSocket(`ws://${location.hostname}`);
    socket.addEventListener("open", async () => {
        console.log("WebSocket open.");
        let offererEE = new EventEmitter();
        socket.addEventListener("message", e => {
            let data = JSON.parse(e.data);
            offererEE.emit(data.type, data.event);
        });
        offererEE.on("icecandidate", (e: Event) =>
            socket.send(JSON.stringify({ type: "icecandidate", event: e })));
        offererEE.on("offer", (e: Event) =>
            socket.send(JSON.stringify({ type: "offer", event: e })));
        let offerer = await Offerer.create(offererEE);
        offerer.on("datachannelmessage", (e: RTCMessageEvent) =>
            console.log("offerer", e));
        offerer.on("datachannelopen", () => {
            offerer.dc.send("send to answerer");
        });
    });
}

main().catch(e => console.error(e.stack != null ? e.stack : e));
