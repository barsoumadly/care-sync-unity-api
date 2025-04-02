const Patient = require("../../models/Patient");
const Doctor = require("../../models/Doctor");
const Appointment = require("../../models/Appointment");
const Clinic = require("../../models/Clinic");
const { StatusCodes } = require("http-status-codes");
const ApiError = require("../../utils/ApiError");
const AsyncHandler = require("../../utils/AsyncHandler");

const getPatientProfile = AsyncHandler(async (req, res) => {
  let patient = await Patient.findOne({ userId: req.user._id }).populate(
    "userId",
    "name email"
  );
  if (!patient) {
    patient = await Patient.findOneAndUpdate(
      { userId: req.user._id },
      {},
      { new: true, runValidators: true, upsert: true }
    ).populate("userId", "name email");
  }
  if (!patient) {
    throw new ApiError("Patient profile not found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({ success: true, data: patient });
});

const updatePatientProfile = AsyncHandler(async (req, res) => {
  const patient = await Patient.findOneAndUpdate(
    { userId: req.user._id },
    req.body,
    { new: true, runValidators: true, upsert: true }
  ).populate("userId", "name email profilePhoto.url");
  if (!patient) {
    throw new ApiError("Patient profile not found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({ success: true, data: patient });
});

const listDoctors = AsyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const doctors = await Doctor.find({ clinicId }).populate(
    "userId",
    "name email profilePhoto.url"
  );
  res.status(StatusCodes.OK).json({ success: true, data: doctors });
});

const listAppointments = AsyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ patientId: req.user._id })
    .populate("doctorId", "name specialization")
    .populate("clinicId", "name location");
  res.status(StatusCodes.OK).json({ success: true, data: appointments });
});

const bookAppointment = AsyncHandler(async (req, res) => {
  const {
    doctorId,
    clinicId,
    scheduledAt,
    reasonForVisit,
    paymentType,
    price,
    type = "consultation",
  } = req.body;

  // Get the clinic to access its doctors array
  const clinic = await Clinic.findById(clinicId);
  if (!clinic) {
    throw new ApiError("Clinic not found", StatusCodes.NOT_FOUND);
  }

  // Find the doctor in the clinic
  const doctorInClinic = clinic.doctors.find(
    (doctor) => doctor.id.toString() === doctorId.toString()
  );

  if (!doctorInClinic) {
    throw new ApiError(
      "Doctor not found in this clinic",
      StatusCodes.NOT_FOUND
    );
  }

  // Find the schedule
  const selectedSchedule = doctorInClinic.schedule.find(
    (schedule) => schedule.day.toString() === scheduledAt.toString()
  );

  if (!selectedSchedule) {
    throw new ApiError(
      "Invalid schedule for this doctor",
      StatusCodes.BAD_REQUEST
    );
  }

  // Calculate the next available date based on schedule
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
    daysUntilTarget += 7; // Move to next week if target day has passed
  }

  const nextAvailableDate = new Date();
  nextAvailableDate.setDate(today.getDate() + daysUntilTarget);

  // Set the time if available in the schedule
  if (
    selectedSchedule.startTime &&
    typeof selectedSchedule.startTime === "string"
  ) {
    const [hours, minutes] = selectedSchedule.startTime.split(":").map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      nextAvailableDate.setHours(hours, minutes, 0, 0);
    } else {
      nextAvailableDate.setHours(0, 0, 0, 0);
    }
  } else {
    nextAvailableDate.setHours(0, 0, 0, 0);
  }

  // Check for existing appointments
  const checkAppointment = await Appointment.findOne({
    patientId: req.user._id,
    doctorId,
    clinicId,
    scheduledAt: nextAvailableDate,
  });

  if (checkAppointment) {
    throw new ApiError(
      "You already have an appointment scheduled at this time",
      StatusCodes.BAD_REQUEST
    );
  }

  // Get doctor's specialization
  const doctor = await Doctor.findById(doctorId).select("specialization");
  if (!doctor) {
    throw new ApiError("Doctor not found", StatusCodes.NOT_FOUND);
  }

  // Find or create patient
  let patient = await Patient.findOne({ userId: req.user._id });
  if (!patient) {
    patient = await Patient.create({ userId: req.user._id, clinicId });
  }

  // Create the appointment with all required fields
  const appointment = await Appointment.create({
    doctorId,
    patientId: patient.userId,
    clinicId,
    scheduledAt: nextAvailableDate,
    specialization: doctor.specialization,
    price: price || Number(doctorInClinic.price || 0),
    type,
    paymentType: paymentType || "cash",
    reasonForVisit,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Appointment booked successfully",
    data: appointment,
  });
});

const getAppointmentDetails = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const appointment = await Appointment.findById(id)
    .populate("doctorId", "name specialization")
    .populate("clinicId", "name location");

  if (!appointment) {
    throw new ApiError("Appointment not found", StatusCodes.NOT_FOUND);
  }

  if (appointment.patientId.toString() !== req.user._id.toString()) {
    throw new ApiError("Unauthorized access", StatusCodes.FORBIDDEN);
  }

  res.status(StatusCodes.OK).json({ success: true, data: appointment });
});

const rescheduleOrCancelAppointment = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { scheduledAt, status, cancellationReason } = req.body;

  const appointment = await Appointment.findById(id);

  if (!appointment) {
    throw new ApiError("Appointment not found", StatusCodes.NOT_FOUND);
  }

  if (appointment.patientId.toString() !== req.user._id.toString()) {
    throw new ApiError("Unauthorized access", StatusCodes.FORBIDDEN);
  }

  if (status === "cancelled") {
    appointment.status = "cancelled";
    appointment.cancellationReason = cancellationReason;
    appointment.cancelledBy = req.user._id;
  } else if (scheduledAt) {
    appointment.scheduledAt = scheduledAt;
    appointment.status = "scheduled";
  } else {
    throw new ApiError("Invalid update request", StatusCodes.BAD_REQUEST);
  }

  await appointment.save();

  res.status(StatusCodes.OK).json({ success: true, data: appointment });
});

const getPatientById = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const patient = await Patient.findById(id).populate({
    path: "userId",
    select: "name email profilePhoto",
  });
  res.status(StatusCodes.OK).json({ success: true, data: patient });
});

module.exports = {
  getPatientProfile,
  updatePatientProfile,
  listDoctors,
  listAppointments,
  bookAppointment,
  getAppointmentDetails,
  rescheduleOrCancelAppointment,
  getPatientById,
};
