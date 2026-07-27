import User from '../models/user.model.js';
import Property from '../models/property.model.js';
import Inquiry from '../models/inquiry.model.js';
import { deleteFromCloudinary } from '../utils/uploadToCloudinary.js';
import SiteVisit from '../models/siteVisit.model.js';
import Wishlist from '../models/wishlist.model.js';


//view all user
export const getAllUsers = async(req,res)=>{
    try{
        const users = await User.find().select("-password");
        res.json({
            success: true,
            count: users.length,
            users
        });
    }
    catch(err){
        res.status(500).json({
            message: err.message
        })
    }
}

//block a particular user 
export const blockUser = async(req,res)=>{
    try{
        const user = await User.findById(req.params.id);
        user.isBlocked = !user.isBlocked;
        await user.save();
        res.json({
            success: true,
            message: user.isBlocked ? "User Blocked" : "User Unblocked",
            isBlocked: user.isBlocked
        });
    }
    catch(err){
        res.status(500).json({
            message: err.message
        })
    }
}

//to delete a particular user 

export const deleteUser = async (req,res)=>{
    try{
        await User.findByIdAndDelete(req.params.id);
        res.json({
            success: true,
            message: "User deleted Successfully!"
        });

    }
    catch(error){
        res.status(500).json({
            message: error.message
        })
    }
}

//view all the properties

export const getAllProperties = async (req,res)=>{
    try{
        const properties = await Property.find().populate("seller","name email");
        res.json({
            success: true,
            count: properties.length,
            properties
        });
    }
     catch(err){
        res.status(500).json({
            message: err.message
        })
    }
}

//to delete a parrticular property by admin
export const deleteProperty = async(req,res)=>{
    try{
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        for (const imageUrl of property.images) {
            await deleteFromCloudinary(imageUrl);
        }

        await Property.findByIdAndDelete(req.params.id);
        await Wishlist.deleteMany({ property: property._id });
        await Inquiry.deleteMany({ property: property._id });
        await SiteVisit.deleteMany({ property: property._id });

        res.json({
            success: true,
            message: "Property Deleted successfully!"
        })
    }
    catch(err){
        res.status(500).json({
            message: err.message
        })
    }
}
// to view all inquiries 

export const getAllInquiries = async(req,res)=>{
    try{
        const inquiries = await Inquiry.find()
        .populate("buyer","name email")
        .populate("seller","name email")
        .populate("property", "title price")
        .sort({createdAt: -1});
        res.json({
            success: true,
            count: inquiries.length,
            inquiries
        });
    }
    catch(error){
        res.status(500).json({
            message: error.message
        })
    }

}

//Dahboard analytics

export const getDashboardStats = async(req,res)=>{
    try{
        const totalUsers = await User.countDocuments();
        const totalProperties = await Property.countDocuments();

        const activeListings = await Property.countDocuments({
            status: "sale"
        });
        const soldProperties = await Property.countDocuments({
            status: "sold"
        });
        res.json({
            success: true,
            stats: {
                totalUsers,
                totalProperties,
                activeListings,
                soldProperties
            }
        })
    }

   catch(error){
        res.status(500).json({
            message: error.message
        })
    }
}

//to get pending seller account

export const getPendingSellers = async (req,res)=>{
    try{
        const pendingSellers = await User.find({
            role: "seller",
            isApproved: false
        }).select("-password");
        res.json({
            success: true,
            count:pendingSellers.length,
            pendingSellers
        });
        

    }
   catch(err){
        res.status(500).json({
            message: err.message
        })
    }
}

//now to approve a seller

export const approveSeller = async (req,res)=>{
    try{
        const seller = await User.findById(req.params.id);
        if(!seller || seller.role !== "seller"){
            return res.status(404).json({
                success: false,
                message: "You are not a seller or seller not found"
            });
        }

        seller.isApproved= true;
        await seller.save();
        res.json({
            success: true,
            message: "seeler approved succesfully",
            seller
        })
    }
    catch(err){
        res.status(500).json({
            message: err.message
        });
    }
}

//to get pending properties (unverified)

export const getPendingProperties = async (req, res) => {
    try {
        const pendingProperties = await Property.find({
            isVerified: false
        }).populate("seller", "name email").sort({ createdAt: -1 });
        res.json({
            success: true,
            count: pendingProperties.length,
            pendingProperties
        });
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
}

//to approve/verify a property

export const approveProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }
        property.isVerified = true;
        await property.save();
        res.json({
            success: true,
            message: "Property approved and is now live",
            property
        });
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}

//to reject a property (delete it, since there's no "rejected" state in the schema)

export const rejectProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        for (const imageUrl of property.images) {
            await deleteFromCloudinary(imageUrl);
        }

        await property.deleteOne();
        await Wishlist.deleteMany({ property: property._id });
        await Inquiry.deleteMany({ property: property._id });
        await SiteVisit.deleteMany({ property: property._id });

        res.json({
            success: true,
            message: "Property rejected and removed"
        });
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}

//to get all site visits (any admin sees the same full list)

export const getAllSiteVisits = async (req, res) => {
    try {
        const siteVisits = await SiteVisit.find()
            .populate("buyer", "name email phone")
            .populate("seller", "name email")
            .populate("property", "title price images city area")
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            count: siteVisits.length,
            siteVisits
        });
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}

//to update a site visit's status

export const updateSiteVisitStatus = async (req, res) => {
    try {
        const siteVisit = await SiteVisit.findById(req.params.id);
        if (!siteVisit) {
            return res.status(404).json({
                success: false,
                message: "Site visit not found"
            });
        }
        siteVisit.status = req.body.status;
        await siteVisit.save();
        res.json({
            success: true,
            message: "Status updated",
            siteVisit
        });
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
