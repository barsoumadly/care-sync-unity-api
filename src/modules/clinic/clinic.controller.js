const Clinic = require("../../models/Clinic");
const Doctor = require("../../models/Doctor");
const { StatusCodes } = require("http-status-codes");
const ApiError = require("../../utils/ApiError");
const AsyncHandler = require("../../utils/AsyncHandler");
const ApiFeatures = require("../../utils/ApiFeatures");
const { deleteFile } = require("../../modules/shared/services/file.service");
const userService = require("../user/user.service");
const clinicService = require("./clinic.service");
const User = require("../../models/User");
const { generatePassword } = require("../../utils/Password");
const { sendTemplateEmail } = require("../../utils/email");
const emailTemplates = require("../../templates/email");
const authService = require("../auth/auth.service");

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
  const clinic = await Clinic.findById(req.params.id);
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
      // Find photos to delete and verify they belong to the clinic
      const photosToDelete = clinic.photos.filter((photo) =>
        publicIdsToDelete.includes(photo.public_id)
      );

      // Delete verified photos from cloudinary
      for (const photo of photosToDelete) {
        await deleteFile(photo.public_id);
      }

      // Update photos array by removing deleted ones
      updatedPhotos = updatedPhotos.filter(
        (photo) => !publicIdsToDelete.includes(photo.public_id)
      );
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
  const { name, email, phone, specialization, schedule, price, ...doctorData } =
    req.body;

  // Check if email is already taken
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(
      "Email address is already registered",
      StatusCodes.BAD_REQUEST
    );
  }

  // Generate a secure random password
  const generatedPassword = generatePassword();

  // Create user with doctor role
  const newUser = await userService.createUser({
    name,
    email,
    password: generatedPassword,
    role: "DOCTOR",
  });

  try {
    // Create doctor profile
    const doctor = await Doctor.create({
      userId: newUser._id,
      clinicId: req.clinic._id,
      phone,
      specialization,
      ...doctorData,
    });

    // Add doctorId to clinic's doctors array
    await Clinic.findByIdAndUpdate(req.clinic._id, {
      $push: { doctors: { id: doctor._id, schedule, price } },
    });

    // Send registration email with credentials
    await sendTemplateEmail(email, emailTemplates.doctorRegistration, {
      name,
      email,
      password: generatedPassword,
    });

    // Send verification email
    await authService.sendEmailVerification(newUser._id);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message:
        "Doctor account created successfully. Login credentials sent via email.",
    });
  } catch (error) {
    // If something fails after user creation, clean up the created user
    await User.findByIdAndDelete(newUser._id);
    throw error;
  }
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

      // Create a new doctor object without the userId field
      const { userId, ...doctorWithoutUser } = doctor.toObject();

      return {
        user: userId,
        doctor: doctorWithoutUser,
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

const getDoctorsWithAppointments = AsyncHandler(async (req, res) => {
  const clinic = req.clinic;

  const clinicDoctors = clinic.doctors || [];
  const doctorIds = clinicDoctors.map(({ id }) => id);

  // Get doctors with their appointments in a single aggregation pipeline
  const doctorsWithCounts = await Doctor.aggregate([
    {
      $match: { _id: { $in: doctorIds } },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $lookup: {
        from: "appointments",
        let: { doctorId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$doctorId", "$$doctorId"] },
              status: { $nin: ["declined", "cancelled"] },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
            },
          },
        ],
        as: "appointmentStats",
      },
    },
    {
      $addFields: {
        appointmentCount: {
          $cond: {
            if: { $gt: [{ $size: "$appointmentStats" }, 0] },
            then: { $arrayElemAt: ["$appointmentStats.count", 0] },
            else: 0,
          },
        },
      },
    },
    {
      $project: {
        doctorId: "$_id",
        name: { $arrayElemAt: ["$user.name", 0] },
        profilePhoto: { $arrayElemAt: ["$user.profilePhoto", 0] },
        specialization: 1,
        appointmentCount: 1,
        _id: 0,
      },
    },
  ]);

  // Add schedule information from clinic.doctors
  const doctorsWithSchedules = doctorsWithCounts.map((doctor) => {
    const doctorInClinic = clinicDoctors.find(
      (d) => d.id.toString() === doctor.doctorId.toString()
    );
    return {
      ...doctor,
      workingDays: doctorInClinic?.schedule || [],
      price: doctorInClinic?.price || 0,
    };
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: doctorsWithSchedules,
  });
});

const bookAppointment = AsyncHandler(async (req, res) => {
  const { name, email, doctorId, scheduleId } = req.body;
  const clinic = req.clinic;

  // Validate doctor availability
  const { doctor, nextAvailableDate } =
    await clinicService.validateDoctorAvailability(
      clinic,
      doctorId,
      scheduleId
    );

  // Handle patient creation or retrieval
  const patient = await clinicService.handlePatientCreation(
    name,
    email,
    clinic,
    req.user._id
  );

  // Create the appointment
  const appointment = await clinicService.createAppointment(
    doctorId,
    patient._id,
    clinic._id,
    nextAvailableDate,
    doctor
  );

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Appointment booked successfully",
    data: appointment,
  });
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
  getDoctorsWithAppointments,
  bookAppointment,
};
