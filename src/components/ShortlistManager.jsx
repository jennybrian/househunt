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

  const getPropertyMedia = (property) => {
    const media = [];
    if (property.photos?.length) {
      property.photos.forEach((url) => media.push({ url, type: "image" }));
    }
    if (property.videos?.length) {
      property.videos.forEach((url) => media.push({ url, type: "video" }));
    }
    return media;
  };

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

  const removeFromShortlist = (propertyId) => {
    const updated = shortlist.filter((id) => id !== propertyId);
    setShortlist(updated);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
  };

  const handleShare = async () => {
    if (shortlist.length === 0) {
      alert("Shortlist is empty.");
      return;
    }
    const shortlistDoc = await createShortlist(null, shortlist, "Shared Shortlist");
    setShareToken(shortlistDoc.shareToken);
    setShareLinks(generateShareableLinks(shortlistDoc.shareToken));
  };

  const shortlistedProperties = properties.filter((p) => shortlist.includes(p.id));

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h2>Shortlisted Properties</h2>
      {/* ... shortlist listing remains unchanged ... */}

      {/* Media Gallery Modal */}
      {selectedMediaGallery.media.length > 0 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 4000,
          }}
          onClick={() => setSelectedMediaGallery({ media: [], index: 0 })}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Button */}
            <button
              onClick={() =>
                setSelectedMediaGallery((g) => ({
                  ...g,
                  index: g.index > 0 ? g.index - 1 : g.media.length - 1,
                }))
              }
              style={{
                position: "absolute",
                left: window.innerWidth > 768 ? 20 : 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.7)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: window.innerWidth > 768 ? 48 : 36,
                height: window.innerWidth > 768 ? 48 : 36,
                fontSize: window.innerWidth > 768 ? 24 : 18,
                cursor: "pointer",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.8)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.7)";
                e.currentTarget.style.transform = "translateY(-50%)";
              }}
              title="Previous"
            >
              ‹
            </button>

            {/* Main Media */}
            {(() => {
              const currentMediaUrl = selectedMediaGallery.media[selectedMediaGallery.index];
              const isVideo =
                currentMediaUrl?.includes(".mp4") ||
                currentMediaUrl?.includes(".webm") ||
                currentMediaUrl?.includes(".mov") ||
                currentMediaUrl?.includes("video/upload");

              return isVideo ? (
                <video
                  src={currentMediaUrl}
                  controls
                  autoPlay
                  style={{
                    maxWidth: window.innerWidth > 768 ? "80vw" : "85vw",
                    maxHeight: window.innerWidth > 768 ? "80vh" : "75vh",
                    borderRadius: "8px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    background: "#000",
                  }}
                />
              ) : (
                <img
                  src={currentMediaUrl}
                  alt={`Shortlist media ${selectedMediaGallery.index + 1}`}
                  style={{
                    maxWidth: window.innerWidth > 768 ? "80vw" : "85vw",
                    maxHeight: window.innerWidth > 768 ? "80vh" : "75vh",
                    borderRadius: "8px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    background: "#fff",
                  }}
                />
              );
            })()}

            {/* Next Button */}
            <button
              onClick={() =>
                setSelectedMediaGallery((g) => ({
                  ...g,
                  index: g.index < g.media.length - 1 ? g.index + 1 : 0,
                }))
              }
              style={{
                position: "absolute",
                right: window.innerWidth > 768 ? 20 : 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.7)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: window.innerWidth > 768 ? 48 : 36,
                height: window.innerWidth > 768 ? 48 : 36,
                fontSize: window.innerWidth > 768 ? 24 : 18,
                cursor: "pointer",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.8)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.7)";
                e.currentTarget.style.transform = "translateY(-50%)";
              }}
              title="Next"
            >
              ›
            </button>

            {/* Close Button */}
            <button
              onClick={() => setSelectedMediaGallery({ media: [], index: 0 })}
              style={{
                position: "absolute",
                top: window.innerWidth > 768 ? 20 : 10,
                right: window.innerWidth > 768 ? 20 : 10,
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: window.innerWidth > 768 ? 40 : 32,
                height: window.innerWidth > 768 ? 40 : 32,
                fontSize: window.innerWidth > 768 ? 20 : 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(244,67,54,0.8)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.7)";
                e.currentTarget.style.transform = "none";
              }}
              title="Close"
            >
              ×
            </button>

            {/* Counter */}
            <div
              style={{
                position: "absolute",
                bottom: window.innerWidth > 768 ? 20 : 10,
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "white",
                padding: "6px 12px",
                borderRadius: "16px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {selectedMediaGallery.index + 1} of {selectedMediaGallery.media.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortlistManager;
