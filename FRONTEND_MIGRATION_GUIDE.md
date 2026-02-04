// =============================================
// FRONTEND MIGRATION GUIDE
// How to update your existing components
// =============================================

// ============================================
// STEP 1: Create API Config
// ============================================
// File: src/config/api.js
// Content provided in: src-config-api.js

// ============================================
// STEP 2: Update Component Imports
// ============================================

// BEFORE:
// import React, { useState, useEffect } from "react";

// AFTER:
// import React, { useState, useEffect } from "react";
// import { fetchWithAuth, API_ENDPOINTS, API_BASE_URL } from "../config/api";

// ============================================
// STEP 3: Replace API Calls
// ============================================

// ============================================
// EXAMPLE 1: registerforlsts.jsx
// ============================================

// BEFORE:
/_
const checkUserLsts = async () => {
const token = sessionStorage.getItem("authToken");
const response = await fetch(
"https://dgunn-dud0b0eygjfcaxfs.southafricanorth-01.azurewebsites.net/api/LstsForm/USERLSTSFORM",
{
headers: { Authorization: `Bearer ${token}` }
}
);
};
_/

// AFTER:
/\*
import { fetchWithAuth, API_ENDPOINTS } from "../config/api";

const checkUserLsts = async () => {
const response = await fetchWithAuth(API_ENDPOINTS.GET_USER_LSTS, {
method: "GET",
});

if (!response.ok) {
throw new Error("Failed to fetch LSTS data");
}

const data = await response.json();
// Use data.registrations instead of data
};
\*/

// ============================================
// EXAMPLE 2: Submitting LSTS Form
// ============================================

// BEFORE:
/\*
const handleSubmit = async (e) => {
e.preventDefault();
const token = sessionStorage.getItem("authToken");

try {
const response = await fetch(
"https://dgunn-dud0b0eygjfcaxfs.southafricanorth-01.azurewebsites.net/api/LstsForm/USERLSTSFORM",
{
method: "POST",
headers: {
"Content-Type": "application/json",
Authorization: `Bearer ${token}`,
},
body: JSON.stringify(formData),
}
);

    if (response.ok) {
      // Handle success
    }

} catch (err) {
// Handle error
}
};
\*/

// AFTER:
/\*
import { fetchWithAuth, API_ENDPOINTS } from "../config/api";

const handleSubmit = async (e) => {
e.preventDefault();

try {
const response = await fetchWithAuth(API_ENDPOINTS.POST_LSTS, {
method: "POST",
body: JSON.stringify(formData),
});

    if (response.ok) {
      const data = await response.json();
      // Handle success - use data.registration
    } else {
      const error = await response.json();
      throw new Error(error.error);
    }

} catch (err) {
console.error("Form submission error:", err);
}
};
\*/

// ============================================
// EXAMPLE 3: Admin API Calls
// ============================================

// BEFORE:
/_
const checkAdmin = async () => {
const token = sessionStorage.getItem("authToken");
const res = await fetch(
"https://dgunn-dud0b0eygjfcaxfs.southafricanorth-01.azurewebsites.net/api/Admin/isAdmin",
{
headers: { Authorization: `Bearer ${token}` },
}
);
const data = await res.json();
setIsAdmin(data);
};
_/

// AFTER:
/\*
import { fetchWithAuth, API_ENDPOINTS } from "../config/api";

const checkAdmin = async () => {
const res = await fetchWithAuth(API_ENDPOINTS.CHECK_ADMIN, {
method: "GET",
});
const data = await res.json();
setIsAdmin(data.isAdmin); // Note: Response structure changed
};
\*/

// ============================================
// EXAMPLE 4: File Upload (Audio Messages)
// ============================================

// BEFORE:
/\*
const handleUpload = (e) => {
e.preventDefault();
const token = sessionStorage.getItem("authToken");

const fd = new FormData();
fd.append("title", uploadTitle);
fd.append("file", uploadFile);

const xhr = new XMLHttpRequest();
xhr.open("POST",
"https://dgunn-dud0b0eygjfcaxfs.southafricanorth-01.azurewebsites.net/api/AudioMessage",
true
);
xhr.setRequestHeader("Authorization", `Bearer ${token}`);

xhr.onload = () => {
// Handle response
};

xhr.send(fd);
};
\*/

// AFTER:
/\*
import { fetchWithAuth, API_ENDPOINTS } from "../config/api";

const handleUpload = async (e) => {
e.preventDefault();

try {
const fd = new FormData();
fd.append("title", uploadTitle);
fd.append("speaker", uploadSpeaker);
fd.append("category", uploadCategory);
fd.append("date", uploadDate);
fd.append("file", uploadFile);

    const response = await fetchWithAuth(API_ENDPOINTS.UPLOAD_MESSAGE, {
      method: "POST",
      body: fd, // Don't set Content-Type, let browser set it
    });

    if (response.ok) {
      const data = await response.json();
      // Handle success - use data.message
    } else {
      const error = await response.json();
      throw new Error(error.error);
    }

} catch (err) {
console.error("Upload error:", err);
}
};
\*/

// ============================================
// EXAMPLE 5: Prayer Requests
// ============================================

// BEFORE:
/\*
const submitPrayer = async () => {
const token = sessionStorage.getItem("authToken");

const response = await fetch(
"https://dgunn-dud0b0eygjfcaxfs.southafricanorth-01.azurewebsites.net/api/PrayerRequest/GetPrayers",
{
method: "POST",
headers: {
"Content-Type": "application/json",
Authorization: `Bearer ${token}`,
},
body: JSON.stringify({ name, email, prayer }),
}
);
};
\*/

// AFTER:
/\*
import { fetchWithAuth, API_ENDPOINTS } from "../config/api";

const submitPrayer = async () => {
const response = await fetchWithAuth(API_ENDPOINTS.POST_PRAYER, {
method: "POST",
body: JSON.stringify({
name,
email,
prayerRequest: prayer,
requestType: "personal",
}),
});

if (response.ok) {
const data = await response.json();
// Handle success
}
};
\*/

// ============================================
// EXAMPLE 6: Dashboard.jsx Profile Fetch
// ============================================

// BEFORE:
/\*
const fetchProfile = async () => {
try {
const token = sessionStorage.getItem("authToken");
const res = await fetch(
"https://dgunn-dud0b0eygjfcaxfs.southafricanorth-01.azurewebsites.net/profile",
{
headers: {
Authorization: `Bearer ${token}`,
},
}
);

    if (!res.ok) throw new Error("Failed to fetch profile");

    const data = await res.json();
    // Use data.fullName

} catch (err) {
console.error("Profile fetch error:", err);
}
};
\*/

// AFTER:
/\*
import { fetchWithAuth, API_ENDPOINTS } from "../config/api";

const fetchProfile = async () => {
try {
const res = await fetchWithAuth(API_ENDPOINTS.PROFILE);

    if (!res.ok) throw new Error("Failed to fetch profile");

    const data = await res.json();
    // Use data.user.full_name (note: response structure is different)
    const fullName = data.user.full_name || "";

} catch (err) {
console.error("Profile fetch error:", err);
}
};
\*/

// ============================================
// RESPONSE STRUCTURE CHANGES
// ============================================

/\*
IMPORTANT: Response structures have changed!

OLD STRUCTURE (Azure Backend):

- /profile → { fullName, title, ... }
- /api/PrayerRequest/GetPrayers → [prayer1, prayer2, ...]
- /api/LstsForm/USERLSTSFORM → { id, name, ... }

NEW STRUCTURE (Supabase Backend):

- /api/auth/profile → { user: { full_name, title, ... } }
- /api/prayers → { prayers: [...], count: 2 }
- /api/lsts → { registrations: [...], count: 5 }
- /api/lsts/user/all → { registrations: [...], count: 1 }

KEY CHANGES:

1. Responses are wrapped in objects: { user: {...} } or { prayers: [...] }
2. Snake_case for database fields: full_name, is_student, etc.
3. Error responses: { error: "message" } instead of different format
4. Admin endpoints require authentication AND admin role
   \*/

// ============================================
// .env Configuration
// ============================================

/\*
Frontend .env.local:

VITE_API_URL=http://localhost:3001

For production:
VITE_API_URL=https://your-backend-domain.com
\*/

// ============================================
// CHECKLIST FOR MIGRATION
// ============================================

/_
□ Create src/config/api.js with provided content
□ Update all import statements to use fetchWithAuth
□ Update all API endpoints to use API_ENDPOINTS constants
□ Update all response handling for new structures
□ Test each API call in browser DevTools
□ Update .env.local with VITE_API_URL
□ Remove hardcoded URLs from components
□ Test authentication flow
□ Test file uploads
□ Test admin functionality
□ Run frontend and backend together
□ Test on production URLs before deploying
_/

// ============================================
// COMMON MISTAKES TO AVOID
// ============================================

/\*
❌ WRONG:
const url = "https://dgunn-dud0b0eygjfcaxfs.southafricanorth-01.azurewebsites.net/api/...";

✅ CORRECT:
import { API_ENDPOINTS, fetchWithAuth } from "../config/api";
const response = await fetchWithAuth(API_ENDPOINTS.POST_PRAYER);

❌ WRONG:
const response = await fetch(url, {
headers: { Authorization: `Bearer ${token}` }
});

✅ CORRECT:
const response = await fetchWithAuth(endpoint, {
method: "POST",
body: JSON.stringify(data)
});

❌ WRONG:
const { fullName } = data; // Old response format

✅ CORRECT:
const { full_name } = data.user; // New response format
\*/
