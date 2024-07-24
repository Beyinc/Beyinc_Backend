







exports.gCalendarCallback = async (req, res, next) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).send("Error: Missing authorization code");
    }
    console.log(code);
    try {
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