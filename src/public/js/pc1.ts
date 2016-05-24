import { fancy_log } from "./samplelib.ts";
import Offerer from "./offerer.ts";

export async function step0() {
    let obj = await Offerer.create((window as any).remoteAnswerer);
    obj.on("datachannelmessage", (evt: any) => {
        if (evt.data instanceof Blob) {
            fancy_log("*** pc2 sent Blob: " + evt.data + ", length=" + evt.data.size, "blue");
        } else {
            fancy_log("pc2 said: " + evt.data, "blue");
        }
    });
    (window as any).offererObj = obj;
    (window as any).dc1 = obj.dc;
}
