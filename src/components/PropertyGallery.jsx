// src/components/PropertyGallery.jsx
import React, { useState, useEffect } from 'react';
import { getProperties, deleteProperty, deleteMultipleProperties, updateProperty } from '../services/firestore';

const PropertyGallery = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageGallery, setImageGallery] = useState({ images: [], index: 0 });
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [shortlist, setShortlist] = useState([]);
  const [expandedProperty, setExpandedProperty] = useState(null);

  const LOCAL_KEY = "househunt_shortlist";

  useEffect(() => {
    loadProperties();
  }, []);

  // On mount, load shortlist from localStorage
  useEffect(() => {
    const shortlistIds = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    setShortlist(shortlistIds);
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const propertiesData = await getProperties();
      // Sort by createdAt descending (most recent first)
      const sortedProperties = propertiesData.sort((a, b) => {
        // Firestore timestamps may be objects with a toDate() method
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate - aDate;
      });
      setProperties(sortedProperties);
      console.log('📊 Loaded properties with structure:', sortedProperties.map(p => ({
        id: p.id,
        title: p.title,
        photos: p.photos,
        imageDetails: p.imageDetails,
        hasPhotos: !!p.photos,
        photoCount: p.photos?.length || 0
      })));
    } catch (error) {
      console.error('Error loading properties:', error);
      alert('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (property) => {
    setDeleteConfirmation(property);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    try {
      await deleteProperty(deleteConfirmation.id);
      
      // Remove from local state immediately for better UX
      setProperties(prev => prev.filter(p => p.id !== deleteConfirmation.id));
      
      setDeleteConfirmation(null);
      console.log('✅ Property deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting property:', error);
      alert(`Failed to delete property: ${error.message}`);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const togglePropertySelection = (propertyId) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedProperties.length === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedProperties.length} properties? This will also delete all associated images from Cloudinary. This action cannot be undone.`
    );

    if (confirmDelete) {
      try {
        console.log('Starting bulk delete for properties:', selectedProperties);
        
        // Use the enhanced bulk delete function
        const results = await deleteMultipleProperties(selectedProperties);
        
        // Check results
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        if (successful.length > 0) {
          // Remove successfully deleted properties from local state
          const successfulIds = successful.map(r => r.id);
          setProperties(prev => 
            prev.filter(p => !successfulIds.includes(p.id))
          );
        }
        
        setSelectedProperties([]);
        setBulkDeleteMode(false);
        
        // Show results to user
        if (failed.length === 0) {
          console.log(`✅ All ${successful.length} properties deleted successfully`);
          alert(`Successfully deleted ${successful.length} properties and their images.`);
        } else {
          console.log(`⚠️ Bulk delete completed: ${successful.length} successful, ${failed.length} failed`);
          alert(`Bulk delete completed:\n- ${successful.length} properties deleted successfully\n- ${failed.length} properties failed to delete`);
        }
        
      } catch (error) {
        console.error('❌ Error during bulk delete:', error);
        alert(`Failed to complete bulk delete: ${error.message}`);
      }
    }
  };

  const toggleBulkMode = () => {
    setBulkDeleteMode(!bulkDeleteMode);
    setSelectedProperties([]);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    // Handle Firestore timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-KE');
  };

  const handleToggleAvailability = async (property) => {
    const newStatus = property.availability === 'Available' ? 'Taken' : 'Available';
    try {
      await updateProperty(property.id, { availability: newStatus });
      setProperties(prev =>
        prev.map(p =>
          p.id === property.id ? { ...p, availability: newStatus } : p
        )
      );
    } catch (error) {
      alert('Failed to update availability: ' + error.message);
    }
  };

  // Add to shortlist handler
  const handleAddToShortlist = (propertyId) => {
    setShortlist(prev => {
      if (prev.includes(propertyId)) return prev;
      const updated = [...prev, propertyId];
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Remove from shortlist handler
  const handleRemoveFromShortlist = (propertyId) => {
    setShortlist(prev => {
      const updated = prev.filter(id => id !== propertyId);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Filter properties based on search and filter criteria
  const filteredProperties = properties.filter(property => {
    // Keyword search (title, notes, address)
    const keyword = search.trim().toLowerCase();
    const matchesKeyword =
      !keyword ||
      property.title?.toLowerCase().includes(keyword) ||
      property.notes?.toLowerCase().includes(keyword) ||
      property.address?.toLowerCase().includes(keyword);

    // Location filter
    const matchesLocation =
      !filterLocation ||
      property.address?.toLowerCase().includes(filterLocation.trim().toLowerCase());

    // Type filter
    const matchesType = !filterType || property.type === filterType;

    // Availability filter
    const matchesAvailability =
      !filterAvailability ||
      (property.availability || '').toLowerCase() === filterAvailability.toLowerCase();

    // Price filter
    const price = Number(property.price) || 0;
    const min = filterPriceMin ? Number(filterPriceMin) : 0;
    const max = filterPriceMax ? Number(filterPriceMax) : Infinity;
    const matchesPrice = price >= min && price <= max;

    return (
      matchesKeyword &&
      matchesLocation &&
      matchesType &&
      matchesAvailability &&
      matchesPrice
    );
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div>🔄 Loading properties...</div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div>📭 No properties found</div>
        <button onClick={loadProperties} style={{ marginTop: '10px', padding: '8px 16px' }}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* === HEADING ROW (separate) === */}
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Property Gallery ({properties.length})</h2>
      </div>

      {/* === BUTTONS ROW (separate, right aligned, wraps on small screens) === */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: 20, flexWrap: 'wrap' }}>
        {!bulkDeleteMode ? (
          <>
            <button
              onClick={loadProperties}
              style={{
                padding: "12px 28px",
                backgroundColor: "#2196F3",
                color: "#fff",
                border: "none",
                borderRadius: "20px",
                fontWeight: 600,
                fontSize: 16,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(33,150,243,0.08)",
                transition: "background 0.2s, transform 0.2s",
                marginRight: 8,
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = "#1565c0"}
              onMouseOut={e => e.currentTarget.style.backgroundColor = "#2196F3"}
            >
              🔄 Refresh
            </button>
            <button 
              onClick={toggleBulkMode}
              style={{ 
                padding: '12px 28px',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: "0 2px 8px rgba(255,152,0,0.08)",
                transition: "background 0.2s, transform 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = "#e65100"}
              onMouseOut={e => e.currentTarget.style.backgroundColor = "#ff9800"}
            >
              🗑️ Bulk Delete
            </button>
          </>
        ) : (
          <>
            <span style={{ 
              padding: '8px 12px',
              backgroundColor: '#e3f2fd',
              color: '#1976d2',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              {selectedProperties.length} selected
            </span>
            <button 
              onClick={handleBulkDelete}
              disabled={selectedProperties.length === 0}
              style={{
                padding: "12px 28px",
                backgroundColor: selectedProperties.length > 0 ? "#f44336" : "#ccc",
                color: "#fff",
                border: "none",
                borderRadius: "20px",
                fontWeight: 600,
                fontSize: 16,
                cursor: selectedProperties.length > 0 ? "pointer" : "not-allowed",
                boxShadow: "0 2px 8px rgba(244,67,54,0.08)",
                transition: "background 0.2s, transform 0.2s",
                marginLeft: 8,
              }}
              onMouseOver={e => {
                if (selectedProperties.length > 0) e.currentTarget.style.backgroundColor = "#b71c1c";
              }}
              onMouseOut={e => {
                if (selectedProperties.length > 0) e.currentTarget.style.backgroundColor = "#f44336";
              }}
            >
              🗑️ Bulk Delete
            </button>
            <button 
              onClick={toggleBulkMode}
              style={{ 
                padding: '12px 28px', 
                backgroundColor: '#666', 
                color: 'white', 
                border: 'none', 
                borderRadius: '20px',
                fontWeight: 600,
                fontSize: 16,
                fontFamily: "sans-serif",
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <input
          type="text"
          placeholder="Keyword (title, notes, address)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', minWidth: 180 }}
        />
        <input
          type="text"
          placeholder="Location"
          value={filterLocation}
          onChange={e => setFilterLocation(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', minWidth: 120 }}
        />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', minWidth: 120 }}
        >
          <option value="">All Types</option>
          <option value="Bedsitter">Bedsitter</option>
          <option value="1Bedroom">1 Bedroom</option>
          <option value="2Bedroom">2 Bedroom</option>
          <option value="3Bedroom">3 Bedroom</option>
          <option value="4Bedroom">4 Bedroom</option>
          <option value="Maisonette">Maisonette</option>
          <option value="Bungalow">Bungalow</option>
          <option value="Townhouse">Townhouse</option>
          <option value="Duplex">Duplex</option>
          <option value="Penthouse">Penthouse</option>
          <option value="Villa">Villa</option>
        </select>
        <select
          value={filterAvailability}
          onChange={e => setFilterAvailability(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', minWidth: 120 }}
        >
          <option value="">All</option>
          <option value="Available">Available</option>
          <option value="Taken">Taken</option>
        </select>
        <input
          type="number"
          placeholder="Min Price"
          value={filterPriceMin}
          onChange={e => setFilterPriceMin(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', width: 100 }}
        />
        <input
          type="number"
          placeholder="Max Price"
          value={filterPriceMax}
          onChange={e => setFilterPriceMax(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', width: 100 }}
        />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        {filteredProperties.map((property) => (
          <div
            key={property.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              position: 'relative',
              transition: "box-shadow 0.2s, transform 0.2s",
              cursor: "pointer"
            }}
            onClick={(e) => {
              // Only open details if not bulkDeleteMode and not clicking the toggle
              if (!bulkDeleteMode && !e.target.classList.contains('availability-toggle')) {
                setExpandedProperty(property);
              }
            }}
            onMouseOver={e => {
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.18)";
              e.currentTarget.style.transform = "translateY(-4px) scale(1.01)";
            }}
            onMouseOut={e => {
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              e.currentTarget.style.transform = "none";
            }}
          >
            {/* Bulk Delete Checkbox */}
            {bulkDeleteMode && (
              <input
                type="checkbox"
                checked={selectedProperties.includes(property.id)}
                onChange={e => {
                  e.stopPropagation();
                  togglePropertySelection(property.id);
                }}
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  zIndex: 2,
                  width: 20,
                  height: 20,
                }}
              />
            )}
            {/* Property Images */}
            {property.photos && property.photos.length > 0 ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={property.photos[0]}
                  alt={property.title}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    setImageGallery({ images: property.photos, index: 0 });
                  }}
                />
                {property.photos.length > 1 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    +{property.photos.length - 1} more
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                width: '100%',
                height: '200px',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666'
              }}>
                📷 No images
              </div>
            )}
            {/* Property Details */}
            <div style={{ padding: '16px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                {property.title}
              </h3>
              
              <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                🗺️ {property.address}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
                <span style={{ 
                  backgroundColor: '#e3f2fd', 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  color: '#1976d2'
                }}>
                  {property.type}
                </span>
                <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                  {formatPrice(property.price)}
                </span>
              </div>

              {property.landlordContact && (
                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                  ☎️ {property.landlordContact}
                </p>
              )}

              {property.notes && (
                <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
                  {property.notes.substring(0, 100)}...
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <span style={{ fontSize: '12px', color: '#999' }}>
                  Added: {formatDate(property.createdAt)}
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div
                    className="availability-toggle"
                    onClick={e => {
                      e.stopPropagation();
                      handleToggleAvailability(property);
                    }}
                    style={{
                      width: 160,
                      height: 40,
                      borderRadius: 24,
                      background: property.availability === "Available"
                        ? "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)"
                        : "linear-gradient(90deg, #ff9800 0%, #ff512f 100%)",
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      position: "relative",
                      transition: "background 0.3s"
                    }}
                    title="Toggle availability"
                  >
                    <span style={{
                      width: "100%",
                      textAlign: "center",
                      color: property.availability === "Available" ? "#155724" : "#fff",
                      fontWeight: 600,
                      fontSize: 15,
                      letterSpacing: "0.5px",
                      transition: "color 0.2s"
                    }}>
                      {property.availability === "Available" ? "Available" : "Taken"}
                    </span>
                    <div style={{
                      position: "absolute",
                      top: 4,
                      left: property.availability === "Available" ? 4 : 124,
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#fff",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "left 0.3s"
                    }}>
                      {property.availability === "Available" ? "🔑" : "🔒"}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(property);
                    }}
                    style={{
                      padding: '4px 8px',
                      fontFamily: 'Inter, Nunito, Arial, sans-serif',
                      fontSize: '10px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Delete property"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Image Gallery Preview */}
              {property.photos && property.photos.length > 1 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Gallery ({property.photos.length} images):
                  </div>
                  <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
                    {property.photos.slice(0, 4).map((photoUrl, index) => (
                      <img
                        key={index}
                        src={photoUrl} // Use direct URL
                        alt={`${property.title} - Image ${index + 1}`}
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          border: '1px solid #ddd'
                        }}
                        onError={(e) => {
                          console.log('Thumbnail failed to load:', photoUrl);
                          e.target.style.display = 'none';
                        }}
                        onClick={() => setSelectedImage({
                          url: photoUrl,
                          title: `${property.title} - Image ${index + 1}`
                        })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Shortlist button */}
              <button
                onClick={() => handleAddToShortlist(property.id)}
                style={{
                  padding: '4px 8px',
                  fontFamily: 'Inter, Nunito, Arial, sans-serif',
                  fontSize: '10px',
                  backgroundColor: shortlist.includes(property.id) ? '#b2dfdb' : '#00bfae',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginLeft: 4
                }}
              >
                {shortlist.includes(property.id) ? 'Shortlisted' : 'Add to Shortlist'}
              </button>
            </div>
          </div>
        ))}
      </div>

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
              maxWidth: '90vw', // Almost full width
              maxHeight: '90vh', // Almost full height
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
                maxWidth: '85vw', // Large image, but not full page
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

      {/* Expanded Property Modal */}
      {expandedProperty && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000
          }}
          onClick={() => setExpandedProperty(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              maxWidth: 480,
              width: '90%',
              padding: 32,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: 12 }}>{expandedProperty.title}</h2>
            {expandedProperty.photos && expandedProperty.photos.length > 0 && (
              <img
                src={expandedProperty.photos[0]}
                alt={expandedProperty.title}
                style={{
                  width: '100%',
                  height: '220px',
                  objectFit: 'cover',
                  borderRadius: 8,
                  marginBottom: 16
                }}
              />
            )}
            <p><strong>Address:</strong> {expandedProperty.address}</p>
            <p><strong>Type:</strong> {expandedProperty.type}</p>
            <p><strong>Price:</strong> {formatPrice(expandedProperty.price)}</p>
            <p><strong>Landlord Contact:</strong> {expandedProperty.landlordContact}</p>
            <p><strong>Availability:</strong> {expandedProperty.availability}</p>
            <p><strong>Notes:</strong> {expandedProperty.notes || "No notes"}</p>
            <p><strong>Added:</strong> {formatDate(expandedProperty.createdAt)}</p>
            <button
              onClick={() => setExpandedProperty(null)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: '#f44336',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                fontSize: 18,
                cursor: 'pointer'
              }}
              title="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={cancelDelete}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px 0', color: '#f44336' }}>
              Delete Property
            </h3>
            
            <p style={{ margin: '0 0 20px 0', color: '#333' }}>
              Are you sure you want to delete "<strong>{deleteConfirmation.title}</strong>"? 
              This action cannot be undone.
            </p>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px' 
            }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Delete Property
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }}
            />
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyGallery;
