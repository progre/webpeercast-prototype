import { EventEmitter } from "events";
import { fancy_log } from "./samplelib.ts";
import Answerer from "./answerer.ts";

export function init(remoteOfferer: EventEmitter) {
    let remote = new EventEmitter();
    let obj = new Answerer(remote);
    obj.on("datachannelmessage", (e: RTCMessageEvent) => {
        if (e.data instanceof Blob) {
            fancy_log("*** pc1 sent Blob: " + e.data + ", length=" + e.data.size, "red");
        } else {
            fancy_log("pc1 said: " + e.data, "red");
        }
    });
    return { obj, remote };
}
