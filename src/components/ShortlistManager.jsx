// src/components/ShortlistManager.jsx
import { useState, useEffect } from "react";
import { getProperties } from "../services/firestore";
import { createShortlist, generateShareableLinks } from "../services/shortlistService";

const LOCAL_KEY = "househunt_shortlist";

const ShortlistManager = () => {
  const [properties, setProperties] = useState([]);
  const [shortlist, setShortlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareToken, setShareToken] = useState(null);
  const [shareLinks, setShareLinks] = useState(null);
  const [selectedMediaGallery, setSelectedMediaGallery] = useState({ media: [], index: 0 });

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

  // Load all properties and shortlist from localStorage
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const allProps = await getProperties();
      setProperties(allProps);

      const shortlistIds = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
      setShortlist(shortlistIds);
      setLoading(false);
    };
    load();
  }, []);

  // Remove property from shortlist
  const removeFromShortlist = (propertyId) => {
    const updated = shortlist.filter((id) => id !== propertyId);
    setShortlist(updated);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
  };

  // Create shareable shortlist and generate links
  const handleShare = async () => {
    if (shortlist.length === 0) {
      alert("Shortlist is empty.");
      return;
    }
    // Create shortlist in backend and get share token
    const shortlistDoc = await createShortlist(null, shortlist, "Shared Shortlist");
    setShareToken(shortlistDoc.shareToken);
    setShareLinks(generateShareableLinks(shortlistDoc.shareToken));
  };

  // Get property details for shortlisted IDs
  const shortlistedProperties = properties.filter((p) => shortlist.includes(p.id));

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h2>Shortlisted Properties</h2>
      {shortlistedProperties.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888", padding: 40 }}>
          No properties in your shortlist.<br />
          Go to the Gallery and add properties to your shortlist.
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={handleShare}
              style={{
                padding: "10px 20px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 16,
                cursor: "pointer",
                marginRight: 12,
              }}
            >
              🔗 Copy/Share Shortlist Link
            </button>
            {shareLinks && (
              <span style={{ fontSize: 14, color: "#1976d2" }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareLinks.direct);
                    alert("Link copied to clipboard!");
                  }}
                  style={{
                    marginRight: 8,
                    padding: "6px 12px",
                    background: "#e3f2fd",
                    color: "#1976d2",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  📋 Copy Link
                </button>
                <button
                  onClick={() => window.open(shareLinks.whatsapp, "_blank")}
                  style={{
                    marginRight: 8,
                    padding: "6px 12px",
                    background: "#25D366",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  💬 WhatsApp
                </button>
                <button
                  onClick={() => (window.location.href = shareLinks.email)}
                  style={{
                    padding: "6px 12px",
                    background: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  📧 Email
                </button>
              </span>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {shortlistedProperties.map((property) => {
              const allMedia = getPropertyMedia(property);
              const firstMediaItem = allMedia[0];
              
              return (
                <div
                  key={property.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    background: "#fff",
                    overflow: "hidden",
                    backgroundColor: "white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    position: "relative",
                    marginBottom: 12,
                  }}
                >
                  {/* Enhanced Media Display - Shows first image or video */}
                  {firstMediaItem ? (
                    <div style={{ position: 'relative' }}>
                      {firstMediaItem.type === 'image' ? (
                        <img
                          src={firstMediaItem.url}
                          alt={property.title}
                          style={{
                            width: "100%",
                            height: 160,
                            objectFit: "cover",
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setSelectedMediaGallery({ 
                              media: allMedia.map(m => m.url), 
                              index: 0 
                            });
                          }}
                        />
                      ) : (
                        <video
                          src={firstMediaItem.url}
                          style={{
                            width: "100%",
                            height: 160,
                            objectFit: "cover",
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setSelectedMediaGallery({ 
                              media: allMedia.map(m => m.url), 
                              index: 0 
                            });
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
                      
                      {/* Media count indicator */}
                      {allMedia.length > 1 && (
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
                          {property.photos && property.photos.length > 0 && (
                            <span>📷{property.photos.length}</span>
                          )}
                          {property.videos && property.videos.length > 0 && (
                            <span>🎥{property.videos.length}</span>
                          )}
                        </div>
                      )}

                      {/* Video play indicator */}
                      {firstMediaItem.type === 'video' && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
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
                          🎥 Video
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      width: '100%',
                      height: 160,
                      backgroundColor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      No media available
                    </div>
                  )}

                  <div style={{ padding: 12 }}>
                    <h3 style={{ margin: "0 0 8px 0", fontSize: 18 }}>{property.title}</h3>
                    <div style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>
                      📍 {property.address}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span
                        style={{
                          backgroundColor: "#e3f2fd",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          color: "#1976d2",
                        }}
                      >
                        {property.type}
                      </span>
                      <span style={{ fontWeight: "bold", color: "#2e7d32" }}>
                        {new Intl.NumberFormat("en-KE", {
                          style: "currency",
                          currency: "KES",
                          minimumFractionDigits: 0,
                        }).format(property.price)}
                      </span>
                    </div>

                    {/* Media Gallery Preview */}
                    {allMedia.length > 1 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500 }}>
                          Media ({allMedia.length} items):
                        </div>
                        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                          {allMedia.slice(0, 4).map((mediaItem, index) => (
                            <div
                              key={index}
                              style={{
                                position: 'relative',
                                width: '40px',
                                height: '40px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                border: '2px solid #ddd',
                                flexShrink: 0,
                                transition: 'border-color 0.2s',
                                overflow: 'hidden'
                              }}
                              onMouseOver={e => e.currentTarget.style.borderColor = '#00bfae'}
                              onMouseOut={e => e.currentTarget.style.borderColor = '#ddd'}
                              onClick={() => {
                                setSelectedMediaGallery({ 
                                  media: allMedia.map(m => m.url), 
                                  index 
                                });
                              }}
                            >
                              {mediaItem.type === 'image' ? (
                                <img
                                  src={mediaItem.url}
                                  alt={`${property.title} - Media ${index + 1}`}
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
                                  muted
                                />
                              )}
                              {mediaItem.type === 'video' && (
                                <div style={{
                                  position: 'absolute',
                                  top: '1px',
                                  right: '1px',
                                  backgroundColor: 'rgba(0,0,0,0.7)',
                                  color: 'white',
                                  borderRadius: '2px',
                                  padding: '1px 2px',
                                  fontSize: '6px'
                                }}>
                                  🎥
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => removeFromShortlist(property.id)}
                      style={{
                        padding: "6px 12px",
                        background: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Media Gallery Modal */}
      {selectedMediaGallery.media.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 4000
          }}
          onClick={() => setSelectedMediaGallery({ media: [], index: 0 })}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Previous Button - Mobile Optimized */}
            <button
              onClick={() =>
                setSelectedMediaGallery(g => ({
                  ...g,
                  index: g.index > 0 ? g.index - 1 : g.media.length - 1
                }))
              }
              style={{
                position: 'absolute',
                left: window.innerWidth > 768 ? 20 : 5,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: window.innerWidth > 768 ? 40 : 28,
                height: window.innerWidth > 768 ? 40 : 28,
                fontSize: window.innerWidth > 768 ? 20 : 14,
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
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)';
                e.currentTarget.style.transform = 'translateY(-50%)';
              }}
            >
              ‹
            </button>

            {/* Main Media Display - Fixed Sizing */}
            {(() => {
              const currentMediaUrl = selectedMediaGallery.media[selectedMediaGallery.index];
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
                    maxWidth: window.innerWidth > 768 ? '75vw' : '90vw',
                    maxHeight: window.innerWidth > 768 ? '70vh' : '60vh',
                    width: 'auto',
                    height: 'auto',
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    background: '#000'
                  }}
                />
              ) : (
                <img
                  src={currentMediaUrl}
                  alt={`Shortlist media ${selectedMediaGallery.index + 1}`}
                  style={{
                    maxWidth: window.innerWidth > 768 ? '75vw' : '90vw',
                    maxHeight: window.innerWidth > 768 ? '70vh' : '60vh',
                    width: 'auto',
                    height: 'auto',
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    background: '#fff'
                  }}
                />
              );
            })()}

            {/* Next Button - Mobile Optimized */}
            <button
              onClick={() =>
                setSelectedMediaGallery(g => ({
                  ...g,
                  index: g.index < g.media.length - 1 ? g.index + 1 : 0
                }))
              }
              style={{
                position: 'absolute',
                right: window.innerWidth > 768 ? 20 : 5,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: window.innerWidth > 768 ? 40 : 28,
                height: window.innerWidth > 768 ? 40 : 28,
                fontSize: window.innerWidth > 768 ? 20 : 14,
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
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)';
                e.currentTarget.style.transform = 'translateY(-50%)';
              }}
            >
              ›
            </button>

            {/* Close Button - Mobile Optimized */}
            <button
              onClick={() => setSelectedMediaGallery({ media: [], index: 0 })}
              style={{
                position: 'absolute',
                top: window.innerWidth > 768 ? 15 : 8,
                right: window.innerWidth > 768 ? 15 : 8,
                backgroundColor: 'rgba(244,67,54,0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: window.innerWidth > 768 ? 35 : 26,
                height: window.innerWidth > 768 ? 35 : 26,
                fontSize: window.innerWidth > 768 ? 18 : 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                fontWeight: 'bold'
              }}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = 'rgba(244,67,54,1)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.backgroundColor = 'rgba(244,67,54,0.8)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              ×
            </button>

            {/* Media Counter - Mobile Optimized */}
            <div style={{
              position: 'absolute',
              bottom: window.innerWidth > 768 ? 15 : 8,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: window.innerWidth > 768 ? '6px 12px' : '4px 8px',
              borderRadius: '12px',
              fontSize: window.innerWidth > 768 ? '14px' : '12px',
              fontWeight: 500
            }}>
              {selectedMediaGallery.index + 1} of {selectedMediaGallery.media.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortlistManager;