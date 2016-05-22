import { EventEmitter } from "events";
import { log } from "./samplelib.ts";
import Offerer from "./offerer.ts";

let offerer = new EventEmitter();
(window as any).remoteOfferer = offerer;

let obj = new Offerer();
obj.on("icecandidate", (e: RTCIceCandidateEvent) => {
    try {
        let candidate = e.candidate;
        if (!candidate) {
            log("pc1 got end-of-candidates signal");
            return;
        }
        log("pc1 found ICE candidate: " + JSON.stringify(candidate));
        (window as any).remoteAnswerer.emit("icecandidate", JSON.stringify(candidate))
    } catch (e) {
        (window as any).failed(e);
    }
});

(window as any).offererObj = obj;
(window as any).dc1 = obj.dc;

export async function step0() {
    try {
        let offer = await obj.beginOffer();
        (window as any).remoteAnswerer.emit("offer", JSON.stringify(offer));
    } catch (e) {
        (window as any).failed(e);
    }
}

// pc2.setLocal finished, call pc1.setRemote
offerer.on("answer", async (answerJSON: string) => {
    try {
        let answer = new RTCSessionDescription(JSON.parse(answerJSON));
        await obj.putAnswer(answer);
        log("HIP HIP HOORAY");
    } catch (e) {
        (window as any).failed(e);
    }
});

offerer.on("icecandidate", async (candidateJSON: string) => {
    try {
        let candidate = new RTCIceCandidate(JSON.parse(candidateJSON));
        await obj.addIceCandidate(candidate);
    } catch (e) {
        (window as any).failed(e);
    }
});
