import PeerBase from "./peerbase";

export default class Answerer extends PeerBase {
    constructor() {
        super();

        this.pc.ondatachannel = (e: RTCDataChannelEvent) => {
            this.setDataChannel(e.channel);
        };
    }

    async answerOffer(offer: RTCSessionDescription) {
        this.setRemoteDescription(offer);
        let answer: RTCSessionDescription = await (this.pc as any).createAnswer();
        await this.pc.setLocalDescription(answer);
        return answer;
    }
}
