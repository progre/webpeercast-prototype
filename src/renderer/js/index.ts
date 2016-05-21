/// <reference path="../../../typings/index.d.ts" />
import "babel-polyfill";
import "webrtc-adapter";

async function main() {
}

main().catch(e => console.error(e.stack != null ? e.stack : e));
