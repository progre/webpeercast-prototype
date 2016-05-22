import { EventEmitter } from "events";
import { log } from "./samplelib.ts";
import Answerer from "./answerer.ts";

let answerer = new EventEmitter();
(window as any).remoteAnswerer = answerer;

let obj = new Answerer();
obj.on("icecandidate", (e: RTCIceCandidateEvent) => {
    try {
        let candidate = e.candidate;
        if (!candidate) {
            log("pc2 got end-of-candidates signal");
            return;
        }
        log("pc2 found ICE candidate: " + JSON.stringify(e.candidate));
        (window as any).remoteOfferer.emit("icecandidate", JSON.stringify(e.candidate));
    } catch (e) {
        (window as any).failed(e);
    }
});

(window as any).answererObj = obj;

answerer.on("offer", async (offerJSON: string) => {
    try {
        let offer = new RTCSessionDescription(JSON.parse(offerJSON));
        log("Offer: " + offer.sdp);

        let answer = await obj.answerOffer(offer);
        log("Answer: " + answer.sdp);
        (window as any).remoteOfferer.emit("answer", JSON.stringify(answer));
    } catch (e) {
        (window as any).failed(e);
    }
});

answerer.on("icecandidate", async (candidateJSON: string) => {
    try {
        let candidate = new RTCIceCandidate(JSON.parse(candidateJSON));
        await obj.addIceCandidate(candidate);
    } catch (e) {
        (window as any).failed(e);
    }
});
