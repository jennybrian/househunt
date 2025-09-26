// src/components/CloudinaryDebug.jsx
import { useState } from 'react';

const CloudinaryDebug = () => {
  const [testUrl, setTestUrl] = useState('');
  const [extractedPublicId, setExtractedPublicId] = useState('');

  // Same function from the firestore service
  const extractPublicIdFromUrl = (cloudinaryUrl) => {
    try {
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
      
      return publicId;
    } catch (error) {
      console.error('Error extracting public_id from URL:', cloudinaryUrl, error);
      return null;
    }
  };

  const testExtraction = () => {
    const result = extractPublicIdFromUrl(testUrl);
    setExtractedPublicId(result || 'Failed to extract');
    console.log('URL:', testUrl);
    console.log('Extracted public_id:', result);
  };

  const testBackendConnection = async () => {
    if (!extractedPublicId || extractedPublicId === 'Failed to extract') {
      alert('Please extract a valid public_id first');
      return;
    }

    try {
      console.log('Testing backend deletion for:', extractedPublicId);
      
      const response = await fetch('http://localhost:4000/delete-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicId: extractedPublicId })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Backend response:', result);
      alert(`Backend test successful: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error('Backend test failed:', error);
      alert(`Backend test failed: ${error.message}`);
    }
  };

  const exampleUrls = [
    'https://res.cloudinary.com/ydwbuqswz2/image/upload/v1758465858/househunt/abc123.jpg',
    'https://res.cloudinary.com/ydwbuqswz2/image/upload/househunt/properties/xyz789.png',
    'https://res.cloudinary.com/ydwbuqswz2/image/upload/v1234567890/househunt/properties/test_image.webp'
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>🔧 Cloudinary Public ID Debug Tool</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Public ID Extraction</h3>
        <input
          type="text"
          value={testUrl}
          onChange={(e) => setTestUrl(e.target.value)}
          placeholder="Paste Cloudinary image URL here..."
          style={{ 
            width: '100%', 
            padding: '8px', 
            marginBottom: '10px',
            fontSize: '14px'
          }}
        />
        
        <button
          onClick={testExtraction}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Extract Public ID
        </button>
        
        <button
          onClick={testBackendConnection}
          disabled={!extractedPublicId || extractedPublicId === 'Failed to extract'}
          style={{
            padding: '8px 16px',
            backgroundColor: extractedPublicId && extractedPublicId !== 'Failed to extract' ? '#f44336' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: extractedPublicId && extractedPublicId !== 'Failed to extract' ? 'pointer' : 'not-allowed'
          }}
        >
          Test Backend Delete
        </button>
        
        {extractedPublicId && (
          <div style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: extractedPublicId === 'Failed to extract' ? '#ffebee' : '#e8f5e8',
            border: `1px solid ${extractedPublicId === 'Failed to extract' ? '#f44336' : '#4CAF50'}`,
            borderRadius: '4px'
          }}>
            <strong>Extracted Public ID:</strong> {extractedPublicId}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Example URLs to Test:</h3>
        {exampleUrls.map((url, index) => (
          <div key={index} style={{ marginBottom: '8px' }}>
            <button
              onClick={() => setTestUrl(url)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                marginRight: '8px'
              }}
            >
              Use Example {index + 1}
            </button>
            <span style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>
              {url}
            </span>
          </div>
        ))}
      </div>

      <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
        <h3>Public ID Format Examples:</h3>
        <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>
          <div><strong>Input URL:</strong> https://res.cloudinary.com/cloud/image/upload/v123/folder/image.jpg</div>
          <div><strong>Public ID:</strong> folder/image</div>
          <br/>
          <div><strong>Input URL:</strong> https://res.cloudinary.com/cloud/image/upload/househunt/properties/abc123.png</div>
          <div><strong>Public ID:</strong> househunt/properties/abc123</div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px' }}>
        <h4>Backend Setup Required:</h4>
        <p>To test backend deletion, make sure you have:</p>
        <ol>
          <li>Created the backend server (househunt-server directory)</li>
          <li>Installed dependencies: express, cors, dotenv, cloudinary</li>
          <li>Set up .env file with Cloudinary credentials</li>
          <li>Started the server on port 4000</li>
        </ol>
      </div>
    </div>
  );
};

export default CloudinaryDebug;