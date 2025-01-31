const { cloudinary } = require("../config/cloudinary");
const ApiError = require("../utils/ApiError");
const { StatusCodes } = require("http-status-codes");

/**
 * Delete a file from cloudinary
 * @param {string} public_id - The public_id of the file to delete
 * @returns {Promise<void>}
 */
const deleteFile = async (public_id) => {
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    throw new ApiError(
      "Error deleting file from cloud storage",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

module.exports = {
  deleteFile,
};
