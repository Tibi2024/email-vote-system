// Hauptfunktion für Webhook-Empfang
exports.handler = async (event, context) => {
  console.log('🚀 Webhook empfangen!');
  console.log('Body:', event.body);
  
  try {
    // Erstmal nur die E-Mail-Daten loggen
    const data = JSON.parse(event.body || '{}');
    
    console.log('📧 Von:', data.from);
    console.log('📧 Betreff:', data.subject);
    console.log('📧 Text:', data.body?.substring(0, 200) + '...');
    
    // Erfolgreiche Antwort zurückgeben
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'E-Mail empfangen und verarbeitet',
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('❌ Fehler beim Verarbeiten:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Verarbeitungsfehler: ' + error.message 
      })
    };
  }
};
