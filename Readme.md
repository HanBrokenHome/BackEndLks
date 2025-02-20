# Voting API Documentation

## Base URL
```
http://localhost:5000
```

## Authentication
- **Admin Token**: Required for all `/admin` routes
- **User Token**: Required for voting

---

## 1. Admin Authentication

### Register Admin
**Endpoint:**
```
POST /admin/register
```
**Body:**
```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "message": "Admin registered successfully"
}
```

### Admin Login
**Endpoint:**
```
POST /admin/login
```
**Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "token": "your_jwt_token"
}
```

---

## 2. User Authentication

### Register User
**Endpoint:**
```
POST /register
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "age": 25
}
```
**Response:**
```json
{
  "message": "User registered successfully"
}
```

### User Login
**Endpoint:**
```
POST /login
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "token": "your_jwt_token",
  "role": "user"
}
```

---

## 3. Candidates Management (Admin)

### Create Candidate
**Endpoint:**
```
POST /admin/candidates
```
**Headers:**
```
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "name": "Candidate Name",
  "photo": "image_url",
  "type": "presiden", // Options: presiden, wapres, dpr, dpd
  "city": "City Name" // Required for DPR & DPD
}
```
**Response:**
```json
{
  "message": "Kandidat berhasil ditambahkan!",
  "candidate": { "id": "123", "name": "Candidate Name" }
}
```

### Get All Candidates
**Endpoint:**
```
GET /admin/candidates
```
**Headers:**
```
Authorization: Bearer <admin_token>
```
**Response:**
```json
[
  {
    "_id": "123",
    "name": "Candidate Name",
    "photo": "image_url",
    "type": "presiden",
    "voteCount": 0
  }
]
```

### Update Candidate
**Endpoint:**
```
PUT /admin/candidates/:id
```
**Headers:**
```
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "name": "Updated Name"
}
```
**Response:**
```json
{
  "_id": "123",
  "name": "Updated Name"
}
```

### Delete Candidate
**Endpoint:**
```
DELETE /admin/candidates/:id
```
**Headers:**
```
Authorization: Bearer <admin_token>
```
**Response:**
```json
{
  "message": "Candidate deleted"
}
```

---

## 4. Parties Management (Admin)

### Create Party
**Endpoint:**
```
POST /admin/parties
```
**Headers:**
```
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "name": "Party Name"
}
```
**Response:**
```json
{
  "message": "Partai berhasil ditambahkan!"
}
```

### Get All Parties
**Endpoint:**
```
GET /admin/parties
```
**Headers:**
```
Authorization: Bearer <admin_token>
```
**Response:**
```json
[
  {
    "_id": "123",
    "name": "Party Name",
    "candidates": []
  }
]
```

---

## 5. Voting

### Vote for a Candidate
**Endpoint:**
```
POST /vote
```
**Headers:**
```
Authorization: Bearer <user_token>
```
**Body:**
```json
{
  "candidateId": "123"
}
```
**Response:**
```json
{
  "message": "Vote recorded",
  "voteCount": 1
}
```

---

## 6. Results

### Get Election Results
**Endpoint:**
```
GET /results
```
**Response:**
```json
[
  {
    "name": "Candidate Name",
    "type": "presiden",
    "voteCount": 100
  }
]
```

