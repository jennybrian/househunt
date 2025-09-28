// src/components/PropertyImageManager.jsx
import { useState } from "react";
import { validateImageFile } from "../services/cloudinary";
import { addProperty } from "../services/firestore";

const CLOUD_NAME = "dwbuqswz2";
const UPLOAD_PRESET = "househunt_unsigned";

// Enhanced validation for both images and videos
const validateMediaFile = (file) => {
  const maxSize = 50 * 1024 * 1024; // 50MB for videos, more lenient
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const videoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime'];
  const allowedTypes = [...imageTypes, ...videoTypes];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  if (file.size > maxSize) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 50MB)`);
  }

  // Additional validation for images (smaller size limit)
  if (imageTypes.includes(file.type) && file.size > 10 * 1024 * 1024) {
    throw new Error(`Image too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 10MB for images)`);
  }

  return true;
};

const PropertyImageManager = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [propertyData, setPropertyData] = useState({
    title: "",
    address: "",
    type: "2BR",
    price: "",
    landlordContact: "",
    notes: "",
  });

  // Enhanced Cloudinary upload for both images and videos
  const uploadMediaToCloudinary = (file, index) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", "properties");
      
      // Determine resource type
      const isVideo = file.type.startsWith('video/');
      const resourceType = isVideo ? 'video' : 'image';

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`);

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setUploadProgress((prev) => {
            const newProgress = [...prev];
            newProgress[index] = percent;
            return newProgress;
          });
        }
      });

      xhr.onload = () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          resolve({
            ...result,
            mediaType: resourceType,
            isVideo: isVideo
          });
        } else {
          reject(new Error("Upload failed"));
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(formData);
    });
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = [];
    const errors = [];

    files.forEach((file, index) => {
      try {
        validateMediaFile(file);
        validFiles.push(file);
      } catch (error) {
        errors.push(`File ${index + 1}: ${error.message}`);
      }
    });

    if (errors.length > 0) {
      alert("Some files were invalid:\n" + errors.join("\n"));
    }

    setSelectedFiles(validFiles);
    setUploadProgress(new Array(validFiles.length).fill(0));
  };

  const uploadMediaAndCreateProperty = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select at least one image or video");
      return;
    }

    if (!propertyData.title || !propertyData.address || !propertyData.price) {
      alert("Please fill in all required property details");
      return;
    }

    setUploading(true);
    const uploadedMediaUrls = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const result = await uploadMediaToCloudinary(file, i);
        uploadedMediaUrls.push({
          url: result.secure_url,
          publicId: result.public_id,
          originalName: file.name,
          size: result.bytes,
          mediaType: result.mediaType,
          isVideo: result.isVideo,
          duration: result.duration || null, // Video duration if available
          width: result.width || null,
          height: result.height || null,
        });
      }

      // Separate images and videos for backwards compatibility
      const images = uploadedMediaUrls.filter(media => !media.isVideo);
      const videos = uploadedMediaUrls.filter(media => media.isVideo);

      const propertyPayload = {
        ...propertyData,
        price: Number(propertyData.price),
        coords: { lat: -1.2833, lng: 36.8167 }, // Default Nairobi coords
        bills: { water: 0, garbage: 0 },
        availability: "available",
        photos: images.map((img) => img.url), // Backwards compatibility
        videos: videos.map((vid) => vid.url), // New video field
        mediaDetails: uploadedMediaUrls, // All media with metadata
        imageDetails: images, // Backwards compatibility
        videoDetails: videos, // New video details
      };

      const propertyRef = await addProperty(propertyPayload);

      alert(
        `✅ Property created!\nID: ${propertyRef.id}\nImages: ${images.length}\nVideos: ${videos.length}`
      );

      // Reset
      setSelectedFiles([]);
      setUploadProgress([]);
      setPropertyData({
        title: "",
        address: "",
        type: "2BR",
        price: "",
        landlordContact: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error uploading property:", error);
      alert(`❌ Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPropertyData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Helper function to get file icon
  const getFileIcon = (file) => {
    if (file.type.startsWith('video/')) return '🎥';
    if (file.type.startsWith('image/')) return '📷';
    return '📄';
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // Common input styles
  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1.5px solid #b2dfdb",
    fontSize: 14,
    outline: "none",
    transition: "border 0.2s",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontWeight: 600,
    color: "#0d4d4d",
    marginBottom: 6,
    display: "block",
    fontSize: 14,
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        margin: "0",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        padding: "24px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <h2
        style={{
          color: "#0d4d4d",
          fontWeight: 700,
          fontSize: 22,
          marginBottom: 20,
          textAlign: "center",
          letterSpacing: "-0.5px",
          margin: "0 0 20px 0",
        }}
      >
        Add New Property with Images & Videos
      </h2>

      {/* Property Title */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Property Title *</label>
        <input
          type="text"
          value={propertyData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          placeholder="e.g., Cozy 2BR near CBD"
          style={inputStyle}
          onFocus={(e) => (e.target.style.border = "1.5px solid #00bfae")}
          onBlur={(e) => (e.target.style.border = "1.5px solid #b2dfdb")}
          required
        />
      </div>

      {/* Address */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Address *</label>
        <input
          type="text"
          value={propertyData.address}
          onChange={(e) => handleInputChange("address", e.target.value)}
          placeholder="e.g., Mukoma Road, Nairobi"
          style={inputStyle}
          onFocus={(e) => (e.target.style.border = "1.5px solid #00bfae")}
          onBlur={(e) => (e.target.style.border = "1.5px solid #b2dfdb")}
          required
        />
      </div>

      {/* Type and Price Row */}
      <div 
        style={{ 
          display: "flex", 
          gap: "12px", 
          marginBottom: "16px",
          flexWrap: "wrap"
        }}
      >
        <div style={{ flex: "1 1 150px", minWidth: "150px" }}>
          <label style={labelStyle}>Type</label>
          <select
            value={propertyData.type}
            onChange={(e) => handleInputChange("type", e.target.value)}
            style={inputStyle}
          >
            <option value="">Select type</option>
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
        </div>

        <div style={{ flex: "1 1 150px", minWidth: "150px" }}>
          <label style={labelStyle}>Price (KSH) *</label>
          <input
            type="number"
            value={propertyData.price}
            onChange={(e) => handleInputChange("price", e.target.value)}
            placeholder="35000"
            style={inputStyle}
            onFocus={(e) => (e.target.style.border = "1.5px solid #00bfae")}
            onBlur={(e) => (e.target.style.border = "1.5px solid #b2dfdb")}
            required
          />
        </div>
      </div>

      {/* Landlord Contact */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Landlord Contact</label>
        <input
          type="text"
          value={propertyData.landlordContact}
          onChange={(e) => handleInputChange("landlordContact", e.target.value)}
          placeholder="+254700000000"
          style={inputStyle}
          onFocus={(e) => (e.target.style.border = "1.5px solid #00bfae")}
          onBlur={(e) => (e.target.style.border = "1.5px solid #b2dfdb")}
        />
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Notes</label>
        <textarea
          value={propertyData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          placeholder="Additional details about the property..."
          rows={3}
          style={{
            ...inputStyle,
            resize: "vertical",
            minHeight: "80px",
          }}
          onFocus={(e) => (e.target.style.border = "1.5px solid #00bfae")}
          onBlur={(e) => (e.target.style.border = "1.5px solid #b2dfdb")}
        />
      </div>

      {/* Media Upload Section */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Property Images & Videos *</label>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          style={{
            ...inputStyle,
            fontSize: 13,
            cursor: "pointer",
          }}
        />
        <small style={{ color: "#666", fontSize: 12, display: "block", marginTop: 4 }}>
          Select images (JPEG, PNG, WebP - max 10MB) and videos (MP4, WebM, MOV - max 50MB)
        </small>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ 
            fontWeight: 600, 
            color: "#0d4d4d", 
            marginBottom: 12,
            fontSize: 16,
          }}>
            Selected Media ({selectedFiles.length})
          </h3>
          {selectedFiles.map((file, index) => {
            const isVideo = file.type.startsWith('video/');
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 8,
                  padding: 10,
                  backgroundColor: isVideo ? "#fff3e0" : "#f8fffe",
                  borderRadius: 8,
                  border: `1px solid ${isVideo ? "#ffcc80" : "#e0f2f1"}`,
                }}
              >
                <span 
                  style={{ 
                    flex: 1, 
                    fontSize: 13,
                    wordBreak: "break-word",
                    marginRight: 8,
                  }}
                >
                  {getFileIcon(file)} {file.name} ({formatFileSize(file.size)})
                  {isVideo && <span style={{ color: "#f57c00", fontSize: 11, display: "block" }}>Video</span>}
                </span>
                {uploading && (
                  <div
                    style={{
                      width: "80px",
                      height: "6px",
                      backgroundColor: isVideo ? "#ffcc80" : "#e0f2f1",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${uploadProgress[index]}%`,
                        height: "100%",
                        backgroundColor: isVideo ? "#f57c00" : "#00bfae",
                        borderRadius: "3px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={uploadMediaAndCreateProperty}
        disabled={uploading || selectedFiles.length === 0}
        style={{
          width: "100%",
          padding: "14px 20px",
          fontSize: "16px",
          fontWeight: "700",
          backgroundColor: uploading ? "#b2dfdb" : "#00bfae",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
          cursor: uploading ? "not-allowed" : "pointer",
          boxShadow: "0 4px 12px rgba(0,191,174,0.2)",
          transition: "all 0.2s ease",
          letterSpacing: "0.3px",
          boxSizing: "border-box",
        }}
        onMouseOver={e => {
          if (!uploading) {
            e.currentTarget.style.backgroundColor = "#0d4d4d";
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseOut={e => {
          if (!uploading) {
            e.currentTarget.style.backgroundColor = "#00bfae";
            e.currentTarget.style.transform = "none";
          }
        }}
      >
        {uploading ? "Uploading Property..." : "Create Property"}
      </button>

      {uploading && (
        <div style={{ 
          marginTop: 12, 
          textAlign: "center", 
          color: "#666",
          fontSize: 14,
        }}>
          Uploading {selectedFiles.length} files (images & videos) and saving to database...
        </div>
      )}
    </div>
  );
};

export default PropertyImageManager;