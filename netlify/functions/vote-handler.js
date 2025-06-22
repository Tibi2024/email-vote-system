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
    // Später: E-Mail-Daten verarbeiten
    const emailData = JSON.parse(event.body);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Email received successfully',
        received: emailData
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