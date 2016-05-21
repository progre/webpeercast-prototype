import { log, fancy_log, pc1OnDataChannel, pc2OnDataChannel } from "./samplelib.ts";
import {EventEmitter} from "events";

let answerer = new EventEmitter();
answerer.on("step1", async (offer: any) => {
    try {
        (window as any).pc2 = new RTCPeerConnection(null);
        (window as any).pc1.didSetRemote = false;
        (window as any).pc2.didSetRemote = false;
        (window as any).pc1.ice_queued = [];
        (window as any).pc2.ice_queued = [];

        (window as any).pc2.ondatachannel = pc2OnDataChannel;

        (window as any).pc2.onicecandidate = function (obj: any) {
            if (obj.candidate) {
                log("pc2 found ICE candidate: " + JSON.stringify(obj.candidate));
                if ((window as any).pc1.didSetRemote) {
                    (window as any).pc1.addIceCandidate(obj.candidate);
                } else {
                    (window as any).pc1.ice_queued.push(obj.candidate);
                }
            } else {
                log("pc2 got end-of-candidates signal");
            }
        };

        (window as any).pc1_offer = offer;
        log("Offer: " + offer.sdp);

        (window as any).pc1.onicecandidate = function (obj: any) {
            if (obj.candidate) {
                log("pc1 found ICE candidate: " + JSON.stringify(obj.candidate));
                if ((window as any).pc2.didSetRemote) {
                    (window as any).pc2.addIceCandidate(obj.candidate);
                } else {
                    (window as any).pc2.ice_queued.push(obj.candidate);
                }
            } else {
                log("pc1 got end-of-candidates signal");
            }
        };

        await (window as any).pc1.setLocalDescription(offer);
        await step1_5();
    } catch (e) {
        (window as any).failed(e);
    }
});

async function step1_5() {
    await step2();
}

// pc1.setLocal finished, call pc2.setRemote
async function step2() {
    await (window as any).pc2.setRemoteDescription((window as any).pc1_offer);
    await step3();
};

// pc2.setRemote finished, call pc2.createAnswer
async function step3() {
    (window as any).pc2.didSetRemote = true;
    while ((window as any).pc2.ice_queued.length > 0) {
        (window as any).pc2.addIceCandidate((window as any).pc2.ice_queued.shift());
    }
    let answer = await (window as any).pc2.createAnswer();
    await step4(answer);
}

// pc2.createAnswer finished, call pc2.setLocal
async function step4(answer: any) {
    (window as any).pc2_answer = answer;
    log("Answer: " + answer.sdp);
    await (window as any).pc2.setLocalDescription(answer);
    (window as any).step5();
}

(window as any).answerer = answerer;
