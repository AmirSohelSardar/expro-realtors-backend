import cloudinary from "../config/cloudinary.js";
import streamifier from 'streamifier';

export const uploadToCloudinary = (buffer, folder= "general")=>{
    return new Promise((resolve, reject)=>{
        const stream = cloudinary.uploader.upload_stream(
            {folder},
            (error, result)=>{
                if(result) resolve(result);
                else reject(error);
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

export const deleteFromCloudinary = async (imageUrl, folder = "properties") => {
    try {
        const publicId = imageUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(folder + "/" + publicId);
    } catch (err) {
        console.error("Failed to delete cloudinary image:", err.message);
    }
};