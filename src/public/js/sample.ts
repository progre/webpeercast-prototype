/// <reference path="../../../typings/index.d.ts" />
import "babel-polyfill";
import "webrtc-adapter";

import { log, fancy_log, pc1OnDataChannel, pc2OnDataChannel } from "./samplelib.ts";
import "./pc2.ts";
import { step0 } from "./pc1.ts";

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
    // log("Sending message #" + iter + " this = " + this);
    if (which === 1) {
        (window as any).dc1.send("1: " + text_pc1.value);
        text_pc1.value = "";
    } else if (which === 2) {
        (window as any).dc2.send("2: " + text_pc2.value);
        text_pc2.value = "";
    } else {
        log("Unknown send " + which);
    }
};

var sendblob = function (which: any) {
    iter = iter + 1;
    // log("Sending blob #" + iter + " this = " + this);
    if (which === 1) {
        (window as any).dc1.send(blob_pc1.files[0]);
        blob_pc1.value = "";
    } else if (which === 2) {
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

async function start() {
    button.innerHTML = "Stop!";
    button.onclick = stop;
    while (datawindow.firstChild) {
        datawindow.removeChild(datawindow.firstChild);
    }

    (window as any).offererObj.on("datachannel", pc1OnDataChannel);
    (window as any).answererObj.on("datachannel", pc2OnDataChannel);
    (window as any).offererObj.on("datachannelmessage", (evt: any) => {
        console.log(evt);
        if (evt.data instanceof Blob) {
            fancy_log("*** pc2 sent Blob: " + evt.data + ", length=" + evt.data.size, "blue");
        } else {
            fancy_log("pc2 said: " + evt.data, "blue");
        }
    });
    (window as any).offererObj.on("datachannelopen", () => {
        log("pc1 onopen fired for " + (window as any).offererObj.dc);
        (window as any).offererObj.dc.send("pc1 says this will likely be queued...");
    });
    (window as any).offererObj.on("datachannelclose", () => {
        log("pc1 onclose fired");
    });

    await step0();
}

function stop() {
    log("closed");
    (window as any).offererObj.close();
    (window as any).answererObj.close();

    button.innerHTML = "Start!";
    button.onclick = start;
}

(window as any).start = start;
(window as any).submitenter = submitenter;
(window as any).sendblob = sendblob;
(window as any).sendit = sendit;
