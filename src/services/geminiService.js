// src/services/geminiService.js

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY ;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`;

export const generatePPTContent = async (userPrompt, existingSlides = []) => {
  try {
    console.log('Generating PPT content for:', userPrompt);
    
    const systemPrompt = `You are an AI assistant specialized in creating structured PowerPoint presentations. 
    Analyze the user's request and generate a JSON response with the following structure:
    
    {
      "thoughtProcess": "Brief explanation of how you structured the presentation",
      "slides": [
        {
          "title": "Slide title",
          "content": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
          "imagePrompt": "Description for generating relevant image"
        }
      ]
    }
    
    Guidelines:
    - Create 3-6 slides based on the topic complexity
    - Each slide should have a clear title and 2-4 bullet points
    - Content should be concise and presentation-friendly
    - Include relevant image prompts where appropriate
    - For edits, modify existing structure while maintaining consistency
    - Ensure ALL JSON arrays are properly closed and strings are complete
    - Do not include markdown code blocks, just pure JSON
    
    ${existingSlides.length > 0 ? 
      `Existing slides: ${JSON.stringify(existingSlides)}. Please modify based on user request: ${userPrompt}` : 
      `User request: ${userPrompt}`
    }`;

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topP: 0.8,
          topK: 40
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    const responseText = data.candidates[0].content.parts[0].text;
    console.log('Raw Gemini response:', responseText);
    
    // Clean and parse the JSON response
    const pptContent = parseAndCleanJSON(responseText);
    
    // Validate structure
    if (!pptContent.slides || !Array.isArray(pptContent.slides)) {
      throw new Error('Invalid slide structure in response');
    }

    // Clean and validate each slide
    pptContent.slides = pptContent.slides.map((slide, index) => ({
      title: slide.title || `Slide ${index + 1}`,
      content: Array.isArray(slide.content) 
        ? slide.content.map(item => String(item).trim()).filter(item => item.length > 0)
        : ['Content not available'],
      imagePrompt: slide.imagePrompt || `Image for ${slide.title || `Slide ${index + 1}`}`
    }));

    // Ensure we have valid slides
    if (pptContent.slides.length === 0) {
      throw new Error('No valid slides generated');
    }

    return pptContent;
    
  } catch (error) {
    console.error('Error generating PPT content with Gemini:', error);
    
    // Fallback to demo content if API fails
    return getFallbackContent(userPrompt, existingSlides, error.message);
  }
};

// Enhanced JSON parsing with error recovery
const parseAndCleanJSON = (responseText) => {
  try {
    // Remove markdown code blocks
    let cleanedText = responseText.replace(/```json\s*/g, '').replace(/\s*```/g, '');
    
    // Find JSON object
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }

    let jsonString = jsonMatch[0];
    
    // Fix common JSON issues
    jsonString = fixJSONIssues(jsonString);
    
    return JSON.parse(jsonString);
    
  } catch (parseError) {
    console.error('JSON parsing error:', parseError);
    
    // Try to extract and rebuild from the response
    return rebuildFromResponse(responseText);
  }
};

// Fix common JSON formatting issues
const fixJSONIssues = (jsonString) => {
  let fixed = jsonString;
  
  // Fix unclosed arrays
  fixed = fixed.replace(/("content":\s*\[[^\]]*)$/g, '$1]');
  
  // Fix unclosed strings in arrays
  fixed = fixed.replace(/("content":\s*\[[^\]]*")([^",\]]*)$/g, '$1"$2]');
  
  // Fix missing commas between array elements
  fixed = fixed.replace(/"\s*"\s*"/g, '", "');
  
  // Fix unescaped quotes within strings
  fixed = fixed.replace(/([^\\])"/g, '$1\\"');
  
  // Ensure all arrays are properly closed
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/\]/g) || []).length;
  
  if (openBrackets > closeBrackets) {
    fixed += ']'.repeat(openBrackets - closeBrackets);
  }
  
  // Ensure the entire object is closed
  const openBraces = (fixed.match(/\{/g) || []).length;
  const closeBraces = (fixed.match(/\}/g) || []).length;
  
  if (openBraces > closeBraces) {
    fixed += '}'.repeat(openBraces - closeBraces);
  }
  
  return fixed;
};

// Fallback extraction when JSON parsing fails
const rebuildFromResponse = (responseText) => {
  console.log('Attempting to rebuild from response text');
  
  // Extract thought process
  const thoughtMatch = responseText.match(/"thoughtProcess":\s*"([^"]*)"/i) || 
                      responseText.match(/thoughtProcess[^"]*"([^"]*)"/i);
  
  // Extract slides using regex
  const slideMatches = responseText.match(/"title":\s*"([^"]*)".*?"content":\s*\[([^\]]*)\]/gs) || [];
  
  const slides = [];
  
  slideMatches.forEach(match => {
    const titleMatch = match.match(/"title":\s*"([^"]*)"/);
    const contentMatch = match.match(/"content":\s*\[([^\]]*)\]/);
    
    if (titleMatch && contentMatch) {
      const title = titleMatch[1];
      // Extract content items
      const contentItems = contentMatch[1].match(/"([^"]*)"/g) || [];
      const content = contentItems.map(item => item.replace(/"/g, '').trim()).filter(item => item.length > 0);
      
      if (content.length > 0) {
        slides.push({
          title,
          content,
          imagePrompt: `Image for ${title}`
        });
      }
    }
  });
  
  // If we couldn't extract any slides, use fallback
  if (slides.length === 0) {
    throw new Error('Could not extract slides from response');
  }
  
  return {
    thoughtProcess: thoughtMatch ? thoughtMatch[1] : 'Created presentation based on your request',
    slides
  };
};

// Fallback content generator
const getFallbackContent = (userPrompt, existingSlides, errorMessage) => {
  console.log('Using fallback content due to:', errorMessage);
  
  if (existingSlides.length > 0) {
    // For edits, modify existing slides slightly
    const modifiedSlides = existingSlides.map(slide => ({
      ...slide,
      content: slide.content.map(item => {
        // Smart modification based on prompt
        if (userPrompt.toLowerCase().includes('expand') || userPrompt.toLowerCase().includes('more')) {
          return item + ' (expanded)';
        } else if (userPrompt.toLowerCase().includes('simplify') || userPrompt.toLowerCase().includes('shorter')) {
          return item.split(' ').slice(0, 4).join(' ');
        } else {
          return item + ' (updated)';
        }
      })
    }));
    
    return {
      thoughtProcess: `Modified existing presentation based on: "${userPrompt}". Note: ${errorMessage}`,
      slides: modifiedSlides
    };
  }
  
  // For new presentations, generate intelligent demo content
  const demoSlides = generateIntelligentSlides(userPrompt);
  
  return {
    thoughtProcess: `Created ${demoSlides.length}-slide presentation about "${userPrompt}". Note: ${errorMessage}`,
    slides: demoSlides
  };
};

const generateIntelligentSlides = (prompt) => {
  const lowercasePrompt = prompt.toLowerCase();
  
  // Detect technology-related topics
  if (lowercasePrompt.includes('node') || lowercasePrompt.includes('javascript') || lowercasePrompt.includes('js')) {
    return [
      {
        title: "What is Node.js?",
        content: [
          "JavaScript runtime built on Chrome's V8 engine",
          "Enables server-side JavaScript execution",
          "Event-driven, non-blocking I/O model",
          "Perfect for scalable network applications"
        ],
        imagePrompt: "Node.js architecture diagram showing event loop"
      },
      {
        title: "Key Features & Benefits",
        content: [
          "Fast execution with V8 JavaScript engine",
          "Single programming language for full-stack",
          "Large ecosystem with npm packages",
          "Excellent for real-time applications"
        ],
        imagePrompt: "Features visualization for Node.js"
      },
      {
        title: "Common Use Cases",
        content: [
          "RESTful APIs and microservices",
          "Real-time applications (chat, gaming)",
          "Data streaming applications",
          "Server-side web applications"
        ],
        imagePrompt: "Use cases diagram for Node.js applications"
      },
      {
        title: "Getting Started",
        content: [
          "Install Node.js from official website",
          "Create your first server with http module",
          "Use npm to manage dependencies",
          "Explore popular frameworks like Express"
        ],
        imagePrompt: "Step-by-step Node.js setup guide"
      }
    ];
  }
  
  // Generic presentation structure
  const topic = prompt.split(' ').slice(0, 3).join(' ');
  return [
    {
      title: `Introduction to ${topic}`,
      content: [
        `Overview and significance of ${topic}`,
        "Key concepts and fundamental principles",
        "Current relevance and applications"
      ],
      imagePrompt: `Conceptual introduction to ${topic}`
    },
    {
      title: "Core Features",
      content: [
        "Main components and characteristics",
        "Key advantages and benefits",
        "How it works in practice"
      ],
      imagePrompt: `Feature overview for ${topic}`
    },
    {
      title: "Practical Applications",
      content: [
        "Real-world use cases",
        "Industry applications",
        "Implementation examples"
      ],
      imagePrompt: `Applications visualization for ${topic}`
    },
    {
      title: "Getting Started",
      content: [
        "Basic setup and requirements",
        "First steps and learning path",
        "Resources for further learning"
      ],
      imagePrompt: `Getting started guide for ${topic}`
    }
  ];
};

// Alternative: Using the newer Gemini 1.5 Flash model
export const generatePPTContentWithFlash = async (userPrompt, existingSlides = []) => {
  const GEMINI_FLASH_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`;
  
  try {
    const systemPrompt = `Create a PowerPoint presentation in valid JSON format only. 
    Structure: {"thoughtProcess": "...", "slides": [{"title": "...", "content": ["...", "..."], "imagePrompt": "..."}]}
    User request: ${userPrompt}
    ${existingSlides.length > 0 ? `Modify existing: ${JSON.stringify(existingSlides)}` : ''}
    Return pure JSON only, no other text.`;

    const response = await fetch(GEMINI_FLASH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;
    
    return parseAndCleanJSON(responseText);
    
  } catch (error) {
    console.error('Flash model error:', error);
    return getFallbackContent(userPrompt, existingSlides, error.message);
  }
};