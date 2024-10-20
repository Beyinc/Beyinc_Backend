const express = require("express");

const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });


const {google} = require('googleapis');

const process = require('process');


const oauth2Client = new google.auth.OAuth2(
  process.env.YOUR_CLIENT_ID,
  process.env.YOUR_CLIENT_SECRET,
  process.env.YOUR_REDIRECT_URL
);

// Define the scopes
const scopes = [
  'https://www.googleapis.com/auth/calendar'
];

// Define and export the calAuth function
exports.calAuth = (req, res) => {
  console.log(oauth2Client);
  const userId = req.payload.user_id;
  console.log(userId);
  console.log(process.env.YOUR_REDIRECT_URL);

  // Generate the authorization URL
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Ensures refresh token is returned
    scope: scopes,          // Scopes for Google Calendar
    prompt: 'consent',      // Forces user consent to always get refresh token
    state: userId           // Pass user ID as state to track user in callback
  });

  console.log(url);

  // Use res.send to send the URL
  res.send({ url });
};

// Export oauth2Client using exports
exports.oauth2Client = oauth2Client;