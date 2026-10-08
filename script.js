const API_BASE = 'http://localhost:4001/api';

const monthYearElement = document.getElementById('month-year');
const daysElement      = document.getElementById('days');
const prevButton       = document.getElementById('prev');
const nextButton       = document.getElementById('next');
const doctorText       = document.getElementById('doctor-text');

let currentDate     = new Date();
let selectedDateKey = null;
let doctorSchedule  = {};

async function fetchDoctorSchedule() {
  try {
    const res  = await fetch(`${API_BASE}/doctors`);
    const data = await res.json();
    data.forEach(doc => {
      if (doc.available_dates) {
        const dates = doc.available_dates.split(',').map(d => d.trim());
        const hours = doc.consultation_hours || '';
        let shift = 'General';
        if (hours.toLowerCase().startsWith('morning'))   shift = '🌅 Morning';
        else if (hours.toLowerCase().startsWith('afternoon')) shift = '☀️ Afternoon';
        else if (hours.toLowerCase().startsWith('night'))     shift = '🌙 Night';

        const docTitle = doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`;
        dates.forEach(date => {
          if (!date) return;
          if (!doctorSchedule[date]) doctorSchedule[date] = [];
          doctorSchedule[date].push({
            name: docTitle,
            specialty: doc.specialty,
            shift: shift,
            hours: hours
          });
        });
      }
    });
    renderCalendar();
  } catch {
  }
}

function renderCalendar() {
  const month = currentDate.getMonth();
  const year  = currentDate.getFullYear();

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  monthYearElement.innerText = `${monthNames[month]} ${year}`;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDay       = new Date(year, month + 1, 0).getDate();
  const today         = new Date();

  let daysHTML = '';

  for (let i = 0; i < firstDayIndex; i++) {
    daysHTML += `<div class="empty"></div>`;
  }

  for (let day = 1; day <= lastDay; day++) {
    const fm      = String(month + 1).padStart(2, '0');
    const fd      = String(day).padStart(2, '0');
    const dateKey = `${year}-${fm}-${fd}`;

    const isToday    = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isSelected = dateKey === selectedDateKey;
    const hasDoctor  = !!doctorSchedule[dateKey];

    let classes = [];
    if (isToday)    classes.push('today');
    if (isSelected) classes.push('selected');
    if (hasDoctor)  classes.push('has-doctor');

    const count = hasDoctor ? doctorSchedule[dateKey].length : 0;
    const badge = hasDoctor ? `<span class="doc-badge">${count}</span>` : '';

    daysHTML += `<div class="${classes.join(' ')}" data-date="${dateKey}">${day}${badge}</div>`;
  }

  daysElement.innerHTML = daysHTML;

  document.querySelectorAll('.days div:not(.empty)').forEach(dayEl => {
    dayEl.addEventListener('click', e => {
      const target = e.target.closest('[data-date]');
      if (!target) return;
      const clicked = target.getAttribute('data-date');
      selectedDateKey = clicked;
      renderCalendar();
      updateDoctorInfo(clicked);
    });
  });
}

function updateDoctorInfo(dateKey) {
  fetch(`${API_BASE}/doctors/by-date?date=${dateKey}`)
    .then(res => res.json())
    .then(doctors => {
      const [yr, mo, dy] = dateKey.split('-');
      const formatted = `${dy}/${mo}/${yr}`;
      if (doctors && doctors.length) {
        let html = `<div style="margin-bottom:10px;font-size:0.95rem;color:var(--text-muted)">
          📅 <span style="color:var(--primary);font-weight:600">${formatted}</span> — 
          <strong>${doctors.length} Doctor${doctors.length > 1 ? 's' : ''}</strong> on duty
        </div>`;
        const shiftOrder = ['🌅 Morning', '☀️ Afternoon', '🌙 Night', 'General'];
        const grouped = {};
        doctors.forEach(d => {
          const hours = d.consultation_hours || '';
          let shift = 'General';
          if (hours.toLowerCase().startsWith('morning')) shift = '🌅 Morning';
          else if (hours.toLowerCase().startsWith('afternoon')) shift = '☀️ Afternoon';
          else if (hours.toLowerCase().startsWith('night')) shift = '🌙 Night';
          d.shift = shift;
          d.hours = hours;
          if (!grouped[shift]) grouped[shift] = [];
          grouped[shift].push(d);
        });
        shiftOrder.forEach(shift => {
          if (!grouped[shift]) return;
          grouped[shift].forEach(d => {
            const docTitle = d.name.startsWith('Dr.') ? d.name : `Dr. ${d.name}`;
            html += `<div style="
              background: rgba(111,56,140,0.12);
              border-left: 3px solid var(--primary);
              border-radius: 6px;
              padding: 8px 12px;
              margin-bottom: 6px;
            ">
              <div style="font-weight:600;color:var(--text-primary)">${docTitle}</div>
              <div style="font-size:0.82rem;color:var(--text-muted)">
                ${d.specialty} · <span style="color:var(--primary)">${d.shift}</span> · ${d.hours}
              </div>
            </div>`;
          });
        });
        doctorText.innerHTML = html;
      } else {
        doctorText.innerHTML = `No scheduled doctors for <span style="color:var(--primary);font-weight:600">${formatted}</span>.<br><strong>Yet to be updated.</strong>`;
      }
    })
    .catch(() => {
      const doctors = doctorSchedule[dateKey] || [];
      const limited = doctors.slice(0, 3);
      const [yr, mo, dy] = dateKey.split('-');
      const formatted = `${dy}/${mo}/${yr}`;
      if (limited.length) {
        let html = `<div style="margin-bottom:10px;font-size:0.95rem;color:var(--text-muted)">
          📅 <span style="color:var(--primary);font-weight:600">${formatted}</span> — 
          <strong>${limited.length} Doctor${limited.length > 1 ? 's' : ''}</strong> on duty
        </div>`;
        limited.forEach(d => {
          html += `<div style="
            background: rgba(111,56,140,0.12);
            border-left: 3px solid var(--primary);
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 6px;
          ">
            <div style="font-weight:600;color:var(--text-primary)">${d.name}</div>
            <div style="font-size:0.82rem;color:var(--text-muted)">
              ${d.specialty} · <span style="color:var(--primary)">${d.shift}</span> · ${d.hours}
            </div>
          </div>`;
        });
        doctorText.innerHTML = html;
      } else {
        doctorText.innerHTML = `No scheduled doctors for <span style="color:var(--primary);font-weight:600">${formatted}</span>.<br><strong>Yet to be updated.</strong>`;
      }
    });
}

prevButton.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

nextButton.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

renderCalendar();
fetchDoctorSchedule();

