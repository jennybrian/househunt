// src/components/ShortlistViewer.jsx
import { useState, useEffect } from 'react';
import { getShortlistByToken } from '../services/shortlistService';

const CONTACT_NAME = "Janiffer";
const CONTACT_PHONE = "+254748618326";
const CONTACT_MSG = `Contact ${CONTACT_NAME} at ${CONTACT_PHONE}\n Get full details, pricing, and viewing arrangements`;

function extractGeneralArea(address) {
  if (!address) return "Nairobi Area";
  // Take up to first comma, append "Area"
  const first = address.split(',')[0].trim();
  return first.endsWith("Area") ? first : `${first} Area`;
}

const ShortlistViewer = ({ shareToken }) => {
  const [shortlist, setShortlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mediaGallery, setMediaGallery] = useState({ media: [], index: 0 });

  // Helper function to get all media (photos + videos) for a property
  const getPropertyMedia = (property) => {
    const media = [];
    
    // Add photos with type indicator
    if (property.photos && property.photos.length > 0) {
      property.photos.forEach((url) => {
        media.push({
          url,
          type: 'image'
        });
      });
    }
    
    // Add videos with type indicator
    if (property.videos && property.videos.length > 0) {
      property.videos.forEach((url) => {
        media.push({
          url,
          type: 'video'
        });
      });
    }
    
    return media;
  };

  useEffect(() => {
    if (shareToken) {
      loadShortlist();
    }
    // eslint-disable-next-line
  }, [shareToken]);

  const loadShortlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const shortlistData = await getShortlistByToken(shareToken);
      if (!shortlistData) {
        setError('Shortlist not found or has expired.');
        return;
      }
      setShortlist(shortlistData);
    } catch (error) {
      setError('Failed to load shortlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '10px' }}>Loading shortlist...</div>
        <div style={{ fontSize: '14px', color: '#666' }}>Token: {shareToken}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        color: '#f44336'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>⚠️ {error}</div>
        <button
          onClick={loadShortlist}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!shortlist) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div>Shortlist not found</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      {/* Contact/Lead Section */}
      <div style={{
        background: '#e3f2fd',
        borderRadius: 10,
        padding: 24,
        marginBottom: 32,
        textAlign: 'center',
        border: '1px solid #90caf9'
      }}>
        <h2 style={{ fontFamily: 'Inter, Nunito, Arial, sans-serif', fontSize: '28px', color: '#000000', margin: 0 }}>Property Shortlist</h2>
        <p style={{ fontFamily: 'Inter, Nunito, Arial, sans-serif', fontSize: '15px', color: '#333', margin: '16px 0 0 0' }}>
          {CONTACT_MSG.split("\n").map((line, i) => (
            <span key={i}>
            {line}
            <br />
            </span>
            ))}
        </p>
      </div>

      {/* Properties Grid */}
      {!shortlist.properties || shortlist.properties.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No properties found in this shortlist.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {shortlist.properties.map((property, index) => {
            const allMedia = getPropertyMedia(property);
            const hasMedia = allMedia.length > 0;
            
            return (
              <div
                key={property.id}
                style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: "white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    transition: "box-shadow 0.2s, transform 0.2s",
                    cursor: hasMedia ? "pointer" : "default",
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.18)";
                    e.currentTarget.style.transform = "translateY(-4px) scale(1.01)";
                }}
                 onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                    e.currentTarget.style.transform = "none";
                }}
              >
                {/* Property Number Badge */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(25, 118, 210, 0.85)',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontFamily: 'Inter, Nunito, Arial, sans-serif',
                  fontSize: '13px',
                  zIndex: 1
                }}>
                  #{index + 1}
                </div>

                {/* Enhanced Media Gallery Display */}
                {hasMedia ? (
                  <div
                    style={{
                      width: '100%',
                      height: 220,
                      overflow: 'hidden',
                      display: 'flex',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onClick={() => setMediaGallery({ media: allMedia.map(m => m.url), index: 0 })}
                  >
                    {allMedia.slice(0, 3).map((mediaItem, i) => (
                      <div
                        key={i}
                        style={{
                          width: `${100 / Math.min(3, allMedia.length)}%`,
                          height: '220px',
                          position: 'relative',
                          borderRight: i < allMedia.length - 1 ? '2px solid #fff' : 'none'
                        }}
                      >
                        {mediaItem.type === 'image' ? (
                          <img
                            src={mediaItem.url}
                            alt={property.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <video
                            src={mediaItem.url}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onMouseEnter={e => e.target.play()}
                            onMouseLeave={e => {
                              e.target.pause();
                              e.target.currentTime = 0;
                            }}
                            muted
                            loop
                          />
                        )}
                        
                        {/* Video indicator overlay */}
                        {mediaItem.type === 'video' && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            🎥
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Media count indicator */}
                    {allMedia.length > 3 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        +{allMedia.length - 3} more
                      </div>
                    )}
                    
                    {/* Mixed media type indicator */}
                    {property.photos && property.videos && (
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {property.photos.length > 0 && <span>📷{property.photos.length}</span>}
                        {property.videos.length > 0 && <span>🎥{property.videos.length}</span>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    height: '220px',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666'
                  }}>
                    No media available
                  </div>
                )}

                {/* Property Teaser Details */}
                <div style={{ padding: '18px 16px 24px 16px', flex: 1 }}>
                  <h3 style={{ margin: '0px 0px 8px', fontSize: '18px', fontFamily: 'Inter, Nunito, Arial, sans-serif', color: '#000000' }}>
                    {property.title}
                  </h3>
                  <div style={{ fontFamily: 'Inter, Nunito, Arial, sans-serif', fontSize: '14px', color: '#555', marginBottom: '4px 0px; color: rgb(102, 102, 102)' }}>
                    🗺️ {extractGeneralArea(property.address)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced Media Gallery Modal */}
      {mediaGallery.media.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 4000
          }}
          onClick={() => setMediaGallery({ media: [], index: 0 })}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.05)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Previous Button */}
            <button
              onClick={() =>
                setMediaGallery(g => ({
                  ...g,
                  index: g.index > 0 ? g.index - 1 : g.media.length - 1
                }))
              }
              style={{
                position: 'absolute',
                left: window.innerWidth > 768 ? 20 : 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: window.innerWidth > 768 ? 48 : 36,
                height: window.innerWidth > 768 ? 48 : 36,
                fontSize: window.innerWidth > 768 ? 24 : 18,
                cursor: 'pointer',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)';
                e.currentTarget.style.transform = 'translateY(-50%)';
              }}
              title="Previous"
            >
              ‹
            </button>

            {/* Main Media Display */}
            {(() => {
              const currentMediaUrl = mediaGallery.media[mediaGallery.index];
              const isVideo = currentMediaUrl && (
                currentMediaUrl.includes('.mp4') || 
                currentMediaUrl.includes('.webm') || 
                currentMediaUrl.includes('.mov') ||
                currentMediaUrl.includes('video/upload')
              );
              
              return isVideo ? (
                <video
                  src={currentMediaUrl}
                  controls
                  autoPlay
                  style={{
                    maxWidth: window.innerWidth > 768 ? '80vw' : '85vw',
                    maxHeight: window.innerWidth > 768 ? '80vh' : '75vh',
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    background: '#000'
                  }}
                />
              ) : (
                <img
                  src={currentMediaUrl}
                  alt={`Property media ${mediaGallery.index + 1}`}
                  style={{
                    maxWidth: window.innerWidth > 768 ? '80vw' : '85vw',
                    maxHeight: window.innerWidth > 768 ? '80vh' : '75vh',
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    background: '#fff'
                  }}
                />
              );
            })()}

            {/* Next Button */}
            <button
              onClick={() =>
                setMediaGallery(g => ({
                  ...g,
                  index: g.index < g.media.length - 1 ? g.index + 1 : 0
                }))
              }
              style={{
                position: 'absolute',
                right: window.innerWidth > 768 ? 20 : 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: window.innerWidth > 768 ? 48 : 36,
                height: window.innerWidth > 768 ? 48 : 36,
                fontSize: window.innerWidth > 768 ? 24 : 18,
                cursor: 'pointer',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)';
                e.currentTarget.style.transform = 'translateY(-50%)';
              }}
              title="Next"
            >
              ›
            </button>

            {/* Close Button */}
            <button
              onClick={() => setMediaGallery({ media: [], index: 0 })}
              style={{
                position: 'absolute',
                top: window.innerWidth > 768 ? 20 : 10,
                right: window.innerWidth > 768 ? 20 : 10,
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: window.innerWidth > 768 ? 40 : 32,
                height: window.innerWidth > 768 ? 40 : 32,
                fontSize: window.innerWidth > 768 ? 20 : 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = 'rgba(244,67,54,0.8)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)';
                e.currentTarget.style.transform = 'none';
              }}
              title="Close"
            >
              ×
            </button>

            {/* Media Counter */}
            <div
              style={{
                position: 'absolute',
                bottom: window.innerWidth > 768 ? 20 : 10,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              {mediaGallery.index + 1} of {mediaGallery.media.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortlistViewer;