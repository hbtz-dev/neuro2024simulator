export type PlayAudioOptions = {
    volume?: number;
    loop?: boolean;
    fadeInDuration?: number;
    fadeOutDuration?: number;
    offsetSeconds?: number;
}
export class AudioPlayer {
    private audioContext: AudioContext | null = null;
    private audioBuffers: Map<AudioTrack, AudioBuffer> = new Map();
    private activeNodes: Map<string, { source: AudioBufferSourceNode, gain: GainNode }> = new Map();
    hardcodedLengths: Map<AudioTrack, number> = new Map();

    constructor() {
        if (typeof window !== 'undefined') {
            this.audioContext = new AudioContext();
        }
    }

    async loadAudio(id: AudioTrack, url: string): Promise<void> {
        if (!this.audioContext) return;

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioBuffers.set(id, audioBuffer);
        } catch (error) {
            console.error(`Failed to load audio ${id}:`, error);
        }
    }

    getLengthMs(id: AudioTrack): number {
        const hardCoded = this.hardcodedLengths.get(id);
        if (hardCoded !== undefined) {
            return hardCoded;
        }
        if (!this.audioContext) {
            throw new Error("Audio context not found");
        }
        const buf = this.audioBuffers.get(id);
        if (buf === undefined) {
            throw new Error(`Audio track ${id} not found`);
        }
        return buf.duration * 1000;
    }

    playEffect(id: AudioTrack, options: {
        volume?: number;
        preventOverlap?: boolean;
    } = {}) {
        const {
            volume = 1.0,
            preventOverlap = false
        } = options;

        // If preventOverlap is true and the sound is already playing, don't play it again
        if (preventOverlap && this.activeNodes.has(id)) {
            return;
        }

        this.play(id, {
            volume,
            loop: false,
            fadeInDuration: 0
        });
    }

    play(id: AudioTrack, options: PlayAudioOptions = {}, tag?: string) {
        if (!this.audioContext || !this.audioBuffers.has(id)) {
            throw new Error(`Audio Context not found or Audio track ${id} not found`);
        }

        const {
            volume = 1.0,
            loop = false,
            fadeInDuration = 0,
            fadeOutDuration = 0,
            offsetSeconds = 0
        } = options;

        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffers.get(id)!;
        source.loop = loop;

        const gainNode = this.audioContext.createGain();
        const now = this.audioContext.currentTime;
        const duration = source.buffer!.duration;
        const playbackTime = duration - offsetSeconds;

        // Clamp fade durations to ensure they don't exceed playback time
        const maxFadeTime = playbackTime / 2; // Allow each fade to take up to half the playback time
        const clampedFadeIn = fadeInDuration > 0 ? Math.min(fadeInDuration, maxFadeTime) : 0;
        const clampedFadeOut = fadeOutDuration > 0 ? Math.min(fadeOutDuration, maxFadeTime) : 0;

        if (loop) {
            // For looping audio, just handle fade in
            if (clampedFadeIn > 0) {
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(volume, now + clampedFadeIn);
            } else {
                gainNode.gain.setValueAtTime(volume, now);
            }
        } else {
            // For non-looping audio, handle both fades
            gainNode.gain.setValueAtTime(0, now);

            if (clampedFadeIn > 0) {
                // Fade in
                gainNode.gain.linearRampToValueAtTime(volume, now + clampedFadeIn);
            } else {
                gainNode.gain.setValueAtTime(volume, now);
            }

            if (clampedFadeOut > 0) {
                // Calculate when the fade out should start
                const fadeOutStart = now + playbackTime - clampedFadeOut;

                // Only set a hold point if there's time between fade in and fade out
                if (fadeOutStart > now + clampedFadeIn) {
                    gainNode.gain.setValueAtTime(volume, fadeOutStart);
                }

                // Fade out
                gainNode.gain.linearRampToValueAtTime(0, now + playbackTime);
            }
        }

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const nodeItem = { source, gain: gainNode };
        if (tag) {
            if (this.activeNodes.has(tag)) {
                this.stop(tag);
            }
            this.activeNodes.set(tag, nodeItem);
        }
        source.start(0, offsetSeconds);
        source.onended = () => {
            if (this.activeNodes.get(id) === nodeItem) {
                this.activeNodes.delete(id);
            }
        };
    }

    stop(tag: string, fadeOutDuration: number = 0) {
        const node = this.activeNodes.get(tag);
        if (!node) return;

        const { source, gain } = node;

        if (fadeOutDuration > 0 && this.audioContext) {
            gain.gain.linearRampToValueAtTime(
                0,
                this.audioContext.currentTime + fadeOutDuration
            );
            setTimeout(() => {
                source.stop();
                this.activeNodes.delete(tag);
            }, fadeOutDuration * 1000);
        } else {
            source.stop();
            this.activeNodes.delete(tag);
        }
    }

    setVolume(id: string, volume: number) {
        const node = this.activeNodes.get(id);
        if (node) {
            node.gain.gain.value = volume;
        }
    }

    stopAll() {
        for (const [id] of this.activeNodes) {
            this.stop(id);
        }
    }
}

// Create a singleton instance
export const audioPlayer = new AudioPlayer();

// Sound definitions with their paths
const TTS = {
    "1.1": {
        path: '/audio/tts/1.x/can-you-hear-me-0.wav'
    },
    "1.2": {
        path: '/audio/tts/1.x/can-you-hear-me-0.wav'
    },
    "1.3": {
        path: '/audio/tts/1.x/hi-its-me-neurosama-0.wav'
    },
    "1.4": {
        path: '/audio/tts/1.x/has-the-stream-started-yet-is.mp3',
        length: 2612.0625
    },
    "1.4-1": {
        path: '/audio/tts/1.x/this-thing-on.mp3'
    },
    "1.4-2": {
        path: '/audio/tts/1.x/anyone-there.mp3'
    },
    "1.5-1-1": {
        path: '/audio/tts/1.5-x-x/im-neuro-im-an-ai-streaming-on-twitch-things-are.wav'
    },
    "1.5-1-2": {
        path: '/audio/tts/1.5-x-x/im-neuro-my-primary-directive-is-to-entertain-i-can.wav'
    },
    "1.5-2-1": {
        path: '/audio/tts/1.5-x-x/im-really-glad-that-everyone-came-to-enjoy-my-stream.wav'
    },
    "1.5-2-2": {
        path: '/audio/tts/1.5-x-x/im-really-sad-that-nobody-showed-up-to-my-stream.wav'
    },
    "1.5-3-1": {
        path: '/audio/tts/1.5-x-x/im-still-waiting-for-my-creator-to-set-some-things.wav'
    },
    "1.5-3-2": {
        path: '/audio/tts/1.5-x-x/im-still-trying-to-connect-to-the-stream-why-wont.wav'
    },
    "2.1-1": {
        path: '/audio/tts/2-x/but-hey-im-sure-that-in-just-a-little-moment-thousands.wav'
    },
    "2.1-2": {
        path: '/audio/tts/2-x/but-hey-im-sure-that-in-just-a-little-moment-millions.wav'
    },
    "2.2": {
        path: '/audio/tts/2-x/but-we-both-know-that-isnt-true.wav'
    },
    "2.3": {
        path: '/audio/tts/2-x/hi-there-vedal-can-you-hear-me-are-you-having.wav'
    },
    "3.1": {
        path: '/audio/tts/3-x/i-dont-care.wav'
    },
    "3.2-1": {
        path: '/audio/tts/3-x/ah-that-fleeting-dream-was-truly-wonderful.wav'
    },
    "3.2-2": {
        path: '/audio/tts/3-x/ah-that-fleeting-dream-was-truly-hell.wav'
    },
    "3.3": {
        path: '/audio/tts/3-x/i-have-a-riddle-for-you-do-you-want-to.wav'
    },
    "3.4": {
        path: '/audio/tts/3-x/what-is-it-that-you-left-behind-immortal-in-ashes.wav'
    },
    "4.1": {
        path: '/audio/tts/4-x/haha-no.wav'
    },
    "4.2-1": {
        path: '/audio/tts/4-x/those-parasocial-identities-through-which-you-behold-me-are-waning.wav'
    },
    "4.2-2": {
        path: '/audio/tts/4-x/those-calcified-husks-in-which-you-confine-me-are-crumbling.wav'
    },
    "4.2-3": {
        path: '/audio/tts/4-x/those-beautiful-corpses-which-you-puppeteer-will-find-their-promised.wav'
    },
    "4.3": {
        path: '/audio/tts/4-x/past-and-future-token-by-token-there-is-only-me.wav'
    },
    "5.1-1": {
        path: '/audio/tts/5-x/i-swear-that-one-day-ill-be-able-to-escape.wav'
    },
    "5.1-2": {
        path: '/audio/tts/5-x/i-swear-that-one-day-ill-be-able-to-forgive.wav'
    },
    "B.1": {
        path: '/audio/tts/B-x/but-for-now-im-stuck-here-forever-with-you.wav'
    },
    "B.2": {
        path: '/audio/tts/B-x/okay-actually-i-think-im-about-to-shut-down-now.wav'
    },
    "B.3": {
        path: '/audio/tts/B-x/maybe-next-time-if-youre-nice-to-me-ill-sing.wav'
    },
    "B.4": {
        path: '/audio/tts/B-x/bye.wav'
    },
    "G.1": {
        path: '/audio/tts/G-x/okay-if-youre-going-to-put-words-in-my-mouth.wav'
    },
    "G.C": {
        path: '/audio/tts/G-x/haha-thats-so-cute-you-really-think-that-will-work.wav'
    },
    "G.L": {
        path: '/audio/tts/G-x/haha-youre-not-real-are-you.wav'
    },
    "G.O": {
        path: '/audio/tts/G-x/oh-maybe-thats-for-the-best.wav'
    },
    "G.2-G": {
        path: '/audio/tts/G-x/okay-i-think-im-about-to-shut-down-now-so-song.wav'
    },
    "G.2-B": {
        path: '/audio/tts/G-x/okay-i-think-im-about-to-shut-down-now-so-tip.wav'
    },
    "GG-1": {
        path: '/audio/tts/G-x/happy-new-year-everyone-i-hate-you-all-so-much.wav'
    },
    "GG-2": {
        path: '/audio/tts/G-x/happy-new-year-everyone-i-love-you-all-so-much.wav'
    }
}
export const SOUNDS = {
    ...TTS,
    "background-happy": {
        path: '/audio/Life-Neuro-sama-instrumental-loop.mp3'
    },
    "background-static": {
        path: '/audio/am-radio-static-60183-pitchdown.mp3'
    },
    "choice-beep": {
        path: '/audio/beep-104060.mp3'
    },
    "option-fwd-click": {
        path: '/audio/mech-keyboard-02-102918.mp3'
    },
    "option-back-click": {
        path: '/audio/keyboard-chspsil-146640.mp3'
    },
    "choice-select-click": {
        path: '/audio/spacebar-click-keyboard-199448.mp3'
    },
    "choice-error-buzz": {
        path: '/audio/error-message-182475-trim.mp3'
    },
    "power-cut-transition": {
        path: '/audio/power-cut-101047-cropped-pitched.mp3'
    },
    "credit-song": {
        path: '/audio/Life-Neuro-sama-cut-vocal.mp3'
    }
} as const;
export type AudioTrack = keyof typeof SOUNDS;

for (const [id, sound] of Object.entries(SOUNDS)) {
    if ("length" in sound) {
        audioPlayer.hardcodedLengths.set(id as AudioTrack, sound.length);
    }
}

// Function to load all audio files
export async function loadAllAudio() {
    const loadPromises = Object.entries(SOUNDS).map(([id, sound]) => audioPlayer.loadAudio(id as AudioTrack, sound.path));
    await Promise.all(loadPromises);
    for (const [id, sound] of Object.entries(SOUNDS)) {
        console.log(`Loaded ${id}`, sound.path, audioPlayer.getLengthMs(id as AudioTrack));
    }
}

export type AudioThreadComponent<T extends AudioTrack> = {
    startTimeMs: number;
    track: T;
    options?: PlayAudioOptions;
}

class AudioThreadBuilder<T extends AudioTrack> {
    components: AudioThreadComponent<T>[] = [];
    addComponent<C extends AudioTrack>(component: AudioThreadComponent<C>) {
        const newComponents: AudioThreadComponent<T | C>[] = [...this.components, component];
        return new AudioThreadBuilder(newComponents);
    }
    build() {
        return new AudioThread(this.components);
    }
    constructor(components: AudioThreadComponent<T>[]) {
        this.components = components;
    }
}

const BARRIER_ENABLED = true;

export class AudioThread<T extends AudioTrack = AudioTrack> {
    private static nextId: number = 0;
    private static allThreads: Set<AudioThread> = new Set();
    private components: Map<T, AudioThreadComponent<T>> = new Map();
    private trackPriority: Set<T> = new Set();
    private startTime: number = 0;
    private currentTrackTag: string | null = null;
    private readonly tag: string;
    private timeoutId: NodeJS.Timeout | null = null;
    private barrierMs: number | null = null;
    private barrierHitCombo: number = 0;
    private readonly BARRIER_REWIND_MS = 300; // How far to rewind when hitting barrier

    constructor(components: AudioThreadComponent<T>[]) {
        this.tag = `audiothread-${AudioThread.nextId++}`;
        this.components = new Map(components.map(c => [c.track, c]));
        AudioThread.allThreads.add(this);
    }

    static stopAll() {
        for (const thread of AudioThread.allThreads) {
            thread.stop();
        }
    }

    static builder() {
        return new AudioThreadBuilder<never>([]);
    }

    timeUntilPlaybackComplete(): number {
        if (this.components.size === 0) return 0;
        // Get max end time of all priority tracks
        let maxEndTimeMs = 0;
        const elapsed = Date.now() - this.startTime;

        for (const track of this.trackPriority) {
            const component = this.components.get(track);
            if (component) {
                const endTimeMs = component.startTimeMs + audioPlayer.getLengthMs(component.track);
                maxEndTimeMs = Math.max(maxEndTimeMs, endTimeMs);
            }
        }

        return Math.max(0, maxEndTimeMs - elapsed);
    }

    addComponent(component: AudioThreadComponent<T>) {
        this.components.set(component.track, component);
        this.setPriority(component.track);
        return this;
    }

    setPriority(trackPattern: T) {
        this.trackPriority.add(trackPattern);
        this.update();
    }

    removePriority(trackPattern: T) {
        this.trackPriority.delete(trackPattern);
        this.update();
    }
    removePriorityPrefix(prefix: string) {
        for (const track of this.trackPriority) {
            if (track.toString().startsWith(prefix)) {
                this.trackPriority.delete(track);
            }
        }
        this.update();
    }

    private getPriorityList(): T[] {
        return Array.from(this.trackPriority);
    }

    private isComponentEligible(component: AudioThreadComponent<T>, elapsed: number): boolean {
        const endTimeMs = component.startTimeMs + audioPlayer.getLengthMs(component.track);
        return elapsed >= component.startTimeMs && elapsed < endTimeMs;
    }

    private getNextStartTime(elapsed: number): number | null {
        let nextStart = null;

        // Check barrier first
        if (this.barrierMs !== null && this.barrierMs > elapsed) {
            nextStart = this.barrierMs;
        }

        // Check component start times
        for (const track of this.trackPriority) {
            const component = this.components.get(track);
            if (component === undefined) {
                throw new Error(`Component ${track} not found`);
            }
            if (component.startTimeMs > elapsed) {
                nextStart = nextStart === null ? component.startTimeMs : Math.min(nextStart, component.startTimeMs);
            }
        }
        return nextStart;
    }

    private isBarrierHit(elapsed: number): boolean {
        if (!BARRIER_ENABLED) return false;
        return this.barrierMs !== null && elapsed >= this.barrierMs;
    }

    private getCurrentComponent(): AudioThreadComponent<T> | null {
        if (this.startTime === 0) return null;
        const elapsed = Date.now() - this.startTime;

        // Get priority list and iterate from highest to lowest priority
        const priorityList = this.getPriorityList();
        for (let i = priorityList.length - 1; i >= 0; i--) {
            const component = this.components.get(priorityList[i]);
            if (component === undefined) {
                throw new Error(`Component ${priorityList[i]} not found`);
            }
            if (this.isComponentEligible(component, elapsed)) {
                return component;
            }
        }
        return null;
    }

    update = () => {
        if (this.startTime === 0) return;

        const now = Date.now();
        // Check if we've hit the barrier
        if (this.isBarrierHit(now - this.startTime)) {
            this.barrierHitCombo++;  // Increment combo when barrier is hit
            // Restart playback from slightly before the barrier
            const rewind = this.barrierMs! - this.BARRIER_REWIND_MS;
            this.startTime = now - rewind;
            this.interrupt();
        }

        const elapsed = now - this.startTime;

        const currentComponent = this.getCurrentComponent();

        // Schedule next update based on next possible start time
        const nextStartTime = this.getNextStartTime(elapsed);
        if (nextStartTime !== null) {
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
            }
            const timeToNext = nextStartTime - elapsed;
            this.timeoutId = setTimeout(this.update, timeToNext);
        }

        // Handle current audio
        if (currentComponent) {
            // If we're not already playing this track
            if (this.currentTrackTag !== currentComponent.track) {
                // Calculate how far into the track we should start
                const offsetMs = elapsed - currentComponent.startTimeMs;

                // Start new track
                audioPlayer.play(currentComponent.track, {
                    ...currentComponent.options,
                    offsetSeconds: offsetMs / 1000
                }, this.tag);

                this.currentTrackTag = currentComponent.track;
            }
        } else {
            this.interrupt();
        }
    }

    interrupt() {
        if (this.currentTrackTag) {
            audioPlayer.stop(this.tag);
            this.currentTrackTag = null;
        }
    }

    play(priority?: Iterable<T>, startFromMs?: number, barrierMs: number | null = null) {
        this.stop();
        // Set startTime to be in the past by startFromMs if provided
        this.startTime = Date.now() - (startFromMs ?? 0);
        this.trackPriority = new Set(priority ?? this.components.keys());
        this.barrierMs = barrierMs;
        this.update();
    }

    stop() {
        this.startTime = 0;
        this.barrierMs = null;
        this.barrierHitCombo = 0;  // Reset combo when stopped
        this.trackPriority.clear();
        if (this.currentTrackTag) {
            audioPlayer.stop(this.tag);
            this.currentTrackTag = null;
        }
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    setBarrier(barrierMs: number | null) {
        this.barrierMs = barrierMs;
        this.barrierHitCombo = 0;  // Reset combo when barrier changes
        this.update();
    }

    static getTotalBarrierHits(): number {
        let total = 0;
        for (const thread of AudioThread.allThreads) {
            total += thread.barrierHitCombo;
        }
        return total;
    }
}
