import express from "express";
import { authorize, protect } from "../middlewares/auth.middleware.js";
import {
    blockUser,
    deleteUser,
    getAllUsers,
    getAllProperties,
    deleteProperty,
    getAllInquiries,
    getDashboardStats,
    getPendingSellers,
    approveSeller,
    getPendingProperties,
    approveProperty,
    rejectProperty,
    getAllSiteVisits,
    updateSiteVisitStatus,
} from "../controllers/admin.controller.js";

const adminRouter = express.Router();

adminRouter.use(protect, authorize("admin"));

// User Management
adminRouter.get("/users", getAllUsers);
adminRouter.patch("/users/:id/block", blockUser);
adminRouter.delete("/users/:id", deleteUser);

// Property Management
adminRouter.get("/properties", getAllProperties);
adminRouter.delete("/properties/:id", deleteProperty);

// Property Verification
adminRouter.get("/pending-properties", getPendingProperties);
adminRouter.patch("/approve-property/:id", approveProperty);
adminRouter.delete("/reject-property/:id", rejectProperty);

// Inquiry Management
adminRouter.get("/inquiries", getAllInquiries);

// Dashboard
adminRouter.get("/stats", getDashboardStats);

// Seller Approval
adminRouter.get("/pending-sellers", getPendingSellers);
adminRouter.patch("/approve-seller/:id", approveSeller);

// Site Visits
adminRouter.get("/site-visits", getAllSiteVisits);
adminRouter.patch("/site-visits/:id/status", updateSiteVisitStatus);

export default adminRouter;