// Example backend API for the JobStalker extension
// This can be deployed to Vercel, Netlify, or any other hosting service

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Your OpenAI API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/analyze-job', async (req, res) => {
  try {
    const { jobData, prompt } = req.body;
    
    if (!jobData) {
      return res.status(400).json({ error: 'Job data is required' });
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    res.json({ analysis: content });
  } catch (error) {
    console.error('Error processing job:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// For Vercel deployment, export the app
module.exports = app; 