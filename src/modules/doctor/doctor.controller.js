const Doctor = require('../../models/Doctor'); // Model Layer
const Appointment = require('../models/Appointment'); // Model Layer
const Patient = require('../models/Patient'); // Model Layer

// Get doctor profile
const getProfile =AsyncHandler( async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id }).populate('userId', 'name email ');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update doctor profile
const updateProfile =AsyncHandler( async (req, res) => {
  try {
    const updatedDoctor = await Doctor.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true }
    );
    res.json({ success: true, data: updatedDoctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// List patients associated with doctor
const listPatients =AsyncHandler( async (req, res) => {
  try {
    const patients = await Patient.find({});
    res.json({ success: true, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// List appointments of the doctor
const listAppointments =AsyncHandler( async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user.id });
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a specific appointment
const getAppointment =AsyncHandler( async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update an appointment
const updateAppointment =AsyncHandler( async (req, res) => {
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

module.exports = {getProfile,updateProfile,listPatients,listAppointments,getAppointment,updateAppointment}