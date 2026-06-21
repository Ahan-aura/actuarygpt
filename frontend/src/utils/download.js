/**
 * Utility to programmatically download files, bypassing cross-origin browser restrictions
 * on standard HTML5 anchor tags by fetching the file as a Blob.
 */
export const downloadPDF = async (url, defaultFilename = 'report.pdf') => {
  try {
    // Extract filename from URL if possible
    let filename = defaultFilename;
    try {
      const urlObj = new URL(url, window.location.origin);
      const pathSegments = urlObj.pathname.split('/');
      const lastSegment = pathSegments[pathSegments.length - 1];
      if (lastSegment && lastSegment.toLowerCase().endsWith('.pdf')) {
        filename = lastSegment;
      }
    } catch (e) {
      console.warn("Could not parse filename from URL:", e);
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading the PDF:', error);
    // Fallback: try opening in a new tab/window if fetch fails
    window.open(url, '_blank');
  }
};
