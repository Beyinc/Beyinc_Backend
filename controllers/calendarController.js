
const User = require('../models/UserModel'); // Adjust the path as needed
const { google } = require('googleapis');
const { oauth2Client } = require('../helpers/calenderAuth');
const Calendar = require('../models/Calender'); // Adjust the path according to your project structure
const calendarApi = google.calendar('v3'); // Using Google Calendar API v3




exports.Redirect = async (req, res, next) => {
    console.log('calendar redirect');
    const userId = req.query.state;
    console.log(userId);
    const code = req.query.code;
    if (!code) {
        return res.status(400).send("Error: Missing authorization code");
    }
    
    try {
        console.log("this is authorized code", code);

        await authorize(userId, code);
        // const oauth2Client = getOAuth2Client();
        // const { tokens } = await oauth2Client.getToken(code);
        // oauth2Client.setCredentials(tokens);

        // // Save credentials to the database
        // await saveCredentials(req.user.id, tokens);

        res.send("Authorization successful!");
    } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        res.status(500).send("Error exchanging code for tokens");
    }
   
};






async function authorize(userId, code) {
  // First, try to retrieve the credentials from the database
//   let oauth2Client;
  try {
    const user = await User.findById(userId).select('googleCredentials');
    
    if (user && user.googleCredentials) {
      oauth2Client.setCredentials(user.googleCredentials);
    } else {
      // No credentials found, proceed to get new tokens
      // Exchange the authorization code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      console.log(tokens);
      // Save the new credentials to the database
      await saveCredentials(userId, tokens);
    }
    
    await createVideoConference(oauth2Client, eventDetails)
    // Proceed with your application logic, such as listing events
    await listEvents(oauth2Client);
    
    return 'Authorization successful!';
  } catch (error) {
    console.error('Error during authorization:', error);
    throw new Error('Error during authorization');
  }
}



// Function to save credentials to the database
async function saveCredentials(userId, tokens) {
    try {
        // Convert expiry_date from the tokens to a Date object
        const expiryDate = new Date(tokens.expiry_date);

        // Find if credentials already exist for the user
        const existingCredentials = await Calendar.findOne({ userId });

        if (existingCredentials) {
            // Update existing credentials
            await Calendar.findOneAndUpdate(
                { userId },
                {
                    googleCredentials: {
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token,
                        expiryDate
                    }
                },
                { new: true } // Return the updated document
            );
        } else {
            // Create new credentials
            await Calendar.create({
                userId,
                googleCredentials: {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiryDate
                }
            });
        }

        console.log('Credentials saved successfully');
    } catch (error) {
        console.error('Error saving credentials:', error);
        throw new Error('Error saving credentials');
    }
}



// Function to list events (implement this based on your needs)
async function listEvents(auth) {
  try {
    const calendar = google.calendar({ version: 'v3', auth });
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = res.data.items;
    if (!events || events.length === 0) {
      console.log('No upcoming events found.');
      return;
    }

    console.log('Upcoming 10 events:');
    events.forEach((event) => {
      const start = event.start.dateTime || event.start.date;
      console.log(`${start} - ${event.summary}`);
    });

  } catch (error) {
    console.error('Error listing events:', error);
    throw new Error('Error listing events');
  }
}



const eventDetails = {
    summary: 'Team Meeting',
    description: 'Discuss project updates and next steps.',
    startTime: new Date(new Date().getTime() + 3600000), // 1 hour from now
    endTime: new Date(new Date().getTime() + 7200000), // 2 hours from now
    timeZone: 'Asia/Kolkata', // Time zone for India
    attendees: ['example@example.com'], // List of attendees
  };
  


/**
 * Creates a Google Calendar event with a Google Meet link.
 * 
 * @param {Object} auth - The OAuth2 client instance.
 * @param {Object} eventDetails - Details of the event to be created.
 * @param {string} eventDetails.summary - Summary of the event.
 * @param {string} eventDetails.description - Description of the event.
 * @param {Date} eventDetails.startTime - Start time of the event.
 * @param {Date} eventDetails.endTime - End time of the event.
 * @param {string} eventDetails.timeZone - Time zone of the event.
 * @param {Array<string>} eventDetails.attendees - List of email addresses to invite.
 */


async function createVideoConference(auth, eventDetails) {
    const calendarApi = google.calendar('v3'); // Google Calendar API client

    const event = {
        summary: eventDetails.summary,
        description: eventDetails.description,
        start: {
            dateTime: eventDetails.startTime.toISOString(),
            timeZone: eventDetails.timeZone,
        },
        end: {
            dateTime: eventDetails.endTime.toISOString(),
            timeZone: eventDetails.timeZone,
        },
        attendees: eventDetails.attendees.map(email => ({ email })),
        conferenceData: {
            createRequest: {
                requestId: `random-string-${Date.now()}`,
                conferenceSolutionKey: {
                    type: 'hangoutsMeet',
                },
            },
        },
        reminders: {
            useDefault: true,
        },
    };

    try {
        const response = await calendarApi.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
            auth: auth // Pass the auth object here
        });
        console.log('Event created:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating event:', error);
        throw new Error('Error creating event');
    }
}