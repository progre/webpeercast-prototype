import gulp from "gulp";
import * as gutil from "gulp-util";
import del from "del";
import {mkdir} from "fs";

import {config as copyConfig} from "./gulp/copy.js";
import "./gulp/electron.js";
import "./gulp/jade.js";
import "./gulp/selflint.js";
import "./gulp/stylus.js";
import "./gulp/test.js";
import {config as tsConfig} from "./gulp/ts.js";

tsConfig.browser = {
    files: [
        { src: "src/public/js/index.ts", dest: "lib/public/js/" },
        { src: "src/public/js/sample.ts", dest: "lib/public/js/" },
        { src: "src/renderer/js/index.ts", dest: "lib/renderer/js/" }
    ]
};

gulp.task("clean", async (done) => {
    await del("lib/");
    mkdir("lib", done);
});

gulp.task("build",
    gulp.series(
        "clean",
        gulp.parallel(
            "copy:copy",
            "jade:debug",
            "stylus:stylus",
            gulp.series(
                "ts:debug",
                "test:test"
            )
        )
    )
);

gulp.task("release-build",
    gulp.series(
        "clean",
        gulp.parallel(
            "copy:copy",
            "jade:release",
            "stylus:stylus",
            gulp.series(
                "ts:release",
                "test:test"
            )
        )
    )
);

gulp.task("watch", () => {
    let signal = false;

    gulp.watch(copyConfig.src, gulp.series(begin, "copy:copy", end));
    gulp.watch(["src/**/*.ts*", "!src/test/**"], gulp.series(begin, "ts:debug", "test:test", end));
    gulp.watch("src/**/*.jade", gulp.series(begin, "jade:debug", end));
    gulp.watch("src/**/*.stylus", gulp.series(begin, "stylus:stylus", end));
    gulp.watch("src/test/**/*.ts", gulp.series(begin, "test:test", end));

    function begin(callback) {
        if (signal) {
            callback(new gutil.PluginError("begin", "Already started."));
            return;
        }
        signal = true;
        setTimeout(() => {
            signal = false;
        }, 3 * 1000);
        console.log("✂─────────────────────────────────────────────────…………");
        callback();
    }

    function end(callback) {
        console.log("   __       __");
        console.log("   ) \\     / (      .-.    .---.  .---. .-.   .-.");
        console.log("  )_  \\_V_/  _(     | |   /   __}{_   _}|  `.'  |");
        console.log("    )__   __(       | `--.\\  {_ }  | |  | |\\ /| |");
        console.log("       `-'          `----' `---'   `-'  `-' ` `-'");
        callback();
    }
});

gulp.task("default",
    gulp.series(
        gulp.parallel(
            "selflint:selflint",
            "build"
        ),
        "watch"
    )
);
