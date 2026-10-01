const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwhKN-Bhf6JT6zX1QJ-kl5cenAIcJoVoPD4wuC5J-q2A_GSSvRdXs5kIW97SrrDo2MeJw/exec';

async function saveToGoogleSheets(uebung, stufe, kategorie, notizen) {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'save',
        uebung: uebung,
        stufe: stufe,
        kategorie: kategorie,
        notizen: notizen
      })
    });
    const result = await response.json();
    console.log('✅ Gespeichert in Google Sheets');
    return result.success;
  } catch (error) {
    console.error('❌ Fehler beim Speichern:', error);
  }
}

async function loadFromGoogleSheets() {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'load' })
    });
    const data = await response.json();
    console.log('✅ Geladen von Google Sheets');
    return data;
  } catch (error) {
    console.error('❌ Fehler beim Laden:', error);
  }
}