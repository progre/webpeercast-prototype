import { EventEmitter } from "events";
import { log } from "./samplelib.ts";

class Offerer extends EventEmitter {
    pc = new RTCPeerConnection(null);
    dc = this.pc.createDataChannel("This is pc1", {});

    constructor() {
        super();

        this.pc.ondatachannel = e => super.emit("datachannel", e);
        this.dc.onmessage = e => super.emit("datachannelmessage", e);
        this.dc.onopen = e => super.emit("datachannelopen", e);
        this.dc.onclose = e => super.emit("datachannelclose", e);
    }

    async beginOffer() {
        let offer: RTCSessionDescription = await (this.pc as any).createOffer();
        await this.pc.setLocalDescription(offer);
        // TODO: Implement for timeout
        return offer;
    }

    async putAnswer(answer: RTCSessionDescription) {
        await this.pc.setRemoteDescription(answer);
    }

    close() {
        this.pc.close();
    }
}

let offerer = new EventEmitter();
(window as any).remoteOfferer = offerer;

let obj = new Offerer();
(window as any).offererObj = obj;
(window as any).pc1 = obj.pc;
(window as any).dc1 = obj.dc;

export async function step0() {
    try {
        let offer = await obj.beginOffer();
        obj.pc.onicecandidate = async function (obj: any) {
            if (obj.candidate) {
                log("pc1 found ICE candidate: " + JSON.stringify(obj.candidate));
                if ((window as any).pc2_didSetRemote) {
                    await ((window as any).pc2 as any).addIceCandidate(obj.candidate);
                } else {
                    (window as any).pc2_ice_queued.push(obj.candidate);
                }
            } else {
                log("pc1 got end-of-candidates signal");
            }
        };
        (window as any).remoteAnswerer.emit("step1", offer);
    } catch (e) {
        (window as any).failed(e);
    }
}

// pc2.setLocal finished, call pc1.setRemote
offerer.on("answer", async (answer: any) => {
    await obj.putAnswer(new RTCSessionDescription(JSON.parse(answer)));
    await step6();
});

// pc1.setRemote finished, make a data channel
async function step6() {
    (window as any).pc1_didSetRemote = true;
    while ((window as any).pc1_ice_queued.length > 0) {
        await (obj.pc as any).addIceCandidate((window as any).pc1_ice_queued.shift());
    }
    log("HIP HIP HOORAY");
}
