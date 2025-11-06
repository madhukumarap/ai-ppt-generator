// src/App.jsx
import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import PPTPreview from './components/PPTPreview';
import { generatePPTContent } from './services/geminiService';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);

  useEffect(() => {
    // Check if API key is stored in localStorage
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setShowApiKeyInput(false);
    }
  }, []);

  const handleApiKeySubmit = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setShowApiKeyInput(false);
    }
  };

  const handleSendMessage = async (message) => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    setIsLoading(true);
    
    const userMessage = { 
      id: Date.now(), 
      role: 'user', 
      content: message 
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const pptContent = await generatePPTContent(message, slides);
      
      const aiMessage = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: pptContent.thoughtProcess,
        slides: pptContent.slides
      };
      setMessages(prev => [...prev, aiMessage]);

      setSlides(pptContent.slides);
      setCurrentSlide(0);
      
    } catch (error) {
      console.error('Error generating presentation:', error);
      const errorMessage = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: `Error: ${error.message}. Please check your API key and try again.` 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setShowApiKeyInput(true);
    setMessages([]);
    setSlides([]);
  };

  if (showApiKeyInput) {
    return (
      <div className="app">
        <div className="api-key-modal">
          <div className="api-key-form">
            <h2>Enter Your Gemini API Key</h2>
            <p>You need a Google Gemini API key to use this application.</p>
            
            <form onSubmit={handleApiKeySubmit}>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="api-key-input"
                required
              />
              <button type="submit" className="api-key-submit">
                Save API Key
              </button>
            </form>
            
            <div className="api-key-help">
              <h4>How to get an API key:</h4>
              <ol>
                <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></li>
                <li>Sign in with your Google account</li>
                <li>Click "Create API Key"</li>
                <li>Copy the key and paste it above</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-content">
            <h1>AI PowerPoint Generator</h1>
            <p>Create stunning presentations with AI-powered assistance</p>
          </div>
          <button onClick={resetApiKey} className="reset-api-key">
            Change API Key
          </button>
        </header>

        <div className="main-content">
          <div className="chat-section">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>

          <div className="preview-section">
            <PPTPreview
              slides={slides}
              currentSlide={currentSlide}
              onSlideChange={setCurrentSlide}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;