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
            {shortlistedProperties.map((property) => (
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
                {property.photos && property.photos.length > 0 && (
                  <img
                    src={property.photos[0]}
                    alt={property.title}
                    style={{
                      width: "100%",
                      height: 160,
                      objectFit: "cover",
                    }}
                  />
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
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ShortlistManager;