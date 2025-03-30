const Doctor = require("../../models/Doctor"); // Model Layer
const Appointment = require("../../models/Appointment"); // Model Layer
const Patient = require("../../models/Patient"); // Model Layer
const Clinic = require("../../models/Clinic"); // Model Layer
const AsyncHandler = require("../../utils/AsyncHandler");

// Get doctor profile
const getProfile = AsyncHandler(async (req, res) => {
  // Doctor is already available in req.doctor
  res.json({ success: true, data: req.doctor });
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

module.exports = {
  getProfile,
  updateProfile,
  listPatients,
  listAppointments,
  getAppointment,
  updateAppointment,
  listClinics,
};
