let datawindow: any = document.getElementById("datawindow");

export function log(msg: any) {
    let div = document.getElementById("datawindow");
    div.innerHTML = div.innerHTML + "<p>" + msg + "</p>";
}

export function fancy_log(msg: any, color: any) {
    let pre = document.createElement("p");
    let message = '<span style="color: ' + color + ';">' + msg + '</span>';
    pre.style.wordWrap = "break-word";
    pre.innerHTML = message;
    datawindow.appendChild(pre); // (window).* here doesn't work right

    pre.scrollIntoView(false);
}

let num_channels: any;
num_channels = 0;
let datachannels = new Array(0);
let preset: any = document.getElementById("preset");
declare let dc2: any;
let iter2 = 0;

export function pc1OnDataChannel(event: any) {
    let mychannel = event.channel;
    // In case pc2 opens a channel
    log("pc1 onDataChannel [" + num_channels + "] = " + mychannel +
        ", stream=" + mychannel.stream + " id=" + mychannel.id +
        ", ordered=" + mychannel.ordered +
        ", label='" + mychannel.label + "'" +
        ", protocol='" + mychannel.protocol + "'");
    datachannels[num_channels] = mychannel;
    num_channels++;

    mychannel.onmessage = function (evt: any) {
        if (evt.data instanceof Blob) {
            fancy_log("*** pc2 sent Blob: " + evt.data + ", length=" + evt.data.size, "blue");
        } else {
            fancy_log('pc2 said: ' + evt.data, "blue");
        }
    }

    mychannel.onopen = function () {
        log("pc1 onopen fired for " + mychannel);
        mychannel.send("pc1 says Hello out there...");
        log("pc1 state: " + mychannel.state);
    }
    mychannel.onclose = function () {
        log("pc1 onclose fired");
    };
}

export function pc2OnDataChannel(event: any) {
    let mychannel = event.channel;
    log("pc2 onDataChannel [" + num_channels + "] = " + mychannel +
        ", stream=" + mychannel.stream + " id=" + mychannel.id +
        ", ordered=" + mychannel.ordered +
        ", label='" + mychannel.label + "'" +
        ", protocol='" + mychannel.protocol + "'");
    datachannels[num_channels] = mychannel;
    num_channels++;
    // mychannel.binaryType = "blob";
    if (!preset.checked) {
        (window as any).dc2 = mychannel;
    }
    mychannel.onmessage = function (evt: any) {
        iter2 = iter2 + 1;
        if (evt.data instanceof Blob) {
            fancy_log("*** pc1 sent Blob: " + evt.data + ", length=" + evt.data.size, "red");
        } else {
            fancy_log("pc1 said: " + evt.data, "red");
        }
    };
    mychannel.onopen = function () {
        log("*** pc2 onopen fired, sending to " + mychannel);
        mychannel.send("pc2 says Hi there!");
    };
    mychannel.onclose = function () {
        log("*** pc2 onclose fired");
    };
}

