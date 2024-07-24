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
  
  // generate a url that asks permissions for Blogger and Google Calendar scopes
  const scopes = [
    'https://www.googleapis.com/auth/calendar'
  ];
  

// Define and export the calendarAuth function
exports.calAuth = (req, res) => {
  console.log('calendarAuth working...');
  
  // console.log(process.env.YOUR_CLIENT_ID);

  // const url = oauth2Client.generateAuthUrl({
  //     access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
  //     scope: scopes // Define your scopes here
  // });

  // console.log(url);

  // Use res.redirect to send a redirect response
  res.send({verified});
};