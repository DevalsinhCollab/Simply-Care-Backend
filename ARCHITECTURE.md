# Simply Care — Architecture & Data Model (End-to-End)

This document summarizes the backend schema, routes, and overall design for the Simply‑Care project (backend + how frontend integrates). Use it as an at-a-glance reference for the data models, major endpoints, request/response expectations, runtime wiring, and next improvements.

**Project layout**
- Backend entry: `index.js` (sets up Express, Socket.IO, DB connection)
- Primary folders: `models/`, `controller/`, `router/`, `middleware/`, `db/`

**High-level flow**
- Client (frontend) calls REST endpoints under `/api/*` served by the Express app in `index.js`.
- Route handlers in `router/` delegate to functions in `controller/` which interact with Mongoose models in `models/`.
- `verifyToken` middleware protects selected routes requiring authentication.
- Socket.IO is configured in `index.js` for chat/real-time features (server stores socket instance at `app.set('socketio', io)`).

**Runtime / Bootstrap**
- Environment variables: `MONGO_URL`, `PORT` (loaded via `dotenv` in `index.js` and `db/db.js`).
- DB connect: `db/db.js` uses `mongoose.connect(process.env.MONGO_URL)`.
- Start: `node index.js` (or use `nodemon` in development).

**Core data models (summary)**
- `user` (`models/user.js`)
  - name, email, phone, otp, keepMeLoggedIn, role (A|U|D|SA), doctorId, clinicId, isDelete
- `clinic` (`models/clinic.js`)
  - name, email, phone, address, isDeleted
- `doctor` (`models/doctor.js`)
  - name, email, phone, clinicId, docSpeciality (ref `doctorSpeciality`), joiningDate, isDeleted
- `doctorSpeciality` (`models/doctorSpeciality.js`)
  - name, isDeleted
- `DoctorUnavailability` (`models/DoctorUnavailability.js`)
  - doctorId, fullDayDates [{date, reason}], customSlots [{date, slots[{startTime,endTime,reason}]}]
- `patient` (`models/patient.js`)
  - name, phone, email, gender, age, occupation, address, pincode, city, state, area, clinicId, isDeleted
- `PatientForm` (`models/patientform.js`)
  - nested doctor info, patient snapshot, assessment fields (nrs, mmt, history...), prescriptions array, clinicId, isDeleted
- `appointment` (`models/appointment.js`)
  - clinicId, doctorId, patientId, patientFormId, sessions[] (sessionNo, doctorId, treatment, sessionDate, payment, paidAmount, remainingAmount, paymentMode, prescribeMedicine, prescriptions[]), appointmentDate, startTime, endTime, docApproval, isDeleted
- `medicine` (`models/medicine.js`)
  - clinicId, name, isDeleted
- `problem` (`models/problem.js`)
  - patientId, docId, docSpeciality, issue, description, isDelete
- `message` (`models/message.js`)
  - senderId, receiverId, prbId (problem), message, read, timestamp
- `expense` (`models/expense.js`)
  - description, amount, expenseDate, month, category, paymentMode, clinicId, isDeleted
- `ReceiptCounter` (`models/receiptcounter.js`)
  - dateKey, sequence

**Route map (major routers and representative endpoints)**
- Authentication: `/api/auth` ([router/auth.js](router/auth.js))
  - `POST /signup` — user signup
  - `POST /verifyotp` — otp verification
  - `POST /login` — login
  - `POST /getuserbytoken` — return user for token
- Doctors: `/api/doc` ([router/doctor.js](router/doctor.js))
  - `POST /adddoctor`, `GET /getdoctors` (protected), `PUT /updatedoctor/:id`, `PUT /deletedoctor/:id`
- Patients: `/api/patient` ([router/patient.js](router/patient.js))
  - `POST /addpatient`, `GET /getpatients` (protected), `PUT /updatepatient/:id`, `DELETE /deletepatient/:id`
- Appointments: `/api/appointment` ([router/appointment.js](router/appointment.js))
  - `POST /createAppointment` (protected)
  - `GET /getAllAppointments` (protected)
  - `GET /getAppointmentById/:id`
  - `PUT /updateAppointment/:id` (protected)
  - `PUT /updateAppointmentStatus/:id` — approve/reject
  - `GET /getAvailableSlots` — helper for scheduling
  - `POST /createAppointmentWithSlot` — slot-based creation
  - Report/receipt/prescription generator endpoints present (GET `/generatereport`, `/generatereceipt`, `/generateprescription`)
- Patient forms: `/api/patientform` ([router/patientForm.js](router/patientForm.js))
  - `POST /addpatientform`, `GET /getpatientsform` (protected), `PUT /updatepatientform/:id`, `GET /getpatientsformbyid/:id` and generate endpoints
- Problems & Chat: `/api/prb` ([router/problem.js](router/problem.js)) and `/api/msg` ([router/message.js](router/message.js))
  - problem creation triggers socket notifications in controller; message endpoints handle `getchat`, `getpatientsbyDoctorid`, `markasreadmsg`, etc.
- Clinic: `/api/clinic` ([router/clinic.js](router/clinic.js))
  - `POST /createClinic`, `GET /getAllClinics` (protected), `GET /getClinicById/:id`
- Medicine: `/api/medicine` ([router/medicine.js](router/medicine.js))
  - CRUD endpoints for clinic medicines
- Expense: `/api/expense` ([router/expense.js](router/expense.js))
  - `/createExpense` (protected), `/getAllExpenses`, `/getExpenseSummary`, `/getExpenseStats`, `/exportExpenseStats`
- Doctor Specialities & Unavailability: `/api/doctorSpeciality`, `/api/unavailability`
  - manage specialities and unavailable slots or full-day offs

**Middleware & Security**
- `verifyToken` middleware is applied to sensitive routes to check auth tokens (JWT or similar) — see `middleware/verifyToken.js`.
- Sensitive endpoints that mutate data often require `verifyToken` (appointments listing, clinic listing, medicines, expenses, doctors, patient forms).

**Socket/Realtime**
- Socket.IO instance is created in `index.js` and set on app (`app.set('socketio', io)`), controllers that need to emit events set `req.io = req.app.get('socketio')` before calling the controller (pattern seen in a few route wrappers).
- Chat `sendMessage` flow (commented in `index.js`): save message to `message` model and `io.to(roomId).emit('receiveMessage', msg)`.

**Frontend integration points (where to look in the frontend repo)**
- API client code lives under `Simply-Care-Frontend/src/apis/` (slices and API wrappers) — the frontend calls the endpoints listed above and maps results into Redux slices.
- Screens that use endpoints: `Simply-Care-Frontend/src/Screens/appointment`, `patients`, `doctors`, `medicine`, `expense`, `patientForm`, `chat`.

**Run & Dev notes**
- Backend (development):
  - cd `Simply-Care-Backend`
  - install: `npm install`
  - set `.env` with `MONGO_URL` and optional `PORT`
  - run: `node index.js` or `nodemon index.js`
- Frontend: follow `Simply-Care-Frontend/package.json` (likely `npm start` for dev, `npm run build` for production).

**Request/Response conventions (observed patterns)**
- Most endpoints return JSON and use standard REST verbs: `POST` to create, `GET` to read, `PUT` to update/soft-delete.
- Soft deletes are commonly used (`isDeleted` or `isDeleted` boolean flags).
- IDs are Mongoose ObjectId references (use strings in URL params where route expects `:id`).

**Quick troubleshooting**
- If server can't connect: ensure `MONGO_URL` is valid and reachable.
- Socket issues: check CORS options in `index.js` and ensure client connects to same origin/port or allowed origin.

**Recommended next improvements**
- Centralize API response format (success/error wrapper) for consistent frontend handling.
- Add request validation (e.g., `express-validator`) on controllers to make contracts explicit.
- Add unit/integration tests for controllers and model logic.
- Harden auth: ensure `verifyToken` checks token expiry and roles for admin-only actions.
- Add API documentation (Swagger/OpenAPI) generated from routes/controllers for developer onboarding.

---
Generated snapshot: core models & routes in `Simply-Care-Backend`.
