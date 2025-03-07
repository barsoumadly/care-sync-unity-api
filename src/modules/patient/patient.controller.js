const Patient = require("../../models/Patient");
const Doctor = require("../../models/Doctor");
const Appointment = require("../../models/Appointment");
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
  const doctors = await Doctor.find().populate("userId", "name email");
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
    reasonForVisit,
    paymentType,
    scheduledAt,
    specialization,
    price,
    time,
  } = req.body;
  const checkAppointment = await Appointment.findOne({
    patientId: req.user._id,
    doctorId,
    clinicId,
    scheduledAt,
  });
  if (checkAppointment) {
    throw new ApiError("Appointment already exists", StatusCodes.BAD_REQUEST);
  }
  const appointment = await Appointment.create({
    doctorId,
    patientId: req.user._id,
    clinicId,
    scheduledAt,
    paymentType,
    reasonForVisit,
  });

  res.status(StatusCodes.CREATED).json({ success: true, data: appointment });
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

module.exports = {
  getPatientProfile,
  updatePatientProfile,
  listDoctors,
  listAppointments,
  bookAppointment,
  getAppointmentDetails,
  rescheduleOrCancelAppointment,
};
