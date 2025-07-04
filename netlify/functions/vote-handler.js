const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event, context) => {
  // Nur POST akzeptieren
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const emailData = JSON.parse(event.body);

    // Betreff normalisieren und als meeting_id nutzen
    const cleanSubject = emailData.subject.replace(/^(re:|fwd:)\s*/i, '').trim();
    const meeting_id = cleanSubject;

    // GPT-Anfrage mit angepasstem Prompt
    const gptResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
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
              'Achte darauf, dass du dich bei den Fragen zur Teilnehmeranzahl und zur zwingenden Teilnahme auf die ursprüngliche E-Mail (Absender: marc.wiesner@lexulus.ai) beziehst, auch wenn im Thread weitere Antworten enthalten sind.\n' +
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
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY
          
        }
      }
    );

    const gptAnswer = gptResponse.data.choices[0].message.content;
    const extractedData = JSON.parse(gptAnswer);

    // Daten in Supabase speichern
    const { data, error } = await supabase
      .from('meetings')
      .upsert({
        meeting_id: meeting_id,
        teilnehmeranzahl: extractedData.teilnehmeranzahl,
        alle_teilnehmen: extractedData.alle_teilnehmen,
        datum: extractedData.datum,
        uhrzeit: extractedData.uhrzeit
      }, { onConflict: 'meeting_id' });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Email received, processed by GPT and saved to Supabase',
        received: emailData,
        gptResponse: gptAnswer,
        supabaseResult: data
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
