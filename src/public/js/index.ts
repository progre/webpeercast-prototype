/// <reference path="../../../typings/index.d.ts" />
import "babel-polyfill";
import "webrtc-adapter";
import { EventEmitter } from "events";
import Offerer from "./offerer.ts";
import Answerer from "./answerer.ts";

async function main() {
    let ee = new EventEmitter();
    let answerer = new Answerer(ee);
    answerer.on("datachannelopen", () => {
        answerer.on("datachannelmessage", (e: RTCMessageEvent) => console.log("answerer", e));
        answerer.dc.send("send to offerer");
    });
    let offerer = await Offerer.create(ee);
    offerer.on("datachannelopen", () => {
        offerer.on("datachannelmessage", (e: RTCMessageEvent) => console.log("offerer", e));
        offerer.dc.send("send to answerer");
    });
}

main().catch(e => console.error(e.stack != null ? e.stack : e));
