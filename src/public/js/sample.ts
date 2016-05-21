/// <reference path="../../../typings/index.d.ts" />
import "babel-polyfill";
import "webrtc-adapter";

import { log, fancy_log, pc1OnDataChannel, pc2OnDataChannel } from "./samplelib.ts";
import * as webRTC from "./webrtc.ts";
import "./answerer.ts";

let button: any = document.getElementById("thebutton");
let text_pc1: any = document.getElementById("pc1_input");
let text_pc2: any = document.getElementById("pc2_input");
let blob_pc1: any = document.getElementById("pc1_browse");
let blob_pc2: any = document.getElementById("pc2_browse");
let datawindow: any = document.getElementById("datawindow");
let preset: any = document.getElementById("preset");
preset.checked = false;
let unordered: any = document.getElementById("unordered");
unordered.checked = false;
let stream_num: any = document.getElementById("stream_num");

let dc1: any;

let iter = 0;

function submitenter(myfield: any, e: any) {
    var keycode: any;
    if (window.event) keycode = (window.event as any).keyCode;
    else if (e) keycode = e.which;
    else return true;

    if (keycode == 13) {
        myfield.form.submit();
        return false;
    } else {
        return true;
    }
}

var sendit = function (which: any) {
    iter = iter + 1;
    //log("Sending message #" + iter + " this = " + this);
    if (which == 1) {
        dc1.send(text_pc1.value);
        text_pc1.value = "";
    } else if (which == 2) {
        (window as any).dc2.send(text_pc2.value);
        text_pc2.value = "";
    } else {
        log("Unknown send " + which);
    }
};

var sendblob = function (which: any) {
    iter = iter + 1;
    //log("Sending blob #" + iter + " this = " + this);
    if (which == 1) {
        dc1.send(blob_pc1.files[0]);
        blob_pc1.value = "";
    } else if (which == 2) {
        (window as any).dc2.send(blob_pc2.files[0]);
        blob_pc2.value = "";
    } else {
        log("Unknown sendblob " + which);
    }
};

function failed(code: any) {
    log("Failure callback: " + code);
}
(window as any).failed = failed;

// pc2.setLocal finished, call pc1.setRemote
function step5() {
    (window as any).pc1.setRemoteDescription((window as any).pc2_answer, step6, failed);
}
(window as any).step5 = step5;

// pc1.setRemote finished, make a data channel
function step6() {
    (window as any).pc1.didSetRemote = true;
    while ((window as any).pc1.ice_queued.length > 0) {
        (window as any).pc1.addIceCandidate((window as any).pc1.ice_queued.shift());
    }
    log("HIP HIP HOORAY");
}

async function start() {
    button.innerHTML = "Stop!";
    button.onclick = stop;
    while (datawindow.firstChild) {
        datawindow.removeChild(datawindow.firstChild);
    }

    (window as any).pc1 = new RTCPeerConnection(null);
    (window as any).pc1.ondatachannel = pc1OnDataChannel;
    let dict = preset.checked ? {
        protocol: "text/plain",
        negotiated: true,
        id: stream_num.value
    } : {}; // reliable (TCP-like)
    dc1 = (window as any).pc1.createDataChannel("This is pc1", dict);
    log("pc1 ordered=" + dc1.ordered);
    // dc1.binaryType = "blob";
    log("pc1 label " + dc1.label +
        ", stream=" + dc1.stream + " id=" + dc1.id);

    dc1.onmessage = function (evt: any) {
        if (evt.data instanceof Blob) {
            fancy_log("*** pc2 sent Blob: " + evt.data + ", length=" + evt.data.size, "blue");
        } else {
            fancy_log('pc2 said: ' + evt.data, "blue");
        }
    }
    dc1.onopen = function () {
        log("pc1 onopen fired for " + dc1);

        if (preset.checked) {
            dict = preset.checked ? {
                protocol: "text/chat", negotiated: true,
                id: stream_num.value
            } : {}; // reliable (TCP-like)
            (window as any).dc2 = (window as any).pc2.createDataChannel("This is pc2", dict);
            let ev: any = {};
            ev.channel = (window as any).dc2;
            (window as any).pc2.ondatachannel(ev);
        }
        dc1.send("pc1 says this will likely be queued...");
    }
    dc1.onclose = function () {
        log("pc1 onclose fired");
    };

    try {
        let offer = await (window as any).pc1.createOffer();
        (window as any).answerer.emit("step1", offer);
    } catch (e) {
        failed(e);
    }
}

function stop() {
    log("closed");
    (window as any).pc1.close();
    (window as any).pc2.close();

    button.innerHTML = "Start!";
    button.onclick = start;
}

(window as any).start = start;
(window as any).submitenter = submitenter;
(window as any).sendblob = sendblob;
(window as any).sendit = sendit;
