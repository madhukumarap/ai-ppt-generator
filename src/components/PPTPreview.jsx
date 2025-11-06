// src/components/PPTPreview.jsx
import React from 'react';
import { downloadPPTX, downloadPDF } from '../utils/downloadUtils';

const PPTPreview = ({ slides, currentSlide, onSlideChange }) => {
  if (slides.length === 0) {
    return (
      <div className="ppt-preview empty">
        <div className="empty-state">
          <div className="file-icon">📊</div>
          <h3>No presentation yet</h3>
          <p>Start a conversation to generate your first slides</p>
        </div>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <div className="ppt-preview">
      <div className="preview-controls">
        <div className="slide-navigation">
          <button
            onClick={() => onSlideChange(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="nav-button"
          >
            ←
          </button>
          <span className="slide-counter">
            Slide {currentSlide + 1} of {slides.length}
          </span>
          <button
            onClick={() => onSlideChange(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
            className="nav-button"
          >
            →
          </button>
        </div>
        
        <div className="download-buttons">
          <button
            onClick={() => downloadPPTX(slides)}
            className="download-button pptx-button"
          >
            Download PPTX
          </button>
          <button
            onClick={() => downloadPDF(slides)}
            className="download-button pdf-button"
          >
            Download PDF
          </button>
        </div>
      </div>

      <div className="slide-container">
        <div className="slide">
          {currentSlideData.title && (
            <h2 className="slide-title">
              {currentSlideData.title}
            </h2>
          )}
          
          {currentSlideData.content && (
            <div className="slide-content">
              {currentSlideData.content.map((item, index) => (
                <div key={index} className="bullet-point">
                  <span className="bullet">•</span>
                  <span className="bullet-text">{item}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="slide-number">
            {currentSlide + 1}
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="slide-thumbnails">
          {slides.map((slide, index) => (
            <button
              key={index}
              onClick={() => onSlideChange(index)}
              className={`thumbnail ${currentSlide === index ? 'active' : ''}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PPTPreview;