import { EventEmitter } from "events";
import { log } from "./samplelib.ts";

class Offerer extends EventEmitter {
    pc = new RTCPeerConnection(<any>{
        iceServers: [{
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
                "stun:stun01.sipphone.com",
                "stun:stun.ekiga.net",
                "stun:stun.fwdnet.net",
                "stun:stun.ideasip.com",
                "stun:stun.iptel.org",
                "stun:stun.rixtelecom.se",
                "stun:stun.schlund.de",
                "stun:stunserver.org",
                "stun:stun.softjoys.com",
                "stun:stun.voiparound.com",
                "stun:stun.voipbuster.com",
                "stun:stun.voipstunt.com",
                "stun:stun.voxgratia.org",
                "stun:stun.xten.com"
            ]
        }]
    });
    dc = this.pc.createDataChannel("");
    private didSetRemote = false;
    private iceCandidateQueue: RTCIceCandidate[] = [];

    constructor() {
        super();

        this.pc.ondatachannel = e => super.emit("datachannel", e);
        this.dc.onmessage = e => super.emit("datachannelmessage", e);
        this.dc.onopen = e => super.emit("datachannelopen", e);
        this.dc.onclose = e => super.emit("datachannelclose", e);
        this.pc.onicecandidate = e => {
            let candidate = e.candidate;
            if (!candidate) {
                log("pc1 got end-of-candidates signal");
                return;
            }
            log("pc1 found ICE candidate: " + JSON.stringify(candidate));
            (window as any).remoteAnswerer.emit("icecandidate", JSON.stringify(candidate))
        };
    }

    async beginOffer() {
        let offer: RTCSessionDescription = await (this.pc as any).createOffer();
        await this.pc.setLocalDescription(offer);
        // TODO: Implement for timeout
        return offer;
    }

    async putAnswer(answer: RTCSessionDescription) {
        await this.pc.setRemoteDescription(answer);
        this.didSetRemote = true;
        await Promise.all(this.iceCandidateQueue.map(
            x => (this.pc as any).addIceCandidate(x)));
    }

    async addIceCandidate(candidate: RTCIceCandidate) {
        if (this.didSetRemote) {
            await (this.pc as any).addIceCandidate(candidate);
        } else {
            this.iceCandidateQueue.push(candidate);
        }
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
