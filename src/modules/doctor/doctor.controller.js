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
  console.log("Doctor ID:", req.doctor._id); // Debugging line

  const appointments = await Appointment.find({ doctorId: req.doctor._id })
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

  // Find all clinics where this doctor is assigned (changed from findOne to find)
  const clinics = await Clinic.find({
    "doctors.id": doctorId,
  }).populate("adminId", "profilePhoto");

  if (!clinics || clinics.length === 0) {
    return res.status(StatusCodes.OK).json({
      success: false,
      data: { schedule: [] },
    });
  }

  // Collect all schedules from all clinics where this doctor works
  let allScheduleItems = [];

  clinics.forEach((clinic) => {
    const doctorEntry = clinic.doctors.find(
      (doc) => doc.id.toString() === doctorId.toString()
    );

    if (
      doctorEntry &&
      doctorEntry.schedule &&
      doctorEntry.schedule.length > 0
    ) {
      // Add each schedule item with its associated clinic information
      const clinicSchedules = doctorEntry.schedule.map((scheduleItem) => ({
        scheduleItem,
        clinic,
      }));

      allScheduleItems = [...allScheduleItems, ...clinicSchedules];
    }
  });

  if (allScheduleItems.length === 0) {
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

  // Get the current date to calculate dates for each day of the week
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.

  // Create a mapping from day name to day number (0-6)
  const dayToNumber = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  // Map schedule items with appointment counts and dates
  const scheduleWithAppointments = allScheduleItems.map(
    ({ scheduleItem, clinic }) => {
      const dayName = scheduleItem.day.toLowerCase();
      const dayNumber = dayToNumber[dayName];

      // Calculate the date for this day of the week
      let daysToAdd = dayNumber - currentDayOfWeek;
      if (daysToAdd < 0) {
        daysToAdd += 7; // If the day has already passed this week, get next week's date
      }

      const dateForDay = new Date();
      dateForDay.setDate(today.getDate() + daysToAdd);

      // Format date as ISO string (or any other format you prefer)
      const formattedDate = dateForDay.toISOString().split("T")[0];

      return {
        _id:
          scheduleItem._id ||
          `${scheduleItem.day}-${scheduleItem.startTime}-${clinic._id}`,
        day: scheduleItem.day,
        startTime: scheduleItem.startTime,
        endTime: scheduleItem.endTime,
        numberOfAppointments: appointmentCountByDay[dayName] || 0,
        date: formattedDate,
        clinicName: clinic.name,
        clinicAddress: clinic.address || {},
        profilePhoto: clinic.adminId?.profilePhoto?.url || null,
        clinicId: clinic._id, // Add clinic ID to identify which clinic this schedule belongs to
      };
    }
  );

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      schedule: scheduleWithAppointments,
    },
  });
});

// Get clinics where the doctor works
const getMyClinicDetails = AsyncHandler(async (req, res) => {
  // Get the current doctor's ID from req.doctor (set by doctorAuth middleware)
  const doctorId = req.doctor._id;

  // Find clinics where this doctor is included in the doctors array
  // Optimized query: populate adminId and select only necessary fields in one query
  const clinics = await Clinic.find({
    "doctors.id": doctorId,
  })
    .select(
      "name slug address phone foundedYear biography rating status doctors"
    )
    .populate({
      path: "adminId",
      select: "profilePhoto",
    })
    .lean();

  if (!clinics || clinics.length === 0) {
    return res.status(StatusCodes.OK).json({
      success: true,
      data: [],
      message: "You are not associated with any clinics.",
    });
  }

  // For each clinic, extract the doctor's specific information
  const clinicsWithDoctorDetails = clinics.map((clinic) => {
    const doctorEntry = clinic.doctors.find(
      (doc) => doc.id.toString() === doctorId.toString()
    );

    return {
      _id: clinic._id,
      name: clinic.name,
      slug: clinic.slug,
      photos: clinic.photos,
      address: clinic.address,
      phone: clinic.phone,
      foundedYear: clinic.foundedYear,
      biography: clinic.biography,
      rating: clinic.rating,
      status: clinic.status,
      profilePhoto: clinic.adminId?.profilePhoto?.url || null,
      doctorDetails: {
        price: doctorEntry?.price,
        schedule: doctorEntry?.schedule || [],
      },
    };
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: clinicsWithDoctorDetails,
  });
});

// Get doctor appointments by clinic ID
const getAppointmentsByClinic = AsyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const doctorId = req.doctor._id;

  // Find appointments for this doctor at the specified clinic
  const appointments = await Appointment.find({
    doctorId: doctorId,
    clinicId: clinicId,
  })
    .populate({
      path: "patientId",
      select: "userId gender dateOfBirth age",
      populate: {
        path: "userId",
        select: "name",
      },
    })
    .sort({ scheduledAt: -1 });

  // Transform the appointments to include only needed patient data
  const formattedAppointments = appointments.map((appointment) => {
    const patient = appointment.patientId;

    // Calculate age if dateOfBirth is available
    let age = null;
    if (patient.dateOfBirth) {
      const birthDate = new Date(patient.dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      // Adjust age if birthday hasn't occurred yet this year
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
    }

    return {
      _id: appointment._id,
      patientId: patient._id,
      patientName: patient.userId?.name || "Unknown",
      patientGender: patient.gender || "Unknown",
      patientAge: age,
      scheduledAt: appointment.scheduledAt,
      status: appointment.status,
      type: appointment.type,
      specialization: appointment.specialization,
      reasonForVisit: appointment.reasonForVisit || "",
    };
  });

  res.status(StatusCodes.OK).json({
    success: true,
    count: formattedAppointments.length,
    data: formattedAppointments,
  });
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
  getMyClinicDetails,
  getAppointmentsByClinic,
};
