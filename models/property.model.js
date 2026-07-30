import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({

    
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    propertyType: {
      type: String,
      enum: [
        "flat",
        "apartment",
        "villa",
        "house",
        "studio",
        "penthouse",
        "office",
        "townhouse",
        "plot",
        "commercial",
      ],
      required: true,
    },
    bhk: {
      type: String,
    },
    bathrooms: {
      type: Number,
    },
    areaSize: {
      type: Number,
    },
    furnishing: {
      type: String,
      enum: ["furnished", "semi-furnished", "unfurnished"],
    },
    amenities: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["sale", "sold"],
      default: "sale",
    },
    images: [{ type: String }],
    youtubeUrl: {
      type: String,
    },
    developerName: {
      type: String,
    },
    possessionStatus: {
      type: String,
      enum: ["new-launch", "under-construction", "ready-to-move"],
    },
    possessionPercent: {
      type: Number,
      min: 0,
      max: 100,
    },
    blocks: {
      type: String,
    },
    totalUnits: {
      type: Number,
    },
    possessionYear: {
      type: String,
    },
    reraId: {
      type: String,
    },
    locationImage: {
      type: String,
    },
    locationDetails: {
      type: String,
    },
    investmentAnalysis: {
      type: String,
    },
    whyConsider: {
      type: String,
    },
    strengths: {
      type: String,
    },
    considerations: {
      type: String,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
 viewedBy: [{ type: String }],

},
{ timestamps: true }
)

const Property = mongoose.model("Property", propertySchema);
export default Property;