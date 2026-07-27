import SiteVisit from "../models/siteVisit.model.js";
import Property from "../models/property.model.js";
import sendEmail from "../utils/sendEmail.js";

// buyer books a site visit for a property
export const createSiteVisit = async (req, res) => {
    try {
        const { propertyId, name, phone, preferredDate, message } = req.body;

        const property = await Property.findById(propertyId).populate("seller", "name email");
        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found",
            });
        }

        const siteVisit = await SiteVisit.create({
            property: property._id,
            buyer: req.user._id,
            seller: property.seller._id,
            name,
            phone,
            preferredDate,
            message,
        });

        const adminEmail = process.env.EMAIL_USER;
        const adminMessage = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                <h2 style="color: #0d9488;">New Site Visit Request</h2>
                <div style="background:#f8fafc;padding:20px;border-radius:10px;border:1px solid #e2e8f0;">
                    <p><strong>Property:</strong> ${property.title}</p>
                    <p><strong>Requested by:</strong> ${name}</p>
                    <p><strong>Phone:</strong> ${phone}</p>
                    <p><strong>Buyer email:</strong> ${req.user.email}</p>
                    <p><strong>Preferred date:</strong> ${new Date(preferredDate).toLocaleString()}</p>
                    <p><strong>Listed by:</strong> ${property.seller?.name || "N/A"} (${property.seller?.email || "N/A"})</p>
                    ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
                </div>
            </div>
        `;

        try {
            await sendEmail({
                email: adminEmail,
                subject: `New Site Visit Request — ${property.title}`,
                message: adminMessage,
            });
        } catch (emailErr) {
            console.error("Site visit admin notification failed:", emailErr.message);
        }

        res.status(201).json({
            success: true,
            message: "Site visit requested successfully",
            siteVisit,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};