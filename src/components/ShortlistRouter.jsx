// src/components/ShortlistRouter.jsx
import { useState, useEffect } from 'react';
import ShortlistViewer from './ShortlistViewer';

const ShortlistRouter = () => {
  const [shareToken, setShareToken] = useState(null);

  useEffect(() => {
    // Support both /shortlist/token and #/shortlist/token formats
    let token = null;
    const urlPath = window.location.pathname;
    const hashPath = window.location.hash;

    if (urlPath.includes('/shortlist/')) {
      token = urlPath.split('/shortlist/')[1];
    } else if (hashPath.includes('/shortlist/')) {
      token = hashPath.split('/shortlist/')[1];
    }

    if (token) setShareToken(token);
  }, []);

  if (shareToken) {
    return (
      <div>
        {/* Back to App Button */}
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 100
        }}>
        </div>
        <ShortlistViewer shareToken={shareToken} />
      </div>
    );
  }

  return null;
};

export default ShortlistRouter;