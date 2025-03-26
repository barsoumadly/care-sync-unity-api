const User = require("../../models/User");
const Patient = require("../../models/Patient");
const Doctor = require("../../models/Doctor");
const Appointment = require("../../models/Appointment");
const { StatusCodes } = require("http-status-codes");
const ApiError = require("../../utils/ApiError");
const { generatePassword } = require("../../utils/Password");
const userService = require("../user/user.service");
const authService = require("../auth/auth.service");
const { sendTemplateEmail } = require("../../utils/email");
const emailTemplates = require("../../templates/email");

const validateDoctorAvailability = async (clinic, doctorId, scheduleId) => {
  const doctors = clinic.doctors || [];
  const doctor = doctors.find((doctor) => doctor.id.equals(doctorId));

  if (!doctor) {
    throw new ApiError(
      "Doctor not found in this clinic",
      StatusCodes.NOT_FOUND
    );
  }

  const doctorSchedule = doctor.schedule || [];
  const selectedSchedule = doctorSchedule.find((schedule) =>
    schedule._id.equals(scheduleId)
  );

  if (!selectedSchedule) {
    throw new ApiError(
      "Invalid schedule ID for this doctor",
      StatusCodes.BAD_REQUEST
    );
  }

  // Find the next available date for the given schedule
  const today = new Date();
  const dayOfWeek = selectedSchedule.day;
  const weekDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const targetDayIndex = weekDays.indexOf(dayOfWeek);

  if (targetDayIndex === -1) {
    throw new ApiError(
      "Invalid day in schedule",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }

  // Calculate days until next occurrence of the scheduled day
  let daysUntilTarget = targetDayIndex - today.getDay();
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7; // Move to next week if target day has passed this week
  }

  const nextAvailableDate = new Date();
  nextAvailableDate.setDate(today.getDate() + daysUntilTarget);
  nextAvailableDate.setHours(0, 0, 0, 0);

  return { doctor, nextAvailableDate };
};

const handlePatientCreation = async (name, email, clinic, userId) => {
  let patient;

  if (email) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      if (existingUser.role !== "PATIENT") {
        throw new ApiError(
          "Email already registered with another role",
          StatusCodes.BAD_REQUEST
        );
      }

      patient = await Patient.findOne({ userId: existingUser._id });
      if (!patient) {
        throw new ApiError("Patient not found", StatusCodes.NOT_FOUND);
      }
    } else {
      // Create new user and patient
      const password = generatePassword();
      const newUser = await userService.createUser({
        name,
        email,
        password,
        role: "PATIENT",
      });

      patient = await Patient.create({
        userId: newUser._id,
        clinicId: clinic._id,
      });

      await authService.sendEmailVerification(newUser._id);
      await sendTemplateEmail(email, emailTemplates.patientRegistration, {
        name,
        email,
        password,
      });
    }
  } else {
    // Use logged-in user's ID for guest account
    patient = await Patient.findOneAndUpdate(
      { userId },
      { clinicId: clinic._id },
      { new: true, upsert: true }
    );
  }

  return patient;
};

const handleDoctorCreation = async (doctorData, clinic) => {
  const { name, email, specialization, ...otherData } = doctorData;

  if (!email) {
    throw new ApiError(
      "Email is required for doctor registration",
      StatusCodes.BAD_REQUEST
    );
  }

  let doctor;
  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    if (existingUser.role !== "DOCTOR") {
      throw new ApiError(
        "Email already registered with another role",
        StatusCodes.BAD_REQUEST
      );
    }

    doctor = await Doctor.findOne({ userId: existingUser._id });
    if (!doctor) {
      throw new ApiError("Doctor not found", StatusCodes.NOT_FOUND);
    }
  } else {
    // Create new user and doctor
    const password = generatePassword();
    const newUser = await userService.createUser({
      name,
      email,
      password,
      role: "DOCTOR",
    });

    doctor = await Doctor.create({
      userId: newUser._id,
      clinicId: clinic._id,
      specialization,
      ...otherData,
    });

    await authService.sendEmailVerification(newUser._id);
    // Using patient registration template - may need a doctor-specific template
    await sendTemplateEmail(email, emailTemplates.patientRegistration, {
      name,
      email,
      password,
      role: "Doctor",
    });
  }

  return doctor;
};

const createAppointment = async (
  doctorId,
  patientId,
  clinicId,
  date,
  doctor
) => {
  const specialization = await Doctor.findById(doctor.id).select(
    "specialization"
  );

  return await Appointment.create({
    doctorId,
    patientId,
    clinicId,
    scheduledAt: new Date(date),
    specialization: specialization.specialization,
    price: Number(doctor.price || 0),
    time: doctor.time,
    type: "consultation",
  });
};

const getDoctorWithAppointments = async (doctorId, clinic) => {
  // Check if doctor belongs to the clinic
  const doctorInClinic = clinic.doctors.find(
    (doctor) => doctor.id.toString() === doctorId.toString()
  );

  if (!doctorInClinic) {
    throw new ApiError(
      "Doctor not found in this clinic",
      StatusCodes.NOT_FOUND
    );
  }

  // Fetch doctor with user details
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new ApiError("Doctor not found", StatusCodes.NOT_FOUND);
  }

  // Get user information
  const user = await User.findById(doctor.userId).select(
    "name email profilePhoto"
  );
  if (!user) {
    throw new ApiError("User information not found", StatusCodes.NOT_FOUND);
  }

  // Get appointments for this doctor
  const appointments = await Appointment.find({ doctorId })
    .populate({
      path: "patientId",
      populate: {
        path: "userId",
        select: "name email profilePhoto",
      },
    })
    .sort({ scheduledAt: -1 });

  return {
    user,
    doctor: {
      _id: doctor._id,
      specialization: doctor.specialization,
      experience: doctor.experience,
      biography: doctor.biography,
      education: doctor.education,
      certification: doctor.certification,
      status: doctor.status,
      clinicId: doctor.clinicId,
      gender: doctor.gender,
      phone: doctor.phone,
    },
    schedule: doctorInClinic.schedule,
    price: doctorInClinic.price,
    appointments,
  };
};

const updateAppointment = async (appointmentId, clinic, updateData) => {
  // Find appointment and verify ownership
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    clinicId: clinic._id,
  });

  if (!appointment) {
    throw new ApiError(
      "Appointment not found or does not belong to this clinic",
      StatusCodes.NOT_FOUND
    );
  }

  // Initialize update object
  const updates = {};

  // If updating doctor, scheduleId must also be provided
  if (updateData.doctorId && !updateData.scheduleId) {
    throw new ApiError(
      "When changing the doctor, you must also provide a new scheduleId",
      StatusCodes.BAD_REQUEST
    );
  }

  // If updating doctor
  if (updateData.doctorId) {
    // Verify doctor belongs to this clinic
    const doctorInClinic = clinic.doctors.find(
      (doctor) => doctor.id.toString() === updateData.doctorId.toString()
    );

    if (!doctorInClinic) {
      throw new ApiError(
        "The specified doctor does not belong to this clinic",
        StatusCodes.BAD_REQUEST
      );
    }

    // Get new doctor details
    const newDoctor = await Doctor.findById(updateData.doctorId).select(
      "specialization"
    );
    if (!newDoctor) {
      throw new ApiError("Doctor not found", StatusCodes.NOT_FOUND);
    }

    updates.doctorId = updateData.doctorId;
    updates.specialization = newDoctor.specialization;
    updates.price = doctorInClinic.price || 0;
  }

  // If updating scheduleId
  if (updateData.scheduleId) {
    const doctorId = updateData.doctorId || appointment.doctorId.toString();

    // Get doctor from clinic
    const doctorInClinic = clinic.doctors.find(
      (doctor) => doctor.id.toString() === doctorId.toString()
    );

    if (!doctorInClinic) {
      throw new ApiError(
        "Doctor not found in this clinic",
        StatusCodes.BAD_REQUEST
      );
    }

    // Verify scheduleId exists for this doctor
    const validSchedule = doctorInClinic.schedule.find(
      (schedule) => schedule._id.toString() === updateData.scheduleId.toString()
    );

    if (!validSchedule) {
      throw new ApiError(
        "Invalid schedule ID for this doctor",
        StatusCodes.BAD_REQUEST
      );
    }

    // Calculate new appointment date based on schedule day (use same approach as validateDoctorAvailability)
    const today = new Date();
    const dayOfWeek = validSchedule.day;

    // Match case format with the model definition (first letter uppercase, rest lowercase)
    const capitalizedDay =
      dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1).toLowerCase();

    const weekDays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const targetDayIndex = weekDays.indexOf(capitalizedDay);

    if (targetDayIndex === -1) {
      throw new ApiError(
        `Invalid day in schedule: ${dayOfWeek}`,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    // Calculate days until next occurrence of the scheduled day
    let daysUntilTarget = targetDayIndex - today.getDay();
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Move to next week if target day has passed this week
    }

    const nextAvailableDate = new Date();
    nextAvailableDate.setDate(today.getDate() + daysUntilTarget);

    try {
      // Set time from the schedule if available, otherwise default to beginning of the day
      if (
        validSchedule.startTime &&
        typeof validSchedule.startTime === "string"
      ) {
        const [hours, minutes] = validSchedule.startTime.split(":").map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          nextAvailableDate.setHours(hours, minutes, 0, 0);
        } else {
          nextAvailableDate.setHours(0, 0, 0, 0);
        }
      } else {
        nextAvailableDate.setHours(0, 0, 0, 0);
      }

      // Set the time field as well if we have startTime
      if (validSchedule.startTime) {
        updates.time = validSchedule.startTime;
      }
    } catch (error) {
      // If there's any error in parsing time, default to beginning of the day
      nextAvailableDate.setHours(0, 0, 0, 0);
      console.error("Error setting time:", error);
    }

    updates.scheduledAt = nextAvailableDate;
  }

  // Update appointment if there are changes
  if (Object.keys(updates).length > 0) {
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { $set: updates },
      { new: true }
    ).populate({
      path: "patientId doctorId",
      populate: {
        path: "userId",
        select: "name email profilePhoto",
      },
    });

    return updatedAppointment;
  }

  // Return original appointment if no updates
  return appointment;
};

module.exports = {
  validateDoctorAvailability,
  handlePatientCreation,
  handleDoctorCreation,
  createAppointment,
  getDoctorWithAppointments,
  updateAppointment,
};
