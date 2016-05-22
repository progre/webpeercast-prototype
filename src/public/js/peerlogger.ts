import PeerBase from "./peerbase.ts";
const logger = require("log4js").getLogger();

export function embedLog(peer: PeerBase) {
    peer.on("icecandidate", (e: RTCIceCandidateEvent) => {
        let candidate = e.candidate;
        if (!candidate) {
            logger.info("End of ICE candidates.");
            return;
        }
        logger.info("ICE candidate", candidate);
    });
    peer.on("datachannelopen", (e: Event) => {
        logger.info("DataChannel open", peer.dc);
    });
    peer.on("datachannel", (e: RTCDataChannelEvent) => {
        logger.info("DataChannel", e.channel);
    });
    peer.on("datachannelclose", (e: Event) => {
        logger.info("DataChannel close", peer.dc);
    });
}
