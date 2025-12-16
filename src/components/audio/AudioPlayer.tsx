import { useEffect, useRef, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import WaveSurfer from 'wavesurfer.js';
import styles from './AudioPlayer.module.css';

interface AudioPlayerProps {
  audioUrl: string;
  onTimeUpdate?: (currentTime: number) => void;
  onReady?: (duration: number) => void;
}

export interface AudioPlayerRef {
  seekTo: (timeMs: number) => void;
  play: () => void;
  pause: () => void;
  getCurrentTime: () => number;
}

export function AudioPlayer({ audioUrl, onTimeUpdate, onReady }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(139, 92, 246, 0.4)',
      progressColor: 'rgba(139, 92, 246, 1)',
      cursorColor: 'rgba(255, 255, 255, 0.8)',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 48,
      normalize: true,
      backend: 'WebAudio',
    });

    wavesurferRef.current = wavesurfer;

    wavesurfer.on('loading', () => {
      setIsLoading(true);
    });

    wavesurfer.on('ready', () => {
      setIsLoading(false);
      const dur = wavesurfer.getDuration();
      setDuration(dur);
      onReady?.(dur);
    });

    wavesurfer.on('play', () => {
      setIsPlaying(true);
    });

    wavesurfer.on('pause', () => {
      setIsPlaying(false);
    });

    wavesurfer.on('timeupdate', (time) => {
      setCurrentTime(time);
      const timeMs = time * 1000;
      onTimeUpdate?.(timeMs);
      // Emit global event for TranscriptionTab to highlight active segment
      window.dispatchEvent(new CustomEvent('audio-time-update', { detail: { currentTimeMs: timeMs } }));
    });

    wavesurfer.on('finish', () => {
      setIsPlaying(false);
    });

    wavesurfer.load(audioUrl);

    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl, onTimeUpdate, onReady]);

  const togglePlayPause = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  }, []);

  const seekTo = useCallback((timeMs: number) => {
    if (wavesurferRef.current && duration > 0) {
      const timeSeconds = timeMs / 1000;
      wavesurferRef.current.seekTo(timeSeconds / duration);
    }
  }, [duration]);

  const skipBackward = useCallback(() => {
    if (wavesurferRef.current) {
      const newTime = Math.max(0, currentTime - 10);
      wavesurferRef.current.seekTo(newTime / duration);
    }
  }, [currentTime, duration]);

  const skipForward = useCallback(() => {
    if (wavesurferRef.current) {
      const newTime = Math.min(duration, currentTime + 10);
      wavesurferRef.current.seekTo(newTime / duration);
    }
  }, [currentTime, duration]);

  const changePlaybackRate = useCallback(() => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];
    setPlaybackRate(newRate);
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(newRate);
    }
  }, [playbackRate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Expose seekTo method via a custom event
  useEffect(() => {
    const handleSeek = (e: CustomEvent<{ timeMs: number }>) => {
      seekTo(e.detail.timeMs);
    };
    window.addEventListener('audio-seek' as keyof WindowEventMap, handleSeek as EventListener);
    return () => {
      window.removeEventListener('audio-seek' as keyof WindowEventMap, handleSeek as EventListener);
    };
  }, [seekTo]);

  return (
    <div className={styles.player}>
      {/* Waveform Container */}
      <div className={styles.waveformContainer}>
        {isLoading && (
          <div className={styles.loading}>
            <Icon icon="solar:refresh-circle-bold" width={24} height={24} className={styles.spinning} />
            <span>Loading audio...</span>
          </div>
        )}
        <div ref={containerRef} className={styles.waveform} />
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {/* Time Display */}
        <div className={styles.time}>
          <span className={styles.currentTime}>{formatTime(currentTime)}</span>
          <span className={styles.separator}>/</span>
          <span className={styles.duration}>{formatTime(duration)}</span>
        </div>

        {/* Main Controls */}
        <div className={styles.mainControls}>
          <button className={styles.controlBtn} onClick={skipBackward} title="Skip back 10s">
            <Icon icon="solar:rewind-10-seconds-back-linear" width={22} height={22} />
          </button>
          <button className={styles.playBtn} onClick={togglePlayPause}>
            <Icon
              icon={isPlaying ? 'solar:pause-bold' : 'solar:play-bold'}
              width={24}
              height={24}
            />
          </button>
          <button className={styles.controlBtn} onClick={skipForward} title="Skip forward 10s">
            <Icon icon="solar:rewind-10-seconds-forward-linear" width={22} height={22} />
          </button>
        </div>

        {/* Speed Control */}
        <button className={styles.speedBtn} onClick={changePlaybackRate} title="Playback speed">
          {playbackRate}x
        </button>
      </div>
    </div>
  );
}

// Helper function to trigger seek from outside the component
export function seekAudioTo(timeMs: number) {
  window.dispatchEvent(new CustomEvent('audio-seek', { detail: { timeMs } }));
}
