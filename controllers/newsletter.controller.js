import Newsletter from "../models/newsletter.model.js";

export const subscribeNewsletter = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const existing = await Newsletter.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(200).json({ success: true, message: "You're already subscribed" });
        }

        await Newsletter.create({ email });

        // add contact to Brevo (free — separate from email-sending limits)
        try {
            const BREVO_API_KEY = process.env.BREVO_API_KEY;
            await fetch("https://api.brevo.com/v3/contacts", {
                method: "POST",
                headers: {
                    "api-key": BREVO_API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({
                    email,
                    updateEnabled: true,
                }),
            });
        } catch (brevoErr) {
            console.error("Brevo contact sync failed:", brevoErr.message);
            // don't fail the request — we already saved them locally
        }

        res.status(201).json({ success: true, message: "Subscribed successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getAllSubscribers = async (req, res) => {
    try {
        const subscribers = await Newsletter.find().sort({ createdAt: -1 });
        res.json({ success: true, count: subscribers.length, subscribers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};