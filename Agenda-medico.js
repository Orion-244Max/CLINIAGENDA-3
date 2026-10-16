/* ==========================================================
 * AGENDA-MEDICO.JS
 * Muestra únicamente las citas asignadas al médico seleccionado
 * (simula la sesión eligiendo un médico de la lista fija).
 * ========================================================== */

document.addEventListener('DOMContentLoaded', function () {

    const SESSION_KEY = 'medicoActualNombre';

    const medicosDisponibles = [
        { nombre: 'Dr. Carlos Ramírez', especialidad: 'Cardiología' },
        { nombre: 'Dra. Lucía Flores', especialidad: 'Pediatría' },
        { nombre: 'Dr. Jorge Medina', especialidad: 'Medicina General' },
        { nombre: 'Dra. Andrea Salas', especialidad: 'Ginecología' },
        { nombre: 'Dr. Miguel Torres', especialidad: 'Odontología' },
        { nombre: 'Dra. Paola Rivas', especialidad: 'Laboratorio' }
    ];

    const grid = document.getElementById('citasMedicoGrid');
    const vacioEl = document.getElementById('citasMedicoVacio');
    const nombreEl = document.getElementById('medicoActualNombre');

    function obtenerCitas() {
        try { return JSON.parse(localStorage.getItem('citas')) || []; }
        catch (e) { return []; }
    }
    function escapar(texto) {
        return String(texto == null ? '' : texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
    function hoyISO() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function medicoActual() {
        const nombre = localStorage.getItem(SESSION_KEY);
        if (!nombre) return null;
        return medicosDisponibles.find(function (m) { return m.nombre === nombre; }) || null;
    }

    /* ----------------------------------------------------------
     * RENDER PRINCIPAL
     * ---------------------------------------------------------- */
    function render() {
        const medico = medicoActual();

        if (!medico) {
            nombreEl.textContent = 'Ningún médico seleccionado';
            grid.innerHTML = '';
            vacioEl.classList.remove('d-none');
            vacioEl.querySelector('p') && (vacioEl.querySelector('p').textContent =
                'Selecciona tu usuario arriba para ver tus citas asignadas.');
            actualizarStats([]);
            return;
        }

        nombreEl.textContent = medico.nombre + ' · ' + medico.especialidad;

        const citas = obtenerCitas().filter(function (c) {
            return (c.doctor || '').trim().toLowerCase() === medico.nombre.trim().toLowerCase();
        });

        actualizarStats(citas);

        grid.innerHTML = '';

        if (citas.length === 0) {
            vacioEl.classList.remove('d-none');
            vacioEl.querySelector('p') && (vacioEl.querySelector('p').textContent =
                'No tienes citas asignadas todavía.');
            return;
        }
        vacioEl.classList.add('d-none');

        citas
            .sort(function (a, b) { return (a.date + ' ' + a.time).localeCompare(b.date + ' ' + b.time); })
            .forEach(function (cita) {
                const col = document.createElement('div');
                col.className = 'col-md-6 col-xl-4';

                const notas = cita.notes && cita.notes.trim() !== '' ? cita.notes : 'Sin observaciones registradas.';
                const badgeRecordatorio = cita.reminderSent
                    ? '<span class="badge rounded-pill bg-success">● Recordatorio enviado</span>'
                    : '<span class="badge rounded-pill bg-secondary">● Recordatorio pendiente</span>';

                col.innerHTML =
                    '<article class="agenda-item shadow-sm" ' +
                    'data-patient="' + escapar(cita.patient) + '" ' +
                    'data-service="' + escapar(cita.service) + '" ' +
                    'data-schedule="' + escapar(cita.date + ' · ' + cita.time) + '" ' +
                    'data-mode="' + escapar(cita.mode) + '" ' +
                    'data-notes="' + escapar(notas) + '">' +

                    '<div class="d-flex justify-content-between align-items-start">' +
                    '  <span class="agenda-hour">' + escapar(cita.time) + '</span>' +
                    '  ' + badgeRecordatorio +
                    '</div>' +

                    '<h3 class="h5 mt-3 mb-2">' + escapar(cita.service) + '</h3>' +
                    '<p class="mb-1 fw-semibold">' + escapar(cita.patient) + '</p>' +

                    '<div class="agenda-meta">' +
                    '  <span>' + escapar(cita.date) + '</span>' +
                    '  <span>' + escapar(cita.mode) + '</span>' +
                    '</div>' +

                    '<p class="text-secondary">' + escapar(notas) + '</p>' +

                    '<div class="d-flex flex-wrap gap-2 mt-2">' +
                    '  <button type="button" class="btn btn-outline-dark btn-sm btn-med-detalle">Ver detalle</button>' +
                    '</div>' +

                    '</article>';

                grid.appendChild(col);
            });

        enlazarBotones();
    }

    function actualizarStats(citas) {
        document.getElementById('statCitasMedico').textContent = citas.length;

        const hoy = hoyISO();
        document.getElementById('statCitasHoyMedico').textContent =
            citas.filter(function (c) { return c.date === hoy; }).length;

        const proximas = citas
            .filter(function (c) { return c.date >= hoy; })
            .sort(function (a, b) { return (a.date + ' ' + a.time).localeCompare(b.date + ' ' + b.time); });

        document.getElementById('statProximaCitaMedico').textContent =
            proximas.length > 0 ? (proximas[0].date + ' ' + proximas[0].time) : '—';
    }

    function enlazarBotones() {
        grid.querySelectorAll('.btn-med-detalle').forEach(function (button) {
            button.addEventListener('click', function () {
                const card = button.closest('article');
                if (!card) return;

                document.getElementById('medModalPatient').textContent = card.dataset.patient || '';
                document.getElementById('medModalService').textContent = card.dataset.service || '';
                document.getElementById('medModalSchedule').textContent = card.dataset.schedule || '';
                document.getElementById('medModalMode').textContent = card.dataset.mode || '';
                document.getElementById('medModalNotes').textContent = card.dataset.notes || '';

                new bootstrap.Modal(document.getElementById('citaMedicoModal')).show();
            });
        });
    }

    /* ----------------------------------------------------------
     * MODAL: SELECCIONAR MÉDICO (simula el inicio de sesión)
     * ---------------------------------------------------------- */
    const listaMiMedicoEl = document.getElementById('listaMiMedico');
    const buscarMiMedicoInput = document.getElementById('buscarMiMedicoInput');
    const modalSeleccionarMedicoEl = document.getElementById('modalSeleccionarMedico');

    function renderListaSeleccion(filtro) {
        if (!listaMiMedicoEl) return;

        const filtroLower = (filtro || '').trim().toLowerCase();
        const filtrados = medicosDisponibles.filter(function (m) {
            return m.nombre.toLowerCase().includes(filtroLower) ||
                   m.especialidad.toLowerCase().includes(filtroLower);
        });

        listaMiMedicoEl.innerHTML = '';

        if (filtrados.length === 0) {
            const vacio = document.createElement('p');
            vacio.className = 'text-secondary text-center mb-0';
            vacio.textContent = 'No se encontraron médicos con ese criterio.';
            listaMiMedicoEl.appendChild(vacio);
            return;
        }

        filtrados.forEach(function (m) {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'list-group-item list-group-item-action';
            item.innerHTML =
                '<span class="fw-semibold">' + m.nombre + '</span>' +
                '<br><span class="text-secondary small">' + m.especialidad + '</span>';

            item.addEventListener('click', function () {
                localStorage.setItem(SESSION_KEY, m.nombre);
                render();
                const modalInstance = bootstrap.Modal.getInstance(modalSeleccionarMedicoEl);
                if (modalInstance) modalInstance.hide();
            });

            listaMiMedicoEl.appendChild(item);
        });
    }

    if (modalSeleccionarMedicoEl) {
        modalSeleccionarMedicoEl.addEventListener('show.bs.modal', function () {
            if (buscarMiMedicoInput) buscarMiMedicoInput.value = '';
            renderListaSeleccion('');
        });
    }
    if (buscarMiMedicoInput) {
        buscarMiMedicoInput.addEventListener('input', function () {
            renderListaSeleccion(buscarMiMedicoInput.value);
        });
    }

    render();
});
