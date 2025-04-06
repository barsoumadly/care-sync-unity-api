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
  if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
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

  // Find all clinics where this doctor is assigned
  const clinics = await Clinic.find({
    "doctors.id": doctorId,
  }).populate("adminId", "profilePhoto");

  if (!clinics || clinics.length === 0) {
    return res.status(StatusCodes.OK).json({
      success: true,
      data: { clinics: [] },
    });
  }

  // Get counts of all appointments for this doctor grouped by clinic and day
  const appointmentCounts = await Appointment.aggregate([
    // Match appointments for this doctor
    { $match: { doctorId: doctorId } },
    // Extract day of week from scheduledAt (1=Sunday, 2=Monday, etc.)
    {
      $addFields: {
        dayNum: { $dayOfWeek: "$scheduledAt" },
      },
    },
    // Group by clinic ID and day number and count
    {
      $group: {
        _id: {
          clinicId: "$clinicId",
          dayNum: "$dayNum",
        },
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

  // Create a lookup map for appointment counts by clinic and day
  const appointmentCountMap = {};
  appointmentCounts.forEach((item) => {
    const { clinicId, dayNum } = item._id;
    const dayName = dayMapping[dayNum];

    if (!appointmentCountMap[clinicId]) {
      appointmentCountMap[clinicId] = {};
    }

    appointmentCountMap[clinicId][dayName] = item.count;
  });

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

  // Process each clinic to build the response
  const clinicsWithSchedules = clinics.map((clinic) => {
    const clinicId = clinic._id.toString();

    // Get doctor entry for this clinic
    const doctorEntry = clinic.doctors.find(
      (doc) => doc.id.toString() === doctorId.toString()
    );

    // Get total appointment count for this clinic
    let totalAppointments = 0;
    if (appointmentCountMap[clinicId]) {
      Object.values(appointmentCountMap[clinicId]).forEach((count) => {
        totalAppointments += count;
      });
    }

    // If no schedule exists, return clinic with empty schedule
    if (
      !doctorEntry ||
      !doctorEntry.schedule ||
      doctorEntry.schedule.length === 0
    ) {
      return {
        numberOfAppointments: totalAppointments,
        clinicName: clinic.name,
        clinicAddress: clinic.address || {},
        profilePhoto: clinic.adminId?.profilePhoto?.url || null,
        clinicId: clinic._id,
        schedule: [],
      };
    }

    // Format schedule items for this clinic
    const schedule = doctorEntry.schedule.map((scheduleItem) => {
      const dayName = scheduleItem.day.toLowerCase();
      const dayNumber = dayToNumber[dayName];

      // Calculate the date for this day of the week
      let daysToAdd = dayNumber - currentDayOfWeek;
      if (daysToAdd < 0) {
        daysToAdd += 7; // If the day has already passed this week, get next week's date
      }

      const dateForDay = new Date();
      dateForDay.setDate(today.getDate() + daysToAdd);
      const formattedDate = dateForDay.toISOString().split("T")[0];

      // Capitalize first letter of day name for return value
      const displayDay =
        scheduleItem.day.charAt(0).toUpperCase() +
        scheduleItem.day.slice(1).toLowerCase();

      return {
        _id:
          scheduleItem._id ||
          `${scheduleItem.day}-${scheduleItem.startTime}-${clinic._id}`,
        day: displayDay,
        startTime: scheduleItem.startTime,
        endTime: scheduleItem.endTime,
        date: formattedDate,
      };
    });

    // Return formatted clinic object with schedule
    return {
      numberOfAppointments: totalAppointments,
      clinicName: clinic.name,
      clinicAddress: clinic.address || {},
      profilePhoto: clinic.adminId?.profilePhoto?.url || null,
      clinicId: clinic._id,
      schedule,
    };
  });

  // Filter out clinics with no schedules if needed
  const filteredClinics = clinicsWithSchedules.filter(
    (clinic) => clinic.schedule.length > 0
  );

  // Return the final formatted response
  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      clinics: filteredClinics,
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
      // select: "userId gender dateOfBirth age",
      // populate: {
      //   path: "userId",
      //   select: "name",
      // },
    })
    .sort({ scheduledAt: -1 });

  // Transform the appointments to include only needed patient data
  const formattedAppointments = await Promise.all(
    appointments.map(async (appointment) => {
      const [patient] = await Patient.find({
        userId: appointment.patientId._id,
      }).populate({
        path: "userId",
        select: "_id name profilePhoto",
      });

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
        guestName: appointment.guestName || "Unknown",
      };
    })
  );

  // const formatAppointments = await formattedAppointments;
  // console.log(formatAppointments);

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
