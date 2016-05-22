import PeerBase from "./peerbase";

export default class Offerer extends PeerBase {
    dc = this.pc.createDataChannel("");

    constructor() {
        super();

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

    putAnswer(answer: RTCSessionDescription) {
        return this.setRemoteDescription(answer);
    }
}
