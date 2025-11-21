// Student Registration System - script.js
// Key features: add/edit/delete, validation, localStorage persistence, dynamic scrollbar (table container overflow)

const form = document.getElementById('studentForm');
const nameInput = document.getElementById('name');
const idInput = document.getElementById('studentId');
const emailInput = document.getElementById('email');
const contactInput = document.getElementById('contact');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const msg = document.getElementById('formMsg');
const tbody = document.getElementById('studentsTbody');
const searchInput = document.getElementById('search');
const clearAllBtn = document.getElementById('clearAll');
const tableWrap = document.getElementById('tableWrap');

const STORAGE_KEY = 'students_v1';
let students = [];
let editingId = null;

// Basic validation helpers
function isNameValid(name) { return /^[A-Za-z\s]+$/.test(name.trim()); }
function isIdValid(id) { return /^\d+$/.test(id); }
function isEmailValid(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function isContactValid(c) { return /^\d{10,}$/.test(c); }

// Load from storage
function loadStudents() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        students = raw ? JSON.parse(raw) : [];
    } catch (e) {
        students = [];
    }
}
function saveStudents() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

// Rendering
function renderTable(filter = '') {
    tbody.innerHTML = '';
    const list = students.filter(s => {
        if (!filter) return true;
        const t = filter.toLowerCase();
        return s.name.toLowerCase().includes(t) || s.studentId.includes(t);
    });

    if (list.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="empty" colspan="5">No records found</td>`;
        tbody.appendChild(tr);
        return;
    }

    list.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.studentId)}</td>
      <td>${escapeHtml(s.email)}</td>
      <td>${escapeHtml(s.contact)}</td>
      <td>
        <button class="action-btn edit" data-id="${s.id}">Edit</button>
        <button class="action-btn delete" data-id="${s.id}">Delete</button>
      </td>
    `;
        tbody.appendChild(tr);
    });

    // attach action listeners
    tbody.querySelectorAll('.edit').forEach(btn => {
        btn.addEventListener('click', () => startEdit(btn.dataset.id));
    });
    tbody.querySelectorAll('.delete').forEach(btn => {
        btn.addEventListener('click', () => deleteStudent(btn.dataset.id));
    });

    // dynamic scrollbar: if rows exceed container height, overflow auto already set in CSS.
    // But we can adjust max-height for smaller screens dynamically:
    adjustTableMaxHeight();
}

// sanitize output
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// Add new student
function addStudent(data) {
    students.push(data);
    saveStudents();
    renderTable(searchInput.value.trim());
}

// Update existing
function updateStudent(id, newData) {
    const idx = students.findIndex(s => s.id === id);
    if (idx === -1) return;
    students[idx] = { ...students[idx], ...newData };
    saveStudents();
    renderTable(searchInput.value.trim());
}

// Delete
function deleteStudent(id) {
    if (!confirm('Delete this record?')) return;
    students = students.filter(s => s.id !== id);
    saveStudents();
    renderTable(searchInput.value.trim());
}

// Start edit mode
function startEdit(id) {
    const s = students.find(x => x.id === id);
    if (!s) return;
    editingId = id;
    nameInput.value = s.name;
    idInput.value = s.studentId;
    emailInput.value = s.email;
    contactInput.value = s.contact;
    submitBtn.textContent = 'Update';
}

// Reset form
function resetForm() {
    editingId = null;
    form.reset();
    submitBtn.textContent = 'Add';
    msg.textContent = '';
}

// Submit handler
form.addEventListener('submit', e => {
    e.preventDefault();
    msg.textContent = '';

    const name = nameInput.value.trim();
    const studentId = idInput.value.trim();
    const email = emailInput.value.trim();
    const contact = contactInput.value.trim();

    // prevent empty row
    if (!name && !studentId && !email && !contact) {
        msg.textContent = 'Please fill at least one field.';
        return;
    }

    // validations
    if (!isNameValid(name)) { msg.textContent = 'Name must contain only letters and spaces.'; return; }
    if (!isIdValid(studentId)) { msg.textContent = 'Student ID must be numeric.'; return; }
    if (!isEmailValid(email)) { msg.textContent = 'Please enter a valid email.'; return; }
    if (!isContactValid(contact)) { msg.textContent = 'Contact must be at least 10 digits.'; return; }

    if (editingId) {
        updateStudent(editingId, { name, studentId, email, contact });
        resetForm();
    } else {
        // unique id for record
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        addStudent({ id, name, studentId, email, contact });
        form.reset();
    }
});

// reset button
resetBtn.addEventListener('click', resetForm);

// search
searchInput.addEventListener('input', () => {
    renderTable(searchInput.value.trim());
});

// clear all
clearAllBtn.addEventListener('click', () => {
    if (!confirm('Clear all records? This cannot be undone.')) return;
    students = [];
    saveStudents();
    renderTable();
});

// adjust scroll area height responsively (dynamic scrollbar behavior)
function adjustTableMaxHeight() {
    const vh = window.innerHeight;
    // leave space for header + form: compute max available for table
    const headerHeight = document.querySelector('.site-header').offsetHeight;
    const formHeight = document.querySelector('.form-panel').offsetHeight;
    // set max-height to a fraction of viewport to enable vertical scrollbar
    let max = Math.max(220, Math.min(480, vh - headerHeight - formHeight - 140));
    tableWrap.style.maxHeight = max + 'px';
}

// utility: keep table nice on resize
window.addEventListener('resize', adjustTableMaxHeight);

// initial load
(function init() {
    loadStudents();
    renderTable();
    adjustTableMaxHeight();
})();
