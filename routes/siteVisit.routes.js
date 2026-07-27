import express from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { createSiteVisit } from "../controllers/siteVisit.controller.js";

const siteVisitRouter = express.Router();

siteVisitRouter.post("/", protect, authorize("buyer"), createSiteVisit);

export default siteVisitRouter;