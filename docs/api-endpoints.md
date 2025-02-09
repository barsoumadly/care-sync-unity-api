# API Endpoints Documentation

## Table of Contents

- [Authentication](#authentication)
- [Appointments](#appointments)
- [Chat](#chat)
- [Users](#users)
- [Facilities](#facilities)

## Authentication

All endpoints except for authentication endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Auth Endpoints

#### Register User

```
POST /api/v1/auth/register
```

**Request Body:**

```json
{
  "email": "string",
  "password": "string",
  "role": "patient|doctor",
  "firstName": "string",
  "lastName": "string"
}
```

**Response (201):**

```json
{
  "message": "User created successfully. Please check your email for verification OTP."
}
```

#### Verify Email

```
POST /api/v1/auth/verify-email
```

**Request Body:**

```json
{
  "email": "string",
  "otp": "string"
}
```

**Response (200):**

```json
{
  "message": "Email verified successfully"
}
```

#### Request Email Verification OTP

```
POST /api/v1/auth/request-email-verification
```

**Request Body:**

```json
{
  "email": "string"
}
```

**Response (200):**

```json
{
  "message": "Email verification OTP has been sent to your email"
}
```

#### Login

```
POST /api/v1/auth/login
```

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "token": "string"
  }
}
```

## Appointments

### Create Appointment

```
POST /api/v1/appointments
```

**Request Body:**

```json
{
  "patient": "string (PatientId)",
  "doctor": "string (DoctorId)",
  "facility": "string (FacilityId)",
  "date": "string (ISO Date)",
  "notes": "string (optional)"
}
```

**Response (201):**

```json
{
  "status": "success",
  "data": {
    "id": "string",
    "patient": "string",
    "doctor": "string",
    "facility": "string",
    "date": "string",
    "status": "scheduled",
    "notes": "string",
    "createdAt": "string"
  }
}
```

### Get Appointment

```
GET /api/v1/appointments/:id
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "id": "string",
    "patient": {
      "id": "string",
      "firstName": "string",
      "lastName": "string"
    },
    "doctor": {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "specialization": "string"
    },
    "facility": {
      "id": "string",
      "name": "string",
      "address": "string"
    },
    "date": "string",
    "status": "string",
    "notes": "string",
    "createdAt": "string"
  }
}
```

### Update Appointment

```
PATCH /api/v1/appointments/:id
```

**Request Body:**

```json
{
  "status": "scheduled|completed|cancelled",
  "date": "string (ISO Date)",
  "notes": "string"
}
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "id": "string",
    "status": "string",
    "date": "string",
    "notes": "string",
    "updatedAt": "string"
  }
}
```

## Chat

### Create Chat

```
POST /api/v1/chats
```

**Request Body:**

```json
{
  "participants": ["string (UserId)"],
  "type": "individual|group"
}
```

**Response (201):**

```json
{
  "status": "success",
  "data": {
    "id": "string",
    "participants": [
      {
        "id": "string",
        "firstName": "string",
        "lastName": "string"
      }
    ],
    "type": "string",
    "createdAt": "string"
  }
}
```

### Send Message

```
POST /api/v1/chats/:chatId/messages
```

**Request Body:**

```json
{
  "content": "string",
  "type": "text|image|file"
}
```

**Response (201):**

```json
{
  "status": "success",
  "data": {
    "id": "string",
    "content": "string",
    "type": "string",
    "sender": {
      "id": "string",
      "firstName": "string",
      "lastName": "string"
    },
    "createdAt": "string"
  }
}
```

## Users

### Get User Profile

```
GET /api/v1/users/profile
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "string",
    "profileImage": "string (url)"
  }
}
```

### Update User Profile

```
PATCH /api/v1/users/profile
```

**Request Body:**

```json
{
  "firstName": "string",
  "lastName": "string",
  "profileImage": "string (base64)"
}
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "profileImage": "string (url)",
    "updatedAt": "string"
  }
}
```

## Facilities

### Create Facility

```
POST /api/v1/facilities
```

**Request Body:**

```json
{
  "name": "string",
  "address": "string",
  "contactNumber": "string",
  "specializations": ["string"]
}
```

**Response (201):**

```json
{
  "status": "success",
  "data": {
    "id": "string",
    "name": "string",
    "address": "string",
    "contactNumber": "string",
    "specializations": ["string"],
    "createdAt": "string"
  }
}
```

### Get Facilities

```
GET /api/v1/facilities
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `specialization` (optional): Filter by specialization
- `search` (optional): Search by name or address

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "facilities": [
      {
        "id": "string",
        "name": "string",
        "address": "string",
        "contactNumber": "string",
        "specializations": ["string"]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "totalItems": 50
    }
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": ["error message"]
    }
  }
}
```

### 401 Unauthorized

```json
{
  "status": "error",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### 403 Forbidden

```json
{
  "status": "error",
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

### 404 Not Found

```json
{
  "status": "error",
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### 500 Internal Server Error

```json
{
  "status": "error",
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Rate Limiting

API requests are limited to:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

**Rate Limit Exceeded Response (429):**

```json
{
  "status": "error",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retryAfter": 30
  }
}
```
