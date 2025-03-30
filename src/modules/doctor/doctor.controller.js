const Doctor = require("../../models/Doctor"); // Model Layer
const Appointment = require("../../models/Appointment"); // Model Layer
const Patient = require("../../models/Patient"); // Model Layer
const Clinic = require("../../models/Clinic"); // Model Layer
const AsyncHandler = require("../../utils/AsyncHandler");
const { StatusCodes } = require("http-status-codes");

// Get doctor profile
const getProfile = AsyncHandler(async (req, res) => {
  // Doctor is already available in req.doctor
  res.json({ success: true, data: req.doctor });
});

const getDoctorById = AsyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const doctor = await Doctor.findById(doctorId).populate("userId");
  res.json({ success: true, data: doctor });
});

// Update doctor profile
const updateProfile = AsyncHandler(async (req, res) => {
  // Extract fields from the request body
  const {
    specialization,
    status,
    age,
    biography,
    dateOfBirth,
    gender,
    education,
    phone,
    experience,
    certification,
  } = req.body;

  // Create update object with valid fields
  const updateData = {};

  if (phone) updateData.phone = phone;
  if (age) updateData.age = age;
  if (status) updateData.status = status;
  if (biography) updateData.biography = biography;
  if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
  if (gender) updateData.gender = gender;
  if (specialization) updateData.specialization = specialization;

  // Handle education array
  if (education && Array.isArray(education)) {
    updateData.education = education;
  }

  // Handle experience array
  if (experience && Array.isArray(experience)) {
    updateData.experience = experience;
  } else if (typeof experience === "number") {
    updateData.experience = experience;
  }

  // Handle certification array
  if (certification && Array.isArray(certification)) {
    updateData.certification = certification;
  }

  // Update the doctor using req.doctor._id
  const updatedDoctor = await Doctor.findByIdAndUpdate(
    req.doctor._id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedDoctor) {
    return res.status(404).json({
      success: false,
      message: "Failed to update doctor profile",
    });
  }

  res.json({
    success: true,
    data: updatedDoctor,
  });
});

// List patients associated with doctor
const listPatients = AsyncHandler(async (req, res) => {
  try {
    const patients = await Patient.find({});
    res.json({ success: true, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// List appointments of the doctor with patient information
const listAppointments = AsyncHandler(async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user.id })
      .populate({
        path: "patientId",
        select: "userId medicalHistory allergies emergencyContact",
        populate: {
          path: "userId",
          select: "_id name email phone",
        },
      })
      .sort({ appointmentDate: -1 });

    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a specific appointment
const getAppointment = AsyncHandler(async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment)
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update an appointment
const updateAppointment = AsyncHandler(async (req, res) => {
  try {
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, data: updatedAppointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// List clinics associated with doctor
const listClinics = AsyncHandler(async (req, res) => {
  try {
    const clinics = await Clinic.find({ doctorId: req.user.id })
      .select(
        "name address contactNumber workingHours specialties services status"
      )
      .sort({ createdAt: -1 });

    res.json({ success: true, data: clinics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get doctor's schedule with appointment counts for all appointments
const getSchedule = AsyncHandler(async (req, res) => {
  // Get the current doctor from req.doctor (set by doctorAuth middleware)
  const doctorId = req.doctor._id;

  // Find the clinic where this doctor is assigned
  const clinic = await Clinic.findOne({
    "doctors.id": doctorId,
  });

  if (!clinic) {
    return res.status(StatusCodes.OK).json({
      success: false,
      data: { schedule: [] },
    });
  }

  // Extract doctor's schedule from clinic
  const doctorEntry = clinic.doctors.find(
    (doc) => doc.id.toString() === doctorId.toString()
  );

  if (
    !doctorEntry ||
    !doctorEntry.schedule ||
    doctorEntry.schedule.length === 0
  ) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: "No schedule found for this doctor",
    });
  }

  // Get counts of all appointments for this doctor grouped by day of week
  const appointmentCounts = await Appointment.aggregate([
    // Match appointments for this doctor
    { $match: { doctorId: doctorId } },
    // Extract day of week from scheduledAt (1=Sunday, 2=Monday, etc.)
    {
      $addFields: {
        dayNum: { $dayOfWeek: "$scheduledAt" },
      },
    },
    // Group by day number and count
    {
      $group: {
        _id: "$dayNum",
        count: { $sum: 1 },
      },
    },
  ]);

  // Create a mapping from day number to day name
  const dayMapping = {
    1: "sunday",
    2: "monday",
    3: "tuesday",
    4: "wednesday",
    5: "thursday",
    6: "friday",
    7: "saturday",
  };

  // Convert the aggregation results to a map for easy lookup by day name
  const appointmentCountByDay = appointmentCounts.reduce((acc, item) => {
    const dayName = dayMapping[item._id];
    acc[dayName] = item.count;
    return acc;
  }, {});

  // Map schedule items with appointment counts
  const scheduleWithAppointments = doctorEntry.schedule.map((scheduleItem) => {
    const dayName = scheduleItem.day.toLowerCase();
    return {
      _id: scheduleItem._id || `${scheduleItem.day}-${scheduleItem.startTime}`,
      day: scheduleItem.day,
      startTime: scheduleItem.startTime,
      endTime: scheduleItem.endTime,
      numberOfAppointments: appointmentCountByDay[dayName] || 0,
    };
  });

  res
    .json({
      success: true,
      data: { schedule: scheduleWithAppointments },
    })
    .status(StatusCodes.OK);
});

module.exports = {
  getProfile,
  getDoctorById,
  updateProfile,
  listPatients,
  listAppointments,
  getAppointment,
  updateAppointment,
  listClinics,
  getSchedule,
};
