'use client'
import { useEffect, useState } from 'react'
import SpookyTerminal from './client'
import * as script from './script'
import { blankNode, intro } from './script/intro'
import { audioPlayer, AudioThread, SOUNDS, loadAllAudio } from './audio'
import { credits } from './script/credits'
import { p2, p4, p5, pg_1, pg_1_x_x_1 } from './script/main'

export default function Home() {
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const resetGame = () => {
    // Stop all audio
    audioPlayer.stopAll();
    AudioThread.stopAll();
    setHasUserInteracted(false);
    setIsAudioLoaded(false);
  };

  useEffect(() => {
    if (!hasUserInteracted) return;

    // Load all audio files after user interaction
    loadAllAudio().then(() => {
      setIsAudioLoaded(true);
    });

    // Cleanup on unmount
    return () => {
      audioPlayer.stop("background-static", 1.0); // 1 second fade out
    };
  }, [hasUserInteracted]);

  if (!hasUserInteracted) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <button
          onClick={() => setHasUserInteracted(true)}
          className="px-8 py-4 bg-green-900 text-green-500 font-mono text-lg border-2 border-green-500 hover:bg-green-800 transition-colors"
        >
          START
        </button>
      </div>
    );
  }

  if (!isAudioLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="text-green-500 font-mono text-lg">Loading audio assets...</div>
      </div>
    );
  }

  return <SpookyTerminal script={intro} onReset={resetGame} />
}
