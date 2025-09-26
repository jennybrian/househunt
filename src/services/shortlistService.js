// src/services/shortlistService.js
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';

// Create a new shortlist in Firestore
export async function createShortlist(clientId, propertyIds, clientName = '') {
  const shortlistData = {
    clientId: clientId || `clients/${uuidv4()}`,
    clientName: clientName || 'Anonymous Client',
    propertyIds,
    shareToken: uuidv4(),
    createdAt: serverTimestamp(),
    isActive: true
  };
  const docRef = await addDoc(collection(db, "shortlists"), shortlistData);
  return {
    id: docRef.id,
    shareToken: shortlistData.shareToken,
    ...shortlistData
  };
}

// Get shortlist by share token (for public viewing)
export async function getShortlistByToken(shareToken) {
  const q = query(
    collection(db, "shortlists"),
    where("shareToken", "==", shareToken),
    where("isActive", "==", true)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const shortlistDoc = querySnapshot.docs[0];
  const shortlistData = { id: shortlistDoc.id, ...shortlistDoc.data() };
  const properties = await getPropertiesByIds(shortlistData.propertyIds);
  return { ...shortlistData, properties };
}

// Helper: Get multiple properties by their IDs
async function getPropertiesByIds(propertyIds) {
  if (!propertyIds || propertyIds.length === 0) return [];
  const properties = [];
  for (const propertyId of propertyIds) {
    try {
      const docRef = doc(db, "properties", propertyId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        properties.push({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (error) {
      // Skip failed property
    }
  }
  return properties;
}

// Generate shareable URLs (only direct, WhatsApp, Email)
export function generateShareableLinks(shareToken) {
  const baseUrl = window.location.origin;
  const shortlistUrl = `${baseUrl}/shortlist/${shareToken}`;
  return {
    direct: shortlistUrl,
    whatsapp: `https://wa.me/?text=Check out these properties I found for you: ${encodeURIComponent(shortlistUrl)}`,
    email: `mailto:?subject=Property Shortlist&body=I've created a shortlist of properties that might interest you. Check them out here: ${encodeURIComponent(shortlistUrl)}`
  };
}