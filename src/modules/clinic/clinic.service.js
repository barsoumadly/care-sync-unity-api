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
    throw new ApiError("Doctor not found in this clinic", StatusCodes.NOT_FOUND);
  }

  const doctorSchedule = doctor.schedule || [];
  const selectedSchedule = doctorSchedule.find(schedule => schedule._id.equals(scheduleId));

  if (!selectedSchedule) {
    throw new ApiError(
      "Invalid schedule ID for this doctor",
      StatusCodes.BAD_REQUEST
    );
  }

  // Find the next available date for the given schedule
  const today = new Date();
  const dayOfWeek = selectedSchedule.day;
  const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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

const createAppointment = async (doctorId, patientId, clinicId, date, doctor) => {
  const specialization = await Doctor.findById(doctor.id).select("specialization");
  
  return await Appointment.create({
    doctorId,
    patientId,
    clinicId,
    scheduledAt: new Date(date),
    specialization: specialization.specialization,
    price: Number(doctor.price),
    time: doctor.time,
    type: "consultation",
  });
};

module.exports = {
  validateDoctorAvailability,
  handlePatientCreation,
  createAppointment,
};
