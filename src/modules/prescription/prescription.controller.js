const Prescription = require("../../models/Prescription");

const createPrescription = async (req, res) => {
  try {
    const prescription = new Prescription(req.body);
    await prescription.save();
    res.status(201).json(prescription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getPrescriptionsByPatientId = async (req, res) => {
  try {
    const patientId = req.user._id;
    const prescriptions = await Prescription.find({ patientId: patientId });
    if (!prescriptions || prescriptions.length === 0) {
      return res
        .status(404)
        .json({ message: "No prescriptions found for this patient" });
    }
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPrescription,
  getPrescriptionsByPatientId,
};
