const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
};

const getTokens = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

const createCalendarEvent = async (tokens, eventData) => {
  try {
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: eventData.title,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: eventData.startDateTime,
        timeZone: 'Asia/Kolkata'
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: 'Asia/Kolkata'
      },
      attendees: eventData.attendees || [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all'
    });

    return { success: true, eventId: response.data.id, eventLink: response.data.htmlLink };
  } catch (error) {
    console.error('Google Calendar error:', error.message);
    return { success: false, error: error.message };
  }
};

const deleteCalendarEvent = async (tokens, eventId) => {
  try {
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    await calendar.events.delete({ calendarId: 'primary', eventId });
    return { success: true };
  } catch (error) {
    console.error('Calendar delete error:', error.message);
    return { success: false };
  }
};

const updateCalendarEvent = async (tokens, eventId, eventData) => {
  try {
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: eventData.title,
      description: eventData.description,
      start: { dateTime: eventData.startDateTime, timeZone: 'Asia/Kolkata' },
      end: { dateTime: eventData.endDateTime, timeZone: 'Asia/Kolkata' }
    };

    await calendar.events.update({ calendarId: 'primary', eventId, resource: event });
    return { success: true };
  } catch (error) {
    console.error('Calendar update error:', error.message);
    return { success: false };
  }
};

module.exports = { getAuthUrl, getTokens, createCalendarEvent, deleteCalendarEvent, updateCalendarEvent, oauth2Client };
