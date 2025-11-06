// src/utils/pptGenerator.js
import pptxgen from 'pptxgenjs';

export const generatePresentation = async (slidesData) => {
  // Simulate generation process
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(slidesData);
    }, 500);
  });
};

export const createPPTX = (slidesData, fileName = 'presentation') => {
  const pptx = new pptxgen();
  
  // Set presentation properties
  pptx.title = 'AI Generated Presentation';
  pptx.author = 'AI PPT Generator';
  
  // Create slides
  slidesData.forEach((slideData, index) => {
    const slide = pptx.addSlide();
    
    // Title
    if (slideData.title) {
      slide.addText(slideData.title, {
        x: 0.5,
        y: 0.5,
        w: '90%',
        h: 1,
        fontSize: 24,
        bold: true,
        align: 'center'
      });
    }
    
    // Content
    if (slideData.content && Array.isArray(slideData.content)) {
      slideData.content.forEach((bullet, bulletIndex) => {
        slide.addText(`• ${bullet}`, {
          x: 1,
          y: 1.5 + (bulletIndex * 0.6),
          w: '85%',
          h: 0.5,
          fontSize: 14,
          bullet: true
        });
      });
    }
    
    // Slide number
    slide.addText(`${index + 1}`, {
      x: '90%',
      y: '90%',
      w: 0.5,
      h: 0.3,
      fontSize: 10,
      align: 'right'
    });
  });
  
  return pptx;
};