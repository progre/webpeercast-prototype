import { EventEmitter } from "events";
import PeerBase from "./peerbase";

export default class Answerer extends PeerBase {
    constructor(private signaling: EventEmitter) {
        super();

        this.pc.ondatachannel = (e: RTCDataChannelEvent) => {
            this.setDataChannel(e.channel);
        };
        this.pc.onicecandidate = e => {
            try {
                let candidate = e.candidate;
                if (!candidate) {
                    return;
                }
                this.emit("icecandidate", JSON.stringify(e.candidate));
            } catch (e) {
                (window as any).failed(e);
            }
        };

        signaling.on("icecandidate", this.onSignalingIceCandidate);
        signaling.on("offer", this.onSignalingOffer);
    }

    close() {
        this.signaling.removeListener("icecandidate", this.onSignalingIceCandidate);
        this.signaling.removeListener("offer", this.onSignalingOffer);
    }

    private async answerOffer(offer: RTCSessionDescription) {
        this.setRemoteDescription(offer);
        let answer: RTCSessionDescription = await (this.pc as any).createAnswer();
        await this.pc.setLocalDescription(answer);
        return answer;
    }

    private onSignalingIceCandidate = async (candidateJSON: string) => {
        try {
            let candidate = new RTCIceCandidate(JSON.parse(candidateJSON));
            await this.addIceCandidate(candidate);
        } catch (e) {
            console.error(e.stack || e);
        }
    };

    private onSignalingOffer = async (offerJSON: string) => {
        try {
            let offer = new RTCSessionDescription(JSON.parse(offerJSON));
            console.log("Offer", offer);
            let answer = await this.answerOffer(offer);
            console.log("Answer", answer);
            this.signaling.emit("answer", JSON.stringify(answer));
        } catch (e) {
            console.error(e.stack || e);
        }
    };
}
