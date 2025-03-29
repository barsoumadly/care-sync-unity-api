const Prescription = require("../../models/Prescription");
const Patient = require("../../models/Patient");

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
    const userId = req.user._id;
    const [patientId] = await Patient.find({ userId: userId });

    const prescriptions = await Prescription.find({ patientId: patientId._id });
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

const updatePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }
    res.json(prescription);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPrescription,
  getPrescriptionsByPatientId,
  updatePrescription,
};
