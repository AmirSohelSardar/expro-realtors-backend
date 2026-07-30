import cloudinary from './../config/cloudinary.js';

// Parses the FAQ list sent as a JSON string from the form, keeping only
// well-formed { question, answer } pairs. Returns undefined if none — keeps
// this field fully optional, matching every other optional property field.
function parseFaqsField(value) {
    if (!value) return undefined;
    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) return undefined;
        const clean = parsed.filter((f) => f?.question?.trim() && f?.answer?.trim());
        return clean.length > 0 ? clean : undefined;
    } catch (e) {
        return undefined;
    }
}
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
        // Pull the full public_id (including any folder path, skipping the
        // version segment like "v1234567890/") straight out of the URL,
        // instead of guessing it from the filename — this handles nested
        // folders and filenames with multiple dots correctly.
        const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+(?:\?.*)?$/);

        if (!match) {
            console.error("Could not parse Cloudinary public_id from URL:", imageUrl);
            return;
        }

        const publicId = match[1];
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result !== "ok" && result.result !== "not found") {
            console.error("Cloudinary delete did not succeed:", imageUrl, result);
        }
    } catch (err) {
        console.error("Failed to delete cloudinary image:", imageUrl, err.message);
    }
};