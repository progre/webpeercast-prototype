/// <reference path="../../../typings/index.d.ts" />
import "babel-polyfill";
import "webrtc-adapter";
import { EventEmitter } from "events";
import Offerer from "../../public/js/offerer.ts";
import Answerer from "../../public/js/answerer.ts";

async function main() {
    let offererToAnswerer = new EventEmitter();
    let answererToOffer = new EventEmitter();
    initAnswerer(answererToOffer, offererToAnswerer);
    initOfferer(offererToAnswerer, answererToOffer);
}

async function initOfferer(emitter: { emit: Function }, receiver: { on: Function }) {
    let offerer = new Offerer();
    receiver.on("answer", async (json: string) => {
        try {
            let answer = new RTCSessionDescription(JSON.parse(json));
            await offerer.setAnswer(answer);
        } catch (e) {
            console.error(e.stack || e);
        }
    });
    receiver.on("icecandidate", async (json: string) => {
        try {
            let candidate = new RTCIceCandidate(JSON.parse(json));
            await offerer.addIceCandidate(candidate);
        } catch (e) {
            console.error(e.stack || e);
        }
    });
    offerer.on("icecandidate", (candidate: RTCIceCandidate) => {
        emitter.emit("icecandidate", JSON.stringify(candidate));
    });
    offerer.on("datachannelopen", () => {
        try {
            offerer.on("datachannelmessage", (e: RTCMessageEvent) => console.log("offerer", e));
            offerer.dc.send("send to answerer");
        } catch (e) {
            console.error(e.stack || e);
        }
    });
    emitter.emit("offer", JSON.stringify(await offerer.offer()));
}

async function initAnswerer(emitter: { emit: Function }, receiver: { on: Function }) {
    let answerer = new Answerer();
    receiver.on("offer", async (json: string) => {
        try {
            let offer = new RTCSessionDescription(JSON.parse(json));
            let answer = await answerer.answerOffer(offer);
            emitter.emit("answer", JSON.stringify(answer));
        } catch (e) {
            console.error(e.stack || e);
        }
    });
    receiver.on("icecandidate", async (json: string) => {
        try {
            let candidate = new RTCIceCandidate(JSON.parse(json));
            await answerer.addIceCandidate(candidate);
        } catch (e) {
            console.error(e.stack || e);
        }
    });
    answerer.on("icecandidate", (candidate: RTCIceCandidate) => {
        emitter.emit("icecandidate", JSON.stringify(candidate));
    });
    answerer.on("datachannelopen", () => {
        try {
            answerer.on("datachannelmessage", (e: RTCMessageEvent) => console.log("answerer", e));
            answerer.dc.send("send to offerer");
        } catch (e) {
            console.error(e.stack || e);
        }
    });
}

main().catch(e => console.error(e.stack != null ? e.stack : e));
