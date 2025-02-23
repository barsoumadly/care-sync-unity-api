# API Endpoints - Phase 1

## Authentication
- POST /api/auth/register - Register a new user (doctor/patient)
- POST /api/auth/login - Login user
- POST /api/auth/verify-email - Verify user's email
- POST /api/auth/forgot-password - Request password reset
- POST /api/auth/reset-password - Reset password

## Clinic Endpoints
### Public
- GET /api/clinics - List all active clinics
- GET /api/clinics/:id - Get clinic details
- GET /api/clinics/search - Search clinics by name, city, or specialization

### Admin Only
- POST /api/clinics - Create new clinic
- PUT /api/clinics/:id - Update clinic details
- GET /api/clinics/:id/doctors - List clinic's doctors
- POST /api/clinics/:id/doctors - Add doctor to clinic
- GET /api/clinics/:id/patients - List clinic's patients
- GET /api/clinics/:id/appointments - List clinic's appointments
- GET /api/clinics/:id/appointments/stats - Get appointment statistics

## Doctor Endpoints
### Doctor Only
- GET /api/doctors/profile - Get own profile
- PUT /api/doctors/profile - Update own profile
- GET /api/doctors/patients - List own patients
- GET /api/doctors/patients/:id - Get specific patient details
- GET /api/doctors/appointments - List own appointments
- GET /api/doctors/appointments/:id - Get appointment details
- PUT /api/doctors/appointments/:id - Update appointment (add notes, mark as completed)
- GET /api/doctors/availability - Get own availability slots

### Admin Only
- GET /api/doctors - List all doctors
- GET /api/doctors/:id - Get doctor details
- PUT /api/doctors/:id - Update doctor details
- DELETE /api/doctors/:id - Deactivate doctor

## Patient Endpoints
### Patient Only
- GET /api/patients/profile - Get own profile
- PUT /api/patients/profile - Update own profile
- GET /api/patients/doctors - List doctors treating the patient
- GET /api/patients/appointments - List own appointments
- POST /api/patients/appointments - Book new appointment
- GET /api/patients/appointments/:id - Get appointment details
- PUT /api/patients/appointments/:id - Reschedule/cancel appointment

### Doctor/Admin Only
- GET /api/patients - List patients
- GET /api/patients/:id - Get patient details
- PUT /api/patients/:id - Update patient details

## Appointment Endpoints
### Public
- GET /api/appointments/available-slots - Get available appointment slots for a doctor
  - Query params: doctorId, date (YYYY-MM-DD)

### Protected (requires authentication)
- POST /api/appointments - Create new appointment
- GET /api/appointments/:id - Get appointment details
- PUT /api/appointments/:id - Update appointment
- DELETE /api/appointments/:id - Cancel appointment

### Admin Only
- GET /api/appointments - List all appointments
- GET /api/appointments/stats - Get appointment statistics
  - Query params: clinicId, startDate, endDate
  - Returns: total appointments, completed, cancelled, no-shows per period

## Expected Query Parameters
- List endpoints support:
  - pagination (page, limit)
  - sorting (sortBy, order)
  - filtering (various fields based on the model)
  - search (search term for relevant fields)
  - date range (startDate, endDate) for appointment endpoints

## Response Format
```json
{
  "success": true,
  "data": {}, // Response data
  "message": "Success message",
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalResults": 48
  }
}
```

## Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

## Appointment Status Flow
1. scheduled -> confirmed (after patient confirms)
2. confirmed -> completed (after appointment is done)
3. scheduled/confirmed -> cancelled (if cancelled by either party)
4. confirmed -> no-show (if patient doesn't show up)

## Appointment Validation Rules
- Cannot book overlapping appointments for the same doctor
- Must be booked within doctor's available slots
- Cannot book past dates
- Cancellation allowed up to X hours before appointment (configurable)
- Rescheduling follows same rules as new booking
