/// <reference path="../../../typings/index.d.ts" />
import "babel-polyfill";
import "webrtc-adapter";
import { EventEmitter } from "events";
import Offerer from "../../public/js/offerer.ts";
import Answerer from "../../public/js/answerer.ts";

async function main() {
    let answererSignaling = new EventEmitter();
    let offererSignaling = new EventEmitter();
    offererSignaling.on("offer", (json: string) => {
        answererSignaling.emit("offer", json);
    });
    answererSignaling.on("answer", (json: string) => {
        offererSignaling.emit("answer", json);
    });
    let answerer = new Answerer(answererSignaling);
    answerer.on("icecandidate", (json: string) => {
        offererSignaling.emit("icecandidate", json);
    });
    answerer.on("datachannelopen", () => {
        answerer.on("datachannelmessage", (e: RTCMessageEvent) => console.log("answerer", e));
        answerer.dc.send("send to offerer");
    });
    let offerer = await Offerer.create(offererSignaling);
    offerer.on("icecandidate", (json: string) => {
        answererSignaling.emit("icecandidate", json);
    });
    offerer.on("datachannelopen", () => {
        offerer.on("datachannelmessage", (e: RTCMessageEvent) => console.log("offerer", e));
        offerer.dc.send("send to answerer");
    });
}

main().catch(e => console.error(e.stack != null ? e.stack : e));
