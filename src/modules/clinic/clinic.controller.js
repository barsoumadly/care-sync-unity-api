const Clinic = require("../../models/Clinic");
const { StatusCodes } = require("http-status-codes");
const ApiError = require("../../utils/ApiError");
const AsyncHandler = require("../../utils/AsyncHandler");
const ApiFeatures = require("../../utils/ApiFeatures");
const { deleteFile } = require("../../modules/shared/services/file.service");

const getClinics = AsyncHandler(async (req, res) => {
  const features = new ApiFeatures(Clinic.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const clinics = await features.query;
  res.status(StatusCodes.OK).json({ success: true, data: clinics });
});

const getClinicById = AsyncHandler(async (req, res) => {
  const clinic = await Clinic.findById(req.params.clinicId);
  if (!clinic) {
    throw new ApiError("Clinic not found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({ success: true, data: clinic });
});

const updateClinic = AsyncHandler(async (req, res) => {
  const clinic = await Clinic.findById(req.clinic._id);
  let updatedPhotos = clinic.photos || [];
  // Handle photo deletions if URLs are provided
  if (req.body.photosToDelete) {
    let publicIdsToDelete = [];

    // Handle both string and array inputs
    if (typeof req.body.photosToDelete === "string") {
      publicIdsToDelete = req.body.photosToDelete
        .split(",")
        .map((id) => id.trim());
    } else if (Array.isArray(req.body.photosToDelete)) {
      publicIdsToDelete = req.body.photosToDelete.map((id) => id.trim());
    }

    if (publicIdsToDelete.length > 0) {
      console.log("Photos to delete:", publicIdsToDelete);
      console.log("Current clinic photos:", clinic.photos);

      // Find photos to delete and verify they belong to the clinic
      const photosToDelete = clinic.photos.filter((photo) =>
        publicIdsToDelete.includes(photo.public_id)
      );

      console.log("Verified photos to delete:", photosToDelete);

      // Delete verified photos from cloudinary
      for (const photo of photosToDelete) {
        await deleteFile(photo.public_id);
      }

      // Update photos array by removing deleted ones
      updatedPhotos = updatedPhotos.filter(
        (photo) => !publicIdsToDelete.includes(photo.public_id)
      );

      console.log("Updated photos array:", updatedPhotos);
    }
  }

  // Handle new photo uploads if files are present
  if (req.files && req.files.length > 0) {
    const newPhotos = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));

    // Append new photos to existing ones
    updatedPhotos = [...updatedPhotos, ...newPhotos];
  }

  // Prepare update data
  const { photosToDelete, address, ...updateData } = req.body;

  // Handle partial address updates while preserving existing values
  const currentAddress = clinic.address || {};
  const updatedAddress = address
    ? {
        street:
          address.street !== undefined ? address.street : currentAddress.street,
        city: address.city !== undefined ? address.city : currentAddress.city,
        state:
          address.state !== undefined ? address.state : currentAddress.state,
      }
    : currentAddress;

  // Update clinic with all changes
  const updatedClinic = await Clinic.findByIdAndUpdate(
    req.clinic._id,
    {
      ...updateData,
      address: updatedAddress,
      photos: updatedPhotos,
    },
    { new: true, runValidators: true }
  );
  res.status(StatusCodes.OK).json({ success: true, data: updatedClinic });
});

const getClinicAppointments = AsyncHandler(async (req, res) => {
  const appointments = await Appointment.find({
    clinicId: req.clinic._id,
  }).populate("doctorId patientId");
  res.status(StatusCodes.OK).json({ success: true, data: appointments });
});

const getOwnClinic = AsyncHandler(async (req, res) => {
  res.status(StatusCodes.OK).json({ success: true, data: req.clinic });
});

const addDoctor = AsyncHandler(async (req, res) => {
  const { doctorId } = req.body;

  if (!doctorId) {
    throw new ApiError("Doctor ID is required", StatusCodes.BAD_REQUEST);
  }

  // Check if doctor exists
  const doctor = await req.db.User.findById(doctorId);
  if (!doctor) {
    throw new ApiError("Doctor not found", StatusCodes.NOT_FOUND);
  }

  // Check if doctor is already added to the clinic
  const clinic = await Clinic.findById(req.clinic._id);
  if (clinic.doctors.includes(doctorId)) {
    throw new ApiError("Doctor already added to clinic", StatusCodes.BAD_REQUEST);
  }

  // Add doctor to clinic
  const updatedClinic = await Clinic.findByIdAndUpdate(
    req.clinic._id,
    {
      $push: { doctors: doctorId }
    },
    { new: true, runValidators: true }
  ).populate('doctors');

  res.status(StatusCodes.OK).json({ success: true, data: updatedClinic });
});

module.exports = {
  getClinics,
  getClinicById,
  updateClinic,
  getClinicAppointments,
  getOwnClinic,
  addDoctor,
};
