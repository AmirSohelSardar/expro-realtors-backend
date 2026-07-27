const sendEmail = async (options) => {

try {
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    if (!BREVO_API_KEY) {
        console.log("Brevo API key is not defined in the environment variables.");
        throw new Error("Missing Email Api Key");
    }
    const data = {
        sender: {
            name: "Real Estate",
            email: process.env.EMAIL_USER
        },
        to:[{email: options.email}],
        subject: options.subject,
        htmlContent: options.message
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": BREVO_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(`Email sending failed: ${response.statusText}`);
    }
    else {
        console.log("Email sent successfully:", result);
    }
}
catch (error) {
    console.error("Error sending email:", error.message);
    throw error;
}
};

export default sendEmail;