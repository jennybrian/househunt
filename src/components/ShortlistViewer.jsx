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
  const [imageGallery, setImageGallery] = useState({ images: [], index: 0 });

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
          {shortlist.properties.map((property, index) => (
            <div
              key={property.id}
                style={{
                    border: "1px solid #ddd", // lighter gray than #ddd for a fresher look
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: "white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    transition: "box-shadow 0.2s, transform 0.2s",
                    cursor:
                    property.photos && property.photos.length > 0 ? "pointer" : "default",
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

              {/* Property Image Gallery */}
              {property.photos && property.photos.length > 0 ? (
                <div
                  style={{
                    width: '100%',
                    height: 220,
                    overflow: 'hidden',
                    display: 'flex',
                    cursor: 'pointer'
                  }}
                  onClick={() => setImageGallery({ images: property.photos, index: 0 })}
                >
                  {property.photos.slice(0, 3).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={property.title}
                      style={{
                        width: `${100 / Math.min(3, property.photos.length)}%`,
                        height: '220px',
                        objectFit: 'cover',
                        borderRight: i < property.photos.length - 1 ? '2px solid #fff' : 'none'
                      }}
                    />
                  ))}
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
                  No image available
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
          ))}
        </div>
      )}

      {/* Image Gallery Modal */}
      {imageGallery.images.length > 0 && (
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
          onClick={() => setImageGallery({ images: [], index: 0 })}
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
              borderRadius: '24px',
              boxShadow: '0 8px 48px rgba(0,0,0,0.35)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() =>
                setImageGallery(g => ({
                  ...g,
                  index: g.index > 0 ? g.index - 1 : g.images.length - 1
                }))
              }
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 56,
                height: 56,
                fontSize: 36,
                cursor: 'pointer',
                zIndex: 1
              }}
              title="Previous"
            >
              ‹
            </button>
            <img
              src={imageGallery.images[imageGallery.index]}
              alt={`Property image ${imageGallery.index + 1}`}
              style={{
                maxWidth: '85vw',
                maxHeight: '85vh',
                borderRadius: '18px',
                boxShadow: '0 8px 48px rgba(0,0,0,0.45)',
                background: '#fff'
              }}
            />
            <button
              onClick={() =>
                setImageGallery(g => ({
                  ...g,
                  index: g.index < g.images.length - 1 ? g.index + 1 : 0
                }))
              }
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 56,
                height: 56,
                fontSize: 36,
                cursor: 'pointer',
                zIndex: 1
              }}
              title="Next"
            >
              ›
            </button>
            <button
              onClick={() => setImageGallery({ images: [], index: 0 })}
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                fontSize: '32px',
                cursor: 'pointer'
              }}
              title="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortlistViewer;