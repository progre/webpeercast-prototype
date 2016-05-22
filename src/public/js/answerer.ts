import { log, pc2OnDataChannel } from "./samplelib.ts";
import { EventEmitter } from "events";

class Answerer extends EventEmitter {
    pc = new RTCPeerConnection(null);

    constructor() {
        super();

        this.pc.ondatachannel = e => super.emit("datachannel", e);
    }

    async receiveOffer(offer: RTCSessionDescription) {
        await this.pc.setRemoteDescription(offer);
        return await (this.pc as any).createAnswer() as RTCSessionDescription;
    }
}

let obj = new Answerer();
(window as any).answererObj = obj;
(window as any).pc2 = obj.pc;
(window as any).pc1_didSetRemote = false;
(window as any).pc2_didSetRemote = false;
(window as any).pc1_ice_queued = [];
(window as any).pc2_ice_queued = [];

let answerer = new EventEmitter();

answerer.on("step1", async (offer: any) => {
    try {
        obj.pc.onicecandidate = function (obj: any) {
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

        log("Offer: " + offer.sdp);

        (window as any).pc2_didSetRemote = true;
        while ((window as any).pc2_ice_queued.length > 0) {
            await ((window as any).pc2 as any).addIceCandidate((window as any).pc2_ice_queued.shift());
        }
        await step4(await obj.receiveOffer(offer));
    } catch (e) {
        (window as any).failed(e);
    }
});

// pc2.createAnswer finished, call pc2.setLocal
async function step4(answer: any) {
    log("Answer: " + answer.sdp);
    await obj.pc.setLocalDescription(answer);
    (window as any).remoteOfferer.emit("answer", JSON.stringify(answer));
}

function close() {
    obj.pc.close();
}

(window as any).pc2_close = close;
(window as any).remoteAnswerer = answerer;
