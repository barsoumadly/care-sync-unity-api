# Care Sync Unity API Architecture Plan - Phase 1

## Core Database Models

### User Model (Enhancement)
```javascript
{
  name: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  phone: { type: String, index: true },
  role: { type: String, enum: ['admin', 'doctor', 'patient'], required: true, index: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
}
```

### Clinic Model (New)
```javascript
{
  name: { type: String, required: true, index: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String },
    zipCode: { type: String }
  },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  adminId: { type: ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
}
```

### Doctor Model (Enhancement)
```javascript
{
  userId: { type: ObjectId, ref: 'User', required: true, unique: true, index: true },
  clinicId: { type: ObjectId, ref: 'Clinic', required: true, index: true },
  specialization: { type: String, required: true, index: true },
  licenseNumber: { type: String, required: true, unique: true },
  experience: { type: Number },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
}
```

### Patient Model (Enhancement)
```javascript
{
  userId: { type: ObjectId, ref: 'User', required: true, unique: true, index: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  bloodGroup: { type: String },
  medicalHistory: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
}
```

### Appointment Model (New)
```javascript
{
  doctorId: { type: ObjectId, ref: 'Doctor', required: true, index: true },
  patientId: { type: ObjectId, ref: 'Patient', required: true, index: true },
  clinicId: { type: ObjectId, ref: 'Clinic', required: true, index: true },
  scheduledAt: { type: Date, required: true, index: true },
  duration: { type: Number, required: true, default: 30 }, // in minutes
  type: { type: String, enum: ['consultation', 'follow-up', 'emergency'], required: true },
  status: { type: String, enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'], default: 'scheduled' },
  reasonForVisit: { type: String, required: true },
  notes: { type: String },
  cancellationReason: { type: String },
  cancelledBy: { type: ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // Compound indexes for efficient querying
  indexes: [
    { doctorId: 1, scheduledAt: 1 },    // Find doctor's appointments for a time period
    { patientId: 1, scheduledAt: 1 },   // Find patient's appointments for a time period
    { clinicId: 1, scheduledAt: 1 }     // Find clinic's appointments for a time period
  ]
}
```

## Phase 1 API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login
- POST /api/auth/verify-email - Verify email
- POST /api/auth/forgot-password - Request reset
- POST /api/auth/reset-password - Reset password

### Clinic Endpoints
#### Public
- GET /api/clinics - List clinics
- GET /api/clinics/:id - Get clinic
- GET /api/clinics/search - Search clinics

#### Admin Only
- POST /api/clinics - Create clinic
- PUT /api/clinics/:id - Update clinic
- GET /api/clinics/:id/doctors - List clinic's doctors
- POST /api/clinics/:id/doctors - Add doctor
- GET /api/clinics/:id/patients - List clinic's patients

### Doctor Endpoints
#### Doctor Only
- GET /api/doctors/profile - Get profile
- PUT /api/doctors/profile - Update profile
- GET /api/doctors/patients - List patients
- GET /api/doctors/appointments - List appointments
- GET /api/doctors/appointments/:id - Get appointment
- PUT /api/doctors/appointments/:id - Update appointment

#### Admin Only
- GET /api/doctors - List doctors
- GET /api/doctors/:id - Get doctor
- PUT /api/doctors/:id - Update doctor
- DELETE /api/doctors/:id - Deactivate doctor

### Patient Endpoints
#### Patient Only
- GET /api/patients/profile - Get profile
- PUT /api/patients/profile - Update profile
- GET /api/patients/doctors - List treating doctors
- GET /api/patients/appointments - List appointments
- POST /api/patients/appointments - Book appointment
- GET /api/patients/appointments/:id - Get appointment
- PUT /api/patients/appointments/:id - Update/cancel appointment

#### Doctor/Admin Only
- GET /api/patients - List patients
- GET /api/patients/:id - Get patient
- PUT /api/patients/:id - Update patient

### Appointment Endpoints
#### Public
- GET /api/appointments/available-slots - Get available slots for a doctor

#### Admin Only
- GET /api/appointments - List all appointments
- POST /api/appointments - Create appointment
- GET /api/appointments/:id - Get appointment
- PUT /api/appointments/:id - Update appointment
- DELETE /api/appointments/:id - Cancel appointment
- GET /api/appointments/stats - Get appointment statistics

## Query Parameters
All list endpoints support:
- pagination (page, limit)
- sorting (sortBy, order)
- filtering (by model fields)
- search (term for relevant fields)

## Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalResults": 48
  }
}
```

## Implementation Steps
1. Update existing models
2. Create Appointment model
3. Implement route files
4. Create controller placeholders
5. Set up authentication middleware
6. Add validation schemas
7. Implement error handling
