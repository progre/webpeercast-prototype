/// <reference path="../../../typings/index.d.ts" />
import "babel-polyfill";
import "webrtc-adapter";
const ipcRenderer: Electron.IpcRenderer
    = (window as any).require("electron").ipcRenderer;
import Answerer from "../../public/js/answerer.ts";

async function main() {
    initAnswerer();
}

async function initAnswerer() {
    let answerer = new Answerer();
    ipcRenderer.on("offer", async (e, arg) => {
        try {
            await answerOffer(answerer, arg);
        } catch (e) {
            console.error(e.stack || e);
        }
    });
    ipcRenderer.on("icecandidate", async (e, arg) => {
        try {
            await addIceCandidate(answerer, arg);
        } catch (e) {
            console.error(e.stack || e);
        }
    });
    answerer.on("icecandidate", (candidate: RTCIceCandidate) => {
        sendIceCandidate(candidate);
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

async function answerOffer(answerer: Answerer, offerInit: any) {
    let offer = new RTCSessionDescription(offerInit);
    let answer = await answerer.answerOffer(offer);
    ipcRenderer.send("answer", JSON.stringify(answer));
}

function sendIceCandidate(candidate: RTCIceCandidate) {
    ipcRenderer.send("icecandidate", JSON.stringify(candidate));
}

async function addIceCandidate(answerer: Answerer, candidateInit: any) {
    let candidate = new RTCIceCandidate(candidateInit);
    await answerer.addIceCandidate(candidate);
}

main().catch(e => console.error(e.stack != null ? e.stack : e));
