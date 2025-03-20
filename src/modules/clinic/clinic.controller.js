const Clinic = require("../../models/Clinic");
const Doctor = require("../../models/Doctor");
const Appointment = require("../../models/Appointment");
const { StatusCodes } = require("http-status-codes");
const ApiError = require("../../utils/ApiError");
const AsyncHandler = require("../../utils/AsyncHandler");
const ApiFeatures = require("../../utils/ApiFeatures");
const { deleteFile } = require("../../modules/shared/services/file.service");
const userService = require("../user/user.service");
const authService = require("../auth/auth.service");
const User = require("../../models/User");
const Patient = require("../../models/Patient");
const { sendTemplateEmail } = require("../../utils/email");
const emailTemplates = require("../../templates/email");
const { generatePassword } = require("../../utils/Password");

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
  const { name, email, phone, specialization, schedule, ...doctorData } =
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
      $push: { doctors: { id: doctor._id, schedule } },
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
    };
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: doctorsWithSchedules,
  });
});

const bookAppointment = AsyncHandler(async (req, res) => {
  const { name, email, doctorId, date, startTime, endTime } = req.body;

  // Validate doctor exists and belongs to clinic
  const doctorInClinic = req.clinic.doctors.find(
    (doc) => doc.id.toString() === doctorId
  );
  if (!doctorInClinic) {
    throw new ApiError(
      "Doctor not found in this clinic",
      StatusCodes.NOT_FOUND
    );
  }

  // Get doctor's schedule for the selected day
  const appointmentDate = new Date(date);
  const dayOfWeek = appointmentDate
    .toLocaleString("en-US", { weekday: "long" })
    .toLowerCase();

  const doctorSchedule = doctorInClinic.schedule.find(
    (schedule) => schedule.day.toLowerCase() === dayOfWeek
  );

  if (!doctorSchedule) {
    throw new ApiError(
      `Doctor is not available on ${dayOfWeek}. Available days: ${doctorInClinic.schedule
        .map((s) => s.day)
        .join(", ")}`,
      StatusCodes.BAD_REQUEST
    );
  }

  // Convert all times to same-day timestamps for comparison
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  // Convert schedule times
  const [scheduleStartHour, scheduleStartMinute] = doctorSchedule.startTime.split(":");
  const [scheduleEndHour, scheduleEndMinute] = doctorSchedule.endTime.split(":");
  
  const scheduleStartTime = new Date(dayStart);
  scheduleStartTime.setHours(parseInt(scheduleStartHour), parseInt(scheduleStartMinute));
  
  const scheduleEndTime = new Date(dayStart);
  scheduleEndTime.setHours(parseInt(scheduleEndHour), parseInt(scheduleEndMinute));

  // Convert appointment times
  const [startHour, startMinute] = startTime.split(":");
  const [endHour, endMinute] = endTime.split(":");

  const appointmentStartTime = new Date(dayStart);
  appointmentStartTime.setHours(parseInt(startHour), parseInt(startMinute));

  const appointmentEndTime = new Date(dayStart);
  appointmentEndTime.setHours(parseInt(endHour), parseInt(endMinute));

  // Validate appointment time is within working hours
  if (
    appointmentStartTime < scheduleStartTime ||
    appointmentEndTime > scheduleEndTime
  ) {
    const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    throw new ApiError(
      `Appointment time must be between ${formatTime(scheduleStartTime)} and ${formatTime(scheduleEndTime)}`,
      StatusCodes.BAD_REQUEST
    );
  }

  // Check for existing appointments in the same time slot
  const existingAppointment = await Appointment.findOne({
    doctorId,
    status: { $nin: ["declined", "cancelled"] },
    $and: [
      // Same day appointments only
      {
        scheduledAt: {
          $gte: dayStart,
          $lt: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000), // next day
        },
      },
      {
        $or: [
          // New appointment starts during an existing appointment
          {
            $and: [
              { scheduledAt: { $lte: appointmentStartTime } },
              { endTime: { $gt: appointmentStartTime } },
            ],
          },
          // New appointment ends during an existing appointment
          {
            $and: [
              { scheduledAt: { $lt: appointmentEndTime } },
              { endTime: { $gte: appointmentEndTime } },
            ],
          },
          // New appointment encompasses an existing appointment
          {
            $and: [
              { scheduledAt: { $gte: appointmentStartTime } },
              { endTime: { $lte: appointmentEndTime } },
            ],
          },
        ],
      },
    ],
  });

  if (existingAppointment) {
    const existingStart = existingAppointment.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const existingEnd = existingAppointment.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    throw new ApiError(
      `Time slot ${existingStart} - ${existingEnd} is already booked`,
      StatusCodes.BAD_REQUEST
    );
  }

  // Check if user exists or create new one
  let user = await User.findOne({ email: email.toLowerCase() });
  let patient;

  if (!user) {
    // Generate password for new user
    const generatedPassword = generatePassword();

    // Create user with patient role
    user = await User.create({
      name,
      email: email.toLowerCase(),
      password: generatedPassword,
      role: "PATIENT",
    });

    try {
      // Create patient profile
      patient = await Patient.create({
        userId: user._id,
      });

      // Send registration email with credentials
      await sendTemplateEmail(email, emailTemplates.patientRegistration, {
        name,
        email,
        password: generatedPassword,
      });

      // Send verification email
      await authService.sendEmailVerification(user._id);
    } catch (error) {
      // Clean up created user if patient creation fails
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  } else {
    patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      patient = await Patient.create({
        userId: user._id,
      });
    }
  }

  // Get doctor's specialization
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new ApiError("Doctor not found", StatusCodes.NOT_FOUND);
  }

  // Set appointment start and end times using the actual date
  const scheduledAt = new Date(appointmentDate);
  scheduledAt.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

  const endTimeDate = new Date(appointmentDate);
  endTimeDate.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

  // Calculate duration in minutes
  const durationInMinutes = Math.round((endTimeDate - scheduledAt) / (1000 * 60));

  const appointment = await Appointment.create({
    doctorId,
    patientId: patient._id,
    clinicId: req.clinic._id,
    scheduledAt: scheduledAt,
    endTime: endTimeDate,
    specialization: doctor.specialization,
    price: req.body.price || 0,
    time: durationInMinutes,
    type: req.body.type || "consultation",
    status: "pending",
    reasonForVisit: req.body.reasonForVisit,
  });

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
