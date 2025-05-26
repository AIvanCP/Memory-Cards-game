import { useCallback, useRef, useEffect } from 'react';

export type SoundType = 
  | 'cardFlip' 
  | 'match' 
  | 'mismatch' 
  | 'gameWin' 
  | 'gameLose' 
  | 'buttonClick'
  | 'achievementUnlock'
  | 'timerWarning'
  | 'turnChange';

interface SoundSettings {
  enabled: boolean;
  volume: number;
}

interface PlaySoundOptions {
  volume?: number;
  playbackRate?: number;
}

/**
 * Hook for managing game sound effects
 */
export function useSoundSystem() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const settingsRef = useRef<SoundSettings>({ enabled: true, volume: 0.7 });

  // Initialize audio context
  useEffect(() => {
    const initAudio = async () => {
      try {
        if (typeof window !== 'undefined' && window.AudioContext) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
      } catch (error) {
        console.warn('Audio context initialization failed:', error);
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Create synthetic sounds since we don't have actual audio files
  const createSyntheticSound = (soundType: SoundType): AudioBuffer => {
    if (!audioContextRef.current) {
      throw new Error('Audio context not initialized');
    }

    const context = audioContextRef.current;
    const sampleRate = context.sampleRate;
    let duration = 0.2;
    let frequencies: number[] = [];

    // Define sound characteristics
    switch (soundType) {
      case 'cardFlip':
        duration = 0.15;
        frequencies = [220, 330];
        break;
      case 'match':
        duration = 0.3;
        frequencies = [440, 554, 659];
        break;
      case 'mismatch':
        duration = 0.4;
        frequencies = [147, 123];
        break;
      case 'gameWin':
        duration = 0.8;
        frequencies = [523, 659, 784, 1047];
        break;
      case 'gameLose':
        duration = 0.6;
        frequencies = [196, 165, 147];
        break;
      case 'buttonClick':
        duration = 0.1;
        frequencies = [800];
        break;      case 'achievementUnlock':
        duration = 1.0;
        frequencies = [523, 659, 784, 1047, 1319];
        break;
      case 'timerWarning':
        duration = 0.5;
        frequencies = [880, 0, 880, 0, 880];
        break;
      case 'turnChange':
        duration = 0.3;
        frequencies = [440, 554];
        break;
      default:
        frequencies = [440];
    }

    const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate sound wave
    for (let i = 0; i < data.length; i++) {
      let value = 0;
      const time = i / sampleRate;
      
      frequencies.forEach((freq, index) => {
        if (freq > 0) {
          const amplitude = Math.exp(-time * 3) / frequencies.length; // Decay
          const phaseOffset = index * 0.1;
          value += amplitude * Math.sin(2 * Math.PI * freq * time + phaseOffset);
        }
      });
      
      data[i] = value * 0.3; // Overall volume control
    }

    return buffer;
  };

  const playSound = useCallback((soundType: SoundType, options: PlaySoundOptions = {}) => {
    if (!settingsRef.current.enabled || !audioContextRef.current) {
      return;
    }

    try {
      const buffer = createSyntheticSound(soundType);
      const source = audioContextRef.current.createBufferSource();
      const gainNode = audioContextRef.current.createGain();

      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      // Set playback rate
      if (options.playbackRate) {
        source.playbackRate.value = options.playbackRate;
      }

      // Set volume
      const volume = (options?.volume ?? 1) * settingsRef.current.volume;
      gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);

      source.start();
    } catch (error) {
      console.warn(`Failed to play sound: ${soundType}`, error);
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<SoundSettings>) => {
    settingsRef.current = { ...settingsRef.current, ...newSettings };
  }, []);

  const getSettings = useCallback((): SoundSettings => {
    return { ...settingsRef.current };
  }, []);

  // Resume audio context on user interaction (required by modern browsers)
  const resumeAudioContext = useCallback(async () => {
    if (audioContextRef.current?.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
      }
    }
  }, []);

  return {
    playSound,
    updateSettings,
    getSettings,
    resumeAudioContext
  };
}

// Hook for easy sound integration in components
export const useGameSounds = () => {
  const { playSound, resumeAudioContext } = useSoundSystem();

  // Game-specific sound helpers
  const sounds = {
    cardFlip: () => playSound('cardFlip'),
    match: () => playSound('match'),
    mismatch: () => playSound('mismatch'),    gameWin: () => playSound('gameWin'),
    gameLose: () => playSound('gameLose'),
    buttonClick: () => playSound('buttonClick'),
    achievementUnlock: () => playSound('achievementUnlock'),
    timerWarning: () => playSound('timerWarning'),
    turnChange: () => playSound('turnChange')
  };

  return {
    ...sounds,
    resumeAudioContext
  };
};
