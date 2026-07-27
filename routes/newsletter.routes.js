import express from "express";
import { authorize, protect } from "../middlewares/auth.middleware.js";
import { subscribeNewsletter, getAllSubscribers } from "../controllers/newsletter.controller.js";

const newsletterRouter = express.Router();

newsletterRouter.post("/", subscribeNewsletter);
newsletterRouter.get("/", protect, authorize("admin"), getAllSubscribers);

export default newsletterRouter;