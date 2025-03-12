const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const ApiError = require("../utils/ApiError");
const { StatusCodes } = require("http-status-codes");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "care-sync/profile-photos",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const clinicPhotosStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "care-sync/clinic-photos",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 1024, height: 1024, crop: "limit" }],
  },
});

const uploadClinicPhotos = multer({
  storage: clinicPhotosStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new ApiError("Only image files are allowed", StatusCodes.BAD_REQUEST), false);
    }
  },
});

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 2, // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new ApiError("Only image files are allowed", StatusCodes.BAD_REQUEST), false);
    }
  },
});

module.exports = {
  cloudinary,
  upload,
  uploadClinicPhotos
};
