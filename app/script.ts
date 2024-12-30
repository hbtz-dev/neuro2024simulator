import { AudioThread, type AudioTrack, type PlayAudioOptions } from "./audio";

export type TransitionChoice = {
    prefix: string;
    perplexity: number;
    node: ScriptNode;
}

export type ChoiceTransitionPolicy = {
    type: "choice";
    choices: TransitionChoice[];
}

export type StopTransitionPolicy = {
    type: "stop";
}

export type AutoTransitionPolicy = {
    type: "auto";
    delayMs: number;
    node: ScriptNode;
    audioBlock?: AudioThread;
    escapeTransition?: ScriptNode;
}

export type RestartTransitionPolicy = {
    type: "restart";
    delayMs: number;
    keypress?: boolean;
}

export type TransitionPolicy = ChoiceTransitionPolicy | StopTransitionPolicy | AutoTransitionPolicy | RestartTransitionPolicy;


export type GenaiAnimationPolicy = {
    type: "genai";
    frames: AnimationFrame[];
    noghost?: boolean;
}

export type AnimationFrame = {
    delayMs: number;
    frame: number;
}

export type KeymashAnimationPolicy = {
    type: "keymash";
    fixedSuffix: string;
    enterRequired: boolean;
    reverse: boolean;
}

export type AnimationPolicy = GenaiAnimationPolicy | KeymashAnimationPolicy;
export class ScriptNode<A extends AnimationPolicy = AnimationPolicy> {
    tokens: string[];
    animationPolicy: A;
    transitionPolicy: TransitionPolicy;
    clearHistory: boolean = false;
    displaySuffix: string = "";
    popHistory: number = 0;
    enterCbs: ((node: ScriptNode) => void)[] = [];
    exitCbs: ((node: ScriptNode) => void)[] = [];
    flags: string[] = [];

    constructor(tokens: string[], animationPolicy: A, transitionPolicy: TransitionPolicy = { type: "stop" }) {
        this.tokens = tokens;
        this.animationPolicy = animationPolicy;
        this.transitionPolicy = transitionPolicy;
    }

    static createGenAINode(text: string, displayTimeMs?: number) {
        const tokens = text.match(/\n|[^\S\n]*\S+|[^\S\n]+$/g) || [];
        if (!displayTimeMs) {
            displayTimeMs = tokens.length * 50;
        }
        return new GenAINodeBuilder()
            .addTokens(tokens, displayTimeMs)
            .build();
    }
    static genAiNodeBuilder() {
        return new GenAINodeBuilder();
    }
    static createKeymashNode(prefix: string, text: string, enterRequired: boolean = true, reverse: boolean = false) {
        const tokens = [prefix, ...text.split("")]
        return new ScriptNode(tokens, { type: "keymash", fixedSuffix: "", enterRequired, reverse });
    }

    onEnter(cb: (node: ScriptNode) => void) {
        this.enterCbs.push(cb);
        return this;
    }

    onExit(cb: (node: ScriptNode) => void) {
        this.exitCbs.push(cb);
        return this;
    }

    addChoice(choice: { node: ScriptNode; perplexity: number; prefix?: string }) {
        const prefix = choice.prefix ?? choice.node.tokens[0];
        const fullChoice = { ...choice, prefix };

        if (this.transitionPolicy.type === "stop") {
            this.transitionPolicy = {
                type: "choice",
                choices: [fullChoice]
            };
        } else if (this.transitionPolicy.type === "choice") {
            this.transitionPolicy.choices.push(fullChoice);
        } else {
            throw new Error("Cannot add choice to node with non-stop/non-choice transition policy");
        }
    }

    setAutoTransition(node: ScriptNode, delayMs: number, audioBlock?: AudioThread) {
        if (this.transitionPolicy.type !== "stop") {
            throw new Error("Cannot set auto transition on node with non-stop transition policy");
        }
        this.transitionPolicy = {
            type: "auto",
            delayMs,
            node,
            audioBlock
        };
    }
}

export const getNormalizedPerplexity = (node: ScriptNode, optionIndex: number): number => {
    if (node.transitionPolicy.type !== "choice") return 0;
    const choices = node.transitionPolicy.choices;
    const sum = choices.reduce((acc: number, opt: TransitionChoice) => acc + opt.perplexity, 0);
    if (sum <= 1) return choices[optionIndex].perplexity;
    const scale = 0.96 / sum;
    return choices[optionIndex].perplexity * scale;
};

export const createScrollTest = () => {
    const scrollTest = ScriptNode.createGenAINode("\nLine one.\nLine two.\nLine three.\nLine four.\nLine five.");
    scrollTest.setAutoTransition(scrollTest, 500);  // Transition to itself after 500ms
    return scrollTest;
};

export class GenAINodeBuilder {
    private tokens: string[] = [];
    private frames: AnimationFrame[] = [];
    private currentTimeMs: number = 0;
    private enterCbs: (() => void)[] = [];
    private exitCbs: (() => void)[] = [];
    fullstop() {
        this.addTokens([""], 0);
        return this;
    }
    add(s: string, durationMs: number) {
        const newTokens = s.match(/\n|[^\S\n]*\S+|[^\S\n]+$/g) || [];
        return this.addTokens(newTokens, durationMs);
    }

    addTokens(tokens: string[], durationMs: number) {
        const startFrame = this.tokens.length;
        this.tokens.push(...tokens);

        // Create frames for each new token with even spacing
        const frameTimeMs = durationMs / tokens.length;
        for (let i = 0; i < tokens.length; i++) {
            this.frames.push({
                delayMs: this.currentTimeMs + (i) * frameTimeMs,
                frame: startFrame + i
            });
        }
        this.currentTimeMs += durationMs;
        return this;
    }

    addSpan(s: string, start: number, end: number) {
        this.delayUntil(start);
        this.add(s, end - start);
        return this;
    }

    onEnter(cb: () => void) {
        this.enterCbs.push(cb);
        return this;
    }

    onExit(cb: () => void) {
        this.exitCbs.push(cb);
        return this;
    }

    delay(ms: number) {
        this.currentTimeMs += ms;
        return this;
    }

    delayUntil(timeMs: number) {
        const delayNeeded = timeMs - this.currentTimeMs;
        if (delayNeeded < 0) {
            throw new Error(`Cannot delay until ${timeMs}ms as current time is already ${this.currentTimeMs}ms`);
        }
        this.currentTimeMs = timeMs;
        return this;
    }

    build(): ScriptNode<GenaiAnimationPolicy> {
        // Add final frame to mark completion
        this.frames.push({
            delayMs: this.currentTimeMs,
            frame: -1
        });
        const ret = new ScriptNode(this.tokens, { type: "genai", frames: this.frames });
        for (const cb of this.enterCbs) {
            ret.onEnter(cb);
        }
        for (const cb of this.exitCbs) {
            ret.onExit(cb);
        }
        return ret;
    }
}
