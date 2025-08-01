const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  console.log("Function triggered. Event body:", event.body);

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt, type } = JSON.parse(event.body);
    const API_KEY = process.env.GOOGLE_AI_API_KEY;

    // --- DEBUGGING STEP: Check if the API key is loaded ---
    if (!API_KEY) {
      console.error("CRITICAL: GOOGLE_AI_API_KEY environment variable is not set!");
      return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error: API key is missing." }) };
    }
    console.log("API Key loaded successfully. Starts with:", API_KEY.substring(0, 4));
    // --- END DEBUGGING STEP ---

    let url;
    let payload;

    if (type === 'text') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
      payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    } else if (type === 'image') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${API_KEY}`;
      payload = { instances: [{ prompt: prompt }], parameters: { "sampleCount": 1 } };
    } else {
      return { statusCode: 400, body: 'Invalid request type' };
    }

    console.log("Sending request to Google AI URL:", url.replace(API_KEY, "REDACTED_API_KEY"));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Google API Error (${response.status}):`, errorBody);
      return { statusCode: response.status, body: `Google API Error: ${errorBody}` };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Function execution error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'There was an internal error executing the function.' }),
    };
  }
};
