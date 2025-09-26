// src/services/firestore.js
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

// --- Properties ---
export async function addProperty(propertyData) {
  return await addDoc(collection(db, "properties"), {
    ...propertyData,
    createdAt: serverTimestamp(),
  });
}

export async function updateProperty(id, updateData) {
  const docRef = doc(db, "properties", id);
  return await updateDoc(docRef, {
    ...updateData,
    updatedAt: serverTimestamp(),
  });
}

export async function getProperties() {
  const querySnapshot = await getDocs(collection(db, "properties"));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function deleteProperty(id) {
  try {
    // First, get the property data to extract image info
    const docRef = doc(db, "properties", id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Property not found');
    }
    
    const propertyData = docSnap.data();
    console.log('Property to delete:', propertyData);
    
    // Extract public IDs from Cloudinary URLs or imageDetails
    const publicIds = [];
    
    // Method 1: From imageDetails (if available)
    if (propertyData.imageDetails && Array.isArray(propertyData.imageDetails)) {
      propertyData.imageDetails.forEach(img => {
        if (img.publicId) {
          publicIds.push(img.publicId);
        }
      });
    }
    
    // Method 2: Extract from photo URLs (if imageDetails not available)
    if (publicIds.length === 0 && propertyData.photos && Array.isArray(propertyData.photos)) {
      propertyData.photos.forEach(photoUrl => {
        const publicId = extractPublicIdFromUrl(photoUrl);
        if (publicId) {
          publicIds.push(publicId);
        }
      });
    }
    
    console.log('Extracted public IDs for deletion:', publicIds);
    
    // Delete images from Cloudinary (if any)
    if (publicIds.length > 0) {
      await deleteCloudinaryImages(publicIds);
    }
    
    // Delete the property document from Firestore
    await deleteDoc(docRef);
    
    console.log('Property deleted successfully:', id);
    return true;
  } catch (error) {
    console.error('Error deleting property:', error);
    throw error;
  }
}

// Helper function to extract public_id from Cloudinary URL
function extractPublicIdFromUrl(cloudinaryUrl) {
  try {
    // Example URL: https://res.cloudinary.com/your_cloud/image/upload/v1234567890/househunt/properties/abc123.jpg
    // Should extract: househunt/properties/abc123
    
    if (!cloudinaryUrl || typeof cloudinaryUrl !== 'string') {
      return null;
    }
    
    const urlParts = cloudinaryUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1 || uploadIndex + 1 >= urlParts.length) {
      return null;
    }
    
    // Skip version if present (starts with 'v' followed by numbers)
    let startIndex = uploadIndex + 1;
    if (urlParts[startIndex] && /^v\d+$/.test(urlParts[startIndex])) {
      startIndex += 1;
    }
    
    // Get everything from the folder onwards, remove file extension
    const pathParts = urlParts.slice(startIndex);
    const fullPath = pathParts.join('/');
    
    // Remove file extension from the last part
    const publicId = fullPath.replace(/\.[^/.]+$/, '');
    
    console.log('Extracted public_id from URL:', cloudinaryUrl, '->', publicId);
    return publicId;
  } catch (error) {
    console.error('Error extracting public_id from URL:', cloudinaryUrl, error);
    return null;
  }
}

// Function to delete images from Cloudinary
async function deleteCloudinaryImages(publicIds) {
  // If you have a backend server running
  const BACKEND_URL = 'https://househunt-server.onrender.com'; // Adjust port if different
  
  for (const publicId of publicIds) {
    try {
      console.log('Deleting from Cloudinary:', publicId);
      
      const response = await fetch(`${BACKEND_URL}/delete-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicId })
      });
      
      if (!response.ok) {
        console.warn(`Failed to delete image ${publicId} from Cloudinary:`, response.statusText);
        // Continue with other deletions even if one fails
        continue;
      }
      
      const result = await response.json();
      console.log(`Successfully deleted image ${publicId} from Cloudinary:`, result);
    } catch (error) {
      console.warn(`Error deleting image ${publicId} from Cloudinary:`, error.message);
      // Continue with other deletions even if one fails
    }
  }
}

// Bulk delete function for multiple properties
export async function deleteMultipleProperties(propertyIds) {
  const results = [];
  
  for (const id of propertyIds) {
    try {
      await deleteProperty(id);
      results.push({ id, success: true });
    } catch (error) {
      console.error(`Failed to delete property ${id}:`, error);
      results.push({ id, success: false, error: error.message });
    }
  }
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Bulk delete completed: ${successful} successful, ${failed} failed`);
  return results;
}

// --- Clients ---
export async function addClient(clientData) {
  return await addDoc(collection(db, "clients"), {
    ...clientData,
    createdAt: serverTimestamp(),
  });
}

export async function getClients() {
  const querySnapshot = await getDocs(collection(db, "clients"));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// --- Shortlists ---
export async function createShortlist(shortlistData) {
  return await addDoc(collection(db, "shortlists"), {
    ...shortlistData,
    createdAt: serverTimestamp(),
  });
}

export async function getShortlist(id) {
  const docRef = doc(db, "shortlists", id);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() };
  } else {
    return null;
  }
}

export const addShortlistToFirestore = async (shortlist) => {
  // Use Firestore addDoc or setDoc
  // Return docRef
};