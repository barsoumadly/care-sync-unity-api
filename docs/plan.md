# Overview

Below is a review of the provided endpoints to ensure consistency with the existing codebase. No endpoints are removed. Some modules (e.g., `facility`) partially map to "providers," while others (like `ratings`, `prescriptions`, `notifications`, `medical-history`) may require new code.

---

## Existing Modules in Your Codebase

- **Appointment**: Already has `appointment.controller.js`, `appointment.route.js`, and `appointment.service.js`.
  - Maps to the Appointment & Scheduling endpoints.
- **Facility**: This currently handles clinics/hospitals, mapping to “providers” if you choose to unify or rename.
- **Doctor**: Matches the Doctor endpoints.
- **Chat**: Matches the real-time communication endpoints for chat.
- **Patient**: No direct mention of medical history or prescriptions here, so these might be added or referenced soon.
- **User**: Might be extended with admin capabilities.

---

## Endpoints (Unmodified)

### Appointment & Scheduling

- `POST /api/v1/appointments`
- `GET /api/v1/appointments`
- `GET /api/v1/appointments/:id`
- `PUT /api/v1/appointments/:id`
- `DELETE /api/v1/appointments/:id`

### Providers (Clinics, Hospitals, Pharmacies, Laboratories)

- `GET /api/v1/providers`
- `GET /api/v1/providers/:id`
- `POST /api/v1/providers` (Admin-only)
- `PUT /api/v1/providers/:id`
- `DELETE /api/v1/providers/:id`

### Doctor-Specific Endpoints

- `GET /api/v1/doctors`
- `GET /api/v1/doctors/:id`
- `POST /api/v1/doctors/:id/schedule` (Optional)

### Ratings & Feedback

- `POST /api/v1/ratings`
- `GET /api/v1/ratings`

### Prescriptions

- `POST /api/v1/prescriptions`
- `GET /api/v1/prescriptions`
- `PUT /api/v1/prescriptions/:id`

### Enrollment & Provider Administration

- `POST /api/v1/clinics/enroll`
  - Similar endpoints can be created for pharmacy and laboratory enrollment.

### Notifications & Real-Time Communication

- `GET /api/v1/notifications`
- `POST /api/v1/notifications`
- `PUT /api/v1/notifications/:id`
- `POST /api/v1/chat/messages`
- `GET /api/v1/chat/messages`

### Search Functionality (Doctors, Facilities)

- `GET /api/v1/search`

### Medical History

- `POST /api/v1/medical-history`
- `GET /api/v1/medical-history/:patientId`
- `PUT /api/v1/medical-history/:recordId`
- `DELETE /api/v1/medical-history/:recordId`

### Administrative Endpoints

- `GET /api/v1/admin/users`
- `PUT /api/v1/admin/users/:id`
- `DELETE /api/v1/admin/users/:id`

---

## Next Steps / Plan

1. **Map "Providers" to Existing Code**

   - Consider renaming or adding a dedicated `providers` module to align with the existing `facility` code.
   - Alternatively, continue using `facility` for providers (clinics, hospitals, etc.).

2. **Create Additional Modules (If Needed)**

   - **Ratings**: Implement rating storage, retrieval, and association with doctors/providers.
   - **Prescriptions**: Add a `prescription` module to handle creation, retrieval, and updates.
   - **Notifications**: Add a `notifications` module or integrate within `shared` to track read/unread status.
   - **Medical History**: Implement a `medicalHistory` module to handle creation, retrieval, updates, and optional deletions.
   - **Search**: Implement or extend your search logic to handle queries across doctors, agencies, etc.

3. **Integration Points**

   - **Service Layer**: E.g., in `patient.service.js`, auto-create a medical history record after patient registration (transaction or event-driven).
   - **Admin Endpoints**: Expand user management or replicate the pattern for providers/clinics if needed.

4. **File/Folder Setup**

   - **`src/modules/ratings`**
     - `ratings.controller.js`, `ratings.route.js`, `ratings.service.js`
   - **`src/modules/prescriptions`**
     - `prescriptions.controller.js`, `prescriptions.route.js`, `prescriptions.service.js`
   - **`src/modules/notifications`**
     - `notifications.controller.js`, `notifications.route.js`, `notifications.service.js`
   - **`src/modules/medicalHistory`**
     - `medicalHistory.controller.js`, `medicalHistory.route.js`, `medicalHistory.service.js`
   - **`src/modules/search`**
     - `search.controller.js`, `search.route.js`, `search.service.js` (if separate)

5. **Consistency & Naming**
   - Make sure consistent naming is used throughout controllers, routes, and services to avoid confusion.
   - Double-check any references to ensure they match the final chosen name (e.g., providers vs. facilities).

---
