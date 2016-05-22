import PeerBase from "./peerbase";

export default class Answerer extends PeerBase {
    async answerOffer(offer: RTCSessionDescription) {
        this.setRemoteDescription(offer);
        let answer: RTCSessionDescription = await (this.pc as any).createAnswer();
        await this.pc.setLocalDescription(answer);
        return answer;
    }
}
