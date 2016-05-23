import { EventEmitter } from "events";
import PeerBase from "./peerbase";

export default class Offerer extends PeerBase {
    private signaling: EventEmitter;
    private onSignalingIceCandidate: Function;

    constructor() {
        super();

        this.setDataChannel(this.pc.createDataChannel(""));
        // send local candidate to remote
        this.pc.onicecandidate = e => {
            try {
                let candidate = e.candidate;
                if (!candidate) {
                    return;
                }
                if (this.signaling != null) {
                    this.signaling.emit("icecandidate", JSON.stringify(candidate));
                }
            } catch (e) {
                console.error(e.stack || e);
            }
        };
        // receive remote candidate to local
        this.onSignalingIceCandidate = async (candidateJSON: string) => {
            try {
                let candidate = new RTCIceCandidate(JSON.parse(candidateJSON));
                await this.addIceCandidate(candidate);
            } catch (e) {
                console.error(e.stack || e);
            }
        };
    }

    async open(signaling: EventEmitter) {
        if (this.signaling != null) {
            this.close();
        }
        this.signaling = signaling;
        this.signaling.on("icecandidate", this.onSignalingIceCandidate);
        let offer = await this.offer();
        let answer: RTCSessionDescription = await new Promise((resolve, reject) => {
            let onAnswer = async (answerJSON: string) => {
                try {
                    this.removeListener("answer", onAnswer);
                    resolve(new RTCSessionDescription(JSON.parse(answerJSON)));
                } catch (e) {
                    reject(e);
                }
            };
            this.signaling.on("answer", onAnswer);
            this.signaling.emit("offer", JSON.stringify(offer));
        });
        await this.putAnswer(answer);
    }

    close() {
        super.close();

        this.signaling.removeListener("icecandidate", this.onSignalingIceCandidate);
    }

    private async offer() {
        let offer: RTCSessionDescription = await (this.pc as any).createOffer();
        await this.pc.setLocalDescription(offer);
        // TODO: Implement for timeout
        return offer;
    }

    private putAnswer(answer: RTCSessionDescription) {
        return this.setRemoteDescription(answer);
    }
}
