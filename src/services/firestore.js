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
    // First, get the property data to extract media info
    const docRef = doc(db, "properties", id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Property not found');
    }
    
    const propertyData = docSnap.data();
    console.log('Property to delete:', propertyData);
    
    // Extract media info for deletion (both images and videos)
    const mediaToDelete = extractMediaFromProperty(propertyData);
    
    console.log('Media to delete:', mediaToDelete);
    
    // Delete media from Cloudinary (if any)
    if (mediaToDelete.length > 0) {
      await deleteCloudinaryMedia(mediaToDelete);
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

// Enhanced function to extract both images and videos from property data
function extractMediaFromProperty(propertyData) {
  const mediaToDelete = [];
  
  // Method 1: From mediaDetails (preferred - contains type info)
  if (propertyData.mediaDetails && Array.isArray(propertyData.mediaDetails)) {
    propertyData.mediaDetails.forEach(media => {
      if (media.publicId) {
        mediaToDelete.push({
          publicId: media.publicId,
          resourceType: media.isVideo ? 'video' : 'image'
        });
      } else if (media.url) {
        const extractedId = extractPublicIdFromUrl(media.url);
        if (extractedId) {
          mediaToDelete.push({
            publicId: extractedId,
            resourceType: media.isVideo ? 'video' : 'image'
          });
        }
      }
    });
    return mediaToDelete; // Return early if mediaDetails exists
  }
  
  // Method 2: From separate imageDetails and videoDetails arrays
  if (propertyData.imageDetails && Array.isArray(propertyData.imageDetails)) {
    propertyData.imageDetails.forEach(img => {
      if (img.publicId) {
        mediaToDelete.push({
          publicId: img.publicId,
          resourceType: 'image'
        });
      } else if (img.url) {
        const extractedId = extractPublicIdFromUrl(img.url);
        if (extractedId) {
          mediaToDelete.push({
            publicId: extractedId,
            resourceType: 'image'
          });
        }
      }
    });
  }
  
  if (propertyData.videoDetails && Array.isArray(propertyData.videoDetails)) {
    propertyData.videoDetails.forEach(video => {
      if (video.publicId) {
        mediaToDelete.push({
          publicId: video.publicId,
          resourceType: 'video'
        });
      } else if (video.url) {
        const extractedId = extractPublicIdFromUrl(video.url);
        if (extractedId) {
          mediaToDelete.push({
            publicId: extractedId,
            resourceType: 'video'
          });
        }
      }
    });
  }
  
  // Method 3: Fallback to photos and videos arrays (extract from URLs)
  if (mediaToDelete.length === 0) {
    // Handle photos
    if (propertyData.photos && Array.isArray(propertyData.photos)) {
      propertyData.photos.forEach(photoUrl => {
        const extractedId = extractPublicIdFromUrl(photoUrl);
        if (extractedId) {
          mediaToDelete.push({
            publicId: extractedId,
            resourceType: 'image'
          });
        }
      });
    }
    
    // Handle videos
    if (propertyData.videos && Array.isArray(propertyData.videos)) {
      propertyData.videos.forEach(videoUrl => {
        const extractedId = extractPublicIdFromUrl(videoUrl);
        if (extractedId) {
          mediaToDelete.push({
            publicId: extractedId,
            resourceType: 'video'
          });
        }
      });
    }
  }
  
  return mediaToDelete;
}

// Helper function to extract public_id from Cloudinary URL
function extractPublicIdFromUrl(cloudinaryUrl) {
  try {
    // Example URLs:
    // Image: https://res.cloudinary.com/your_cloud/image/upload/v1234567890/properties/abc123.jpg
    // Video: https://res.cloudinary.com/your_cloud/video/upload/v1234567890/properties/abc123.mp4
    
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

// Enhanced function to delete both images and videos from Cloudinary
async function deleteCloudinaryMedia(mediaArray) {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  
  for (const media of mediaArray) {
    try {
      console.log(`Deleting ${media.resourceType} from Cloudinary:`, media.publicId);
      
      // Use different endpoint based on resource type
      const endpoint = media.resourceType === 'video' ? '/delete-video' : '/delete-image';
      
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          publicId: media.publicId,
          resourceType: media.resourceType 
        })
      });
      
      if (!response.ok) {
        console.warn(`Failed to delete ${media.resourceType} ${media.publicId} from Cloudinary:`, response.statusText);
        continue;
      }
      
      const result = await response.json();
      console.log(`Successfully deleted ${media.resourceType} ${media.publicId} from Cloudinary:`, result);
    } catch (error) {
      console.warn(`Error deleting ${media.resourceType} ${media.publicId} from Cloudinary:`, error.message);
    }
  }
}

// Legacy function to delete images from Cloudinary (for backward compatibility)
async function deleteCloudinaryImages(publicIds) {
  // Convert to new format and call the enhanced function
  const mediaArray = publicIds.map(publicId => ({
    publicId,
    resourceType: 'image'
  }));
  
  await deleteCloudinaryMedia(mediaArray);
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