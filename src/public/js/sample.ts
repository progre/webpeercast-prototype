import "webrtc-adapter";

import { log, fancy_log, pc1OnDataChannel, pc2OnDataChannel } from "./samplelib.ts";

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

let pc1: any;
let pc2: any;
let dc1: any;

let pc1_offer: any;
let pc2_answer: any;
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

// pc1.createOffer finished, call pc1.setLocal
function step1(offer: any) {
    pc2 = new RTCPeerConnection(null);
    pc1.didSetRemote = false;
    pc2.didSetRemote = false;
    pc1.ice_queued = [];
    pc2.ice_queued = [];

    pc2.ondatachannel = pc2OnDataChannel;

    pc2.onicecandidate = function (obj: any) {
        if (obj.candidate) {
            log("pc2 found ICE candidate: " + JSON.stringify(obj.candidate));
            if (pc1.didSetRemote) {
                pc1.addIceCandidate(obj.candidate);
            } else {
                pc1.ice_queued.push(obj.candidate);
            }
        } else {
            log("pc2 got end-of-candidates signal");
        }
    }

    pc1_offer = offer;
    log("Offer: " + offer.sdp);

    pc1.onicecandidate = function (obj: any) {
        if (obj.candidate) {
            log("pc1 found ICE candidate: " + JSON.stringify(obj.candidate));
            if (pc2.didSetRemote) {
                pc2.addIceCandidate(obj.candidate);
            } else {
                pc2.ice_queued.push(obj.candidate);
            }
        } else {
            log("pc1 got end-of-candidates signal");
        }
    }

    pc1.setLocalDescription(offer, step1_5, failed);
}

function step1_5() {
    setTimeout(step2, 0);
}

// pc1.setLocal finished, call pc2.setRemote
function step2() {
    pc2.setRemoteDescription(pc1_offer, step3, failed);
};

// pc2.setRemote finished, call pc2.createAnswer
function step3() {
    pc2.didSetRemote = true;
    while (pc2.ice_queued.length > 0) {
        pc2.addIceCandidate(pc2.ice_queued.shift());
    }
    pc2.createAnswer(step4, failed);
}

// pc2.createAnswer finished, call pc2.setLocal
function step4(answer: any) {
    pc2_answer = answer;
    log("Answer: " + answer.sdp);
    pc2.setLocalDescription(answer, step5, failed);
}

// pc2.setLocal finished, call pc1.setRemote
function step5() {
    pc1.setRemoteDescription(pc2_answer, step6, failed);
}

// pc1.setRemote finished, make a data channel
function step6() {
    pc1.didSetRemote = true;
    while (pc1.ice_queued.length > 0) {
        pc1.addIceCandidate(pc1.ice_queued.shift());
    }
    log("HIP HIP HOORAY");
}

function start() {
    button.innerHTML = "Stop!";
    button.onclick = stop;
    while (datawindow.firstChild) {
        datawindow.removeChild(datawindow.firstChild);
    }

    pc1 = new RTCPeerConnection(null);
    pc1.ondatachannel = pc1OnDataChannel;
    let dict = preset.checked ? {
        protocol: "text/plain",
        negotiated: true,
        id: stream_num.value
    } : {}; // reliable (TCP-like)
    dc1 = pc1.createDataChannel("This is pc1", dict);
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
            (window as any).dc2 = pc2.createDataChannel("This is pc2", dict);
            let ev: any = {};
            ev.channel = (window as any).dc2;
            pc2.ondatachannel(ev);
        }
        dc1.send("pc1 says this will likely be queued...");
    }
    dc1.onclose = function () {
        log("pc1 onclose fired");
    };

    pc1.createOffer(step1, failed);
}

function stop() {
    log("closed");
    pc1.close();
    pc2.close();

    button.innerHTML = "Start!";
    button.onclick = start;
}

(window as any).start = start;
(window as any).submitenter = submitenter;
(window as any).sendblob = sendblob;
(window as any).sendit = sendit;
