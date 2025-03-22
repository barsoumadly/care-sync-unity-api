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

const validateDoctorAvailability = async (clinic, doctorId, date) => {
  const doctors = clinic.doctors || [];
  const doctor = doctors.find((doctor) => doctor.id.equals(doctorId));

  if (!doctor) {
    throw new ApiError("Doctor not found in this clinic", StatusCodes.NOT_FOUND);
  }

  const doctorSchedule = doctor.schedule || [];
  const appointmentDate = new Date(date);
  const dayName = appointmentDate.toLocaleString("en-US", { weekday: "long" });
  
  const isAvailable = doctorSchedule.some(
    (schedule) => schedule.day === dayName
  );

  if (!isAvailable) {
    throw new ApiError(
      "Doctor is not available on this date",
      StatusCodes.BAD_REQUEST
    );
  }

  return { doctor, doctorSchedule };
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