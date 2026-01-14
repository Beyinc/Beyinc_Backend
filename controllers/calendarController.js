// controllers/calendarController.js
const User = require('../models/UserModel'); // Adjust the path as needed
const { google } = require('googleapis');
const { oauth2Client } = require('../helpers/calenderAuth');
const Calendar = require('../models/Calender'); // Adjust the path according to your project structure
const calendarApi = google.calendar('v3'); // Using Google Calendar API v3
const availabilityController = require ('./availabilityController.js');
const Booking = require('../models/Booking.js'); // Adjust the path according to your project structure
const send_Notification_mail = require("../helpers/EmailSending");

// --- EMAIL TEMPLATE ---
const getUserRescheduleAlertTemplate = (mentorName, studentName, topic, newDate, link) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #2196F3;">Session Rescheduled by Student </h2>
      <p>Hello <strong>${mentorName}</strong>,</p>
      <p><strong>${studentName}</strong> has updated the date/time for your session.</p>
      
      <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
        <p><strong>Topic:</strong> ${topic}</p>
        <p><strong>New Date & Time:</strong> ${new Date(newDate).toUTCString()}</p>
        <p><strong>Meeting Link:</strong> <a href="${link}">${link}</a></p>
      </div>

      <p>Please check your calendar to ensure this fits your schedule.</p>
    </div>
  `;
};

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
    try {
      if (!code) {
        throw new Error('Authorization code is required');
      }

      console.log('Exchanging authorization code for new tokens...');
      
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
  
      console.log('New tokens received:', {
        access_token: tokens.access_token ? 'present' : 'missing',
        refresh_token: tokens.refresh_token ? 'present' : 'missing',
        expiry_date: tokens.expiry_date
      });
      
      await saveCredentials(userId, tokens);
  
      try {
        await listEvents(oauth2Client);
      } catch (listError) {
        console.warn('Could not list events (API may not be enabled):', listError.message);
        console.log('Authorization successful - tokens saved. Please enable Google Calendar API in Google Cloud Console if needed.');
      }
      
      return 'Authorization successful!';
    } catch (error) {
      console.error('Error during authorization:', error);
      throw new Error('Error during authorization');
    }
}

async function saveCredentials(userId, tokens) {
    try {
        const expiryDate = new Date(tokens.expiry_date);
        const existingCredentials = await Calendar.findOne({ userId });

        if (existingCredentials) {
            await Calendar.findOneAndUpdate(
                { userId },
                {
                    googleCredentials: {
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token,
                        expiryDate
                    }
                },
                { new: true }
            );
        } else {
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

async function createVideoConference(auth, eventDetails) {
    const calendarApi = google.calendar('v3'); 

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
            auth: auth 
        });

        return response.data;
    } catch (error) {
        console.error('Error creating event:', error);
        
        if (error.code === 403 && error.errors && error.errors[0]?.reason === 'accessNotConfigured') {
            const errorMessage = error.errors[0]?.message || 'Google Calendar API is not enabled';
            throw new Error(`Google Calendar API is not enabled. Please enable it in Google Cloud Console: ${errorMessage}`);
        }
        
        throw new Error(`Error creating event: ${error.message || 'Unknown error'}`);
    }
}

exports.book = async (req, res, next) => {
    console.log('Book created')
    const { eventDetails, mentorId, bookingData } = req.body;
    console.log('booking data received', bookingData)
    bookingData.userId = bookingData.user_id;
    console.log('booking data', bookingData)

    try {
        const userCalendar = await Calendar.findOne({ userId: mentorId });
        console.log('credentials found' ,userCalendar.googleCredentials)

        if (userCalendar && userCalendar.googleCredentials) {
                oauth2Client.setCredentials({
                    access_token: userCalendar.googleCredentials.accessToken,
                    refresh_token: userCalendar.googleCredentials.refreshToken,
                    expiry_date: userCalendar.googleCredentials.expiryDate.getTime(),
                });

                console.log('credentials set')
            
            const expiryDate = new Date(userCalendar.googleCredentials.expiryDate);
            if (expiryDate <= new Date()) {
                if (userCalendar.googleCredentials.refreshToken) {
                    const { credentials } = await oauth2Client.refreshAccessToken();
                    oauth2Client.setCredentials(credentials);
                    await saveCredentials(mentorId, credentials);
                } else {
                    return res.status(401).send('Access token expired and no refresh token available. Reauthorization required.');
                }
            }
        } else {
            return res.status(401).send('No credentials found. Reauthorization required.');
        }

        const createdEvent = await createVideoConference(oauth2Client, eventDetails);
        const createdBooking = await availabilityController.saveBooking(bookingData, createdEvent);

        if (createdBooking) { 
            return res.status(200).json({
                success: true,
                message: 'created and saved',
            });
        }
        
        if (!createdBooking) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create booking',
            });
        }
        
    } catch (error) {
        console.error('Error in booking:', error);
        
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
        const userCalendar = await Calendar.findOne({ userId: mentorId });
        console.log('credentials found', userCalendar.googleCredentials);

        if (userCalendar && userCalendar.googleCredentials) {
            oauth2Client.setCredentials({
                access_token: userCalendar.googleCredentials.accessToken,
                refresh_token: userCalendar.googleCredentials.refreshToken,
                expiry_date: userCalendar.googleCredentials.expiryDate.getTime(), 
            });

            console.log('credentials set');

            const expiryDate = new Date(userCalendar.googleCredentials.expiryDate);
            if (expiryDate <= new Date()) {
                if (userCalendar.googleCredentials.refreshToken) {
                    const { credentials } = await oauth2Client.refreshAccessToken();
                    oauth2Client.setCredentials(credentials);
                    await saveCredentials(mentorId, credentials);
                } else {
                    return res.status(401).send('Access token expired and no refresh token available. Reauthorization required.');
                }
            }
        } else {
            return res.status(401).send('No credentials found. Reauthorization required.');
        }

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const event = await calendar.events.get({
            calendarId: 'primary',
            eventId: eventId,
        });

        const updatedAttendees = [...event.data.attendees || [], { email }];
        event.data.attendees = updatedAttendees;

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
    const { eventDetails, mentorId, bookingData , rescheduleBooking } = req.body;
    const { eventId } = rescheduleBooking;

    console.log('eventId:', eventId, 'mentorId:', mentorId);
    console.log('reschedule data', rescheduleBooking)

    try {
        // --- GOOGLE AUTH LOGIC START ---
        const userCalendar = await Calendar.findOne({ userId: mentorId });
        
        if (userCalendar && userCalendar.googleCredentials) {
            oauth2Client.setCredentials({
                access_token: userCalendar.googleCredentials.accessToken,
                refresh_token: userCalendar.googleCredentials.refreshToken,
                expiry_date: userCalendar.googleCredentials.expiryDate.getTime(),
            });

            const expiryDate = new Date(userCalendar.googleCredentials.expiryDate);
            if (expiryDate <= new Date()) {
                if (userCalendar.googleCredentials.refreshToken) {
                    const { credentials } = await oauth2Client.refreshAccessToken();
                    oauth2Client.setCredentials(credentials);
                    await saveCredentials(mentorId, credentials); 
                } else {
                    return res.status(401).send('Reauthorization required.');
                }
            }
        } else {
            return res.status(401).send('No credentials found.');
        }
        // --- GOOGLE AUTH LOGIC END ---

        // Modify event dates on Google Calendar
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const updatedEvent = await calendar.events.patch({
            calendarId: 'primary',
            eventId: eventId,
            requestBody: {
                start: { dateTime: eventDetails.startDateTimeUTC, timeZone: 'UTC' },
                end: { dateTime: eventDetails.endDateTimeUTC, timeZone: 'UTC' },
            },
        });

        // Update database
        const updateResult = await updateBookingDates(
            eventId,
            eventDetails.startDateTimeUTC,
            eventDetails.endDateTimeUTC
        );

        if (!updateResult.success) {
            return res.status(500).send(updateResult.message);
        }

        // --- EMAIL LOGIC to Notify MENTOR ---
        try {
            const bookingDetails = await Booking.findOne({ eventId: eventId })
                .populate('userId', 'email userName')
                .populate('mentorId', 'userName email');

            if (bookingDetails && bookingDetails.mentorId) {
                const emailBody = getUserRescheduleAlertTemplate(
                    bookingDetails.mentorId.userName,  
                    bookingDetails.userId.userName,    
                    bookingDetails.title || "Mentorship Session",
                    eventDetails.startDateTimeUTC,
                    bookingDetails.meetLink || "Check Dashboard"
                );

                await send_Notification_mail(
                    bookingDetails.mentorId.email,
                    "Session Rescheduled by Student 🔄", 
                    emailBody,
                    bookingDetails.mentorId.email,
                    "",
                    {}
                );
                console.log(`Reschedule alert sent to mentor: ${bookingDetails.mentorId.email}`);
            }
        } catch (emailError) {
            console.error("Failed to send reschedule email notification:", emailError);
        }
        // ---------------------------------------------

        res.status(200).send({
            message: 'Event and booking dates successfully updated!',
            updatedEvent: updatedEvent.data,
            updatedBooking: updateResult.updatedBooking,
        });

    } catch (error) {
        console.error('Error modifying event dates:', error);
        res.status(500).send('Error in modifying event dates.');
    }
}; 

async function updateBookingDates(eventId, newStartDateTime, newEndDateTime) {
    try {
        const updatedBooking = await Booking.findOneAndUpdate(
            { eventId }, 
            {
                startDateTime: newStartDateTime,
                endDateTime: newEndDateTime,
                reschedule: true, 
            },
            { new: true } 
        );

        if (!updatedBooking) {
            return { success: false, message: 'Booking not found' };
        }

        console.log('Booking dates updated in database:', updatedBooking);
        return { success: true, message: 'Event and booking dates successfully updated!', updatedBooking };
    } catch (error) {
        console.error('Error updating booking dates:', error);
        return { success: false, message: 'There was a problem updating the booking.' };
    }
};

exports.deleteEvent = async (req, res, next) => {
    const { selectedBooking } = req.body;
    const { eventId, mentorId } = selectedBooking;
    const { _id } = mentorId;

    console.log('eventId:', eventId, 'mentorId:', mentorId, 'id:', _id);

    try {
        const userCalendar = await Calendar.findOne({ userId: _id });
        console.log('credentials found:', userCalendar.googleCredentials);

        if (userCalendar && userCalendar.googleCredentials) {
            oauth2Client.setCredentials({
                access_token: userCalendar.googleCredentials.accessToken,
                refresh_token: userCalendar.googleCredentials.refreshToken,
                expiry_date: userCalendar.googleCredentials.expiryDate.getTime(),
            });

            const expiryDate = new Date(userCalendar.googleCredentials.expiryDate);
            if (expiryDate <= new Date()) {
                if (userCalendar.googleCredentials.refreshToken) {
                    const { credentials } = await oauth2Client.refreshAccessToken();
                    oauth2Client.setCredentials(credentials);
                    await saveCredentials(mentorId, credentials);
                } else {
                    return res.status(401).send('Access token expired and no refresh token available. Reauthorization required.');
                }
            }
        } else {
            return res.status(401).send('No credentials found. Reauthorization required.');
        }

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
        });

        console.log('Event deleted successfully');

        const deleteResult = await cancelBooking(eventId);

        if (!deleteResult.success) {
            return res.status(500).send(deleteResult.message);
        }

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
        const updatedBooking = await Booking.findOneAndUpdate(
            { eventId }, 
            { status: 'cancelled' }, 
            { new: true } 
        );

        if (!updatedBooking) {
            return { success: false, message: 'Booking not found' };
        }

        console.log('Booking status updated to cancelled:', updatedBooking);
        return { success: true, message: 'Booking successfully cancelled!', updatedBooking };
    } catch (error) {
        console.error('Error cancelling booking:', error);
        return { success: false, message: 'There was a problem cancelling the booking.' };
    }
}