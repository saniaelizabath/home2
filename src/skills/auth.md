# Authentication Skill

This document outlines the authentication setup and flow for the LedgerLearn application.

## configuration
- **Provider**: Firebase Authentication
- **Project ID**: `tuitionapp-b354c`
- **Config File**: `src/firebase.js`

## Auth Flow
- **Students**: 
    - Full Signup (via `SignupPage` -> `StudentRegister`)
    - Login (via `LoginPage`)
- **Teachers**:
    - Login Only
- **Admins**:
    - Login Only

## Key Components
- **`AuthContext.jsx`**: Manages user state and provides `useAuth` hook.
- **`RoleSelectModal.jsx`**: Role selection entry point.
- **`LoginPage.jsx`**: Handles email/password sign-in and password resets.
- **`SignupPage.jsx`**: Entry for new student registration.

## Implementation Details
### Firebase Initialization
```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = { ... };
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### Role-Based Restrictions
- Signup is restricted to students at the UI level (`RoleSelectModal`) and routing level (`SignupPage`).

### Strong Password Validation
- Minimum 8 characters.
- Requires at least one uppercase letter, one lowercase letter, and one number.
