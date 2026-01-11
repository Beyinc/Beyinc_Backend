
const User = require('../models/UserModel'); // Adjust the path as needed
const { google } = require('googleapis');
const { oauth2Client } = require('../helpers/calenderAuth');
const Calendar = require('../models/Calender'); // Adjust the path according to your project structure
const calendarApi = google.calendar('v3'); // Using Google Calendar API v3
const availabilityController = require ('./availabilityController.js');
const Booking = require('../models/Booking.js'); // Adjust the path according to your project structure


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

        res.send("Authorization successful!");
    } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        res.status(500).send("Error exchanging code for tokens");
    }
   
};






async function authorize(userId, code) {
    // When an authorization code is provided, always exchange it for new tokens
    // This handles both initial authorization and re-authorization scenarios
   
    try {
      if (!code) {
        throw new Error('Authorization code is required');
      }

      console.log('Exchanging authorization code for new tokens...');
      
      // Always exchange the authorization code for new tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
  
      console.log('New tokens received:', {
        access_token: tokens.access_token ? 'present' : 'missing',
        refresh_token: tokens.refresh_token ? 'present' : 'missing',
        expiry_date: tokens.expiry_date
      });
      
      // Save the new credentials to the database (this will update if they exist)
      await saveCredentials(userId, tokens);
  
      // Try to list events as a verification step (optional - won't fail if API isn't enabled)
      try {
        await listEvents(oauth2Client);
      } catch (listError) {
        // Log the error but don't fail authorization if Calendar API isn't enabled
        console.warn('Could not list events (API may not be enabled):', listError.message);
        console.log('Authorization successful - tokens saved. Please enable Google Calendar API in Google Cloud Console if needed.');
      }
      
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



// const eventDetails = {
//     summary: 'Team Meeting',
//     description: 'Discuss project updates and next steps.',
//     startTime: new Date(new Date().getTime() + 3600000), // 1 hour from now
//     endTime: new Date(new Date().getTime() + 7200000), // 2 hours from now
//     timeZone: 'Asia/Kolkata', // Time zone for India
//     attendees: ['example@example.com'], // List of attendees
//   };
  


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

    console.log(eventDetails);
    const event = {
        summary: eventDetails.title,
        description: eventDetails.description,
        start: {
            dateTime: eventDetails.startDateTimeUTC,
            timeZone: eventDetails.timeZone,
        },
        end: {
            dateTime: eventDetails.endDateTimeUTC,
            timeZone: 'UTC',
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

        // console.log('Event created:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating event:', error);
        
        // Check if the error is due to Calendar API not being enabled
        if (error.code === 403 && error.errors && error.errors[0]?.reason === 'accessNotConfigured') {
            const errorMessage = error.errors[0]?.message || 'Google Calendar API is not enabled';
            throw new Error(`Google Calendar API is not enabled. Please enable it in Google Cloud Console: ${errorMessage}`);
        }
        
        throw new Error(`Error creating event: ${error.message || 'Unknown error'}`);
    }
}





exports.book = async (req, res, next) => {
    // const userId = req.user._id; // Assuming user ID is available in req.user._id
    console.log('Book created')
    const { eventDetails, mentorId, bookingData   } = req.body;
    console.log('booking data received', bookingData)
    // console.log(eventDetails, mentorId);
    bookingData.userId = bookingData.user_id;

    console.log('booking data', bookingData)

    try {
        // Check if the user has stored credentials
        const userCalendar = await Calendar.findOne({ userId: mentorId });

        console.log('credentials found' ,userCalendar.googleCredentials)

        if (userCalendar && userCalendar.googleCredentials) {
            // Set credentials to the oauth2Client
              // Set the credentials to the oauth2Client
                  oauth2Client.setCredentials({
                    access_token: userCalendar.googleCredentials.accessToken,
                    refresh_token: userCalendar.googleCredentials.refreshToken,
                    expiry_date: userCalendar.googleCredentials.expiryDate.getTime(), // Convert Date to timestamp
                });

                console.log('credentials set')
            // Optionally check if the access token has expired
            const expiryDate = new Date(userCalendar.googleCredentials.expiryDate);
            if (expiryDate <= new Date()) {
                // If the token has expired, refresh it (this depends on your token management strategy)
                if (userCalendar.googleCredentials.refreshToken) {
                    const { credentials } = await oauth2Client.refreshAccessToken();
                    oauth2Client.setCredentials(credentials);
                    await saveCredentials(mentorId, credentials); // Save the new tokens
                } else {
                    return res.status(401).send('Access token expired and no refresh token available. Reauthorization required.');
                }
            }
        } else {
            return res.status(401).send('No credentials found. Reauthorization required.');
        }

        // Proceed to create the video conference
        const createdEvent = await createVideoConference(oauth2Client, eventDetails);

        const createdBooking = await availabilityController.saveBooking(bookingData, createdEvent);

        if (createdBooking)   { 
        return res.status(200).json({
            success: true,
            message: 'created and saved',
          });
        }
        // Check if the booking was saved successfully
        if (!createdBooking) {
          return res.status(500).json({
            success: false,
            message: 'Failed to create booking',
          });
        }
        
    } catch (error) {
        console.error('Error in booking:', error);
        
        // Provide more specific error messages
        if (error.message && error.message.includes('Google Calendar API is not enabled')) {
            return res.status(503).json({
                success: false,
                message: 'Google Calendar API is not enabled. Please contact the administrator to enable it in Google Cloud Console.',
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error in booking the event.',
            error: error.message || 'Unknown error'
        });
    }
};






exports.addAttendee = async (req, res, next) => {
    const { eventId, mentorId } = req.body;
    console.log(eventId, mentorId);
    const {email} = req.payload;

    console.log('email',email);
  
  
    try {
        // Check if the mentor has stored credentials
        const userCalendar = await Calendar.findOne({ userId: mentorId });

        console.log('credentials found', userCalendar.googleCredentials);

        if (userCalendar && userCalendar.googleCredentials) {
            // Set the credentials to the oauth2Client
            oauth2Client.setCredentials({
                access_token: userCalendar.googleCredentials.accessToken,
                refresh_token: userCalendar.googleCredentials.refreshToken,
                expiry_date: userCalendar.googleCredentials.expiryDate.getTime(), // Convert Date to timestamp
            });

            console.log('credentials set');

            // Optionally check if the access token has expired
            const expiryDate = new Date(userCalendar.googleCredentials.expiryDate);
            if (expiryDate <= new Date()) {
                // If the token has expired, refresh it
                if (userCalendar.googleCredentials.refreshToken) {
                    const { credentials } = await oauth2Client.refreshAccessToken();
                    oauth2Client.setCredentials(credentials);
                    await saveCredentials(mentorId, credentials); // Save the new tokens
                } else {
                    return res.status(401).send('Access token expired and no refresh token available. Reauthorization required.');
                }
            }
        } else {
            return res.status(401).send('No credentials found. Reauthorization required.');
        }

        // Fetch the existing event
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const event = await calendar.events.get({
            calendarId: 'primary',
            eventId: eventId,
        });

        // Add the new attendee
        const updatedAttendees = [...event.data.attendees || [], { email }];
        event.data.attendees = updatedAttendees;

        // Update the event with the new attendee list
        const updatedEvent = await calendar.events.patch({
            calendarId: 'primary',
            eventId: eventId,
            requestBody: {
                attendees: updatedAttendees,
            },
        });
        console.log('added user', updatedEvent)
        res.status(200).send(updatedEvent.data);
    } catch (error) {
        console.error('Error in adding attendee:', error);
        res.status(500).send('Error in adding attendee to the event.');
    }
};



exports.modifyEventDates = async (req, res, next) => {
    const { eventDetails, mentorId, bookingData , rescheduleBooking  } = req.body;
    const { eventId } = rescheduleBooking;

    console.log('eventId:', eventId, 'mentorId:', mentorId);

    console.log('reschedule data', rescheduleBooking)
  

    try {
        // Check if the mentor has stored credentials
        const userCalendar = await Calendar.findOne({ userId: mentorId });

        console.log('credentials found:', userCalendar.googleCredentials);

        if (userCalendar && userCalendar.googleCredentials) {
            // Set the credentials to the oauth2Client
            oauth2Client.setCredentials({
                access_token: userCalendar.googleCredentials.accessToken,
                refresh_token: userCalendar.googleCredentials.refreshToken,
                expiry_date: userCalendar.googleCredentials.expiryDate.getTime(),
            });

            console.log('credentials set');

            // Optionally check if the access token has expired
            const expiryDate = new Date(userCalendar.googleCredentials.expiryDate);
            if (expiryDate <= new Date()) {
                if (userCalendar.googleCredentials.refreshToken) {
                    const { credentials } = await oauth2Client.refreshAccessToken();
                    oauth2Client.setCredentials(credentials);
                    await saveCredentials(mentorId, credentials); // Save new tokens
                } else {
                    return res.status(401).send('Access token expired and no refresh token available. Reauthorization required.');
                }
            }
        } else {
            return res.status(401).send('No credentials found. Reauthorization required.');
        }

        // Fetch the existing event
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const event = await calendar.events.get({
            calendarId: 'primary',
            eventId: eventId,
        });

        // Modify event dates
        const updatedEvent = await calendar.events.patch({
            calendarId: 'primary',
            eventId: eventId,
            requestBody: {
                start: {
                    dateTime: eventDetails.startDateTimeUTC, // New start date
                    timeZone: 'UTC', // Keep existing time zone
                },
                end: {
                    dateTime: eventDetails.endDateTimeUTC, // New end date
                    timeZone:'UTC', // Keep existing time zone
                },
            },
        });


        const updateResult = await updateBookingDates(
            eventId,
            eventDetails.startDateTimeUTC,
            eventDetails.endDateTimeUTC
        );

        if (!updateResult.success) {
            // Handle failure in updating the booking
            return res.status(500).send(updateResult.message);
        }

        // Send a success response with both the updated calendar event and the updated booking
        res.status(200).send({
            message: 'Event and booking dates successfully updated!',
            updatedEvent: updatedEvent.data,
            updatedBooking: updateResult.updatedBooking,
        });
    } 
        
     catch (error) {
        console.error('Error modifying event dates:', error);
        res.status(500).send('Error in modifying event dates.');
    }
};




async function updateBookingDates(eventId, newStartDateTime, newEndDateTime) {
    try {
        // Find the booking by eventId and update the dates, also set reschedule to true
        const updatedBooking = await Booking.findOneAndUpdate(
            { eventId }, // Find booking by eventId
            {
                startDateTime: newStartDateTime,
                endDateTime: newEndDateTime,
                reschedule: true, // Add the reschedule field
            },
            { new: true } // Return the updated booking
        );

        if (!updatedBooking) {
            return { success: false, message: 'Booking not found' };
        }

        console.log('Booking dates updated in database:', updatedBooking);

        // Return a success message with the updated booking details
        return { success: true, message: 'Event and booking dates successfully updated!', updatedBooking };
    } catch (error) {
        console.error('Error updating booking dates:', error);
        // Return an error message
        return { success: false, message: 'There was a problem updating the booking.' };
    }
};




exports.deleteEvent = async (req, res, next) => {
    const { selectedBooking } = req.body;
    const { eventId,mentorId } = selectedBooking;
    const {_id} = mentorId;

    console.log('eventId:', eventId, 'mentorId:', mentorId, 'id:', _id);

    try {
        // Check if the mentor has stored credentials
        const userCalendar = await Calendar.findOne({ userId: _id });

        console.log('credentials found:', userCalendar.googleCredentials);

        if (userCalendar && userCalendar.googleCredentials) {
            // Set the credentials to the oauth2Client
            oauth2Client.setCredentials({
                access_token: userCalendar.googleCredentials.accessToken,
                refresh_token: userCalendar.googleCredentials.refreshToken,
                expiry_date: userCalendar.googleCredentials.expiryDate.getTime(),
            });

            console.log('credentials set');

            // Optionally check if the access token has expired
            const expiryDate = new Date(userCalendar.googleCredentials.expiryDate);
            if (expiryDate <= new Date()) {
                if (userCalendar.googleCredentials.refreshToken) {
                    const { credentials } = await oauth2Client.refreshAccessToken();
                    oauth2Client.setCredentials(credentials);
                    await saveCredentials(mentorId, credentials); // Save new tokens
                } else {
                    return res.status(401).send('Access token expired and no refresh token available. Reauthorization required.');
                }
            }
        } else {
            return res.status(401).send('No credentials found. Reauthorization required.');
        }

        // Delete the event from the Google Calendar
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
        });

        console.log('Event deleted successfully');

        // Optionally, you can also delete the event from your database or update its status
         const deleteResult = await cancelBooking(eventId);

        if (!deleteResult.success) {
            // Handle failure in deleting the booking
            return res.status(500).send(deleteResult.message);
        }

        // Send a success response
        res.status(200).send({
            message: 'Event and booking successfully deleted!',
            deletedBooking: deleteResult.deletedBooking,
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).send('Error in deleting event.');
    }
};



async function cancelBooking(eventId) {
    try {
        // Find the booking by eventId and update the status to "cancelled"
        const updatedBooking = await Booking.findOneAndUpdate(
            { eventId }, // Find the booking by eventId
            { status: 'cancelled' }, // Update status to "cancelled"
            { new: true } // Return the updated booking
        );

        if (!updatedBooking) {
            return { success: false, message: 'Booking not found' };
        }

        console.log('Booking status updated to cancelled:', updatedBooking);

        // Return a success message with the updated booking details
        return { success: true, message: 'Booking successfully cancelled!', updatedBooking };
    } catch (error) {
        console.error('Error cancelling booking:', error);
        // Return an error message
        return { success: false, message: 'There was a problem cancelling the booking.' };
    }
}
