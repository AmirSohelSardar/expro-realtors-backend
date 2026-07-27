import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import Chat from './../models/chat.model.js';

const chatRouter = express.Router();

chatRouter.use(protect);

// to create a Chat
chatRouter.post("/start", async (req, res) => {
    try {
        const { propertyId, sellerId, buyerId: providedBuyerId } = req.body;
        let buyerId, finalSellerId;

       if (providedBuyerId && sellerId) {
    // Explicit buyer/seller pair provided by the frontend
    buyerId = providedBuyerId;
    finalSellerId = sellerId;
} else if (req.user.role === "seller") {
    buyerId = providedBuyerId;
    finalSellerId = req.user._id;
} else {
    buyerId = req.user._id;
    finalSellerId = sellerId;
}

        if (!buyerId || !finalSellerId) {
            return res.status(400).json({
                message: "Missing buyer or seller Id"
            });
        }

        // check for an existing chat btw this buyer and seller
        let chat = await Chat.findOne({
            buyer: buyerId,
            seller: finalSellerId
        });

        if (!chat) {
            try {
                chat = await Chat.create({
                    property: propertyId,
                    buyer: buyerId,
                    seller: finalSellerId,
                    messages: []
                });
            } catch (createErr) {
                // another concurrent request created it first (race condition) — fetch that one instead
                if (createErr.code === 11000) {
                    chat = await Chat.findOne({ buyer: buyerId, seller: finalSellerId });
                } else {
                    throw createErr;
                }
            }
        }

        chat = await Chat.findById(chat._id)
            .populate("buyer", "name email profilePic role")
            .populate("seller", "name email profilePic role")
            .populate("property", "title price images");

        res.json(chat);
    } catch (err) {
        res.status(500).json({
            message: "Error creating chat or getting previous one",
            error: err.message
        });
    }
});

// to send message
chatRouter.post("/send", async (req, res) => {
    try {
        const { chatId, text, image } = req.body;
        const userId = req.user._id;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                message: "Chat not found"
            });
        }

        // ensure sender is part of this Chat
        if (chat.buyer.toString() !== userId.toString() && chat.seller.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "Not authorized to send message in this chat"
            });
        }

        const newMessage = {
            sender: userId,
            text,
            image,
            createdAt: new Date()
        };

        chat.messages.push(newMessage);
        await chat.save();

        const savedMessage = chat.messages[chat.messages.length - 1];
        res.json({ chat, newMessage: savedMessage });
    } catch (err) {
        res.status(500).json({
            message: "Error sending message",
            error: err.message
        });
    }
});

// to get chats for user
chatRouter.get("/user", async (req, res) => {
    try {
        const userId = req.user._id;
        const chats = await Chat.find({
            $or: [{ buyer: userId }, { seller: userId }]
        })
            .populate("buyer", "name email profilePic role")
            .populate("seller", "name email profilePic role")
            .populate("property", "title price images")
            .sort({ updatedAt: -1 });

        const withUnread = chats.map((chat) => {
            const unreadCount = chat.messages.filter(
                (m) => m.sender.toString() !== userId.toString() && !m.isRead
            ).length;
            const chatObj = chat.toObject();
            chatObj.unreadCount = unreadCount;
            return chatObj;
        });

        res.json(withUnread);
    } catch (err) {
        res.status(500).json({
            message: "error fetching user chat",
            error: err.message
        });
    }
});

// to get chat messages
chatRouter.get("/:chatId", async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId)
            .populate("buyer", "name email profilePic role")
            .populate("seller", "name email profilePic role")
            .populate("property", "title price images")
            .populate("messages.sender", "name profilePic");

        if (!chat) return res.status(404).json({ message: "Chat not found" });

        const userId = req.user._id.toString();
        if (chat.buyer._id.toString() !== userId && chat.seller._id.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized"
            });
        }

        // mark incoming messages as read since the user is now viewing this chat
        let changed = false;
        chat.messages.forEach((m) => {
            if (m.sender._id.toString() !== userId && !m.isRead) {
                m.isRead = true;
                changed = true;
            }
        });
        if (changed) {
            await chat.save();
        }

        res.json(chat);
    } catch (err) {
        res.status(500).json({
            message: "error fetching user chat",
            error: err.message
        });
    }
});




// mark unread messages as read (chat window already open, new message just arrived)
chatRouter.patch("/:chatId/read", async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ message: "Chat not found" });

        const userId = req.user._id.toString();
        if (chat.buyer.toString() !== userId && chat.seller.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized" });
        }

        let changed = false;
        chat.messages.forEach((m) => {
            if (m.sender.toString() !== userId && !m.isRead) {
                m.isRead = true;
                changed = true;
            }
        });
        if (changed) {
            await chat.save();
        }

        res.json({ message: "Marked as read" });
    } catch (err) {
        res.status(500).json({ message: "error marking chat read", error: err.message });
    }
});

// to delete an entire Chat
chatRouter.delete("/:chatId", async (req, res) => {
    try {
        const userId = req.user._id;
        const chat = await Chat.findById(req.params.chatId);

        if (!chat) {
            return res.status(404).json({
                message: "Chat not found"
            });
        }

        // now we ensure the user is part of the Chat
        if (chat.buyer.toString() !== userId.toString() &&
            chat.seller.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "Not authorized"
            });
        }

        await Chat.findByIdAndDelete(req.params.chatId);
        res.json({ message: "Chat deleted successfully" });
    } catch (err) {
        res.status(500).json({
            message: "error deleting chat",
            error: err.message
        });
    }
});

// to delete a specific message
chatRouter.delete("/:chatId/message/:messageId", async (req, res) => {
    try {
        const userId = req.user._id;
        const chat = await Chat.findById(req.params.chatId);

        if (!chat) return res.status(404).json({ message: "Chat Not Found" });

        const message = chat.messages.id(req.params.messageId);
        if (!message) return res.status(404).json({ message: "Message not found" });

        // only sender can delete their message
        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "Not authorized to delete this message"
            });
        }

        chat.messages.pull(req.params.messageId);
        await chat.save();

        res.json({ message: "Message deleted successfully" });
    } catch (err) {
        res.status(500).json({
            message: "error deleting message",
            error: err.message
        });
    }
});

export default chatRouter;