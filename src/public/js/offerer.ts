import { EventEmitter } from "events";
import PeerBase from "./peerbase";

export default class Offerer extends PeerBase {
    static async create(signaling: EventEmitter) {
        let instance = new this(signaling);
        let offer = await instance.offer();
        let answer: RTCSessionDescription = await new Promise((resolve, reject) => {
            let onAnswer = async (answerJSON: string) => {
                try {
                    instance.removeListener("answer", onAnswer);
                    resolve(new RTCSessionDescription(JSON.parse(answerJSON)));
                } catch (e) {
                    reject(e);
                }
            };
            instance.signaling.on("answer", onAnswer);
            instance.signaling.emit("offer", JSON.stringify(offer));
        });
        await instance.putAnswer(answer);
        return instance;
    }

    constructor(private signaling: EventEmitter) {
        super();

        this.setDataChannel(this.pc.createDataChannel(""));
        this.pc.onicecandidate = e => {
            try {
                let candidate = e.candidate;
                if (!candidate) {
                    return;
                }
                this.emit("icecandidate", JSON.stringify(candidate));
            } catch (e) {
                console.error(e.stack || e);
            }
        };
        signaling.on("icecandidate", this.onSignalingIceCandidate);
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

    private onSignalingIceCandidate = async (candidateJSON: string) => {
        try {
            let candidate = new RTCIceCandidate(JSON.parse(candidateJSON));
            await this.addIceCandidate(candidate);
        } catch (e) {
            console.error(e.stack || e);
        }
    };
}
