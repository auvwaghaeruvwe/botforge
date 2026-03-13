export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, system } = req.body;

    const cleanMessages = (messages || []).filter(m => m && m.content && String(m.content).trim() !== '');

    const groqMessages = [
      { role: 'system', content: system || 'You are a helpful assistant. Be friendly and concise.' },
      ...cleanMessages
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 500,
        messages: groqMessages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq error:', JSON.stringify(data));
      return res.status(response.status).json({ error: data });
    }

    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't respond right now.";
    
    return res.status(200).json({
      content: [{ type: 'text', text: reply }]
    });

  } catch (error) {
    console.error('Server error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
