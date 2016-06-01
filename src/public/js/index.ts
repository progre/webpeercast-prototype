/// <reference path="../../../typings/index.d.ts" />
import "babel-polyfill";
import "webrtc-adapter";
import Offerer from "./offerer.ts";

async function main() {
    initOfferer();
}

async function initOfferer() {
    let offerer = new Offerer();
    let socket = new WebSocket(`ws://${location.hostname}`);
    socket.addEventListener("open", async (e) => {
        socket.addEventListener("message", async (e) => {
            if (e.data.length === 0) {
                return;
            }
            let obj = JSON.parse(e.data);
            if (obj == null) {
                return;
            }
            switch (obj.type) {
                case "answer":
                    await setAnswer(offerer, obj.data);
                    break;
                case "icecandidate":
                    await addIceCandidate(offerer, obj.data);
                    break;
            }
        });
        offerer.on("icecandidate", (candidate: RTCIceCandidate) => {
            sendIceCandidate(socket, candidate);
        });
        offerer.on("datachannelopen", () => {
            offerer.on("datachannelmessage", (e: RTCMessageEvent) => console.log("offerer", e));
            offerer.dc.send("send to answerer");
        });

        await sendOffer(socket, offerer);
    });
}

async function sendOffer(socket: WebSocket, offerer: Offerer) {
    socket.send(JSON.stringify({
        type: "offer",
        data: await offerer.offer()
    }));
}

async function setAnswer(offerer: Offerer, answerInit: any) {
    let answer = new RTCSessionDescription(answerInit);
    await offerer.setAnswer(answer);
}

function sendIceCandidate(socket: WebSocket, candidate: RTCIceCandidate) {
    socket.send(JSON.stringify({ type: "icecandidate", data: candidate }));
}

async function addIceCandidate(offerer: Offerer, candidateInit: any) {
    let candidate = new RTCIceCandidate(candidateInit);
    await offerer.addIceCandidate(candidate);
}

main().catch(e => console.error(e.stack != null ? e.stack : e));
