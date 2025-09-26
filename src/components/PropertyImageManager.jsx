// src/components/PropertyImageManager.jsx
import { useState } from "react";
import { validateImageFile } from "../services/cloudinary";
import { addProperty } from "../services/firestore";

const CLOUD_NAME = "dwbuqswz2";
const UPLOAD_PRESET = "househunt_unsigned";

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

  // ✅ Unsigned Cloudinary upload
  const uploadImageToCloudinary = (file, index) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", "properties");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

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
          resolve(JSON.parse(xhr.responseText));
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
        validateImageFile(file);
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

  const uploadImagesAndCreateProperty = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select at least one image");
      return;
    }

    if (!propertyData.title || !propertyData.address || !propertyData.price) {
      alert("Please fill in all required property details");
      return;
    }

    setUploading(true);
    const uploadedImageUrls = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const result = await uploadImageToCloudinary(file, i);
        uploadedImageUrls.push({
          url: result.secure_url,
          publicId: result.public_id,
          originalName: file.name,
          size: result.bytes,
        });
      }

      const propertyPayload = {
        ...propertyData,
        price: Number(propertyData.price),
        coords: { lat: -1.2833, lng: 36.8167 }, // Default Nairobi coords
        bills: { water: 0, garbage: 0 },
        availability: "available",
        photos: uploadedImageUrls.map((img) => img.url),
        imageDetails: uploadedImageUrls,
      };

      const propertyRef = await addProperty(propertyPayload);

      alert(
        `✅ Property created!\nID: ${propertyRef.id}\nImages uploaded: ${uploadedImageUrls.length}`
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

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 20,
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
        padding: "32px 28px",
        marginTop: 24,
      }}
    >
      <h2
        style={{
          color: "#0d4d4d",
          fontWeight: 700,
          marginBottom: 18,
          textAlign: "center",
          letterSpacing: "-0.5px",
        }}
      >
        Add New Property with Images
      </h2>
      <div style={{ marginBottom: 18 }}>
        <label
          style={{
            fontWeight: 600,
            color: "#0d4d4d",
            marginBottom: 6,
            display: "block",
          }}
        >
          Property Title *
        </label>
        <input
          type="text"
          value={propertyData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          placeholder="e.g., Cozy 2BR near CBD"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 8,
            border: "1.5px solid #b2dfdb",
            fontSize: 16,
            outline: "none",
            transition: "border 0.2s",
            marginBottom: 4,
          }}
          onFocus={(e) => (e.target.style.border = "1.5px solid #00bfae")}
          onBlur={(e) => (e.target.style.border = "1.5px solid #b2dfdb")}
          required
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label
          style={{
            fontWeight: 600,
            color: "#0d4d4d",
            marginBottom: 6,
            display: "block",
          }}
        >
          Address *
        </label>
        <input
          type="text"
          value={propertyData.address}
          onChange={(e) => handleInputChange("address", e.target.value)}
          placeholder="e.g., Mukoma Road, Nairobi"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 8,
            border: "1.5px solid #b2dfdb",
            fontSize: 16,
            outline: "none",
            transition: "border 0.2s",
            marginBottom: 4,
          }}
          onFocus={(e) => (e.target.style.border = "1.5px solid #00bfae")}
          onBlur={(e) => (e.target.style.border = "1.5px solid #b2dfdb")}
          required
        />
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
        <div style={{ flex: 1 }}>
          <label
            style={{
              fontWeight: 600,
              color: "#0d4d4d",
              marginBottom: 6,
              display: "block",
            }}
          >
            Type
          </label>
          <select
            value={propertyData.type}
            onChange={(e) => handleInputChange("type", e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1.5px solid #b2dfdb",
              fontSize: 16,
              outline: "none",
              transition: "border 0.2s",
              marginBottom: 4,
            }}
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

        <div style={{ flex: 1 }}>
          <label
            style={{
              fontWeight: 600,
              color: "#0d4d4d",
              marginBottom: 6,
              display: "block",
            }}
          >
            Price (KSH) *
          </label>
          <input
            type="number"
            value={propertyData.price}
            onChange={(e) => handleInputChange("price", e.target.value)}
            placeholder="35000"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1.5px solid #b2dfdb",
              fontSize: 16,
              outline: "none",
              transition: "border 0.2s",
              marginBottom: 4,
            }}
            required
          />
        </div>
      </div>

      <div style={{ marginBottom: "18px" }}>
        <label
          style={{
            fontWeight: 600,
            color: "#0d4d4d",
            marginBottom: 6,
            display: "block",
          }}
        >
          Landlord Contact
        </label>
        <input
          type="text"
          value={propertyData.landlordContact}
          onChange={(e) => handleInputChange("landlordContact", e.target.value)}
          placeholder="+254700000000"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 8,
            border: "1.5px solid #b2dfdb",
            fontSize: 16,
            outline: "none",
            transition: "border 0.2s",
            marginBottom: 4,
          }}
        />
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label
          style={{
            fontWeight: 600,
            color: "#0d4d4d",
            marginBottom: 6,
            display: "block",
          }}
        >
          Notes
        </label>
        <textarea
          value={propertyData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          placeholder="Additional details about the property..."
          rows={3}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 8,
            border: "1.5px solid #b2dfdb",
            fontSize: 16,
            outline: "none",
            transition: "border 0.2s",
            marginBottom: 4,
          }}
        />
      </div>

      {/* Image Upload Section */}
      <div style={{ marginBottom: "24px" }}>
        <label
          style={{
            fontWeight: 600,
            color: "#0d4d4d",
            marginBottom: 6,
            display: "block",
          }}
        >
          Property Images *
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          style={{
            display: "block",
            marginTop: 6,
            marginBottom: 4,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1.5px solid #b2dfdb",
            fontSize: 16,
            outline: "none",
            transition: "border 0.2s",
          }}
        />
        <small style={{ color: "#888" }}>
          Select multiple images (JPEG, PNG, WebP). Max 10MB per file.
        </small>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontWeight: 600, color: "#0d4d4d", marginBottom: 12 }}>
            Selected Images ({selectedFiles.length})
          </h3>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 8,
                padding: 8,
                backgroundColor: "#f5f5f5",
                borderRadius: 4,
              }}
            >
              <span style={{ flex: 1 }}>
                📷 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
              {uploading && (
                <div
                  style={{
                    width: "100px",
                    backgroundColor: "#ddd",
                    borderRadius: "4px",
                  }}
                >
                  <div
                    style={{
                      width: `${uploadProgress[index]}%`,
                      height: "4px",
                      backgroundColor: "#4CAF50",
                      borderRadius: "4px",
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={uploadImagesAndCreateProperty}
        disabled={uploading || selectedFiles.length === 0}
        style={{
          width: "100%",
          padding: "14px",
          fontSize: "18px",
          fontWeight: "bold",
          backgroundColor: uploading ? "#b2dfdb" : "#00bfae",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          cursor: uploading ? "not-allowed" : "pointer",
          boxShadow: "0 2px 8px rgba(0,191,174,0.08)",
          transition: "background 0.2s, transform 0.2s",
          letterSpacing: "0.5px",
        }}
        onMouseOver={e => {
          if (!uploading) e.currentTarget.style.backgroundColor = "#0d4d4d";
        }}
        onMouseOut={e => {
          if (!uploading) e.currentTarget.style.backgroundColor = "#00bfae";
        }}
      >
        {uploading ? "🔄 Uploading Property..." : "Create Property"}
      </button>

      {uploading && (
        <div style={{ marginTop: "10px", textAlign: "center", color: "#666" }}>
          Uploading {selectedFiles.length} images and saving to database...
        </div>
      )}
    </div>
  );
};

export default PropertyImageManager;
