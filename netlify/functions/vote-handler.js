const axios = require('axios');

exports.handler = async (event, context) => {
  // Nur POST-Requests akzeptieren
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  console.log('Webhook received:', event.body);

  try {
    const emailData = JSON.parse(event.body);
    
    // GPT-Anfrage (OpenAI)
    const gptResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Du bist ein hilfreicher Assistent.' },
          { role: 'user', content: 'Extrahiere das Datum und die Uhrzeit aus folgendem Text: ' + emailData.body }
        ]
      },
      {
        headers: {
          'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const gptAnswer = gptResponse.data.choices[0].message.content;
    console.log('GPT-Antwort:', gptAnswer);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Email received and processed by GPT',
        received: emailData,
        gptResponse: gptAnswer
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
