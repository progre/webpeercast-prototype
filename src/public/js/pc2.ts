import { EventEmitter } from "events";
import { log, fancy_log } from "./samplelib.ts";
import Answerer from "./answerer.ts";

export function init(remoteOfferer: EventEmitter) {
    let remote = new EventEmitter();
    let obj = new Answerer();
    obj.on("icecandidate", (e: RTCIceCandidateEvent) => {
        try {
            let candidate = e.candidate;
            if (!candidate) {
                return;
            }
            remote.emit("icecandidate", JSON.stringify(e.candidate));
        } catch (e) {
            (window as any).failed(e);
        }
    });
    obj.on("datachannelmessage", (e: RTCMessageEvent) => {
        if (e.data instanceof Blob) {
            fancy_log("*** pc1 sent Blob: " + e.data + ", length=" + e.data.size, "red");
        } else {
            fancy_log("pc1 said: " + e.data, "red");
        }
    });

    remote.on("offer", async (offerJSON: string) => {
        try {
            console.log("offer", offerJSON);
            let offer = new RTCSessionDescription(JSON.parse(offerJSON));
            log("Offer: " + offer.sdp);

            let answer = await obj.answerOffer(offer);
            log("Answer: " + answer.sdp);
            remote.emit("answer", JSON.stringify(answer));
        } catch (e) {
            (window as any).failed(e);
        }
    });
    remote.on("icecandidate", async (candidateJSON: string) => {
        try {
            let candidate = new RTCIceCandidate(JSON.parse(candidateJSON));
            await obj.addIceCandidate(candidate);
        } catch (e) {
            (window as any).failed(e);
        }
    });
    return { obj, remote }
}
