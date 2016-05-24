/// <reference path="../../../typings/index.d.ts" />
import "babel-polyfill";
import "webrtc-adapter";
import { EventEmitter } from "events";
import Offerer from "./offerer.ts";
import Answerer from "./answerer.ts";

async function main() {
    let socket = new WebSocket(`ws://${location.hostname}`);
    socket.addEventListener("open", async () => {
        console.log("WebSocket open.");
        let answererEE = new EventEmitter();
        let offererEE = new EventEmitter();
        socket.addEventListener("message", e => {
            let data = JSON.parse(e.data);
            answererEE.emit(data.type, data.event);
            offererEE.emit(data.type, data.event);
        });
        answererEE.on("icecandidate", (e: Event) =>
            socket.send(JSON.stringify({ type: "icecandidate", event: e })));
        offererEE.on("icecandidate", (e: Event) =>
            socket.send(JSON.stringify({ type: "icecandidate", event: e })));
        offererEE.on("offer", (e: Event) =>
            socket.send(JSON.stringify({ type: "offer", event: e })));
        answererEE.on("answer", (e: Event) =>
            socket.send(JSON.stringify({ type: "answer", event: e })));
        let answerer = new Answerer(answererEE);
        answerer.on("datachannelopen", () => {
            answerer.on("datachannelmessage", (e: RTCMessageEvent) => console.log("answerer", e));
            answerer.dc.send("send to offerer");
        });
        let offerer = await Offerer.create(offererEE);
        offerer.on("datachannelopen", () => {
            offerer.on("datachannelmessage", (e: RTCMessageEvent) => console.log("offerer", e));
            offerer.dc.send("send to answerer");
        });
    });
}

main().catch(e => console.error(e.stack != null ? e.stack : e));
