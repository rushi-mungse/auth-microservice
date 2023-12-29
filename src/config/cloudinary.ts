import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import fs from "fs";

import {
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    CLOUDINARY_CLOUD_NAME,
    logger,
} from "./";
import createHttpError from "http-errors";

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (
    localFilePath: string,
): Promise<UploadApiResponse> => {
    try {
        const cloudinaryResponse = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type: "auto",
            },
        );
        await fs.promises.unlink(localFilePath);
        return cloudinaryResponse;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        logger.error(error);
        throw createHttpError(500, "Internal Server Error!");
    }
};

export default uploadOnCloudinary;
