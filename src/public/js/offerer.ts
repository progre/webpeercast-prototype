import PeerBase from "./peerbase";

export default class Offerer extends PeerBase {
    constructor() {
        super();

        this.setDataChannel(this.pc.createDataChannel(""));
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
