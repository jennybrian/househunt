// src/AddPropertyForm.jsx
import React, { useState } from "react";
import axios from "axios";

function AddPropertyForm() {
  const [property, setProperty] = useState({
    type: "",
    location: "",
    price: "",
  });
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  // replace with your Cloudinary info
  const cloudName = "dwbuqswz2";
  const uploadPreset = "househunt_unsigned";

  const handleChange = (e) => {
    setProperty({ ...property, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const uploadedUrls = [];

      for (let file of images) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          formData
        );
        uploadedUrls.push(res.data.secure_url);
      }

      console.log("Uploaded property:", {
        ...property,
        images: uploadedUrls,
      });

      alert("Property added successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="type"
        placeholder="e.g. 2 bedroom apartment"
        value={property.type}
        onChange={handleChange}
      />
      <input
        name="location"
        placeholder="e.g. Kileleshwa, Nairobi"
        value={property.location}
        onChange={handleChange}
      />
      <input
        name="price"
        placeholder="Price"
        value={property.price}
        onChange={handleChange}
      />
      <input type="file" multiple onChange={handleFileChange} />
      <button type="submit" disabled={uploading}>
        {uploading ? "Uploading..." : "Add Property"}
      </button>
    </form>
  );
}

export default AddPropertyForm;