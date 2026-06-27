/**
 * Utility to programmatically download files, bypassing cross-origin browser restrictions
 * on standard HTML5 anchor tags by fetching the file as a Blob.
 */
export const downloadPDF = (url, defaultFilename = 'report.pdf') => {
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

    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading the PDF:', error);
    window.open(url, '_blank');
  }
};
