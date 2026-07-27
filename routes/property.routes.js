import express from 'express';
import {
  addProperty,
  getAllProperties,
  getMyProperties,
  updateProperty,
  deleteProperty,
  updatePropertyStatus,
  getPropertyCounts,
  getPropertyDetails,
  getSellerDashboard,
} from "../controllers/property.controller.js";
import {authorize,protect} from '../middlewares/auth.middleware.js';
import upload from '../middlewares/upload.middleware.js'


const propertyRouter = express.Router();
propertyRouter.get("/",getAllProperties);

propertyRouter.post("/",protect,authorize("seller","admin"),upload.array("images",10),addProperty);
propertyRouter.get("/my",protect,authorize("seller","admin"),getMyProperties);
propertyRouter.put("/:id",protect, authorize("seller","admin"),upload.array("images",10), updateProperty);

propertyRouter.delete("/:id",protect, authorize("seller","admin"),deleteProperty);
propertyRouter.patch("/:id/status",protect,authorize("seller","admin"),updatePropertyStatus);

propertyRouter.get("/counts",getPropertyCounts);
propertyRouter.get("/:id",getPropertyDetails);

propertyRouter.get("/seller/dashboard",protect,authorize("seller","admin"),getSellerDashboard);

export default propertyRouter;