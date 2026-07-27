import mongoose from "mongoose";
import "dotenv/config";
import Chat from "../models/chat.model.js";

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    const chats = await Chat.find().sort({ createdAt: 1 });
    const seen = new Map();

    for (const chat of chats) {
        const key = `${chat.buyer}-${chat.seller}`;
        if (!seen.has(key)) {
            seen.set(key, chat);
            continue;
        }

        const original = seen.get(key);
        if (chat.messages.length > 0) {
            original.messages.push(...chat.messages);
            original.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            await original.save();
        }
        await Chat.findByIdAndDelete(chat._id);
        console.log(`Merged and removed duplicate chat ${chat._id} into ${original._id}`);
    }

    console.log("Done.");
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});