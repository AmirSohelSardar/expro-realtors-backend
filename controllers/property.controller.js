import Property from "../models/property.model.js";
import Inquiry from "../models/inquiry.model.js";
import Wishlist from "../models/wishlist.model.js";
import SiteVisit from "../models/siteVisit.model.js";

import jwt from 'jsonwebtoken';
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/uploadToCloudinary.js";



//add propertyDetailsStyles

export const addProperty = async (req,res)=>{
    try{
        if (req.user.role === "seller" && !req.user.isApproved) {
            return res.status(403).json({
                success: false,
                message: "Your seller account is pending admin approval. You can't list properties yet."
            });
        }

        let imageUrls =[];
        if(req.files && req.files.length>0){
            for(let file of req.files){
                const result = await uploadToCloudinary(file.buffer, "properties");
                imageUrls.push(result.secure_url);
            }
        }

      const property = await Property.create({
      title: req.body.title,
      description: req.body.description,
      price: Number(req.body.price),
      city: req.body.city,
      area: req.body.area,
      pincode: req.body.pincode,
      propertyType: req.body.propertyType,
      bhk: req.body.bhk ? String(req.body.bhk) : undefined,
      bathrooms: req.body.bathrooms ? Number(req.body.bathrooms) : undefined,
      areaSize: req.body.areaSize ? Number(req.body.areaSize) : undefined,
      furnishing: req.body.furnishing,
      status: req.body.status,
      images: imageUrls,
      youtubeUrl: req.body.youtubeUrl ? req.body.youtubeUrl.trim() : undefined,
      developerName: req.body.developerName,
      possessionStatus: req.body.possessionStatus || undefined,
      possessionPercent: req.body.possessionPercent ? Number(req.body.possessionPercent) : undefined,
      blocks: req.body.blocks,
      totalUnits: req.body.totalUnits ? Number(req.body.totalUnits) : undefined,
      possessionYear: req.body.possessionYear,
      reraId: req.body.reraId,
      seller: req.user._id,
      isVerified: req.user.role === "admin" ? true : false,
      amenities: req.body.amenities
        ? Array.isArray(req.body.amenities)
          ? req.body.amenities
          : (() => {
            try {
              return JSON.parse(req.body.amenities);
            } catch (e) {
              return req.body.amenities.split(",");
            }
          })()
        : [],
    });

    res.json({
        success: true,
        property
    });



}
    catch (error) {
    console.error("ADD_PROPERTY_ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error while adding property",

    });
  }
}

//to get my propertyDetailsStyles
export const getMyProperties = async (req,res)=>{
    try{
        const properties = await Property.find({
            seller: req.user._id
        });
        res.json({
            success: true,
            properties
        });
    }
catch (error) {
    
    res.status(500).json({
      success: false,
      message: error.message 

    });
  }
};

// UPDATE PROPERTY
export const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    const isOwner = property.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }
    
    const fields = [
      "title",
      "description",
      "price",
      "city",
      "area",
      "pincode",
      "propertyType",
      "bhk",
      "bathrooms",
      "areaSize",
      "furnishing",
    "status",
      "amenities",
      "youtubeUrl",
      "developerName",
      "possessionStatus",
      "possessionPercent",
      "blocks",
      "totalUnits",
      "possessionYear",
      "reraId",
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "amenities" && typeof req.body[field] === "string") {
          try {
            property[field] = JSON.parse(req.body[field]);
          } catch (e) {
            property[field] = req.body[field].split(",");
          }
        } else {
          property[field] = req.body[field];
        }
      }
    });

    const oldImages = property.images;

    if (req.body.existingImages) {
      try {
        const existing = JSON.parse(req.body.existingImages);
        property.images = Array.isArray(existing) ? existing : property.images;
      } catch (e) {
        console.error("Failed to parse existingImages:", e);
      }

      // any image the user removed in the edit form gets deleted from cloudinary too
      const removedImages = oldImages.filter((img) => !property.images.includes(img));
      for (const imgUrl of removedImages) {
        await deleteFromCloudinary(imgUrl);
      }
    }

    if (req.files && req.files.length > 0) {
      let newImages = [];
      for (let file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "properties");
        newImages.push(result.secure_url);
      }
      property.images = [...property.images, ...newImages];
    }

    await property.save();

    res.json({
      success: true,
      message: "Property updated",
      property,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//delete a property

export const deleteProperty = async(req,res)=>{
    try{
        const property = await Property.findById(req.params.id);
        if(!property){
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        //check the ownership
        const isOwner = property.seller.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";

        if(!isOwner && !isAdmin){
            return res.status(403).json({
                success: false,
                message: "Not Authorized"
            });
        }

        //delete image from cloudinary

        for (let imageUrl of property.images){
            await deleteFromCloudinary(imageUrl);
        }

        await property.deleteOne();
        await Wishlist.deleteMany({ property: property._id });
        await Inquiry.deleteMany({ property: property._id });
        await SiteVisit.deleteMany({ property: property._id });

        res.json({
            success: true,
            message: "Property deleted successfully"
        });
    }
    catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

//update property status

export const updatePropertyStatus = async (req,res)=>{
    try{
       
        const property = await Property.findById(req.params.id);
        if(!property){
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        //check the ownership
        const isOwner = property.seller.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";

        if(!isOwner && !isAdmin){
            return res.status(403).json({
                success: false,
                message: "Not Authorized"
            });
        }
        property.status = req.body.status;
        await property.save()
        res.json({
            success: true,
            message: "Property status updated successfully",
            property
        });


    }

    catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}


// GET ALL PROPERTIES
export const getAllProperties = async (req, res) => {
  try {
    const {
      city,
      area,
      pincode,
      propertyType,
      bhk,
      furnishing,
      status,
      minPrice,
      maxPrice,
      amenities,
      sort,
      seller,
    } = req.query;

    let query = {
      status: "sale",
      isVerified: true,
    };

    if (seller) query.seller = seller;
    if (city) query.city = new RegExp(city, "i");
    if (area) query.area = new RegExp(area, "i");
    if (pincode) query.pincode = pincode;

    if (propertyType) {
      query.propertyType = { $in: propertyType.toLowerCase().split(",") };
    }
   if (bhk) {
      if (bhk === "5+") {
        query.$expr = {
          $gte: [
            { $toInt: { $cond: [{ $in: ["$bhk", [null, ""]] }, "0", "$bhk"] } },
            5,
          ],
        };
      } else {
        query.bhk = bhk;
      }
    }
    if (furnishing) {
      const furnishingArray = furnishing.split(",");
      query.furnishing = {
        $in: furnishingArray.map((f) => new RegExp(`^${f.trim()}$`, "i")),
      };
    }
    if (status) query.status = status;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice && !isNaN(minPrice)) query.price.$gte = Number(minPrice);
      if (maxPrice && !isNaN(maxPrice)) query.price.$lte = Number(maxPrice);
      if (Object.keys(query.price).length === 0) delete query.price;
    }

    if (amenities) {
      query.amenities = {
        $in: amenities.split(",").map((a) => a.trim()),
      };
    }

    let sortOption = { createdAt: -1 };
    if (sort === "priceLow") sortOption = { price: 1 };
    if (sort === "priceHigh") sortOption = { price: -1 };
    if (sort === "latest") sortOption = { createdAt: -1 };

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 12);
    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      Property.find(query)
        .populate("seller", "name phone profilePic")
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Property.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: properties.length,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      properties,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching properties",
      error: error.message,
    });
  }
};


// to get property  details
export const getPropertyDetails = async (req,res)=>{
    try{
        const property = await Property.findById(req.params.id).populate(
            "seller",
            "name email phone profilePic isApproved role"
        )
        if(!property){
            return res.status(404).json({
                success:false,
                message:"Property not found"
            });
        }
        //unique view tracking by id
        let visitorId = req.ip;
        const authHeader = req.headers.authorization;
        if(authHeader && authHeader.startsWith("Bearer")){
            try{
                const token = authHeader.split(" ")[1];
                const decoded = jwt.verify(token,process.env.JWT_SECRET);
                visitorId = decoded.id;
            }
            catch (error){
                //ignore

            }
        }

        const isSellerChecking = property.seller && visitorId === property.seller._id.toString();
        //only increament the view if not seller but if he edit then increase the view
        if(!isSellerChecking && !property.viewedBy.includes(visitorId)){
            property.views +=1;
            property.viewedBy.push(visitorId);
            await property.save();
        }

        const similarProperties = await Property.find({
            _id:{$ne: property._id},
            city: property.city,
            propertyType: property.propertyType,
            status:property.status
        })

        .limit(4)
        .select("title price images city area propertyType bhk areaSize status");
        res.json({
            success: true,
            property,
            similarProperties

        });

    }




    catch(error){
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
}

//seller dashboard

export const getSellerDashboard = async (req,res)=>{
    try{
        const sellerId  = req.user._id;
        const totalProperties = await Property.countDocuments({seller: sellerId});
        const activeListings = await Property.countDocuments({
            seller:sellerId,
            status: "sale"
        });

        const soldProperties = await Property.countDocuments({
            seller:sellerId,
            status:"sold"
        });

        const totalInquiries = await Inquiry.countDocuments({
            seller:sellerId
        });

        // calculate total views for all properties
        const viewsData = await Property.aggregate([
            {$match: {seller:sellerId}},
            {$group:{_id: null, totalViews: {$sum: "$views"}}},
        ]);
        const totalViews = viewsData.length>0? viewsData[0].totalViews:0;
        res.json({
            success: true,
            status:{
                totalProperties,
                activeListings,
                soldProperties,
                totalInquiries,
                totalViews
            }
        });


    }

    catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
}

//get properties count by type

export const getPropertyCounts =  async (req, res)=>{
    try{
        //GET PROPERTY COUNTS BY TYPE
    const counts = await Property.aggregate([
      { $match: { status: "sale" } },
      { $group: { _id: "$propertyType", count: { $sum: 1 } } }
    ]);

    const formattedCounts = counts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}); 
    res.json({
        success: true,
        counts: formattedCounts
    });

    }
    catch(error){
        res.status(500).json({
            sucess: false,
            message: "Internal server error while fetching counts",
            error:error.message,
        });

    }
}