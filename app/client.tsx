'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScriptNode, getNormalizedPerplexity } from './script';
import { audioPlayer, SOUNDS, type AudioTrack, AudioThread } from './audio';

const spookyTheme = {
    primary: 'rgb(32, 197, 94)',       // text color (green-500)
    primaryDim: 'rgb(34, 197, 94, 0.7)', // dimmed text (green-500/70)
    ghost: 'rgb(20, 83, 45)',          // ghost text (green-900)
    ghostShadow: 'rgba(34, 197, 94, 0.5)', // ghost text shadow
    border: 'rgb(22, 101, 52)',        // border color (green-800)
    glow: 'rgb(20, 83, 45)',          // background glow (green-900)
};

const DEBUG = false;

const cleanTheme = {
    primary: 'rgb(220, 220, 220)',      // text color (soft white)
    primaryDim: 'rgba(220, 220, 220, 0.7)', // dimmed text
    ghost: 'rgb(128, 128, 128)',       // ghost text (gray)
    ghostShadow: 'rgba(220, 220, 220, 0.2)', // ghost text shadow
    border: 'rgb(64, 64, 64)',         // border color (darker gray)
    glow: 'transparent',               // no glow
};

interface EffectSliderProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step: number;
}

const EffectSlider = ({ label, value, onChange, min, max, step }: EffectSliderProps) => (
    <div className="w-full max-w-4xl flex items-center gap-4 font-mono mt-2" style={{ color: spookyTheme.primary }}>
        <label>{label}: {Number(value).toFixed(step >= 1 ? 0 : -Math.floor(Math.log10(step)))}</label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-48"
        />
    </div>
);

const ScanlineOverlay = ({ pattern, height, speed }: { pattern: string, height: number, speed: number }) => (
    <div
        className="absolute inset-0 pointer-events-none"
        style={{
            background: pattern,
            height,
            animation: `scanlines ${speed}s linear infinite`,
            willChange: 'transform',
            zIndex: 30
        }}
    />
);

const Cursor = ({ blinkRate, theme }: { blinkRate: number, theme: typeof spookyTheme }) => (
    <span
        key={Date.now()}
        className="absolute inline-block"
        style={{
            width: '2px',
            height: '1.2em',
            transform: 'translateY(0.1em)',
            opacity: 1,
            background: theme.primary,
            animation: `cursorBlink ${blinkRate}s step-end infinite`,
            willChange: 'opacity'
        }}
    />
);

type IndicatorState = {
    count: number;
    total: number;
    perplexity: number;
    active: boolean;
};

const StatusIndicator = ({
    count,
    total,
    perplexity,
    active
}: {
    count: number,
    total: number,
    perplexity: number,
    active: boolean
}) => (
    <div className="absolute -bottom-4 left-0 whitespace-nowrap text-xs font-mono">
        <span style={{ color: active ? spookyTheme.primary : spookyTheme.primaryDim, fontWeight: active ? 'bold' : 'normal' }}>
            {count}/{total}
        </span>
        <span className="ml-2" style={{
            color: perplexity === 0 ? 'rgb(239, 68, 68)' : spookyTheme.primaryDim,
            fontWeight: perplexity === 0 ? 'bold' : 'normal'
        }}>
            ({perplexity.toFixed(4)})
        </span>
    </div>
);

const GlowBackground = ({ pulseIntensity, glowIntensity, pulseDuration }: { pulseIntensity: number, glowIntensity: number, pulseDuration: number }) => (
    <div
        className="absolute inset-0 blur-xl rounded pointer-events-none"
        style={{
            background: spookyTheme.glow,
            opacity: pulseIntensity > 0 ? undefined : glowIntensity,
            animation: pulseIntensity > 0 ? `opacity ${pulseDuration}s ease-in-out infinite` : 'none',
            zIndex: 10,
            mixBlendMode: 'screen'
        }}
    />
);


interface SpookyTerminalProps {
    script: ScriptNode;
    onReset: () => void;
}

type TextParts = {
    prefix: string;
    working: string;
    suffix: string;
    ghost: boolean;
    cursorPosition: "before" | "after" | "none";
};

const SpookyTerminal = ({ script, onReset }: SpookyTerminalProps) => {
    const [history, setHistory] = useState<ScriptNode[]>([script]);
    const currentNode = history.at(-1)!;
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
    const [animationStartTime, setAnimationStartTime] = useState(Date.now());
    const [currentAnimationFrame, setCurrentAnimationFrame] = useState(0);
    const [isSpookyMode, setIsSpookyMode] = useState(false);
    const [blurAmount, setBlurAmount] = useState(0);
    const [bgImageOpacity, setBgImageOpacity] = useState(0);
    const [karmaCount, setKarmaCount] = useState(0);

    // Add polling for barrier hits
    useEffect(() => {
        const pollInterval = setInterval(() => {
            const totalHits = AudioThread.getTotalBarrierHits();
            // Convert hits to blur amount: each hit adds 0.5px of blur, max 4px (reduced from 8px)
            const newBlur = Math.min(totalHits * 0.5, 4);
            setBlurAmount(newBlur);
        }, 100); // Poll every 100ms

        return () => clearInterval(pollInterval);
    }, []);

    // Reset blur on node transition
    useEffect(() => {
        setBlurAmount(0);
    }, [history]);

    const theme = isSpookyMode ? spookyTheme : cleanTheme;

    const [scanlineSpeed, setScanlineSpeed] = useState(1);
    const [scanlineHeight, setScanlineHeight] = useState(3);
    const [scanlineGap, setScanlineGap] = useState(8);
    const [scanlineOpacity, setScanlineOpacity] = useState(0.2);
    const [flickerSpeed, setFlickerSpeed] = useState(4);
    const [glowIntensity, setGlowIntensity] = useState(0.2);
    const [vignetteIntensity, setVignetteIntensity] = useState(0.6);
    const [pulseIntensity, setPulseIntensity] = useState(0);
    const [pulseDuration, setPulseDuration] = useState(4);
    const [blinkRate, setBlinkRate] = useState(1.5);

    const [indicator, setIndicator] = useState<IndicatorState>({
        count: 1,
        total: 1,
        perplexity: Math.random() * 0.3 + 0.6,
        active: false
    });

    // Derive animation complete from frame
    const animationComplete = currentAnimationFrame == -1;

    const executeTransition = useCallback((nextNode: ScriptNode) => {

        setHistory((prev) => {
            for (const cb of prev.at(-1)?.exitCbs ?? []) {
                cb(currentNode);
            }
            const popHistory = prev.at(-1)?.popHistory ?? 0;
            if (popHistory > 0) {
                return [...prev.slice(0, -popHistory), nextNode];
            }
            return [...prev, nextNode];
        });
        setSelectedOptionIndex(0);
        setCurrentAnimationFrame(0);
        setAnimationStartTime(Date.now());
    }, []);

    const updateAnimation = useCallback((e?: React.KeyboardEvent) => {
        if (animationComplete) return;
        if (currentNode.animationPolicy.type === "genai") {
            const now = Date.now();
            const elapsed = now - animationStartTime;
            // Find the next frame based on elapsed time
            const frames = currentNode.animationPolicy.frames;
            const nextFrame = frames.find(frame => frame.delayMs > elapsed);

            if (!nextFrame) {
                // No more frames, animation complete
                setCurrentAnimationFrame(-1);
            } else {
                // Set current frame and schedule next update
                const currentFrame = frames[frames.indexOf(nextFrame) - 1];
                setCurrentAnimationFrame(currentFrame ? currentFrame.frame : 0);
                const delay = nextFrame.delayMs - elapsed;
                setTimeout(updateAnimation, delay);
            }
        }
        else if (currentNode.animationPolicy.type === "keymash") {
            if (!currentNode.animationPolicy.reverse) {
                if (e?.key === 'Enter') {
                    if (currentAnimationFrame === currentNode.tokens.length - 1 && currentNode.animationPolicy.enterRequired) {
                        setCurrentAnimationFrame(-1);
                        audioPlayer.playEffect("choice-select-click", { volume: 2 });
                    }
                }
                else if (e?.key !== 'Backspace') {
                    const noise = ["option-fwd-click", "option-back-click"][Math.floor(Math.random() * 2)] as AudioTrack;
                    if (currentAnimationFrame >= currentNode.tokens.length - 2 && !currentNode.animationPolicy.enterRequired) {
                        setCurrentAnimationFrame(-1);
                        audioPlayer.playEffect(noise, { volume: 0.4 });
                    }
                    else if (currentAnimationFrame < currentNode.tokens.length - 1) {
                        setCurrentAnimationFrame(currentAnimationFrame + 1);
                        audioPlayer.playEffect(noise, { volume: 0.4 });
                    }
                    else {
                        // audioPlayer.playEffect("choice-error-buzz", { volume: 0.1, stopPrevious: true });
                    }
                }
            }
            else {
                if (e?.key === 'Enter') {
                    if (currentAnimationFrame === 0 && currentNode.animationPolicy.enterRequired) {
                        setCurrentAnimationFrame(-1);
                        audioPlayer.playEffect("choice-select-click", { volume: 2 });
                    }
                }
                else if (e?.key === 'Backspace') {
                    if (currentAnimationFrame <= 1 && !currentNode.animationPolicy.enterRequired) {
                        setCurrentAnimationFrame(-1);
                        audioPlayer.playEffect('option-back-click', { volume: 0.4 });
                    }
                    else if (currentAnimationFrame > 0) {
                        setCurrentAnimationFrame(currentAnimationFrame - 1);
                        audioPlayer.playEffect('option-back-click', { volume: 0.4 });
                    }
                }
            }
        }
        else {
            throw new Error("UNIMPLEMENTED");
        }
    }, [animationStartTime, currentAnimationFrame, history, currentNode]);

    useEffect(() => {
        if (currentNode.animationPolicy.type === "genai") {
            setCurrentAnimationFrame(0);
            setAnimationStartTime(Date.now());
            updateAnimation();
        }
        else if (currentNode.animationPolicy.type === "keymash") {
            if (currentNode.animationPolicy.reverse) {
                setCurrentAnimationFrame(currentNode.tokens.length - 1);
            }
            else {
                setCurrentAnimationFrame(0);
            }
        }
        else {
            throw new Error("UNIMPLEMENTED");
        }
        for (const cb of currentNode.enterCbs) {
            cb(currentNode);
        }
        // Check for goodkarma flag
        if (currentNode.flags?.includes("goodkarma")) {
            setKarmaCount(prev => prev + 1);
            // Flash the background image for karma gain
            setBgImageOpacity(0.5);
            setTimeout(() => {
                setBgImageOpacity(0);
            }, 30);
        }
        // Switch to spooky mode if the node has the flag
        if (currentNode.flags?.includes("become spooky")) {
            setIsSpookyMode(true);
            // Flash the background image
            setBgImageOpacity(0.5);
            setTimeout(() => {
                setBgImageOpacity(0);
            }, 30);
        }
        // Turn on lights if the node has the flag
        if (currentNode.flags?.includes("lightson")) {
            setBgImageOpacity(1);
        }
    }, [history, currentNode]);

    // Play beep when choices appear
    useEffect(() => {
        if (animationComplete) {
            if (currentNode.transitionPolicy.type === "auto") {
                const nextNode = currentNode.transitionPolicy.node;
                const audioBlock = currentNode.transitionPolicy.audioBlock;
                const audioDelay = audioBlock ? audioBlock.timeUntilPlaybackComplete() : 0;
                const timer = setTimeout(() => executeTransition(nextNode),
                    currentNode.transitionPolicy.delayMs + audioDelay);

                return () => clearTimeout(timer);
            }
            else if (currentNode.transitionPolicy.type === "restart") {
                if (!currentNode.transitionPolicy.keypress) {
                    const timer = setTimeout(() => {
                        onReset();
                    }, currentNode.transitionPolicy.delayMs);
                    return () => clearTimeout(timer);
                }
            }
            else if (currentNode.transitionPolicy.type === "choice") {
                setIndicator({
                    count: selectedOptionIndex + 1,
                    total: currentNode.transitionPolicy.choices.length,
                    perplexity: getNormalizedPerplexity(currentNode, selectedOptionIndex),
                    active: true
                });
                audioPlayer.playEffect("choice-beep", { volume: 1 });
            }
        }
    }, [animationComplete, currentNode.transitionPolicy.type]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.preventDefault();
        if ((!e.repeat || e.key === 'Backspace') && e.key !== 'Escape') {
            if (!animationComplete && currentNode.animationPolicy.type === "keymash") {
                updateAnimation(e);
            }
            if (animationComplete) {
                if (currentNode.transitionPolicy.type === "choice") {
                    const choices = currentNode.transitionPolicy.choices;

                    if (e.key === 'ArrowUp') {
                        const canMove = selectedOptionIndex < choices.length - 1;
                        if (canMove) {
                            audioPlayer.playEffect("option-fwd-click", { volume: 0.15 });
                            setSelectedOptionIndex(prev => prev + 1);
                        }
                        else {
                            audioPlayer.playEffect("choice-error-buzz", {
                                volume: 0.45,
                            });
                        }
                    } else if (e.key === 'ArrowDown') {
                        const canMove = selectedOptionIndex > 0;
                        if (canMove) {
                            audioPlayer.playEffect("option-back-click", { volume: 0.2 });
                            setSelectedOptionIndex(prev => prev - 1);
                        }
                        else {
                            audioPlayer.playEffect("choice-error-buzz", {
                                volume: 0.45,
                            });
                        }
                    } else if (e.key === 'Tab' || e.key === 'Enter') {
                        let perplexity = getNormalizedPerplexity(currentNode, selectedOptionIndex);
                        // If we have 3 or more karma, upgrade 0 perplexity to 0.001
                        if (perplexity === 0 && karmaCount >= 3) {
                            perplexity = 0.0001;
                        }
                        if (perplexity === 0) {
                            audioPlayer.playEffect("choice-error-buzz", { volume: 0.45 });
                            return;
                        }
                        audioPlayer.playEffect("choice-select-click", { volume: 0.3 });
                        const nextNode = choices[selectedOptionIndex].node;
                        executeTransition(nextNode);
                    }
                }
                else if (currentNode.transitionPolicy.type === "restart" && currentNode.transitionPolicy.keypress) {
                    // Ignore special keys like Shift, Control, Alt, etc.
                    if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Space') {
                        onReset();
                    }
                }
            }
        }            // Handle escape transitions
        if (e.key === 'Escape' && currentNode.transitionPolicy.type === "auto" && currentNode.transitionPolicy.escapeTransition) {
            executeTransition(currentNode.transitionPolicy.escapeTransition);
        }
    };

    // Create scanline pattern that's much larger than viewport to ensure good coverage
    const scanlinePattern = `repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, ${scanlineOpacity}) 0px,
    rgba(0, 0, 0, ${scanlineOpacity}) ${scanlineHeight}px,
    transparent ${scanlineHeight}px,
    transparent ${scanlineGap}px
  )`;

    // Calculate a height that's a multiple of the pattern height and larger than viewport
    const getPatternHeight = () => {
        const viewportHeight = window.innerHeight;
        const patternHeight = scanlineGap; // One complete pattern using state variable
        const repetitions = Math.ceil(viewportHeight / patternHeight) * 2; // Double the needed height
        return patternHeight * repetitions;
    };

    const getTextParts = (node: ScriptNode): TextParts => {
        let historical = '';
        if (!node.clearHistory) {
            for (let i = history.length - 2; i >= 0; i--) {
                const histNode = history[i];
                historical = histNode.tokens.join('') + historical;
                if (histNode.clearHistory) {
                    break;
                }
            }
        }
        if (node.animationPolicy.type === "keymash") {
            return {
                prefix: historical + node.tokens.slice(0, currentAnimationFrame + 1).join(''),
                working: "",
                suffix: currentNode.displaySuffix,
                ghost: false,
                cursorPosition: "before"
            };
        }
        else if (node.animationPolicy.type === "genai") {
            const ghostok = !node.animationPolicy.noghost;

            if (animationComplete) {
                // Animation complete - show full text
                const beforeLast = node.tokens.slice(0, -1).join('');
                const lastToken = node.tokens[node.tokens.length - 1] || "";

                if (node.transitionPolicy.type === "choice") {
                    // Show choice as ghost
                    return {
                        prefix: historical + node.tokens.join(''),
                        working: node.transitionPolicy.choices[selectedOptionIndex].prefix,
                        suffix: currentNode.displaySuffix,
                        ghost: ghostok,
                        cursorPosition: "before"
                    };
                } else {
                    // Show last token as solid
                    return {
                        prefix: historical + beforeLast,
                        working: lastToken,
                        suffix: currentNode.displaySuffix,
                        ghost: false,
                        cursorPosition: "after"
                    };
                }
            } else {
                // Animating - show current frame
                const beforeCurrent = node.tokens.slice(0, currentAnimationFrame).join('');
                const currentToken = node.tokens[currentAnimationFrame] || "";

                return {
                    prefix: historical + beforeCurrent,
                    working: currentToken,
                    suffix: currentNode.displaySuffix,
                    ghost: currentAnimationFrame > 0 && ghostok,
                    cursorPosition: currentAnimationFrame > 0 ? "before" : "after"
                };
            }
        }
        else {
            throw new Error("UNIMPLEMENTED");
        }
    };
    const parts = getTextParts(currentNode);

    const style = document.createElement('style');
    style.textContent = `
    @keyframes opacity {
      0%, 100% { opacity: ${glowIntensity}; }
      50% { opacity: ${Math.max(0, glowIntensity * (1 - pulseIntensity * 0.75))}; }
    }

    @keyframes scanlines {
      0% { transform: translateY(0); }
      100% { transform: translateY(${scanlineGap}px); }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0) rotate(0deg); }
      25% { transform: translateX(var(--shake-intensity)) rotate(calc(var(--shake-intensity) * 0.2deg)); }
      75% { transform: translateX(calc(var(--shake-intensity) * -1)) rotate(calc(var(--shake-intensity) * -0.2deg)); }
    }

    @keyframes rgbSplit {
      0%, 100% { 
        text-shadow: 
          calc(var(--shake-intensity) * -0.5) 0 #ff0000,
          var(--shake-intensity) 0 #00ff00,
          0 0 #0000ff;
      }
      50% { 
        text-shadow: 
          var(--shake-intensity) 0 #ff0000,
          calc(var(--shake-intensity) * -0.5) 0 #00ff00,
          0 0 #0000ff;
      }
    }

    @keyframes textFlicker {
      0% { opacity: 1; }
      90% { opacity: 1; }
      92% { opacity: 0.4; }
      94% { opacity: 1; }
      96% { opacity: 0.6; }
      98% { opacity: 1; }
      100% { opacity: 1; }
    }
    
    @keyframes cursorBlink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
    }

    .terminal-content {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    
    .terminal-content::-webkit-scrollbar {
        display: none;
    }

    .flicker {
      animation: textFlicker ${flickerSpeed}s linear infinite;
    }

    .shake {
      animation: shake 0.08s ease-in-out infinite;
    }

    .rgb-split {
      animation: rgbSplit 0.5s ease-in-out infinite;
    }

    .crt-vignette::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(
        circle at center,
        transparent 60%,
        rgba(0, 0, 0, ${vignetteIntensity}) 100%
      );
      pointer-events: none;
    }
  `;
    document.head.appendChild(style);


    // Add new useEffect for indicator state management
    useEffect(() => {
        if (animationComplete) {
            if (currentNode.transitionPolicy.type === "choice") {
                let perplexity = getNormalizedPerplexity(currentNode, selectedOptionIndex);
                // If we have 3 or more karma, upgrade 0 perplexity to 0.001
                if (perplexity === 0 && karmaCount >= 3) {
                    perplexity = 0.0001;
                }
                setIndicator({
                    count: selectedOptionIndex + 1,
                    total: currentNode.transitionPolicy.choices.length,
                    perplexity: perplexity,
                    active: true
                });
            } else {
                // Show 0/0 for non-choice nodes when complete
                setIndicator({
                    count: 0,
                    total: 0,
                    perplexity: Math.random() * 0.3 + 0.6,
                    active: false
                });
            }
        } else if (currentAnimationFrame > 0) {
            // During animation, after first frame
            setIndicator({
                count: 1,
                total: 1,
                perplexity: Math.random() * 0.3 + 0.6,
                active: false
            });
        } else if (currentAnimationFrame === 0) {
            // First frame - keep values but set active to false
            setIndicator(prev => ({
                ...prev,
                active: false
            }));
        }
    }, [animationComplete, currentAnimationFrame, currentNode, selectedOptionIndex]);

    // Reference to the content div for auto-scrolling
    const contentRef = useRef<HTMLDivElement>(null);

    // Auto-scroll effect
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [parts.prefix, parts.working, parts.suffix]);

    // Prevent manual scrolling
    useEffect(() => {
        const content = contentRef.current;
        if (!content) return;

        const preventScroll = (e: WheelEvent) => {
            e.preventDefault();
        };

        content.addEventListener('wheel', preventScroll, { passive: false });
        return () => content.removeEventListener('wheel', preventScroll);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center w-full h-screen bg-black p-8">
            <div className="w-full max-w-4xl flex flex-col gap-4">
                {DEBUG && (
                    <div className="flex justify-end mb-2">
                        <div className="flex gap-2">
                            <button
                                onClick={onReset}
                                className="px-4 py-2 rounded font-mono text-sm transition-colors select-none bg-red-900 text-red-500 border-red-500 hover:bg-red-800 border"
                            >
                                Reset Game
                            </button>
                            <button
                                onClick={() => setIsSpookyMode(!isSpookyMode)}
                                className={`px-4 py-2 rounded font-mono text-sm transition-colors select-none ${isSpookyMode
                                    ? 'bg-green-900 text-green-500 border-green-500 hover:bg-green-800'
                                    : 'bg-gray-900 text-white border-gray-700 hover:bg-gray-800'
                                    } border`}
                            >
                                {isSpookyMode ? 'Switch to Clean Mode' : 'Switch to Spooky Mode'}
                            </button>
                        </div>
                    </div>
                )}
                <div className="h-[32rem] relative select-none">
                    <div
                        className={`relative w-full h-full rounded-lg overflow-hidden backdrop-blur-sm select-none ${isSpookyMode ? 'bg-black/80' : 'bg-black'}`}
                        style={{ border: `1px solid ${theme.border}`, outline: 'none' }}
                        tabIndex={0}
                        onKeyDown={handleKeyDown}
                    >
                        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                            style={{
                                backgroundImage: 'url("/images/neurospooky.jpg")',
                                opacity: bgImageOpacity,
                                mixBlendMode: 'soft-light',
                                zIndex: 0
                            }}
                        />
                        <GlowBackground
                            pulseIntensity={isSpookyMode ? pulseIntensity : 0}
                            glowIntensity={isSpookyMode ? glowIntensity : 0}
                            pulseDuration={pulseDuration}
                        />
                        <div
                            ref={contentRef}
                            className={`terminal-content w-full h-full p-4 font-mono overflow-auto relative ${AudioThread.getTotalBarrierHits() > 0 ? 'shake rgb-split' : ''}`}
                            style={{
                                color: theme.primary,
                                zIndex: 20,
                                '--shake-intensity': `${Math.min(AudioThread.getTotalBarrierHits() * 0.3, 3)}px`
                            } as React.CSSProperties}
                        >
                            <div className={`whitespace-pre-wrap ${isSpookyMode ? 'flicker' : ''}`}>
                                <span className="relative" style={{
                                    filter: `blur(${blurAmount}px)`,
                                    transition: 'filter 0.5s ease-out'
                                }}>
                                    {parts.prefix}
                                    {parts.cursorPosition === "before" && <Cursor blinkRate={blinkRate} theme={theme} />}
                                </span>
                                <div className="inline-block relative" style={{
                                    filter: 'blur(0px)',
                                    boxShadow: blurAmount > 0 ? `0 0 ${blurAmount * 2}px rgba(0,0,0,0.5)` : 'none',
                                    transition: 'filter 0.5s ease-out, box-shadow 0.5s ease-out',
                                    '--shake-intensity': `${Math.min(AudioThread.getTotalBarrierHits() * 0.3, 3)}px`
                                } as React.CSSProperties}>
                                    {isSpookyMode && <StatusIndicator {...indicator} />}
                                    <span style={{
                                        ...(parts.ghost ? {
                                            color: theme.ghost,
                                            filter: `drop-shadow(0 0 2px ${theme.ghostShadow})`
                                        } : undefined),
                                    }}>
                                        {parts.working}
                                    </span>
                                </div>
                                <span style={{
                                    filter: `blur(${blurAmount}px)`,
                                    transition: 'filter 0.5s ease-out'
                                }}>
                                    {parts.cursorPosition === "after" && <Cursor blinkRate={blinkRate} theme={theme} />}
                                    {currentNode.displaySuffix}
                                </span>
                            </div>
                        </div>
                        {isSpookyMode && (
                            <>
                                <div className="absolute inset-0 pointer-events-none" style={{
                                    background: 'radial-gradient(circle at center, transparent 60%, rgba(0, 0, 0, 0.6) 100%)',
                                    zIndex: 25
                                }} />
                                <ScanlineOverlay
                                    pattern={scanlinePattern}
                                    height={getPatternHeight()}
                                    speed={scanlineSpeed}
                                />
                            </>
                        )}
                    </div>
                </div>

                {DEBUG && (
                    <div className="space-y-2">
                        <EffectSlider
                            label="Scanline Speed (s)"
                            value={scanlineSpeed}
                            onChange={setScanlineSpeed}
                            min={0.5}
                            max={2}
                            step={0.1}
                        />
                        <EffectSlider
                            label="Scanline Height (px)"
                            value={scanlineHeight}
                            onChange={setScanlineHeight}
                            min={1}
                            max={4}
                            step={0.5}
                        />
                        <EffectSlider
                            label="Scanline Gap (px)"
                            value={scanlineGap}
                            onChange={setScanlineGap}
                            min={4}
                            max={16}
                            step={1}
                        />
                        <EffectSlider
                            label="Scanline Opacity"
                            value={scanlineOpacity}
                            onChange={setScanlineOpacity}
                            min={0}
                            max={0.3}
                            step={0.01}
                        />
                        <EffectSlider
                            label="Flicker Speed (s)"
                            value={flickerSpeed}
                            onChange={setFlickerSpeed}
                            min={0.5}
                            max={10}
                            step={0.5}
                        />
                        <EffectSlider
                            label="Glow Intensity"
                            value={glowIntensity}
                            onChange={setGlowIntensity}
                            min={0}
                            max={1}
                            step={0.05}
                        />
                        <EffectSlider
                            label="Vignette Intensity"
                            value={vignetteIntensity}
                            onChange={setVignetteIntensity}
                            min={0}
                            max={1}
                            step={0.05}
                        />
                        <EffectSlider
                            label="Pulse Intensity"
                            value={pulseIntensity}
                            onChange={setPulseIntensity}
                            min={0}
                            max={1}
                            step={0.01}
                        />
                        <EffectSlider
                            label="Pulse Duration (s)"
                            value={pulseDuration}
                            onChange={setPulseDuration}
                            min={1}
                            max={10}
                            step={0.1}
                        />
                        <EffectSlider
                            label="Cursor Blink Rate (s)"
                            value={blinkRate}
                            onChange={setBlinkRate}
                            min={0.5}
                            max={3}
                            step={0.1}
                        />
                        <EffectSlider
                            label="Blur Amount (px)"
                            value={blurAmount}
                            onChange={setBlurAmount}
                            min={0}
                            max={8}
                            step={0.5}
                        />
                        <EffectSlider
                            label="Background Image Opacity"
                            value={bgImageOpacity}
                            onChange={setBgImageOpacity}
                            min={0}
                            max={1}
                            step={0.01}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpookyTerminal;