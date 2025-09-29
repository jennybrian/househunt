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

  useEffect(() => {
    const shortlistIds = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    setShortlist(shortlistIds);
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const propertiesData = await getProperties();
      const sortedProperties = propertiesData.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate - aDate;
      });
      setProperties(sortedProperties);
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
      setProperties(prev => prev.filter(p => p.id !== deleteConfirmation.id));
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Error deleting property:', error);
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
        const results = await deleteMultipleProperties(selectedProperties);
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        if (successful.length > 0) {
          const successfulIds = successful.map(r => r.id);
          setProperties(prev => 
            prev.filter(p => !successfulIds.includes(p.id))
          );
        }
        
        setSelectedProperties([]);
        setBulkDeleteMode(false);
        
        if (failed.length === 0) {
          alert(`Successfully deleted ${successful.length} properties and their images.`);
        } else {
          alert(`Bulk delete completed:\n- ${successful.length} properties deleted successfully\n- ${failed.length} properties failed to delete`);
        }
      } catch (error) {
        console.error('Error during bulk delete:', error);
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

  const handleAddToShortlist = (propertyId) => {
    setShortlist(prev => {
      if (prev.includes(propertyId)) return prev;
      const updated = [...prev, propertyId];
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveFromShortlist = (propertyId) => {
    setShortlist(prev => {
      const updated = prev.filter(id => id !== propertyId);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Helper function to get all media (photos + videos) for a property
  const getPropertyMedia = (property) => {
    const media = [];
    
    // Add photos with type indicator
    if (property.photos && property.photos.length > 0) {
      property.photos.forEach((url, index) => {
        media.push({
          url,
          type: 'image',
          index: media.length
        });
      });
    }
    
    // Add videos with type indicator
    if (property.videos && property.videos.length > 0) {
      property.videos.forEach((url, index) => {
        media.push({
          url,
          type: 'video',
          index: media.length
        });
      });
    }
    
    return media;
  };

  const filteredProperties = properties.filter(property => {
    const keyword = search.trim().toLowerCase();
    const matchesKeyword =
      !keyword ||
      property.title?.toLowerCase().includes(keyword) ||
      property.notes?.toLowerCase().includes(keyword) ||
      property.address?.toLowerCase().includes(keyword);

    const matchesLocation =
      !filterLocation ||
      property.address?.toLowerCase().includes(filterLocation.trim().toLowerCase());

    const matchesType = !filterType || property.type === filterType;

    const matchesAvailability =
      !filterAvailability ||
      (property.availability || '').toLowerCase() === filterAvailability.toLowerCase();

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
        <div>Loading properties...</div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div>No properties found</div>
        <button onClick={loadProperties} style={{ marginTop: '10px', padding: '8px 16px' }}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header with Title and Action Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: 22,
          color: '#0d4d4d',
          fontWeight: 700
        }}>
          Property Gallery ({filteredProperties.length})
        </h2>
        
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {!bulkDeleteMode ? (
            <>
              <button
                onClick={loadProperties}
                style={{
                  padding: "6px 14px",
                  backgroundColor: "#2196F3",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 500,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  boxShadow: "0 1px 3px rgba(33,150,243,0.3)",
                  transition: "all 0.2s ease",
                  minHeight: "30px"
                }}
                onMouseOver={e => {
                  e.currentTarget.style.backgroundColor = "#1565c0";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(33,150,243,0.4)";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.backgroundColor = "#2196F3";
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(33,150,243,0.3)";
                }}
              >
                Refresh
              </button>
              <button 
                onClick={toggleBulkMode}
                style={{ 
                  padding: '6px 14px',
                  backgroundColor: '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  boxShadow: "0 1px 3px rgba(255,152,0,0.3)",
                  transition: "all 0.2s ease",
                  minHeight: "30px"
                }}
                onMouseOver={e => {
                  e.currentTarget.style.backgroundColor = "#e65100";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(255,152,0,0.4)";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.backgroundColor = "#ff9800";
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(255,152,0,0.3)";
                }}
              >
                Bulk Delete
              </button>
            </>
          ) : (
            <>
              <span style={{ 
                padding: '4px 10px',
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                minHeight: '22px'
              }}>
                {selectedProperties.length} selected
              </span>
              <button 
                onClick={handleBulkDelete}
                disabled={selectedProperties.length === 0}
                style={{
                  padding: "6px 14px",
                  backgroundColor: selectedProperties.length > 0 ? "#f44336" : "#ccc",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 500,
                  fontSize: 13,
                  cursor: selectedProperties.length > 0 ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  boxShadow: selectedProperties.length > 0 ? "0 1px 3px rgba(244,67,54,0.3)" : "none",
                  transition: "all 0.2s ease",
                  opacity: selectedProperties.length > 0 ? 1 : 0.6,
                  minHeight: "30px"
                }}
                onMouseOver={e => {
                  if (selectedProperties.length > 0) {
                    e.currentTarget.style.backgroundColor = "#b71c1c";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 2px 6px rgba(244,67,54,0.4)";
                  }
                }}
                onMouseOut={e => {
                  if (selectedProperties.length > 0) {
                    e.currentTarget.style.backgroundColor = "#f44336";
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(244,67,54,0.3)";
                  }
                }}
              >
                Delete ({selectedProperties.length})
              </button>
              <button 
                onClick={toggleBulkMode}
                style={{ 
                  padding: '6px 14px', 
                  backgroundColor: '#666', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px',
                  fontWeight: 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.2s ease",
                  minHeight: "30px"
                }}
                onMouseOver={e => {
                  e.currentTarget.style.backgroundColor = "#424242";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.backgroundColor = "#666";
                  e.currentTarget.style.transform = "none";
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ 
        marginBottom: 24, 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 12,
        padding: '16px',
        backgroundColor: '#f8fffe',
        borderRadius: '8px',
        border: '1px solid #e0f2f1'
      }}>
        <input
          type="text"
          placeholder="Keyword (title, notes, address)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ 
            padding: '8px 12px', 
            borderRadius: 6, 
            border: '1px solid #ccc', 
            minWidth: 180,
            fontSize: 14,
            outline: 'none',
            transition: 'border 0.2s'
          }}
          onFocus={e => e.target.style.border = '1px solid #00bfae'}
          onBlur={e => e.target.style.border = '1px solid #ccc'}
        />
        <input
          type="text"
          placeholder="Location"
          value={filterLocation}
          onChange={e => setFilterLocation(e.target.value)}
          style={{ 
            padding: '8px 12px', 
            borderRadius: 6, 
            border: '1px solid #ccc', 
            minWidth: 120,
            fontSize: 14,
            outline: 'none',
            transition: 'border 0.2s'
          }}
          onFocus={e => e.target.style.border = '1px solid #00bfae'}
          onBlur={e => e.target.style.border = '1px solid #ccc'}
        />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ 
            padding: '8px 12px', 
            borderRadius: 6, 
            border: '1px solid #ccc', 
            minWidth: 120,
            fontSize: 14,
            outline: 'none',
            backgroundColor: 'white'
          }}
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
          style={{ 
            padding: '8px 12px', 
            borderRadius: 6, 
            border: '1px solid #ccc', 
            minWidth: 120,
            fontSize: 14,
            outline: 'none',
            backgroundColor: 'white'
          }}
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
          style={{ 
            padding: '8px 12px', 
            borderRadius: 6, 
            border: '1px solid #ccc', 
            width: 100,
            fontSize: 14,
            outline: 'none',
            transition: 'border 0.2s'
          }}
          onFocus={e => e.target.style.border = '1px solid #00bfae'}
          onBlur={e => e.target.style.border = '1px solid #ccc'}
        />
        <input
          type="number"
          placeholder="Max Price"
          value={filterPriceMax}
          onChange={e => setFilterPriceMax(e.target.value)}
          style={{ 
            padding: '8px 12px', 
            borderRadius: 6, 
            border: '1px solid #ccc', 
            width: 100,
            fontSize: 14,
            outline: 'none',
            transition: 'border 0.2s'
          }}
          onFocus={e => e.target.style.border = '1px solid #00bfae'}
          onBlur={e => e.target.style.border = '1px solid #ccc'}
        />
      </div>

      {/* Properties Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        {filteredProperties.map((property) => {
          const allMedia = getPropertyMedia(property);
          const firstMediaItem = allMedia[0];
          
          return (
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
                // Prevent card opening when clicking specific interactive elements
                if (
                  !bulkDeleteMode && 
                  !e.target.closest('.availability-toggle') &&
                  !e.target.closest('.shortlist-btn') &&
                  !e.target.closest('.delete-btn') &&
                  !e.target.closest('.gallery-thumb')
                ) {
                  setExpandedProperty(property);
                }
              }}
              onMouseOver={e => {
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                e.currentTarget.style.transform = "translateY(-2px)";
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
                    width: 18,
                    height: 18,
                  }}
                />
              )}

              {/* Property Media (Image or Video) */}
              {firstMediaItem ? (
                <div style={{ position: 'relative' }}>
                  {firstMediaItem.type === 'image' ? (
                    <img
                      src={firstMediaItem.url}
                      alt={property.title}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        cursor: 'pointer'
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        setImageGallery({ images: allMedia.map(m => m.url), index: 0 });
                      }}
                    />
                  ) : (
                    <video
                      src={firstMediaItem.url}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        cursor: 'pointer'
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        setImageGallery({ images: allMedia.map(m => m.url), index: 0 });
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
                  height: '200px',
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

              {/* Property Details */}
              <div style={{ padding: '16px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
                  {property.title}
                </h3>
                
                <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                  {property.address}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
                  <span style={{ 
                    backgroundColor: '#e3f2fd', 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    color: '#1976d2',
                    fontWeight: 500
                  }}>
                    {property.type}
                  </span>
                  <span style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '16px' }}>
                    {formatPrice(property.price)}
                  </span>
                </div>

                {property.landlordContact && (
                  <p style={{ margin: '4px 0', fontSize: '14px', color: '#555' }}>
                    {property.landlordContact}
                  </p>
                )}

                {property.notes && (
                  <p style={{ margin: '8px 0', fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
                    {property.notes.substring(0, 100)}{property.notes.length > 100 ? '...' : ''}
                  </p>
                )}

                {/* Bottom Actions Row */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginTop: '12px',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '12px', color: '#999' }}>
                    {formatDate(property.createdAt)}
                  </span>
                  
                  {/* Availability Toggle */}
                  <div
                    className="availability-toggle"
                    onClick={e => {
                      e.stopPropagation();
                      handleToggleAvailability(property);
                    }}
                    style={{
                      width: 100,
                      height: 32,
                      borderRadius: 16,
                      background: property.availability === "Available"
                        ? "linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)"
                        : "linear-gradient(90deg, #ff9800 0%, #ffb74d 100%)",
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      position: "relative",
                      transition: "all 0.2s ease"
                    }}
                    title="Toggle availability"
                  >
                    <span style={{
                      width: "100%",
                      textAlign: "center",
                      color: "white",
                      fontWeight: 600,
                      fontSize: 12,
                      letterSpacing: "0.3px"
                    }}>
                      {property.availability === "Available" ? "Available" : "Taken"}
                    </span>
                    <div style={{
                      position: "absolute",
                      top: 2,
                      left: property.availability === "Available" ? 2 : 70,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "left 0.2s ease",
                      fontSize: 12
                    }}>
                      {property.availability === "Available" ? "✓" : "✗"}
                    </div>
                  </div>
                </div>

                {/* Media Gallery Preview */}
                {allMedia.length > 1 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500 }}>
                      Media ({allMedia.length} items):
                    </div>
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                      {allMedia.slice(0, 4).map((mediaItem, index) => (
                        <div
                          key={index}
                          className="gallery-thumb"
                          style={{
                            position: 'relative',
                            width: '50px',
                            height: '50px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: '2px solid #ddd',
                            flexShrink: 0,
                            transition: 'border-color 0.2s',
                            overflow: 'hidden'
                          }}
                          onMouseOver={e => e.currentTarget.style.borderColor = '#00bfae'}
                          onMouseOut={e => e.currentTarget.style.borderColor = '#ddd'}
                          onClick={e => {
                            e.stopPropagation();
                            setImageGallery({ images: allMedia.map(m => m.url), index });
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
                              top: '2px',
                              right: '2px',
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              color: 'white',
                              borderRadius: '2px',
                              padding: '1px 3px',
                              fontSize: '8px'
                            }}>
                              🎥
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginTop: '12px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    className="shortlist-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      shortlist.includes(property.id) 
                        ? handleRemoveFromShortlist(property.id)
                        : handleAddToShortlist(property.id);
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      backgroundColor: shortlist.includes(property.id) ? '#4caf50' : '#00bfae',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {shortlist.includes(property.id) ? 'Shortlisted' : 'Add to Shortlist'}
                  </button>
                  
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(property);
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.backgroundColor = '#d32f2f';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.backgroundColor = '#f44336';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Media Gallery Modal */}
      {imageGallery.images.length > 0 && (
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
          onClick={() => setImageGallery({ images: [], index: 0 })}
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
            {/* Previous Button - Responsive Size */}
            <button
              onClick={() =>
                setImageGallery(g => ({
                  ...g,
                  index: g.index > 0 ? g.index - 1 : g.images.length - 1
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
              const currentMediaUrl = imageGallery.images[imageGallery.index];
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
                  alt={`Property media ${imageGallery.index + 1}`}
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

            {/* Next Button - Responsive Size */}
            <button
              onClick={() =>
                setImageGallery(g => ({
                  ...g,
                  index: g.index < g.images.length - 1 ? g.index + 1 : 0
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

            {/* Close Button - Responsive Size */}
            <button
              onClick={() => setImageGallery({ images: [], index: 0 })}
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
            <div style={{
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
            }}>
              {imageGallery.index + 1} of {imageGallery.images.length}
            </div>
          </div>
        </div>
      )}

      {/* Expanded Property Modal - Mobile Optimized */}
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
            zIndex: 3000,
            padding: window.innerWidth > 768 ? '20px' : '10px',
            overflowY: 'auto'
          }}
          onClick={() => setExpandedProperty(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              maxWidth: window.innerWidth > 768 ? 500 : '95vw',
              width: '100%',
              maxHeight: window.innerWidth > 768 ? '85vh' : '90vh',
              overflowY: 'auto',
              padding: window.innerWidth > 768 ? 24 : 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              position: 'relative',
              margin: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setExpandedProperty(null)}
              style={{
                position: 'absolute',
                top: window.innerWidth > 768 ? 12 : 8,
                right: window.innerWidth > 768 ? 12 : 8,
                background: '#f44336',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: window.innerWidth > 768 ? 32 : 28,
                height: window.innerWidth > 768 ? 32 : 28,
                fontSize: window.innerWidth > 768 ? 18 : 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              title="Close"
            >
              ×
            </button>

            <h2 style={{ 
              marginBottom: 16, 
              paddingRight: 40,
              fontSize: window.innerWidth > 768 ? '24px' : '20px'
            }}>
              {expandedProperty.title}
            </h2>
            
            {(() => {
              const expandedMedia = getPropertyMedia(expandedProperty);
              const firstMedia = expandedMedia[0];
              
              if (!firstMedia) return null;
              
              return firstMedia.type === 'image' ? (
                <img
                  src={firstMedia.url}
                  alt={expandedProperty.title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: window.innerWidth > 768 ? '250px' : '180px',
                    objectFit: 'cover',
                    borderRadius: 8,
                    marginBottom: 16
                  }}
                />
              ) : (
                <video
                  src={firstMedia.url}
                  controls
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: window.innerWidth > 768 ? '250px' : '180px',
                    objectFit: 'cover',
                    borderRadius: 8,
                    marginBottom: 16,
                    backgroundColor: '#000'
                  }}
                />
              );
            })()}

            <div style={{ 
              lineHeight: '1.6',
              fontSize: window.innerWidth > 768 ? '15px' : '14px'
            }}>
              <p><strong>Address:</strong> {expandedProperty.address}</p>
              <p><strong>Type:</strong> {expandedProperty.type}</p>
              <p><strong>Price:</strong> {formatPrice(expandedProperty.price)}</p>
              <p><strong>Landlord Contact:</strong> {expandedProperty.landlordContact}</p>
              <p><strong>Availability:</strong> {expandedProperty.availability}</p>
              <p><strong>Notes:</strong> {expandedProperty.notes || "No notes available"}</p>
              <p><strong>Added:</strong> {formatDate(expandedProperty.createdAt)}</p>
              
              {/* Media count info */}
              {(() => {
                const mediaCount = getPropertyMedia(expandedProperty);
                if (mediaCount.length > 0) {
                  const images = expandedProperty.photos ? expandedProperty.photos.length : 0;
                  const videos = expandedProperty.videos ? expandedProperty.videos.length : 0;
                  return (
                    <p><strong>Media:</strong> {images} images, {videos} videos</p>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Media Gallery Modal - Mobile Optimized */}
      {imageGallery.images.length > 0 && (
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
            zIndex: 4000,
            padding: window.innerWidth > 768 ? '60px 20px 60px 20px' : '50px 5px 50px 5px'
          }}
          onClick={() => setImageGallery({ images: [], index: 0 })}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Previous Button - Mobile Optimized */}
            <button
              onClick={() =>
                setImageGallery(g => ({
                  ...g,
                  index: g.index > 0 ? g.index - 1 : g.images.length - 1
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
              title="Previous"
            >
              ‹
            </button>

            {/* Main Media Display - Fixed Sizing */}
            {(() => {
              const currentMediaUrl = imageGallery.images[imageGallery.index];
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
                    maxWidth: '100%',
                    maxHeight: '100%',
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
                  alt={`Property media ${imageGallery.index + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
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
                setImageGallery(g => ({
                  ...g,
                  index: g.index < g.images.length - 1 ? g.index + 1 : 0
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
              title="Next"
            >
              ›
            </button>

            {/* Close Button - Mobile Optimized */}
            <button
              onClick={() => setImageGallery({ images: [], index: 0 })}
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
                fontWeight: 'bold',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = 'rgba(244,67,54,1)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.backgroundColor = 'rgba(244,67,54,0.8)';
                e.currentTarget.style.transform = 'none';
              }}
              title="Close"
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
              {imageGallery.index + 1} of {imageGallery.images.length}
            </div>
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
            zIndex: 2000,
            padding: '20px'
          }}
          onClick={cancelDelete}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
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

      {/* Single Image Modal */}
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
                width: '32px',
                height: '32px',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
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