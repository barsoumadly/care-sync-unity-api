# API Features Guide

## Overview

The `ApiFeatures` class is a utility that helps implement common API functionalities like filtering, sorting, field limiting, and pagination in your MongoDB queries. It provides a clean and chainable interface to build complex queries based on request parameters.

## Features

### 1. Filtering
- Allows filtering records based on query parameters
- Supports MongoDB operators (gt, gte, lt, lte)
- Automatically excludes pagination parameters

Example URL:
```
/api/v1/users?role=admin&age[gte]=25&status=active
```

### 2. Sorting
- Sort results by any field(s)
- Support for multiple sort criteria using comma separation
- Default sort by '-createdAt' (newest first)

Example URL:
```
/api/v1/users?sort=age,-createdAt
```

### 3. Field Limiting
- Select specific fields to include in the response
- Exclude unnecessary data to reduce payload size
- Default exclusion of '__v' field

Example URL:
```
/api/v1/users?fields=name,email,age
```

### 4. Pagination
- Page-based pagination
- Configurable page size
- Default: page=1, limit=10

Example URL:
```
/api/v1/users?page=2&limit=20
```

## Implementation Guide

### 1. Controller Implementation

```javascript
const AsyncHandler = require("../utils/AsyncHandler");
const ApiFeatures = require("../utils/ApiFeatures");
const User = require("../models/User");

const getAllUsers = AsyncHandler(async (req, res) => {
  // Initialize ApiFeatures with the base query and request query
  const features = new ApiFeatures(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // Execute the query
  const users = await features.query;

  res.status(200).json({
    status: "success",
    results: users.length,
    data: { users }
  });
});
```

### 2. Route Implementation

```javascript
const express = require("express");
const router = express.Router();
const { getAllUsers } = require("../controllers/user.controller");

router.get("/", getAllUsers);

module.exports = router;
```

## Usage Examples

### Basic Filtering
```
GET /api/v1/users?role=admin
GET /api/v1/users?status=active&verified=true
```

### Advanced Filtering
```
GET /api/v1/users?age[gte]=25&rating[lt]=5
GET /api/v1/users?price[gte]=100&price[lte]=200
```

### Sorting
```
GET /api/v1/users?sort=age            // Ascending by age
GET /api/v1/users?sort=-age           // Descending by age
GET /api/v1/users?sort=role,-createdAt // Sort by role (asc) then createdAt (desc)
```

### Field Selection
```
GET /api/v1/users?fields=name,email,age  // Only return specified fields
GET /api/v1/users?fields=-password,-__v  // Exclude specified fields
```

### Pagination
```
GET /api/v1/users?page=2&limit=10    // Get second page, 10 items per page
```

### Combining Features
```
GET /api/v1/users?role=admin&sort=-createdAt&fields=name,email&page=1&limit=20
```

## Best Practices

1. **Error Handling**: Always wrap your controller methods with AsyncHandler for proper error handling.

2. **Security**: Be mindful of which fields you allow to be queried and sorted by.

3. **Performance**: 
   - Use field limiting to reduce response payload size
   - Set reasonable limits for pagination
   - Consider indexing frequently filtered fields

4. **Documentation**: Document available query parameters for your API endpoints.

## Example Complete Implementation

```javascript
// users.controller.js
const AsyncHandler = require("../utils/AsyncHandler");
const ApiFeatures = require("../utils/ApiFeatures");
const User = require("../models/User");

exports.getAllUsers = AsyncHandler(async (req, res) => {
  // Create a base query
  const usersQuery = User.find();

  // Apply API features
  const features = new ApiFeatures(usersQuery, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // Execute query
  const users = await features.query;

  // Send response
  res.status(200).json({
    status: "success",
    results: users.length,
    data: { users }
  });
});

// Additional controller methods...
```

This implementation allows for flexible and powerful API queries while maintaining clean and maintainable code.