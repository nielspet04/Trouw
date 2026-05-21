import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE, MEDIA_BASE } from '../config';

const SLIDE_DURATION_MS = 8000;

export default function AdminSlideshow({ onExit, onLogout }) {
  const [uploads, setUploads] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadInitialSlideshowData = async () => {
      try {
        const [uploadsResponse, nowPlayingResponse] = await Promise.all([
          axios.get(`${API_BASE}/uploads`),
          axios.get(`${API_BASE}/spotify/now-playing`)
        ]);

        if (isMounted) {
          setUploads(uploadsResponse.data || []);
          setNowPlaying(nowPlayingResponse.data || null);
        }
      } catch (error) {
        console.error('Failed to load slideshow data:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialSlideshowData();

    const refreshInterval = setInterval(async () => {
      try {
        const [uploadsResponse, nowPlayingResponse] = await Promise.all([
          axios.get(`${API_BASE}/uploads`),
          axios.get(`${API_BASE}/spotify/now-playing`)
        ]);

        setUploads(uploadsResponse.data || []);
        setNowPlaying(nowPlayingResponse.data || null);
      } catch (error) {
        console.error('Failed to refresh slideshow data:', error);
      }
    }, 12000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, []);

  const slides = useMemo(() => uploads.filter((upload) => {
    const uploadType = upload.media_type || '';
    const ext = upload.filename.split('.').pop().toLowerCase();
    return uploadType === 'photo'
      || uploadType === 'video'
      || ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'webm'].includes(ext);
  }), [uploads]);

  const safeCurrentIndex = slides.length ? currentIndex % slides.length : 0;
  const currentSlide = slides[safeCurrentIndex];
  const currentExt = currentSlide?.filename?.split('.').pop().toLowerCase();
  const isVideo = currentSlide?.media_type === 'video' || ['mp4', 'mov', 'webm'].includes(currentExt);
  const track = nowPlaying?.track;
  const liveProgressMs = track
    ? Math.min(
      track.durationMs || nowPlaying.progressMs || 0,
      (nowPlaying.progressMs || 0) + (nowPlaying.isPlaying ? Math.max(0, clock - (nowPlaying.fetchedAt || clock)) : 0)
    )
    : 0;
  const progressPercent = track?.durationMs
    ? Math.min(100, Math.round((liveProgressMs / track.durationMs) * 100))
    : 0;
  const lyricLines = nowPlaying?.lyrics?.lines || [];
  const activeLyricIndex = lyricLines.reduce((activeIndex, line, index) => (
    line.timeMs <= liveProgressMs ? index : activeIndex
  ), -1);
  const visibleLyrics = lyricLines.slice(
    Math.max(0, activeLyricIndex - 2),
    Math.min(lyricLines.length, Math.max(activeLyricIndex + 3, 5))
  );

  const formatTime = (milliseconds = 0) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const slideInterval = setInterval(() => {
      setCurrentIndex((index) => (index + 1) % slides.length);
    }, SLIDE_DURATION_MS);

    return () => clearInterval(slideInterval);
  }, [slides.length]);

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setClock(Date.now());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  const showPrevious = () => {
    if (slides.length === 0) return;
    setCurrentIndex((index) => (index - 1 + slides.length) % slides.length);
  };

  const showNext = () => {
    if (slides.length === 0) return;
    setCurrentIndex((index) => (index + 1) % slides.length);
  };

  const openFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch((error) => {
      console.error('Fullscreen failed:', error);
    });
  };

  return (
    <div className="slideshow-page">
      <section className="slideshow-stage">
        <div className="slideshow-topbar">
          <div>
            <p className="hero-kicker">Trouw van Guy en Ria</p>
            <h1>Jouw momenten, ons gastenboek</h1>
          </div>
          <div className="slideshow-actions">
            <button type="button" onClick={showPrevious}>Vorige</button>
            <button type="button" onClick={showNext}>Volgende</button>
            <button type="button" onClick={openFullscreen}>Fullscreen</button>
            <button type="button" onClick={onExit}>Beheer</button>
            <button type="button" onClick={onLogout}>Uitloggen</button>
          </div>
        </div>

        <div className="slideshow-frame">
          {loading ? (
            <p className="slideshow-empty">Laden...</p>
          ) : currentSlide ? (
            <>
              {isVideo ? (
                <video
                  key={currentSlide.id}
                  src={`${MEDIA_BASE}${currentSlide.filepath}`}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  key={currentSlide.id}
                  src={`${MEDIA_BASE}${currentSlide.filepath}`}
                  alt={currentSlide.originalname || 'Upload'}
                />
              )}
              <div className="slideshow-caption">
                <span>{safeCurrentIndex + 1} / {slides.length}</span>
                <strong>Door {currentSlide.guest_name || 'Onbekend'}</strong>
              </div>
            </>
          ) : (
            <p className="slideshow-empty">Nog geen foto's of video's om te tonen.</p>
          )}
        </div>
      </section>

      <aside className="slideshow-sidebar">
        <div className="footer-decoration" aria-hidden="true" />
        <h2>Nu op Spotify</h2>
        <p className="gallery-subtitle">Live vanaf jullie gekoppelde account</p>

        {track ? (
          <div className="now-playing-card">
            {track.image && (
              <img className="now-playing-cover" src={track.image} alt="" />
            )}
            <p className="now-playing-status">{nowPlaying.isPlaying ? 'Speelt nu' : 'Gepauzeerd'}</p>
            <h3>{track.name}</h3>
            <p className="request-artist">{track.artist}</p>
            {track.album && <p className="request-artist">{track.album}</p>}

            <div className="now-playing-progress" aria-label="Voortgang">
              <span style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="now-playing-times">
              <span>{formatTime(liveProgressMs)}</span>
              <span>{formatTime(track.durationMs)}</span>
            </div>

            <div className="lyrics-panel">
              <p className="current-song-label">Lyrics</p>
              {visibleLyrics.length > 0 ? (
                <div className="lyrics-lines">
                  {visibleLyrics.map((line) => (
                    <p
                      key={`${line.timeMs}-${line.text}`}
                      className={line.timeMs <= liveProgressMs ? 'active' : ''}
                    >
                      {line.text}
                    </p>
                  ))}
                </div>
              ) : (
                <p>
                  {nowPlaying.lyrics?.status === 'missing-key'
                    ? 'Voeg MUSIXMATCH_API_KEY toe om live lyrics te tonen.'
                    : 'Geen gesynchroniseerde lyrics gevonden voor dit nummer.'}
                </p>
              )}
              {nowPlaying.lyrics?.provider && (
                <p className="lyrics-provider">
                  Lyrics via {nowPlaying.lyrics.provider}
                  {!nowPlaying.lyrics.synced && visibleLyrics.length > 0 ? ' - timing benaderd' : ''}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="slideshow-empty compact">
            Er speelt momenteel geen Spotify nummer, of Spotify moet opnieuw gekoppeld worden.
          </p>
        )}
      </aside>
    </div>
  );
}
