import { EventEmitter } from "events";

export default class PeerBase extends EventEmitter {
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
    dc: RTCDataChannel;
    private didSetRemote = false;
    private iceCandidateQueue: RTCIceCandidate[] = [];

    constructor() {
        super();

        this.pc.ondatachannel = e => super.emit("datachannel", e);
        this.pc.onicecandidate = e => super.emit("icecandidate", e);
    }

    protected setDataChannel(dc: RTCDataChannel) {
        this.dc = dc;
        this.dc.onopen = e => super.emit("datachannelopen", e);
        this.dc.onmessage = e => super.emit("datachannelmessage", e);
        this.dc.onclose = e => super.emit("datachannelclose", e);
    }

    protected async setRemoteDescription(sd: RTCSessionDescription) {
        await this.pc.setRemoteDescription(sd);
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
