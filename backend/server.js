const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { exec } = require('child_process');
const db      = require('./db');

const app  = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..')));

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  exec(`${cmd} ${url}`);
}

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/patients', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM patients ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/patients/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Patient not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patients', async (req, res) => {
  const { name, age, gender, blood_group, condition, phone, status } = req.body;
  if (!name || !age) return res.status(400).json({ error: 'name and age are required' });
  try {
    const [result] = await db.query(
      'INSERT INTO patients (name, age, gender, blood_group, `condition`, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, age, gender || 'other', blood_group || 'O+', condition || '', phone || '', status || 'active']
    );
    res.status(201).json({ id: result.insertId, message: 'Patient created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  const { name, age, gender, blood_group, condition, phone, status } = req.body;
  try {
    await db.query(
      'UPDATE patients SET name=?, age=?, gender=?, blood_group=?, `condition`=?, phone=?, status=? WHERE id=?',
      [name, age, gender, blood_group, condition, phone, status, req.params.id]
    );
    res.json({ message: 'Patient updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM patients WHERE id = ?', [req.params.id]);
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/doctors', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM doctors ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/doctors/by-date', async (req, res) => {
  const date = req.query.date;
  if (!date) return res.status(400).json({ error: 'date query parameter required' });
  try {
    const [rows] = await db.query('SELECT * FROM doctors WHERE FIND_IN_SET(?, available_dates) > 0 ORDER BY name ASC LIMIT 3', [date]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/doctors/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Doctor not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/doctors', async (req, res) => {
  const { name, specialty, phone, email, experience, status, consultation_hours, available_dates } = req.body;
  if (!name || !specialty) return res.status(400).json({ error: 'name and specialty are required' });
  try {
    const [result] = await db.query(
      'INSERT INTO doctors (name, specialty, phone, email, experience, status, consultation_hours, available_dates) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, specialty, phone || '', email || '', experience || 0, status || 'available', consultation_hours || '', available_dates || '']
    );
    res.status(201).json({ id: result.insertId, message: 'Doctor created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/doctors/:id', async (req, res) => {
  const { name, specialty, phone, email, experience, status, consultation_hours, available_dates } = req.body;
  try {
    await db.query(
      'UPDATE doctors SET name=?, specialty=?, phone=?, email=?, experience=?, status=?, consultation_hours=?, available_dates=? WHERE id=?',
      [name, specialty, phone, email, experience, status, consultation_hours, available_dates, req.params.id]
    );
    res.json({ message: 'Doctor updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/doctors/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM doctors WHERE id = ?', [req.params.id]);
    res.json({ message: 'Doctor deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/requests', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM appointments ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/requests/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Request not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests', async (req, res) => {
  const { patient_name, age, phone, gender, doctor_id, doctor_name, appointment_date, appointment_time, reason, notes } = req.body;
  if (!patient_name || !doctor_id || !appointment_date) {
    return res.status(400).json({ error: 'patient_name, doctor_id, and appointment_date are required' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO appointments (patient_name, age, phone, gender, doctor_id, doctor_name, appointment_date, appointment_time, reason, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [patient_name, age || null, phone || '', gender || '', doctor_id, doctor_name || '', appointment_date, appointment_time || '', reason || '', notes || '']
    );
    res.status(201).json({ id: result.insertId, message: 'Appointment request submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/requests/:id', async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'approved', 'rejected'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status value' });
  try {
    await db.query('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: `Request ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/requests/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/emergency', async (req, res) => {
  const { patient_name, phone, location, description, role } = req.body;
  if (!patient_name || !location) {
    return res.status(400).json({ error: 'patient_name and location are required' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO emergency_requests (patient_name, phone, location, description, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [patient_name, phone || '', location, description || '', role || 'patient', 'active']
    );
    console.log(`🚨 EMERGENCY ALERT from ${patient_name} at ${location}`);
    res.status(201).json({ id: result.insertId, message: 'Emergency alert dispatched' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/emergency', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM emergency_requests ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/contacts', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM contacts ORDER BY department ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), server: 'VITC Healthcare API v1.0' });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.path} not found` });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`VITC HealthCare API Server running at http://localhost:${PORT}`);
  if (process.argv.includes('--open') || process.env.OPEN_BROWSER === 'true') {
    setTimeout(() => {
      openBrowser(`http://localhost:${PORT}/patient.html`);
      openBrowser(`http://localhost:${PORT}/admin.html`);
    }, 500);
  }
});

