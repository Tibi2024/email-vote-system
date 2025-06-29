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
        model: 'gpt-4', // oder 'gpt-4-1106-preview' für die neueste Version, wenn du Zugriff hast
        messages: [
          { 
            role: 'system', 
            content: 'Du bist ein hilfreicher Assistent. Extrahiere aus dem E-Mail-Text die gewünschten Informationen und gib sie als strukturiertes JSON zurück.' 
          },
          { 
            role: 'user', 
            content: 'Extrahiere aus folgendem E-Mail-Text:\n' +
              '- Wie viele Personen sollen teilnehmen? (teilnehmeranzahl)\n' +
              '- Müssen alle Teilnehmer zwingend dabei sein? (alle_teilnehmen, Standard: ja, außer es steht explizit etwas anderes in der E-Mail)\n' +
              '- Wann soll das Meeting stattfinden? (datum und uhrzeit)\n' +
              'Antworte immer im folgenden JSON-Format:\n' +
              `{
                "teilnehmeranzahl": 0,
                "alle_teilnehmen": true,
                "datum": "YYYY-MM-DD",
                "uhrzeit": "HH:MM"
              }` +
              '\nHier ist der E-Mail-Text:\n' + emailData.body
          }
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
