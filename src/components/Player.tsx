import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Music2, Volume2, X } from 'lucide-react';
import type { Media } from '../../shared/types';
import { mediaUrl } from '../lib';
const clock = (n: number) => Number.isFinite(n) ? Math.floor(n / 60) + ':' + String(Math.floor(n % 60)).padStart(2, '0') : '0:00';
export function Player({ tracks, selectedId, playRequest, onSelect }: { tracks: Media[]; selectedId: string | null; playRequest: number; onSelect: (id: string | null) => void }) {
  const audio = useRef<HTMLAudioElement>(null), previousId = useRef<string | null>(null);
  const [playing, setPlaying] = useState(false), [time, setTime] = useState(0), [duration, setDuration] = useState(0), [volume, setVolume] = useState(.65), [error, setError] = useState('');
  const track = tracks.find(t => t.id === selectedId);
  const trackRef = useRef(track); trackRef.current = track;
  useEffect(() => {
    if (!selectedId) { audio.current?.pause(); previousId.current = null; return; }
    if (!trackRef.current) { onSelect(null); return; }
    const el = audio.current!;
    const changed = previousId.current !== selectedId;
    previousId.current = selectedId; setError('');
    if (changed) { setTime(0); setDuration(0); el.load(); }
    void el.play().catch(() => { setPlaying(false); setError('Tocá play para escuchar. Si no abre, probá MP3.'); });
  }, [selectedId, playRequest, onSelect]);
  useEffect(() => { if (selectedId && !tracks.some(t => t.id === selectedId)) { audio.current?.pause(); onSelect(null); } }, [tracks, selectedId, onSelect]);
  useEffect(() => { if (audio.current) audio.current.volume = volume; }, [volume]);
  const next = (delta: number) => { if (!tracks.length || !selectedId) return; const index = tracks.findIndex(t => t.id === selectedId); onSelect(tracks[(index + delta + tracks.length) % tracks.length].id); if (tracks.length === 1) { audio.current!.currentTime = 0; void audio.current!.play().catch(() => setError('No pudimos reproducir este audio.')); } };
  return <><audio ref={audio} src={track ? mediaUrl(track.id) : undefined} preload="none" onTimeUpdate={() => setTime(audio.current!.currentTime)} onLoadedMetadata={() => setDuration(audio.current!.duration)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => next(1)} onError={() => { if (track) { setPlaying(false); setError('No pudimos abrir este audio. Probá con MP3 o revisá tu conexión.'); } }} />
    {track && <aside className="player" aria-label="Reproductor de música"><div className="player-main"><div className={'player-cover ' + (playing ? 'playing' : '')}><Music2 size={21} /></div><div className="player-title"><strong>{track.title}</strong><span>{error || track.artist || 'Nuestra banda sonora'}</span></div><div className="player-controls"><button className="icon-button" aria-label="Canción anterior" onClick={() => next(-1)}><SkipBack size={18} /></button><button className="play-main" aria-label={playing ? 'Pausar música' : 'Reproducir música'} onClick={() => { if (playing) audio.current?.pause(); else { setError(''); void audio.current?.play().catch(() => setError('No pudimos reproducir. Probá otro formato.')); } }}>{playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}</button><button className="icon-button" aria-label="Canción siguiente" onClick={() => next(1)}><SkipForward size={18} /></button></div><button className="icon-button player-close" aria-label="Cerrar reproductor" onClick={() => onSelect(null)}><X size={16} /></button></div><div className="player-seek"><span>{clock(time)}</span><input type="range" aria-label="Posición de la canción" min={0} max={Number.isFinite(duration) ? duration : 0} step={.1} value={Math.min(time, Number.isFinite(duration) ? duration : 0)} onChange={e => { if (audio.current && duration) { audio.current.currentTime = Number(e.target.value); setTime(Number(e.target.value)); } }} /><span>{clock(duration)}</span><label className="volume"><Volume2 size={16} /><input type="range" aria-label="Volumen" min={0} max={1} step={.05} value={volume} onChange={e => setVolume(Number(e.target.value))} /></label></div></aside>}
  </>;
}

