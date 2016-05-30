/// <reference path="../../../typings/index.d.ts" />
import "babel-polyfill";
import "webrtc-adapter";
import { EventEmitter } from "events";
const ipcRenderer: Electron.IpcRenderer = (window as any).require("electron").ipcRenderer;
import Offerer from "../../public/js/offerer.ts";
import Answerer from "../../public/js/answerer.ts";

async function main() {
    // let offererToAnswerer = new EventEmitter();
    // let answererToOffer = new EventEmitter();
    initAnswerer();
    initOfferer();
}

async function initOfferer() {
    let offerer = new Offerer();
    ipcRenderer.on("answer", async (e, arg) => {
        try {
            let answer = new RTCSessionDescription(JSON.parse(arg));
            await offerer.setAnswer(answer);
        } catch (e) {
            console.error(e.stack || e);
        }
    });
    ipcRenderer.on("icecandidate", async (e, arg) => {
        try {
            let candidate = new RTCIceCandidate(JSON.parse(arg));
            await offerer.addIceCandidate(candidate);
        } catch (e) {
            console.error(e.stack || e);
        }
    });
    offerer.on("icecandidate", (candidate: RTCIceCandidate) => {
        ipcRenderer.send("icecandidate", JSON.stringify(candidate));
    });
    offerer.on("datachannelopen", () => {
        try {
            offerer.on("datachannelmessage", (e: RTCMessageEvent) => console.log("offerer", e));
            offerer.dc.send("send to answerer");
        } catch (e) {
            console.error(e.stack || e);
        }
    });
    ipcRenderer.send("offer", JSON.stringify(await offerer.offer()));
}

async function initAnswerer() {
    let answerer = new Answerer();
    ipcRenderer.on("offer", async (e, arg) => {
        try {
            let offer = new RTCSessionDescription(JSON.parse(arg));
            let answer = await answerer.answerOffer(offer);
            ipcRenderer.send("answer", JSON.stringify(answer));
        } catch (e) {
            console.error(e.stack || e);
        }
    });
    ipcRenderer.on("icecandidate", async (e, arg) => {
        try {
            let candidate = new RTCIceCandidate(JSON.parse(arg));
            await answerer.addIceCandidate(candidate);
        } catch (e) {
            console.error(e.stack || e);
        }
    });
    answerer.on("icecandidate", (candidate: RTCIceCandidate) => {
        ipcRenderer.send("icecandidate", JSON.stringify(candidate));
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
