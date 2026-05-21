import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE, MEDIA_BASE } from '../config';

const SLIDE_DURATION_MS = 8000;

export default function AdminSlideshow({ onExit, onLogout }) {
  const [uploads, setUploads] = useState([]);
  const [songRequests, setSongRequests] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadInitialSlideshowData = async () => {
      try {
        const [uploadsResponse, songsResponse] = await Promise.all([
          axios.get(`${API_BASE}/uploads`),
          axios.get(`${API_BASE}/spotify/requests`)
        ]);

        if (isMounted) {
          setUploads(uploadsResponse.data || []);
          setSongRequests(songsResponse.data || []);
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
        const [uploadsResponse, songsResponse] = await Promise.all([
          axios.get(`${API_BASE}/uploads`),
          axios.get(`${API_BASE}/spotify/requests`)
        ]);

        setUploads(uploadsResponse.data || []);
        setSongRequests(songsResponse.data || []);
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

  const upcomingSongs = useMemo(() => [...songRequests]
    .sort((a, b) => new Date(a.requested_at) - new Date(b.requested_at))
    .slice(0, 10), [songRequests]);

  const safeCurrentIndex = slides.length ? currentIndex % slides.length : 0;
  const currentSlide = slides[safeCurrentIndex];
  const currentExt = currentSlide?.filename?.split('.').pop().toLowerCase();
  const isVideo = currentSlide?.media_type === 'video' || ['mp4', 'mov', 'webm'].includes(currentExt);

  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const slideInterval = setInterval(() => {
      setCurrentIndex((index) => (index + 1) % slides.length);
    }, SLIDE_DURATION_MS);

    return () => clearInterval(slideInterval);
  }, [slides.length]);

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
        <h2>Liedjes voor straks</h2>
        <p className="gallery-subtitle">{upcomingSongs.length} requests in beeld</p>

        {upcomingSongs.length > 0 ? (
          <div className="slideshow-song-list">
            {upcomingSongs.map((song, idx) => (
              <div key={song.id} className="slideshow-song">
                <span className="order">{idx + 1}</span>
                <div className="request-info">
                  <p className="request-track">{song.track_name}</p>
                  <p className="request-artist">{song.artist_name}</p>
                  <p className="request-artist">door {song.guest_name || 'Onbekend'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="slideshow-empty compact">Nog geen liedjes aangevraagd.</p>
        )}
      </aside>
    </div>
  );
}
