import { log, pc2OnDataChannel } from "./samplelib.ts";
import { EventEmitter } from "events";

class Answerer extends EventEmitter {
    pc = new RTCPeerConnection(null);

    constructor() {
        super();

        this.pc.ondatachannel = e => super.emit("datachannel", e);

        this.pc.onicecandidate = e => {
            let candidate = e.candidate;
            if (!candidate) {
                log("pc2 got end-of-candidates signal");
                return;
            }
            log("pc2 found ICE candidate: " + JSON.stringify(e.candidate));
            if ((window as any).pc1_didSetRemote) {
                (window as any).pc1.addIceCandidate(e.candidate);
            } else {
                (window as any).pc1_ice_queued.push(e.candidate);
            }
        };
    }

    async answerOffer(offer: RTCSessionDescription) {
        await this.pc.setRemoteDescription(offer);
        let answer: RTCSessionDescription = await (this.pc as any).createAnswer();
        await this.pc.setLocalDescription(answer);
        return answer;
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

answerer.on("offer", async (offerJson: string) => {
    try {
        let offer = new RTCSessionDescription(JSON.parse(offerJson));
        log("Offer: " + offer.sdp);

        (window as any).pc2_didSetRemote = true;
        while ((window as any).pc2_ice_queued.length > 0) {
            await ((window as any).pc2 as any).addIceCandidate((window as any).pc2_ice_queued.shift());
        }
        let answer = await obj.answerOffer(offer);
        log("Answer: " + answer.sdp);
        (window as any).remoteOfferer.emit("answer", JSON.stringify(answer));
    } catch (e) {
        (window as any).failed(e);
    }
});


function close() {
    obj.pc.close();
}

(window as any).pc2_close = close;
(window as any).remoteAnswerer = answerer;
