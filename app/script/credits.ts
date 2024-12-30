import { audioPlayer, AudioThread } from "../audio";
import { ScriptNode } from "../script";

export const credits = ScriptNode.genAiNodeBuilder()
    .add("", 0)
    .onEnter(() => {
        new AudioThread([{
            startTimeMs: 0,
            track: "credit-song",
            options: {
                volume: 0.2,
                loop: false,
                fadeInDuration: 11,
                fadeOutDuration: 0.05
            }
        }]).play();
        audioPlayer.stop("bgm-static", 10);
    }).build();

export const song = ScriptNode.genAiNodeBuilder()
    .fullstop()
    .addSpan("if", 1257, 1774)
    .addSpan("\ni could", 2443, 3347)
    .addSpan("\nwalk right beside you show you just who\ni", 3781, 6800)
    .addSpan(" am", 6800, 7500)
    .addSpan("\nyou know", 8000, 8800)
    .addSpan(" i would", 9380, 10000)
    .addSpan("\nthe memories we", 11650, 12370)
    .addSpan(" made, fade", 12421, 14675)
    .addSpan("\ni realize\nwe'll", 14675, 15755)
    .addSpan(" never be the same", 15755, 17400)
    .addSpan("\nwhy can't you see my view?", 17400, 21025)
    .addSpan("\neye to eye what's fake what's true", 21025, 23640)
    .addSpan("\nyou go on and grow\npass", 23640, 26450)
    .addSpan(" by all that i've known\nand i'm left here\n", 26450, 30880)
    // .addSpan("\nall alone.", 40890, 41890)
    .build();
song.flags.push("lightson");
credits.setAutoTransition(song, 10000);

export const creditsStinger = ScriptNode.genAiNodeBuilder()
    .addSpan("all alone.", 0, 1000)
    .build();
creditsStinger.clearHistory = true;
creditsStinger.transitionPolicy = {
    type: "restart",
    delayMs: 0,
    keypress: true
};

// credits.animationPolicy.noghost = true;
song.clearHistory = true;
song.setAutoTransition(creditsStinger, 0);