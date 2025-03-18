const Clinic = require("../../models/Clinic");
const Doctor = require("../../models/Doctor");
const { StatusCodes } = require("http-status-codes");
const ApiError = require("../../utils/ApiError");
const AsyncHandler = require("../../utils/AsyncHandler");
const ApiFeatures = require("../../utils/ApiFeatures");
const { deleteFile } = require("../../modules/shared/services/file.service");
const userService = require("../user/user.service");
const authService = require("../auth/auth.service");
const User = require("../../models/User");

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

const createDoctor = AsyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    specialization,
    schedule,
    ...doctorData
  } = req.body;

  // Create user with doctor role
  const newUser = userService
    .createUser({
      name,
      email,
      password,
      role: "DOCTOR",
    })
    .then(async (user) => {
      // Create doctor profile
      const doctor = await Doctor.create({
        userId: user._id,
        clinicId: req.clinic._id,
        phone,
        specialization,
        ...doctorData,
      });

      // Add doctorId to clinic's doctors array
      await Clinic.findByIdAndUpdate(req.clinic._id, {
        $push: { doctors: { id: doctor._id, schedule } },
      });

      // Send verification email
      await authService.sendEmailVerification(user._id);
    });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Doctor account created successfully.",
  });
});

const getOwnDoctors = AsyncHandler(async (req, res) => {
  const clinicDoctors = req.clinic.doctors || [];

  // Get all doctor IDs from clinic's doctors array
  const doctorIds = clinicDoctors.map(({ id }) => id);

  // Fetch all doctors in a single query
  const doctors = await Doctor.find({
    _id: { $in: doctorIds },
  }).populate("userId");

  // Create a map for easy lookup
  const doctorMap = {};
  doctors.forEach((doctor) => {
    doctorMap[doctor._id.toString()] = doctor;
  });

  // Create the final array with the same structure as before
  const doctorsWithDetails = clinicDoctors
    .map(({ id, schedule }) => {
      const doctor = doctorMap[id.toString()];
      if (!doctor) return null;

      return {
        user: doctor.userId,
        doctor: {
          _id: doctor._id,
          specialization: doctor.specialization,
          phone: doctor.phone,
          clinicId: doctor.clinicId,
        },
        schedule,
      };
    })
    .filter(Boolean); // Remove any null entries

  res.status(StatusCodes.OK).json({ success: true, data: doctorsWithDetails });
});

const updateDoctor = AsyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const {
    name,
    email,
    phone,
    specialization,
    password,
    schedule,
    ...otherDoctorFields
  } = req.body;

  const doctor = await Doctor.findById(doctorId).populate("userId");

  if (!doctor) {
    throw new ApiError("Doctor not found", StatusCodes.NOT_FOUND);
  }

  // Verify doctor belongs to this clinic
  if (doctor.clinicId.toString() !== req.clinic._id.toString()) {
    throw new ApiError(
      "Unauthorized to modify this doctor",
      StatusCodes.FORBIDDEN
    );
  }

  // Update user fields if provided
  if (name || email) {
    await User.findByIdAndUpdate(doctor.userId._id, {
      name: name || doctor.userId.name,
      email: email || doctor.userId.email,
    });
  }

  // Update password if provided
  if (password) {
    await userService.resetUserPassword(doctor.userId, password);
  }

  // Update profile photo if provided
  if (req.file) {
    await userService.updateProfilePhoto(doctor.userId._id, req.file);
  }

  // Update schedule in clinic's doctors array if provided
  if (schedule) {
    await Clinic.updateOne(
      {
        _id: doctor.clinicId,
        "doctors.id": doctor.userId._id,
      },
      {
        $set: { "doctors.$.schedule": schedule },
      }
    );
  }

  // Update doctor fields
  const updatedDoctor = await Doctor.findByIdAndUpdate(
    doctorId,
    {
      phone: phone || doctor.phone,
      specialization: specialization || doctor.specialization,
      ...otherDoctorFields,
    },
    { new: true, runValidators: true }
  ).populate("userId");

  res.status(StatusCodes.OK).json({ success: true, data: updatedDoctor });
});

const removeDoctor = AsyncHandler(async (req, res) => {
  const { doctorId } = req.params;

  const doctorExists = req.clinic.doctors.some((doctor) =>
    doctor.id.equals(doctorId)
  );
  if (doctorExists) {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new ApiError("Doctor not found", StatusCodes.NOT_FOUND);
    }

    // Remove clinicId from doctor document
    await Doctor.findByIdAndUpdate(doctorId, {
      $unset: { clinicId: "" },
    });

    // Remove doctor from clinic's doctors array
    await Clinic.findByIdAndUpdate(req.clinic._id, {
      $pull: { doctors: { id: doctor._id } },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Doctor removed from clinic successfully",
    });
  }
  throw new ApiError("Doctor not found in clinic", StatusCodes.NOT_FOUND);
});

module.exports = {
  getClinics,
  getClinicById,
  updateClinic,
  getClinicAppointments,
  getOwnClinic,
  createDoctor,
  getOwnDoctors,
  updateDoctor,
  removeDoctor,
};
