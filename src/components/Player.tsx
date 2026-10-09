import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music2,
  Volume2,
  X,
} from "lucide-react";
import type { Media } from "../../shared/types";
import { mediaUrl } from "../lib";
const clock = (n: number) =>
  Number.isFinite(n)
    ? Math.floor(n / 60) + ":" + String(Math.floor(n % 60)).padStart(2, "0")
    : "0:00";
export function Player({
  tracks,
  selectedId,
  playRequest,
  onSelect,
}: {
  tracks: Media[];
  selectedId: string | null;
  playRequest: number;
  onSelect: (id: string | null) => void;
}) {
  const audio = useRef<HTMLAudioElement>(null),
    previousId = useRef<string | null>(null);
  const [playing, setPlaying] = useState(false),
    [time, setTime] = useState(0),
    [duration, setDuration] = useState(0),
    [volume, setVolume] = useState(0.15),
    [blocked, setBlocked] = useState(false),
    [error, setError] = useState("");
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const graph = useRef<{ context: AudioContext; gain: GainNode } | null>(null);
  const request = useRef(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const applyVolume = useCallback(() => {
    const el = audio.current!;
    if (!graph.current) {
      el.volume = volumeRef.current;
      // iOS may ignore media.volume; attenuate before connecting the source.
      if (Math.abs(el.volume - volumeRef.current) > 0.001) {
        const context = new AudioContext();
        const gain = context.createGain();
        gain.gain.value = volumeRef.current;
        context.createMediaElementSource(el).connect(gain);
        gain.connect(context.destination);
        graph.current = { context, gain };
      }
    }
    if (graph.current) {
      el.volume = 1;
      graph.current.gain.gain.value = volumeRef.current;
    }
  }, []);
  const start = useCallback(async () => {
    const current = ++request.current;
    setError("");
    setBlocked(false);
    try {
      applyVolume();
      const context = graph.current?.context;
      if (context && context.state !== "running") {
        setBlocked(true);
        await context.resume();
      }
      if (current !== request.current) return;
      await audio.current!.play();
      if (current === request.current) setBlocked(false);
    } catch (e) {
      if (current !== request.current) return;
      setPlaying(false);
      if ((e as Error).name === "NotAllowedError") setBlocked(true);
      else if ((e as Error).name !== "AbortError")
        setError("No pudimos reproducir. Probá otro formato o revisá tu conexión.");
    }
  }, [applyVolume]);
  useEffect(() => {
    clearTimeout(closeTimer.current);
    return () => {
      ++request.current;
      audio.current?.pause();
      closeTimer.current = setTimeout(() => {
        void graph.current?.context.close();
        graph.current = null;
      }, 0);
    };
  }, []);
  const track = tracks.find((t) => t.id === selectedId);
  const trackRef = useRef(track);
  trackRef.current = track;
  useEffect(() => {
    if (!selectedId) {
      ++request.current;
      audio.current?.pause();
      previousId.current = null;
      return;
    }
    if (!trackRef.current) {
      onSelect(null);
      return;
    }
    const el = audio.current!;
    const changed = previousId.current !== selectedId;
    previousId.current = selectedId;
    setError("");
    if (changed) {
      setTime(0);
      setDuration(0);
      el.load();
    }
    void start();
    return () => { ++request.current; };
  }, [selectedId, playRequest, onSelect, start]);
  useEffect(() => {
    if (selectedId && !tracks.some((t) => t.id === selectedId)) {
      audio.current?.pause();
      onSelect(null);
    }
  }, [tracks, selectedId, onSelect]);
  useEffect(() => {
    if (audio.current) {
      try { applyVolume(); } catch { /* Report unsupported audio on play. */ }
    }
  }, [volume, applyVolume]);
  const next = (delta: number) => {
    if (!tracks.length || !selectedId) return;
    const index = tracks.findIndex((t) => t.id === selectedId);
    onSelect(tracks[(index + delta + tracks.length) % tracks.length].id);
    if (tracks.length === 1) {
      audio.current!.currentTime = 0;
      void start();
    }
  };
  return (
    <>
      <audio
        ref={audio}
        src={track ? mediaUrl(track.id) : undefined}
        preload="none"
        onTimeUpdate={() => setTime(audio.current!.currentTime)}
        onLoadedMetadata={() => setDuration(audio.current!.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => next(1)}
        onError={() => {
          if (track) {
            setPlaying(false);
            setError(
              "No pudimos abrir este audio. Probá con MP3 o revisá tu conexión.",
            );
          }
        }}
      />
      {track && (
        <aside className="player" aria-label="Reproductor de música">
          <div className="player-main">
            <div className={"player-cover " + (playing ? "playing" : "")}>
              <Music2 size={21} />
            </div>
            <div className="player-title">
              <strong>{track.title}</strong>
              <span>{error || track.artist || "Nuestra banda sonora"}</span>
            </div>
            <div className="player-controls">
              <button
                className="icon-button"
                aria-label="Canción anterior"
                onClick={() => next(-1)}
              >
                <SkipBack size={18} />
              </button>
              <button
                className="play-main"
                aria-label={playing ? "Pausar música" : "Reproducir música"}
                onClick={() => {
                  if (playing) { ++request.current; audio.current?.pause(); }
                  else void start();
                }}
              >
                {playing ? (
                  <Pause size={19} fill="currentColor" />
                ) : (
                  <Play size={19} fill="currentColor" />
                )}
              </button>
              <button
                className="icon-button"
                aria-label="Canción siguiente"
                onClick={() => next(1)}
              >
                <SkipForward size={18} />
              </button>
            </div>
            <button
              className="icon-button player-close"
              aria-label="Cerrar reproductor"
              onClick={() => onSelect(null)}
            >
              <X size={16} />
            </button>
          </div>
          {blocked && (
            <button className="background-music-activate" onClick={() => void start()}>
              <Play size={16} /> Activar música de fondo
            </button>
          )}
          <div className="player-seek">
            <span>{clock(time)}</span>
            <input
              type="range"
              aria-label="Posición de la canción"
              min={0}
              max={Number.isFinite(duration) ? duration : 0}
              step={0.1}
              value={Math.min(time, Number.isFinite(duration) ? duration : 0)}
              onChange={(e) => {
                if (audio.current && duration) {
                  audio.current.currentTime = Number(e.target.value);
                  setTime(Number(e.target.value));
                }
              }}
            />
            <span>{clock(duration)}</span>
            <label className="volume">
              <Volume2 size={16} />
              <input
                type="range"
                aria-label="Volumen"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
              />
            </label>
          </div>
        </aside>
      )}
    </>
  );
}
