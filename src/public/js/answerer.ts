import { log, pc2OnDataChannel } from "./samplelib.ts";
import { EventEmitter } from "events";

let answerer = new EventEmitter();
let pc2: RTCPeerConnection;

answerer.on("step1", async (offer: any) => {
    try {
        pc2 = new RTCPeerConnection(null);
        (window as any).pc2 = pc2;
        (window as any).pc1_didSetRemote = false;
        (window as any).pc2_didSetRemote = false;
        (window as any).pc1_ice_queued = [];
        (window as any).pc2_ice_queued = [];

        pc2.ondatachannel = pc2OnDataChannel;

        pc2.onicecandidate = function (obj: any) {
            if (obj.candidate) {
                log("pc2 found ICE candidate: " + JSON.stringify(obj.candidate));
                if ((window as any).pc1_didSetRemote) {
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

        await step2();
    } catch (e) {
        (window as any).failed(e);
    }
});

// pc1.setLocal finished, call pc2.setRemote
async function step2() {
    await pc2.setRemoteDescription((window as any).pc1_offer);
    await step3();
};

// pc2.setRemote finished, call pc2.createAnswer
async function step3() {
    (window as any).pc2_didSetRemote = true;
    while ((window as any).pc2_ice_queued.length > 0) {
        await ((window as any).pc2 as any).addIceCandidate((window as any).pc2_ice_queued.shift());
    }
    let answer = await ((window as any).pc2 as any).createAnswer();
    await step4(answer);
}

// pc2.createAnswer finished, call pc2.setLocal
async function step4(answer: any) {
    log("Answer: " + answer.sdp);
    await pc2.setLocalDescription(answer);
    (window as any).offerer.emit("answer", JSON.stringify(answer));
}

function close() {
    pc2.close();
}

(window as any).pc2_close = close;
(window as any).answerer = answerer;
