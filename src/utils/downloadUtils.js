// src/utils/downloadUtils.js
import { createPPTX } from './pptGenerator';

export const downloadPPTX = (slidesData) => {
  try {
    const pptx = createPPTX(slidesData);
    const timestamp = new Date().getTime();
    pptx.writeFile({ fileName: `presentation-${timestamp}.pptx` });
  } catch (error) {
    console.error('Error downloading PPTX:', error);
    alert('Error downloading presentation. Please try again.');
  }
};

export const downloadPDF = async (slidesData) => {
  try {
    // Note: pptxgenjs PDF export only works in Node.js environment, not in browser
    // So we'll create a workaround by generating an HTML representation that can be printed as PDF
    const timestamp = new Date().getTime();
    // Create a printable HTML version
    const pdfContent = generatePDFContent(slidesData);
    
    // Create a blob and download
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `presentation-${timestamp}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error downloading PDF:', error);
    
    // Fallback: Try to use browser's print to PDF
    alert('PDF generation requires browser print. Opening print dialog...');
    generatePrintableVersion(slidesData);
  }
};

// Generate HTML content for PDF
const generatePDFContent = (slidesData) => {
  const slidesHTML = slidesData.map((slide, index) => `
    <div class="pdf-slide" style="page-break-after: always; margin: 20px; padding: 40px; border: 1px solid #ccc;">
      <h2 style="text-align: center; color: #2c3e50; margin-bottom: 30px;">${slide.title}</h2>
      <div style="margin-left: 20px;">
        ${slide.content.map(item => `
          <div style="margin-bottom: 15px; font-size: 16px; line-height: 1.5;">
            • ${item}
          </div>
        `).join('')}
      </div>
      <div style="position: absolute; bottom: 20px; right: 20px; color: #7f8c8d; font-size: 14px;">
        ${index + 1} / ${slidesData.length}
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Presentation Export</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background: white;
        }
        .pdf-slide {
          width: 210mm;
          height: 297mm;
          margin: 10mm auto;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          position: relative;
        }
        @media print {
          body { margin: 0; }
          .pdf-slide {
            margin: 0;
            box-shadow: none;
            page-break-after: always;
          }
        }
      </style>
    </head>
    <body>
      ${slidesHTML}
    </body>
    </html>
  `;
};

// Alternative: Generate printable version that users can "Print as PDF"
const generatePrintableVersion = (slidesData) => {
  const printWindow = window.open('', '_blank');
  const slidesHTML = slidesData.map((slide, index) => `
    <div class="slide" style="page-break-after: always; padding: 40px; min-height: 90vh;">
      <h1 style="text-align: center; color: #2c3e50; margin-bottom: 40px; font-size: 2.5em;">
        ${slide.title}
      </h1>
      <div style="margin-left: 60px; font-size: 1.4em; line-height: 1.6;">
        ${slide.content.map(item => `
          <div style="margin-bottom: 25px; display: flex; align-items: flex-start;">
            <span style="color: #3498db; margin-right: 15px; font-size: 1.2em;">•</span>
            <span>${item}</span>
          </div>
        `).join('')}
      </div>
      <div style="position: absolute; bottom: 30px; right: 40px; color: #95a5a6; font-size: 1.1em;">
        Slide ${index + 1} of ${slidesData.length}
      </div>
    </div>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Presentation - ${new Date().toLocaleDateString()}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          color: #2c3e50;
        }
        .slide {
          background: white;
          margin-bottom: 20px;
          position: relative;
        }
        @media print {
          body { padding: 0; }
          .slide {
            margin-bottom: 0;
            page-break-after: always;
          }
        }
      </style>
    </head>
    <body>
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; border-bottom: 2px solid #3498db;">
        <h1 style="color: #2c3e50; margin: 0;">AI Generated Presentation</h1>
        <p style="color: #7f8c8d; margin: 10px 0 0 0;">Created on ${new Date().toLocaleDateString()}</p>
      </div>
      ${slidesHTML}
      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => {
            window.close();
          }, 1000);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
};


// New function to export as image (alternative to PDF)
export const downloadAsImages = async (slidesData) => {
  try {
    // This would require HTML to canvas conversion
    // For now, we'll use the printable version
    alert('Image export would require additional libraries. Using printable version instead.');
    generatePrintableVersion(slidesData);
  } catch (error) {
    console.error('Error exporting as images:', error);
    alert('Error exporting images. Please try the PDF export instead.');
  }
};