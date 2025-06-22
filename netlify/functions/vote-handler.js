const { Octokit } = require('@octokit/rest');

// GitHub-Integration für Datenspeicherung
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

exports.handler = async (event, context) => {
  console.log('🚀 Abstimmungs-Handler gestartet');
  
  try {
    // E-Mail-Daten parsen
    const emailData = JSON.parse(event.body || '{}');
    console.log('📧 E-Mail empfangen von:', emailData.from);
    console.log('📧 Betreff:', emailData.subject);
    
    // Prüfen ob es eine Abstimmungsantwort ist
    if (!isVotingResponse(emailData)) {
      console.log('❌ Keine Abstimmungsantwort - ignoriert');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Keine Abstimmungsantwort' })
      };
    }
    
    // Abstimmung verarbeiten
    const voteData = parseVote(emailData);
    console.log('🗳️ Stimme erkannt:', voteData);
    
    // Stimme speichern und prüfen ob Abstimmung vollständig
    const result = await processVote(voteData);
    
    if (result.isComplete) {
      console.log('🎉 Abstimmung abgeschlossen! Gewinner:', result.winner);
      // TODO: Teams-Meeting erstellen
      await notifyCompletion(result);
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        vote: voteData.choice,
        totalVotes: result.totalVotes,
        isComplete: result.isComplete,
        winner: result.winner
      })
    };
    
  } catch (error) {
    console.error('❌ Fehler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Prüft ob E-Mail eine Abstimmungsantwort ist
function isVotingResponse(emailData) {
  const subject = emailData.subject || '';
  const body = emailData.body || '';
  
  // Outlook-Abstimmungsantworten erkennen
  return subject.includes('Ihre Abstimmungsantwort') || 
         body.includes('Sie haben') || 
         subject.includes('Re: Abstimmung:');
}

// Extrahiert Abstimmungsdaten aus E-Mail
function parseVote(emailData) {
  const subject = emailData.subject || '';
  const body = emailData.body || '';
  const voter = emailData.from || '';
  
  // Meeting-Titel extrahieren
  let meetingTitle = subject
    .replace('Re: Abstimmung: ', '')
    .replace('Ihre Abstimmungsantwort: ', '')
    .replace('Re: ', '');
  
  // Gewählte Option extrahieren
  let choice = null;
  
  // Verschiedene Patterns für Abstimmungsantworten
  const patterns = [
    /Sie haben "([^"]+)" gewählt/,
    /Your vote: "([^"]+)"/,
    /Antwort: "([^"]+)"/,
    /Vote: ([^\n\r]+)/
  ];
  
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) {
      choice = match[1].trim();
      break;
    }
  }
  
  // Fallback: Erste Zeile nach "Re:"
  if (!choice && body.includes('Re:')) {
    const lines = body.split('\n');
    for (const line of lines) {
      if (line.trim() && !line.includes('Re:') && !line.includes('From:')) {
        choice = line.trim();
        break;
      }
    }
  }
  
  return {
    voter: voter,
    choice: choice,
    meetingTitle: meetingTitle,
    timestamp: new Date().toISOString(),
    originalSubject: subject,
    originalBody: body.substring(0, 500) // Nur erste 500 Zeichen
  };
}

// Verarbeitet die Stimme und prüft Vollständigkeit
async function processVote(voteData) {
  console.log('💾 Verarbeite Stimme für:', voteData.meetingTitle);
  
  // Vereinfachte In-Memory-Speicherung für den Start
  // TODO: Später auf GitHub-Dateien umstellen
  
  // Mock-Daten für Demonstration
  const mockVotes = {
    [voteData.voter]: {
      choice: voteData.choice,
      timestamp: voteData.timestamp
    }
  };
  
  // Simuliere 3 erwartete Teilnehmer
  const expectedVoters = 3;
  const currentVotes = Object.keys(mockVotes).length;
  const isComplete = currentVotes >= expectedVoters;
  
  let winner = null;
  if (isComplete) {
    winner = calculateWinner(mockVotes);
  }
  
  return {
    totalVotes: currentVotes,
    expectedVoters: expectedVoters,
    isComplete: isComplete,
    winner: winner,
    allVotes: mockVotes
  };
}

// Ermittelt Gewinner-Option
function calculateWinner(votes) {
  const counts = {};
  
  // Stimmen zählen
  Object.values(votes).forEach(vote => {
    const choice = vote.choice;
    counts[choice] = (counts[choice] || 0) + 1;
  });
  
  console.log('📊 Stimmenverteilung:', counts);
  
  // Option mit meisten Stimmen finden
  let winner = null;
  let maxVotes = 0;
  
  for (const [option, voteCount] of Object.entries(counts)) {
    if (voteCount > maxVotes) {
      maxVotes = voteCount;
      winner = option;
    }
  }
  
  return {
    choice: winner,
    votes: maxVotes,
    total: Object.keys(votes).length,
    distribution: counts
  };
}

// Benachrichtigung bei Abschluss
async function notifyCompletion(result) {
  console.log('📢 Sende Benachrichtigung...');
  console.log('🏆 Gewinner-Termin:', result.winner.choice);
  console.log('📊 Stimmen:', result.winner.votes, 'von', result.winner.total);
  
  // TODO: E-Mail an alle Teilnehmer senden
  // TODO: Teams-Meeting erstellen
}
