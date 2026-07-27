import Contact from "../models/contact.model.js";
import sendEmail from "../utils/sendEmail.js";
import { escapeHtml } from "../utils/escapeHtml.js";

// Create Contact
export const createContact = async (req, res) => {
    try {
        const { name, email, phone, role, message } = req.body;

        const contact = new Contact({
            name,
            email,
            phone,
            role,
            message,
        });

        // Save to MongoDB
        await contact.save();

        // Notify Admin via Email
        const adminEmail = process.env.EMAIL_USER;

        const adminMessage = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                <h2 style="color: #0d9488;">New Contact Request</h2>
                <p>You have received a new message from the platform.</p>

                <div style="background:#f8fafc;padding:20px;border-radius:10px;border:1px solid #e2e8f0;">
                    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
                    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
                    <p><strong>Phone:</strong> ${escapeHtml(phone) || "N/A"}</p>
                    <p><strong>Role:</strong> ${escapeHtml(role)}</p>
                    <p><strong>Message:</strong></p>
                    <p>"${escapeHtml(message)}"</p>
                </div>
            </div>
        `;

        try {
            await sendEmail({
                email: adminEmail,
                subject: `New Contact Message from ${name}`,
                message: adminMessage,
            });
        } catch (emailErr) {
            console.error("Admin notification email failed:", emailErr.message);
        }

        res.status(201).json({
            success: true,
            message: "Message sent successfully",
        });

    } catch (err) {
        console.error("Contact Error:", err);

        res.status(500).json({
            success: false,
            message: err.message || "Failed to send message",
        });
    }
};

//to get all contact(admin)

export const getAllContacts = async(req,res)=>{
    try{
        const contacts = await Contact .find().sort({createdAt: -1});
        res.status(200).json({
            success: true,
            contacts
        });
    }
    catch (err) {
        console.error("Contact Error:", err);

        res.status(500).json({
            success: false,
            message: "Failed to fetch contacts"
        });
    }

}