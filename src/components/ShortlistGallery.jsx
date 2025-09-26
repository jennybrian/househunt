import React, { useEffect, useState } from "react";
import { getShortlistById } from "../services/firestore";
import { useParams, useLocation } from "react-router-dom";

const ShortlistGallery = () => {
  const { shortlistId } = useParams();
  const [shortlist, setShortlist] = useState(null);
  const [properties, setProperties] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const token = new URLSearchParams(location.search).get("token");
    getShortlistById(shortlistId, token).then(data => {
      setShortlist(data);
      // Fetch properties by IDs
      // getPropertiesByIds(data.propertyIds).then(setProperties);
    });
  }, [shortlistId, location.search]);s

  if (!shortlist) return <div>Loading shortlist...</div>;

  return (
    <div>
      <h2>Shared Property Shortlist</h2>
      {/* Render property gallery for shortlist */}
      {properties.map(property => (
        <div key={property.id}>{property.title}</div>
      ))}
    </div>
  );
};

export default ShortlistGallery;