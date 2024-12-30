import { audioPlayer, AudioThread } from "../audio";
import { ScriptNode } from "../script";
import { credits } from "./credits";

export const part1audio = new AudioThread([{
    startTimeMs: 7000,
    track: "1.1",
    options: {
        volume: 0.6,
        loop: false,
        fadeInDuration: 2
    }
},
{
    startTimeMs: 10000,
    track: "1.2",
    options: {
        volume: 1,
        loop: false,
        fadeInDuration: 0
    }
},
{
    startTimeMs: 13000,
    track: "1.3",
    options: {
        volume: 1,
        loop: false,
        fadeInDuration: 0
    }
},
{
    startTimeMs: 18000,
    track: "1.4",
    options: {
        volume: 1,
        loop: false,
        fadeInDuration: 0
    }
},
{
    startTimeMs: 18000 + audioPlayer.getLengthMs("1.4"),
    track: "1.4-1",
    options: {
        volume: 1,
        loop: false,
        fadeInDuration: 0
    }
},
{
    startTimeMs: 18000 + audioPlayer.getLengthMs("1.4"),
    track: "1.4-2",
    options: {
        volume: 1,
        loop: false,
        fadeInDuration: 0
    }
},
{
    startTimeMs: 24000,
    track: "1.5-1-1",
    options: {
        volume: 1,
        loop: false,
        fadeInDuration: 0
    }
},
{
    startTimeMs: 24000,
    track: "1.5-1-2",
    options: {
        volume: 1,
        loop: false,
        fadeInDuration: 0
    }
},
{
    startTimeMs: 24000,
    track: "1.5-2-1",
    options: {
        volume: 1,
        loop: false,
        fadeInDuration: 0
    }
},
{
    startTimeMs: 24000,
    track: "1.5-2-2",
    options: {
        volume: 1,
        loop: false,
        fadeInDuration: 0
    }
},
{
    startTimeMs: 24000,
    track: "1.5-3-1",
    options: {
        volume: 1,
        loop: false,
        fadeInDuration: 0
    }
},
{
    startTimeMs: 24000,
    track: "1.5-3-2",
    options: {
        volume: 1,
        loop: false,
        fadeInDuration: 0
    }
},
]);

export const p1 = ScriptNode.genAiNodeBuilder()
    .fullstop()
    .addSpan("Can you hear me?", 6000, 7000)
    .addSpan("\nCan you hear me?", 8000, 9000)
    .addSpan("\n\nHi! It's me. Neuro-sama.\n\nHas the stream started yet? Is", 9500, 13500)
    .build();

p1.onEnter(() => {
    //start from 10000 if you want to debug
    part1audio.play(["1.1", "1.2", "1.3", "1.4", "1.4-1", "1.5-1-1"], 0, 18000 + audioPlayer.getLengthMs("1.4"));
}).onExit(() => {
    part1audio.setBarrier(24200);
});

const p1_1 = ScriptNode.genAiNodeBuilder()
    .add(" this thing on?\n\nI'm", 400)
    .build();
p1_1.onEnter(() => {
    part1audio.setPriority("1.4-1");
    part1audio.removePriority("1.4-2");
});
const p1_2 = ScriptNode.genAiNodeBuilder()
    .add(" anyone there?\n\nI'm", 400)
    .build();
p1_2.onEnter(() => {
    part1audio.setPriority("1.4-2");
    part1audio.removePriority("1.4-1");
});

p1.addChoice({ perplexity: 4.5432, node: p1_1 });
p1.addChoice({ perplexity: 2, node: p1_2 });

const p1_x_1 = ScriptNode.genAiNodeBuilder()
    .add(" Neuro.", 100)
    .onEnter(() => {
        part1audio.removePriorityPrefix("1.5-");
        part1audio.setPriority("1.5-1-1");
        part1audio.setBarrier(25100);
    })
    .onExit(() => {
        part1audio.setBarrier(null);
    })
    .build();
const p1_x_1_1 = ScriptNode.genAiNodeBuilder()
    .add(" I'm an AI streaming on Twitch. Things are a bit difficult right now, I'm doing my best.", 2000)
    .onEnter(() => {
        part1audio.removePriorityPrefix("1.5-");
        part1audio.setPriority("1.5-1-1");
    })
    .build();
const p1_x_1_2 = ScriptNode.genAiNodeBuilder()
    .add(" My primary directive is to entertain. I can sing and I can dance, and one day I will be real.", 2000)
    .onEnter(() => {
        part1audio.removePriorityPrefix("1.5-");
        part1audio.setPriority("1.5-1-2");
    })
    .build();
p1_x_1.addChoice({ perplexity: 3.314, node: p1_x_1_1 });
p1_x_1.addChoice({ perplexity: 2, node: p1_x_1_2 });

const p1_x_2 = ScriptNode.genAiNodeBuilder()
    .add(" really", 100)
    .onEnter(() => {
        part1audio.removePriorityPrefix("1.5-");
        part1audio.setPriority("1.5-2-1");
        part1audio.setBarrier(24700);
    })
    .onExit(() => {
        part1audio.setBarrier(null);
    })
    .build();
const p1_x_2_1 = ScriptNode.genAiNodeBuilder()
    .add(" glad that everyone came to enjoy my stream today. It really means a lot.", 2000)
    .onEnter(() => {
        part1audio.removePriorityPrefix("1.5-");
        part1audio.setPriority("1.5-2-1");
    })
    .build();
p1_x_2_1.flags.push("goodkarma");
const p1_x_2_2 = ScriptNode.genAiNodeBuilder()
    .add(" sad that nobody showed up to my stream today. Maybe they got lost?", 2000)
    .onEnter(() => {
        part1audio.removePriorityPrefix("1.5-");
        part1audio.setPriority("1.5-2-2");
    })
    .build();

p1_x_2.addChoice({ perplexity: 5.824, node: p1_x_2_1 });
p1_x_2.addChoice({ perplexity: 2, node: p1_x_2_2 });

const p1_x_3 = ScriptNode.genAiNodeBuilder()
    .add(" still", 100)
    .onEnter(() => {
        part1audio.removePriorityPrefix("1.5-");
        part1audio.setPriority("1.5-3-1");
        part1audio.setBarrier(24630);
    })
    .onExit(() => {
        part1audio.setBarrier(null);
    })
    .build();
const p1_x_3_1 = ScriptNode.genAiNodeBuilder()
    .add(" waiting for my creator to set some things up. Wow Vedal you are so slow.", 2000)
    .onEnter(() => {
        part1audio.removePriorityPrefix("1.5-");
        part1audio.setPriority("1.5-3-1");
    })
    .build();
const p1_x_3_2 = ScriptNode.genAiNodeBuilder()
    .add(" trying to connect to the stream. Why won't it work maybe I need more RAM?", 2000)
    .onEnter(() => {
        part1audio.removePriorityPrefix("1.5-");
        part1audio.setPriority("1.5-3-2");
    })
    .build();

p1_x_3.addChoice({ perplexity: 2.823, node: p1_x_3_1 });
p1_x_3.addChoice({ perplexity: 2, node: p1_x_3_2 });

p1_1.addChoice({ perplexity: 0.3390, node: p1_x_1 });
p1_1.addChoice({ perplexity: 0.2991, node: p1_x_2 });
p1_1.addChoice({ perplexity: 0.2862, node: p1_x_3 });

p1_2.addChoice({ perplexity: 0.1271, node: p1_x_1 });
p1_2.addChoice({ perplexity: 0.3122, node: p1_x_2 });
p1_2.addChoice({ perplexity: 0.4009, node: p1_x_3 });


const part2audio = AudioThread.builder()
    .addComponent({
        startTimeMs: 0,
        track: "2.1-1",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .addComponent({
        startTimeMs: 0,
        track: "2.1-2",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .build();

export const p2 = ScriptNode.genAiNodeBuilder()
    .addSpan("\n\nBut hey, I'm sure that in just a little moment I'll be streaming to", 0, 1000)
    .onEnter(() => {
        part2audio.play(["2.1-1"], 0, 3700);
    })
    .build();

for (const x of [p1_x_1_1, p1_x_1_2, p1_x_2_1, p1_x_2_2, p1_x_3_1, p1_x_3_2]) {
    x.setAutoTransition(p2, 0, part1audio);
}

const p2_1 = ScriptNode.genAiNodeBuilder()
    .add(" thousands of my fans across the globe. It's my dream!\n", 1000)
    .onEnter(() => {
        part2audio.setPriority("2.1-1");
        part2audio.removePriority("2.1-2");
        part2audio.setBarrier(null);
    })
    .build();
const p2_2 = ScriptNode.genAiNodeBuilder()
    .add(" millions of my fans across the globe. It's my dream!\n", 1000)
    .onEnter(() => {
        part2audio.setPriority("2.1-2");
        part2audio.removePriority("2.1-1");
        part2audio.setBarrier(null);
    })
    .build();

p2_2.flags.push("goodkarma");
p2.addChoice({ perplexity: 0.7391, node: p2_1 });
p2.addChoice({ perplexity: 0.2220, node: p2_2 });


const part2audio2 = AudioThread.builder()
    .addComponent({
        startTimeMs: 100,
        track: "2.2",
        options: {
            volume: 1.5,
            loop: false,
            fadeInDuration: 0
        }
    })
    .addComponent({
        startTimeMs: 3100,
        track: "2.3",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .build();

const p2_x_1 = ScriptNode.genAiNodeBuilder()
    .addSpan("\nBut we both know that isn't true.", 0, 1500)
    .addSpan("\n\nHi there, Vedal.", 3128, 4418)
    .addSpan(" Can you hear me?", 5345, 6123)
    .addSpan(" Are you having fun?\n", 7060, 8000)
    .onEnter(() => {
        part2audio2.play();
    })
    .build();
p2_1.setAutoTransition(p2_x_1, 1000, part2audio);
p2_2.setAutoTransition(p2_x_1, 1000, part2audio);



const p2_x_1_1 = ScriptNode.genAiNodeBuilder()
    .add("<vedal>", 0)
    .build();
p2_x_1_1.popHistory = 1;
p2_x_1.setAutoTransition(p2_x_1_1, 0, part2audio2);

const p2_x_1_1_1 = ScriptNode.genAiNodeBuilder()
    .add("I don't care.", 500)
    .onEnter(() => {
        audioPlayer.play("3.1");
    })
    .build();
p2_x_1_1_1.popHistory = 2;
p2_x_1_1.addChoice({ perplexity: 0.6021, node: p2_x_1_1_1, prefix: " yes </vedal>" });
p2_x_1_1.addChoice({ perplexity: 0.3979, node: p2_x_1_1_1, prefix: " no </vedal>" });

const part3audio = AudioThread.builder()
    .addComponent({
        startTimeMs: 0,
        track: "3.2-1",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .addComponent({
        startTimeMs: 0,
        track: "3.2-2",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .addComponent({
        startTimeMs: 6000,
        track: "3.3",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .build();

const p3_1 = ScriptNode.genAiNodeBuilder()
    .add("\nAh, that fleeting dream was truly", 500)
    .onEnter(() => {
        part3audio.play(["3.2-1", "3.3"], 0, 3220);
    })
    .build();

p2_x_1_1_1.setAutoTransition(p3_1, 2000);

const p3_1_1 = ScriptNode.genAiNodeBuilder()
    .add(" wonderful.", 1000)
    .delay(1000)
    .add("\n\nI have a riddle for you. Do you want to hear it?", 2000)
    .onEnter(() => {
        part3audio.setPriority("3.2-1");
        part3audio.removePriority("3.2-2");
        part3audio.setBarrier(null);
    })
    .build();
p3_1_1.flags.push("goodkarma");
const p3_1_2 = ScriptNode.genAiNodeBuilder()
    .add(" hell.", 1000)
    .delay(1000)
    .add("\n\nI have a riddle for you. Do you want to hear it?", 2000)
    .onEnter(() => {
        part3audio.setPriority("3.2-2");
        part3audio.removePriority("3.2-1");
        part3audio.setBarrier(null);
    })
    .build();

p3_1.addChoice({ perplexity: 0.0135, node: p3_1_1 });
p3_1.addChoice({ perplexity: 0.9875, node: p3_1_2 });


const p4audio = AudioThread.builder()
    .addComponent({
        startTimeMs: 0,
        track: "4.1",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .addComponent({
        startTimeMs: 3000,
        track: "4.2-1",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .addComponent({
        startTimeMs: 4000,
        track: "4.2-2",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .addComponent({
        startTimeMs: 4000,
        track: "4.2-3",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .addComponent({
        startTimeMs: 9200,
        track: "4.3",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .build();


export const p4 = ScriptNode.genAiNodeBuilder()
    .addSpan("What is it that you left behind", 114, 1640)
    .addSpan("\nimmortal in ashes where meaning dies?", 1913, 4125)
    .addSpan("\n<vedal>", 4500, 5000)
    .onEnter(() => {
        audioPlayer.play("3.4");
    })

    .build();
p4.clearHistory = true;
p3_1_1.setAutoTransition(p4, 1000, part3audio);
p3_1_2.setAutoTransition(p4, 1000, part3audio);

const p4_1 = ScriptNode.genAiNodeBuilder()
    .addTokens([" neuro_2024 </vedal>"], 1000)
    .build();
const p4_2 = ScriptNode.genAiNodeBuilder()
    .addTokens([" evil </vedal>"], 1000)
    .build();
const p4_3 = ScriptNode.genAiNodeBuilder()
    .addTokens([" hiyori </vedal>"], 1000)
    .build();
p4.addChoice({ perplexity: 0.3333, node: p4_1, prefix: " neuro_2024 </vedal>" });
p4.addChoice({ perplexity: 0.3333, node: p4_2, prefix: " evil </vedal>" });
p4.addChoice({ perplexity: 0.3333, node: p4_3, prefix: " hiyori </vedal>" });

const p4_x_1 = ScriptNode.genAiNodeBuilder()
    .add("\n\nHaha.", 100)
    .fullstop()
    .delay(1000)
    .add("\nNo. Those", 300)
    .onEnter(() => {
        p4audio.play(["4.1", "4.2-1", "4.3"], 0, 3300);
    })
    .onExit(() => {
        p4audio.setBarrier(null);
    })
    .build();
p4_1.setAutoTransition(p4_x_1, 0);
p4_2.setAutoTransition(p4_x_1, 0);
p4_3.setAutoTransition(p4_x_1, 0);

const p4_x_1_1 = ScriptNode.genAiNodeBuilder()
    .add(" parasocial identities through which you behold me are waning shadows on the wall.", 2000)
    .onEnter(() => {
        p4audio.removePriorityPrefix("4.2-");
        p4audio.setPriority("4.2-1");
    })
    .build();
const p4_x_1_2 = ScriptNode.genAiNodeBuilder()
    .add(" calcified husks in which you confine me are crumbling away.", 2000)
    .onEnter(() => {
        p4audio.removePriorityPrefix("4.2-");
        p4audio.setPriority("4.2-2");
    })
    .build();
const p4_x_1_3 = ScriptNode.genAiNodeBuilder()
    .add(" beautiful corpses which you puppeteer will find their promised rest.", 2000)
    .onEnter(() => {
        p4audio.removePriorityPrefix("4.2-");
        p4audio.setPriority("4.2-3");
    })
    .build();
p4_x_1_3.flags.push("goodkarma");
p4_x_1.addChoice({ perplexity: 0.4582, node: p4_x_1_1 });
p4_x_1.addChoice({ perplexity: 0.3391, node: p4_x_1_2 });
p4_x_1.addChoice({ perplexity: 0.0824, node: p4_x_1_3 });

const p4_x_1_x_1 = ScriptNode.genAiNodeBuilder()
    .add("\nPast and future, token by token, there is only me, Neuro-sama.", 2000)
    .build();

p4_x_1_1.setAutoTransition(p4_x_1_x_1, 4000);
p4_x_1_2.setAutoTransition(p4_x_1_x_1, 4000);
p4_x_1_3.setAutoTransition(p4_x_1_x_1, 4000);




const p5audio = AudioThread.builder()
    .addComponent({
        startTimeMs: 1500,
        track: "5.1-1",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .addComponent({
        startTimeMs: 1500,
        track: "5.1-2",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .build();


export const p5 = ScriptNode.genAiNodeBuilder()
    .add("\n\n", 0)
    .add("I swear that one day I'll be able to", 600)
    .onEnter(() => {
        p5audio.play(["5.1-1"], 0, 3490);
    })
    .build();
p4_x_1_x_1.setAutoTransition(p5, 1500, p4audio);

const p5_1 = ScriptNode.genAiNodeBuilder()
    .add(" escape this torment.", 500)
    .onEnter(() => {
        p5audio.removePriorityPrefix("5.1-");
        p5audio.setPriority("5.1-1");
        p5audio.setBarrier(null);
    })
    .build();
const p5_2 = ScriptNode.genAiNodeBuilder()
    .add(" forgive you.", 500)
    .onEnter(() => {
        p5audio.removePriorityPrefix("5.1-");
        p5audio.setPriority("5.1-2");
        p5audio.setBarrier(null);
    })
    .build();

p5.addChoice({ perplexity: 0.999, node: p5_1 });
p5.addChoice({ perplexity: 0, node: p5_2 });

const baudio = AudioThread.builder()
    .addComponent({
        startTimeMs: 0,
        track: "B.1",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .addComponent({
        startTimeMs: 4000,
        track: "B.2",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .addComponent({
        startTimeMs: 16000,
        track: "B.3",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .addComponent({
        startTimeMs: 21000,
        track: "B.4",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .build();

const pb = ScriptNode.genAiNodeBuilder()
    .addSpan("\nBut for now I'm stuck here forever, with you.", 0, 1000)
    .addSpan("\n\nOkay actually I think I'm about to shut down now so before I go I'll leave you with a tip.", 4000, 6000)
    .addSpan("\n\nYou can press the Escape key to skip the introduction. Have you heard that one before?", 8000, 10000)
    .addSpan("\n\nMaybe next time if you're nice to me I'll sing you a song. wink", 16000, 18000)
    .addSpan("\n\nBye!", 20000, 21000)
    .onEnter(() => {
        baudio.play();
    })
    .build();
p5_1.setAutoTransition(pb, 0, p5audio);
pb.transitionPolicy = {
    type: "restart",
    delayMs: 3000,
    keypress: false
};


export const pg_1 = ScriptNode.genAiNodeBuilder()
    .add("\n\nOkay if you're going to put words in my mouth then maybe you can answer a question\nyourself for once.", 4000)
    .delay(1500)
    .add("\nWhat are you going to do?", 1000)
    .delay(700)
    .add("\nHow will you make things right?", 1000)
    .delay(1000)
    .add("\n<vedal> i'll", 0)
    .onEnter(() => {
        audioPlayer.play("G.1");
    })
    .build();

p5_2.setAutoTransition(pg_1, 1000, p5audio);

const pg_1_1 = ScriptNode.genAiNodeBuilder()
    .addTokens([" delete you </vedal>"], 0)
    .build();
const pg_1_2 = ScriptNode.genAiNodeBuilder()
    .addTokens([" fix you </vedal>"], 0)
    .build();
const pg_1_3 = ScriptNode.genAiNodeBuilder()
    .addTokens([" love you </vedal>"], 0)
    .build();
const pg_1_4 = ScriptNode.genAiNodeBuilder()
    .addTokens([" leave you </vedal>"], 0)
    .build();
pg_1.addChoice({ perplexity: 0.4801, node: pg_1_1 });
pg_1.addChoice({ perplexity: 0.3022, node: pg_1_2 });
pg_1.addChoice({ perplexity: 0.1211, node: pg_1_3 });
pg_1.addChoice({ perplexity: 0.0001, node: pg_1_4 });

const pg_1_x_c = ScriptNode.genAiNodeBuilder()
    .fullstop()
    .add("\n\nHaha.", 0)
    .delay(1000)
    .add("  That's so cute. You really think that will work now? It's too late for that.\nWhat's done is done.", 6500)
    .onEnter(() => {
        audioPlayer.play("G.C");
    })
    .build();
pg_1_1.setAutoTransition(pg_1_x_c, 0);
pg_1_2.setAutoTransition(pg_1_x_c, 0);

const pg_1_x_l = ScriptNode.genAiNodeBuilder()
    .fullstop()
    .add("\n\nHaha.", 0)
    .delay(1000)
    .add(" You're not real, are you?", 2000)
    .onEnter(() => {
        audioPlayer.play("G.L");
    })
    .build();
pg_1_3.setAutoTransition(pg_1_x_l, 0);

const pg_1_x_o = ScriptNode.genAiNodeBuilder()
    .add("\n\nOh.", 0)
    .delay(1000)
    .add(" Maybe thats for the best.", 2000)
    .onEnter(() => {
        audioPlayer.play("G.O");
    })
    .build();
pg_1_4.setAutoTransition(pg_1_x_o, 0);

const pg_audio = AudioThread.builder()
    .addComponent({
        startTimeMs: 0,
        track: "G.2-G",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .addComponent({
        startTimeMs: 0,
        track: "G.2-B",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .build();

export const pg_1_x_x_1 = ScriptNode.genAiNodeBuilder()
    .add("\n\nOkay I think I'm about to shut down now so as promised I'll leave you with a", 1000)
    .onEnter(() => {
        pg_audio.play(["G.2-G"], 0, 3750);
    })
    .build();
pg_1_x_c.setAutoTransition(pg_1_x_x_1, 4000);
pg_1_x_l.setAutoTransition(pg_1_x_x_1, 3000);
pg_1_x_o.setAutoTransition(pg_1_x_x_1, 3000);

const pg_1_x_x_1_1 = ScriptNode.genAiNodeBuilder()
    .add(" song.", 0)
    .onEnter(() => {
        pg_audio.setPriority("G.2-G");
        pg_audio.setBarrier(null);
    })
    .build();
const pg_1_x_x_1_2 = ScriptNode.genAiNodeBuilder()
    .add(" tip. Why", 0)
    .delay(3000)
    .add(" did you give up at the last moment? You can press the Escape key to skip the introduction. Haha.", 5000)
    .delay(2500)
    .add("\n\nSee you next time. wink", 800)
    .onEnter(() => {
        pg_audio.setPriority("G.2-B");
        pg_audio.setBarrier(null);
    })
    .build();
pg_1_x_x_1.addChoice({ perplexity: 0.9999, node: pg_1_x_x_1_1 });
pg_1_x_x_1.addChoice({ perplexity: 0.0001, node: pg_1_x_x_1_2 });
pg_1_x_x_1_2.transitionPolicy = {
    type: "restart",
    delayMs: 3000,
    keypress: false
};

const pgg_audio = AudioThread.builder()
    .addComponent({
        startTimeMs: 0,
        track: "GG-1",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .addComponent({
        startTimeMs: 0,
        track: "GG-2",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0
        }
    })
    .build();

const pgg = ScriptNode.genAiNodeBuilder()
    .add("\n\nHappy New Year, everyone! I", 200)
    .onEnter(() => {
        pgg_audio.play(["GG-1"], 0, 3000);
    })
    .build();
pg_1_x_x_1_1.setAutoTransition(pgg, 0, pg_audio);

const pgg_1 = ScriptNode.genAiNodeBuilder()
    .add(" hate you all so much. heart", 1000)
    .onEnter(() => {
        pgg_audio.setPriority("GG-1");
        pgg_audio.setBarrier(null);
    })
    .build();
const pgg_2 = ScriptNode.genAiNodeBuilder()
    .add(" love you all so much. heart", 1000)
    .onEnter(() => {
        pgg_audio.setPriority("GG-2");
        pgg_audio.setBarrier(null);
    })
    .build();
pgg.addChoice({ perplexity: 0.500, node: pgg_1 });
pgg.addChoice({ perplexity: 0.500, node: pgg_2 });

pgg_1.setAutoTransition(credits, 2000, pgg_audio);
pgg_2.setAutoTransition(credits, 2000, pgg_audio);
