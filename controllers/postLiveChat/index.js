const PostLiveChatMessage = require("../../models/PostLiveChatMessage");

exports.getPostLiveChatMessages = async (req, res) => {
    try {
        const { postId } = req.body;
        const messages = await PostLiveChatMessage.find({ postId })
            .sort({ timestamp: 1 })
            .limit(50).populate({
                path: "senderId",
                select: "userName image role"
            });
        res.json(messages);
    } catch (error) {
        console.error("Error fetching chat messages:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
}

exports.sendPostLiveChatMessage = async (req, res) => {
    try {
        const { postId, senderId, senderName, message, timestamp } = req.body;

        // Step 1: Create and save
        const newMessage = new PostLiveChatMessage({
            postId,
            senderId,
            senderName,
            message,
            timestamp: new Date(timestamp)
        });

        const savedMessage = await newMessage.save();

        // Step 2: Populate after save
        const populatedMessage = await savedMessage.populate({
            path: "senderId",
            select: "userName image"
        });

        res.json(populatedMessage);
    } catch (error) {
        console.error("Error saving chat message:", error);
        res.status(500).json({ error: "Failed to send message" });
    }
};

