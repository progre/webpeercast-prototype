let configuration = {
    iceServers: [{ urls: "stun:services.mozilla.com:3478" }]
};

export async function sendOfferFromAliceToBob(ws: WebSocket) {
    let pc = new RTCPeerConnection(configuration);
    pc.onicecandidate = e => {
        // TODO: たぶんいらないので消す
        if (e.candidate == null) {
            console.error("Has no candidate", e);
            return;
        }
        console.log(e);
    };
    ws.send(await createOfferForRemote(pc));
}

export async function createOfferForRemote(pc: RTCPeerConnection) {
    let offer: RTCSessionDescription = await (<any>pc).createOffer();
    await pc.setLocalDescription(offer);
    return offer;
}
