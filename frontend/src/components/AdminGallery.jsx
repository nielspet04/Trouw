import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function AdminGallery() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchUploads();
    const interval = setInterval(fetchUploads, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUploads = async () => {
    try {
      const response = await axios.get(`${API_BASE}/uploads`);
      setUploads(response.data || []);
    } catch (error) {
      console.error('Failed to fetch uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'webm'].includes(ext)) return 'video';
    return 'file';
  };

  const filteredUploads = uploads.filter(upload => {
    if (filter === 'images') return getFileType(upload.filename) === 'image';
    if (filter === 'videos') return getFileType(upload.filename) === 'video';
    return true;
  });

  return (
    <div className="admin-gallery">
      <h2>📸 Galerij - Alle uploads</h2>
      <p className="gallery-subtitle">{filteredUploads.length} bestanden</p>

      <div className="gallery-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Alles ({uploads.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'images' ? 'active' : ''}`}
          onClick={() => setFilter('images')}
        >
          Foto's ({uploads.filter(u => getFileType(u.filename) === 'image').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'videos' ? 'active' : ''}`}
          onClick={() => setFilter('videos')}
        >
          Video's ({uploads.filter(u => getFileType(u.filename) === 'video').length})
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0' }}>
          ⏳ Laden...
        </p>
      ) : filteredUploads.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontStyle: 'italic' }}>
          Nog geen uploads...
        </p>
      ) : (
        <div className="gallery-grid">
          {filteredUploads.map((upload) => {
            const isImage = getFileType(upload.filename) === 'image';
            const isVideo = getFileType(upload.filename) === 'video';
            
            return (
              <div key={upload.id} className="gallery-item">
                <a 
                  href={`http://5.22.208.187:5000${upload.filepath}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="gallery-link"
                >
                  <div className="gallery-media">
                    {isImage && (
                      <img 
                        src={`http://5.22.208.187:5000${upload.filepath}`} 
                        alt="Upload"
                        loading="lazy"
                      />
                    )}
                    {isVideo && (
                      <div className="video-placeholder">
                        🎬 Video
                      </div>
                    )}
                  </div>
                </a>
                <div className="gallery-info">
                  <p className="gallery-filename">{upload.originalname || upload.filename}</p>
                  <p className="gallery-date">
                    {new Date(upload.uploaded_at).toLocaleDateString('nl-NL', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
