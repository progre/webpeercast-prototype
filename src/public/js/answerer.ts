import { EventEmitter } from "events";
import { log } from "./samplelib.ts";

class Answerer extends EventEmitter {
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
    private didSetRemote = false;
    private iceCandidateQueue: RTCIceCandidate[] = [];

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
            (window as any).remoteOfferer.emit("icecandidate", JSON.stringify(e.candidate));
        };
    }

    async answerOffer(offer: RTCSessionDescription) {
        await this.pc.setRemoteDescription(offer);
        this.didSetRemote = true;
        await Promise.all(this.iceCandidateQueue.map(
            x => (this.pc as any).addIceCandidate(x)));
        let answer: RTCSessionDescription = await (this.pc as any).createAnswer();
        await this.pc.setLocalDescription(answer);
        return answer;
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

let answerer = new EventEmitter();
(window as any).remoteAnswerer = answerer;

let obj = new Answerer();
(window as any).answererObj = obj;
(window as any).pc2 = obj.pc;

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
