/// <reference path="../../../typings/index.d.ts" />
import "babel-polyfill";
import "webrtc-adapter";
import { EventEmitter } from "events";
import Answerer from "../../public/js/answerer.ts";

async function main() {
    let socket = new WebSocket(`ws://${location.hostname}`);
    socket.addEventListener("open", async () => {
        console.log("WebSocket open.");
        let ee = new EventEmitter();
        socket.addEventListener("message", e => {
            let data = JSON.parse(e.data);
            ee.emit(data.type, data.event);
        });
        ee.on("icecandidate", (e: Event) =>
            socket.send(JSON.stringify({ type: "icecandidate", event: e })));
        ee.on("answer", (e: Event) =>
            socket.send(JSON.stringify({ type: "answer", event: e })));
        let answerer = new Answerer(ee);
        answerer.on("datachannelmessage", (e: RTCMessageEvent) =>
            console.log("answerer", e));
        answerer.on("datachannelopen", () => {
            answerer.dc.send("send to offerer");
        });
    });
}

main().catch(e => console.error(e.stack != null ? e.stack : e));
