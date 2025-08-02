const PostLiveChatMessage = require("../../models/PostLiveChatMessage");

exports.getPostLiveChatMessages = async (req, res) => {
    try {
        const { postId } = req.body;
        const messages = await PostLiveChatMessage.find({ postId })
            .sort({ timestamp: 1 })
            .limit(50);
        res.json(messages);
    } catch (error) {
        console.error("Error fetching chat messages:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
}

exports.sendPostLiveChatMessage = async (req, res) => {
    try {
        const { postId, senderId, senderName, message, timestamp } = req.body;
        
        const newMessage = new PostLiveChatMessage({
            postId,
            senderId,
            senderName,
            message,
            timestamp: new Date(timestamp)
        });

        const savedMessage = await newMessage.save();
        res.json(savedMessage);
    } catch (error) {
        console.error("Error saving chat message:", error);
        res.status(500).json({ error: "Failed to send message" });
    }
}
    