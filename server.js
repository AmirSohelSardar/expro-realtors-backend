import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { connectDB } from './config/db.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import propertyRouter from './routes/property.routes.js';
import inquiryRouter from './routes/inquiry.routes.js';
import wishlistRouter from './routes/wishlist.routes.js';
import contactRouter from './routes/contact.routes.js';
import adminRouter from './routes/admin.routes.js';
import chatRouter from './routes/chat.routes.js';
import siteVisitRouter from './routes/siteVisit.routes.js';
import newsletterRouter from './routes/newsletter.routes.js';

const app = express();

// DB
connectDB().catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
});

// MIDDLEWARES
const allowedOrigins = [
    process.env.CLIENT_URL || "http://localhost:3000",
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

app.use(express.json());

// ROUTES
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/property", propertyRouter);
app.use("/api/inquiry", inquiryRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/contact", contactRouter);
app.use("/api/admin", adminRouter);
app.use("/api/chat", chatRouter);
app.use("/api/site-visit", siteVisitRouter);
app.use("/api/newsletter", newsletterRouter);

app.get("/", (req, res) => {
    res.send("API is running");
});

// Only run a real listening server locally.
// On Vercel, the app is imported and wrapped as a serverless function instead.
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

export default app;