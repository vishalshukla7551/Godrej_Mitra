# ASE and ZSE Profile Update APIs

## Overview
These APIs allow ASE and ZSE users to update their profile information, specifically their agency name and other relevant details.

## ASE Profile Update API

### Endpoint
```
POST /api/ase/profile/update
```

### Authentication
- Requires authenticated ASE user (role: ASE)
- Uses cookie-based authentication

### Request Body
```json
{
  "agencyName": "string (optional)"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "id": "string",
    "fullName": "string",
    "phone": "string",
    "agencyName": "string | null",
    "zseName": "string | null",
    "stores": [
      {
        "id": "string",
        "name": "string",
        "city": "string | null"
      }
    ]
  }
}
```

### Example Usage
```javascript
const response = await fetch('/api/ase/profile/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    agencyName: 'Samsung Agency XYZ'
  }),
  credentials: 'include'
});

const data = await response.json();
console.log(data);
```

### Error Responses
- `401 Unauthorized`: User is not authenticated or not an ASE
- `404 Not Found`: ASE profile not found
- `500 Internal Server Error`: Server error occurred

---

## ZSE Profile Update API

### Endpoint
```
POST /api/zse/profile/update
```

### Authentication
- Requires authenticated ZSE user (role: ZSE)
- Uses cookie-based authentication

### Request Body
```json
{
  "agencyName": "string (optional)",
  "region": "string (optional)"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "id": "string",
    "fullName": "string",
    "phone": "string",
    "agencyName": "string | null",
    "region": "string | null",
    "ases": [
      {
        "id": "string",
        "fullName": "string",
        "storeCount": number
      }
    ],
    "stores": [
      {
        "id": "string",
        "name": "string",
        "city": "string | null"
      }
    ]
  }
}
```

### Example Usage
```javascript
const response = await fetch('/api/zse/profile/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    agencyName: 'Samsung Agency ABC',
    region: 'North India'
  }),
  credentials: 'include'
});

const data = await response.json();
console.log(data);
```

### Error Responses
- `401 Unauthorized`: User is not authenticated or not a ZSE
- `404 Not Found`: ZSE profile not found
- `500 Internal Server Error`: Server error occurred

---

## Database Schema Reference

### ASE Model
```prisma
model ASE {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  userId       String   @unique @db.ObjectId
  fullName     String
  phone        String
  AgencyName   String?  // Agency name field
  storeIds     String[] // Array of Store IDs
  zseId        String   @db.ObjectId
  
  user         User     @relation("UserASE", fields: [userId], references: [id], onDelete: Cascade)
  zse          ZSE      @relation("ZSEToASE", fields: [zseId], references: [id], onDelete: Cascade)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### ZSE Model
```prisma
model ZSE {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  userId       String   @unique @db.ObjectId
  fullName     String
  phone        String
  region       String?  // Region field
  AgencyName   String?  // Agency name field
  
  user         User     @relation("UserZSE", fields: [userId], references: [id], onDelete: Cascade)
  ases         ASE[]    @relation("ZSEToASE")
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## Notes

1. **Partial Updates**: Both APIs support partial updates - you can send only the fields you want to update
2. **Null Values**: Sending `null` or empty string will clear the field value
3. **Authentication**: Both APIs require proper authentication and role-based access
4. **Related Data**: Both APIs return related data (stores, ASEs) in the response for convenience
5. **Timestamps**: The `updatedAt` field is automatically updated on each profile update

## Testing

You can test these APIs using curl:

### Test ASE Profile Update
```bash
curl -X POST http://localhost:3000/api/ase/profile/update \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{"agencyName": "Test Agency"}'
```

### Test ZSE Profile Update
```bash
curl -X POST http://localhost:3000/api/zse/profile/update \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{"agencyName": "Test Agency", "region": "North"}'
```
