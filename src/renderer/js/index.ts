/// <reference path="../../../typings/index.d.ts" />
import "babel-polyfill";
import "webrtc-adapter";

async function main() {
    await beginChannel();
}

async function receieveOfferFromAliceToBob(ws: WebSocket) {
    ws.addEventListener("message", ev => {
        
    });
}

async function beginChannel() {
    let stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });
    createRelay(stream)
        .then(sd => {
            // socket.json.send(pc.localDescription);
            $('#output').val(JSON.stringify(sd))
        })
        .catch(errorHandler);
}

main().catch(e => console.error(e.stack != null ? e.stack : e));
