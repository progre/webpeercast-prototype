import { EventEmitter } from "events";
import { log, fancy_log, pc1OnDataChannel } from "./samplelib.ts";

let offerer = new EventEmitter();
(window as any).offerer = offerer;

export async function step0() {
    (window as any).pc1 = new RTCPeerConnection(null);
    (window as any).pc1.ondatachannel = pc1OnDataChannel;
    let dict = /*preset.checked ? {
        protocol: "text/plain",
        negotiated: true,
        id: stream_num.value
    } : */{}; // reliable (TCP-like)
    (window as any).dc1 = (window as any).pc1.createDataChannel("This is pc1", dict);
    log("pc1 ordered=" + (window as any).dc1.ordered);
    // dc1.binaryType = "blob";
    log("pc1 label " + (window as any).dc1.label +
        ", stream=" + (window as any).dc1.stream + " id=" + (window as any).dc1.id);

    (window as any).dc1.onmessage = function (evt: any) {
        if (evt.data instanceof Blob) {
            fancy_log("*** pc2 sent Blob: " + evt.data + ", length=" + evt.data.size, "blue");
        } else {
            fancy_log('pc2 said: ' + evt.data, "blue");
        }
    };
    (window as any).dc1.onopen = function () {
        log("pc1 onopen fired for " + (window as any).dc1);
        (window as any).dc1.send("pc1 says this will likely be queued...");
    };
    (window as any).dc1.onclose = function () {
        log("pc1 onclose fired");
    };

    try {
        let offer = await (window as any).pc1.createOffer();
        (window as any).answerer.emit("step1", offer);
    } catch (e) {
        (window as any).failed(e);
    }
}

offerer.on("step1_25", async (offer: any) => {
    (window as any).pc1.onicecandidate = async function (obj: any) {
        if (obj.candidate) {
            log("pc1 found ICE candidate: " + JSON.stringify(obj.candidate));
            if ((window as any).pc2_didSetRemote) {
                await ((window as any).pc2 as any).addIceCandidate(obj.candidate);
            } else {
                (window as any).pc2_ice_queued.push(obj.candidate);
            }
        } else {
            log("pc1 got end-of-candidates signal");
        }
    };

    await (window as any).pc1.setLocalDescription(offer);
});

// pc2.setLocal finished, call pc1.setRemote
offerer.on("step5", async () => {
    await (window as any).pc1.setRemoteDescription((window as any).pc2_answer);
    step6();
});

// pc1.setRemote finished, make a data channel
function step6() {
    (window as any).pc1_didSetRemote = true;
    while ((window as any).pc1_ice_queued.length > 0) {
        (window as any).pc1.addIceCandidate((window as any).pc1_ice_queued.shift());
    }
    log("HIP HIP HOORAY");
}
