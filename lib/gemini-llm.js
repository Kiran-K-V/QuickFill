// lib/gemini-llm.js
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // <-- Replace with your key

async function extractProfileFromText(transcript) {
  const prompt = `
Extract all personal information as key-value pairs from this text. 
Return a JSON object with keys like name, email, phone, address, etc.

Text: """${transcript}"""
`;

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': 'AIzaSyDXFN3ZKoexfvwpt2ZnEvkCzUsRRrGJLYY'
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();
  // Parse the LLM's response to get the JSON object
  // This depends on Gemini's output format; adjust as needed
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse Gemini response:', e, text);
  }
  return null;
}

window.extractProfileFromText = extractProfileFromText;
