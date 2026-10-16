/* ==========================================================
 * AGENDA.JS
 * CRUD completo de citas sobre localStorage (clave "citas"),
 * más el indicador y envío de recordatorio por WhatsApp.
 * ========================================================== */

document.addEventListener('DOMContentLoaded', function () {

    const STORAGE_KEY = 'citas';

    const grid = document.getElementById('agendaGrid');
    const vacioEl = document.getElementById('agendaVacio');

    const medicosDisponibles = [
        { nombre: 'Dr. Carlos Ramírez', especialidad: 'Cardiología' },
        { nombre: 'Dra. Lucía Flores', especialidad: 'Pediatría' },
        { nombre: 'Dr. Jorge Medina', especialidad: 'Medicina General' },
        { nombre: 'Dra. Andrea Salas', especialidad: 'Ginecología' },
        { nombre: 'Dr. Miguel Torres', especialidad: 'Odontología' },
        { nombre: 'Dra. Paola Rivas', especialidad: 'Laboratorio' }
    ];

    /* ---------------------------------------------------------- */
    function obtenerCitas() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch (e) { return []; }
    }
    function guardarCitas(lista) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    }
    function obtenerPacientesGuardados() {
        try { return JSON.parse(localStorage.getItem('pacientes')) || []; }
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

    /* ----------------------------------------------------------
     * DASHBOARD SUPERIOR (métricas generales)
     * ---------------------------------------------------------- */
    function renderDashboard() {
        const statTotalPacientes = document.getElementById('statTotalPacientes');
        if (!statTotalPacientes) return; // esta vista no tiene dashboard

        const citas = obtenerCitas();
        const pacientes = obtenerPacientesGuardados();
        const hoy = hoyISO();

        statTotalPacientes.textContent = pacientes.length;
        document.getElementById('statTotalCitas').textContent = citas.length;
        document.getElementById('statCitasHoy').textContent =
            citas.filter(function (c) { return c.date === hoy; }).length;
        document.getElementById('statRecordatoriosPendientes').textContent =
            citas.filter(function (c) { return !c.reminderSent; }).length;
    }

    /* ----------------------------------------------------------
     * RENDER PRINCIPAL DE LA AGENDA
     * ---------------------------------------------------------- */
    function renderAgenda() {
        renderDashboard();

        const citas = obtenerCitas();
        if (!grid) return;

        grid.innerHTML = '';

        if (citas.length === 0) {
            if (vacioEl) vacioEl.classList.remove('d-none');
            return;
        }
        if (vacioEl) vacioEl.classList.add('d-none');

        // Ordenar por fecha y hora
        citas.sort(function (a, b) {
            return (a.date + ' ' + a.time).localeCompare(b.date + ' ' + b.time);
        });

        citas.forEach(function (cita) {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-xl-4';

            const notas = cita.notes && cita.notes.trim() !== '' ? cita.notes : 'Sin observaciones registradas.';
            const badgeRecordatorio = cita.reminderSent
                ? '<span class="badge rounded-pill bg-success">● Recordatorio enviado</span>'
                : '<span class="badge rounded-pill bg-secondary">● Recordatorio pendiente</span>';

            const botonRecordatorio = cita.reminderSent
                ? ''
                : '<button type="button" class="btn btn-success btn-sm btn-enviar-recordatorio" data-id="' + escapar(cita.id) + '">Enviar recordatorio</button>';

            col.innerHTML =
                '<article class="agenda-item shadow-sm" ' +
                'data-patient="' + escapar(cita.patient) + '" ' +
                'data-service="' + escapar(cita.service) + '" ' +
                'data-doctor="' + escapar(cita.doctor) + '" ' +
                'data-schedule="' + escapar(cita.date + ' · ' + cita.time) + '" ' +
                'data-mode="' + escapar(cita.mode) + '" ' +
                'data-notes="' + escapar(notas) + '">' +

                '<div class="d-flex justify-content-between align-items-start">' +
                '  <span class="agenda-hour">' + escapar(cita.time) + '</span>' +
                '  ' + badgeRecordatorio +
                '</div>' +

                '<h3 class="h5 mt-3 mb-2">' + escapar(cita.service) + '</h3>' +
                '<p class="mb-1 fw-semibold">' + escapar(cita.patient) + '</p>' +
                '<p class="text-secondary mb-0">' + escapar(cita.doctor) + '</p>' +

                '<div class="agenda-meta">' +
                '  <span>' + escapar(cita.date) + '</span>' +
                '  <span>' + escapar(cita.mode) + '</span>' +
                '</div>' +

                '<p class="text-secondary">' + escapar(notas) + '</p>' +

                '<div class="d-flex flex-wrap gap-2 mt-2">' +
                '  <button type="button" class="btn btn-outline-dark btn-sm view-detail-btn">Ver detalle</button>' +
                '  <button type="button" class="btn btn-warning btn-sm btn-editar-cita" data-id="' + escapar(cita.id) + '">Editar</button>' +
                '  <button type="button" class="btn btn-danger btn-sm btn-eliminar-cita" data-id="' + escapar(cita.id) + '">Eliminar</button>' +
                '  ' + botonRecordatorio +
                '</div>' +

                '</article>';

            grid.appendChild(col);
        });

        enlazarBotonesTarjetas();
    }

    /* ----------------------------------------------------------
     * BOTONES DE CADA TARJETA (ver detalle / editar / eliminar / recordatorio)
     * ---------------------------------------------------------- */
    function enlazarBotonesTarjetas() {

        // Ver detalle
        grid.querySelectorAll('.view-detail-btn').forEach(function (button) {
            button.addEventListener('click', function () {
                const card = button.closest('article');
                if (!card) return;

                document.getElementById('modalPatient').textContent = card.dataset.patient || '';
                document.getElementById('modalService').textContent = card.dataset.service || '';
                document.getElementById('modalDoctor').textContent = card.dataset.doctor || '';
                document.getElementById('modalSchedule').textContent = card.dataset.schedule || '';
                document.getElementById('modalMode').textContent = card.dataset.mode || '';
                document.getElementById('modalNotes').textContent = card.dataset.notes || '';

                const modalEl = document.getElementById('appointmentModal');
                if (modalEl) new bootstrap.Modal(modalEl).show();
            });
        });

        // Eliminar
        grid.querySelectorAll('.btn-eliminar-cita').forEach(function (button) {
            button.addEventListener('click', function () {
                const id = button.getAttribute('data-id');
                const confirmar = confirm('¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.');
                if (!confirmar) return;

                let citas = obtenerCitas();
                citas = citas.filter(function (c) { return String(c.id) !== String(id); });
                guardarCitas(citas);
                renderAgenda();
            });
        });

        // Editar
        grid.querySelectorAll('.btn-editar-cita').forEach(function (button) {
            button.addEventListener('click', function () {
                const id = button.getAttribute('data-id');
                const citas = obtenerCitas();
                const cita = citas.find(function (c) { return String(c.id) === String(id); });
                if (!cita) return;

                document.getElementById('edit-cita-id').value = cita.id;
                document.getElementById('edit-cita-patient').value = cita.patient || '';
                document.getElementById('edit-cita-doctor').value = cita.doctor || '';
                document.getElementById('edit-cita-service').value = cita.service || '';
                document.getElementById('edit-cita-date').value = cita.date || '';
                document.getElementById('edit-cita-time').value = cita.time || '';
                document.getElementById('edit-cita-mode').value = cita.mode || '';
                document.getElementById('edit-cita-notes').value = cita.notes || '';

                new bootstrap.Modal(document.getElementById('modalEditarCita')).show();
            });
        });

        // Enviar recordatorio
        grid.querySelectorAll('.btn-enviar-recordatorio').forEach(function (button) {
            button.addEventListener('click', function () {
                citaIdParaRecordatorio = button.getAttribute('data-id');

                if (recordatorioNumeroInput) recordatorioNumeroInput.value = '';
                if (recordatorioErrorEl) recordatorioErrorEl.classList.add('d-none');

                modalRecordatorioInstance.show();
            });
        });
    }

    /* ----------------------------------------------------------
     * FORMULARIO EDITAR CITA
     * ---------------------------------------------------------- */
    const formEditarCita = document.getElementById('formEditarCita');
    const modalEditarCitaEl = document.getElementById('modalEditarCita');

    if (formEditarCita) {
        formEditarCita.addEventListener('submit', function (e) {
            e.preventDefault();

            const id = document.getElementById('edit-cita-id').value;
            let citas = obtenerCitas();
            const idx = citas.findIndex(function (c) { return String(c.id) === String(id); });
            if (idx === -1) return;

            citas[idx].patient = document.getElementById('edit-cita-patient').value;
            citas[idx].doctor = document.getElementById('edit-cita-doctor').value;
            citas[idx].service = document.getElementById('edit-cita-service').value;
            citas[idx].date = document.getElementById('edit-cita-date').value;
            citas[idx].time = document.getElementById('edit-cita-time').value;
            citas[idx].mode = document.getElementById('edit-cita-mode').value;
            citas[idx].notes = document.getElementById('edit-cita-notes').value;

            guardarCitas(citas);
            renderAgenda();

            const modalInstance = bootstrap.Modal.getInstance(modalEditarCitaEl);
            if (modalInstance) modalInstance.hide();
        });
    }

    /* ----------------------------------------------------------
     * BUSCADOR DE PACIENTES (dentro del modal Editar cita)
     * ---------------------------------------------------------- */
    const listaPacientesAgendaEl = document.getElementById('listaPacientesAgenda');
    const buscarPacienteAgendaInput = document.getElementById('buscarPacienteAgendaInput');
    const sinPacientesAgendaEl = document.getElementById('sinPacientesAgenda');
    const modalBuscarPacienteAgendaEl = document.getElementById('modalBuscarPacienteAgenda');

    function renderPacientesAgenda(filtro) {
        if (!listaPacientesAgendaEl) return;

        const pacientes = obtenerPacientesGuardados();
        const filtroLower = (filtro || '').trim().toLowerCase();
        const filtrados = pacientes.filter(function (p) {
            return (p.nombre || '').toLowerCase().includes(filtroLower) ||
                   (p.dni || '').toLowerCase().includes(filtroLower);
        });

        listaPacientesAgendaEl.innerHTML = '';

        if (pacientes.length === 0) {
            if (sinPacientesAgendaEl) sinPacientesAgendaEl.classList.remove('d-none');
            return;
        }
        if (sinPacientesAgendaEl) sinPacientesAgendaEl.classList.add('d-none');

        if (filtrados.length === 0) {
            const vacio = document.createElement('p');
            vacio.className = 'text-secondary text-center mb-0';
            vacio.textContent = 'No se encontraron pacientes con ese criterio.';
            listaPacientesAgendaEl.appendChild(vacio);
            return;
        }

        filtrados.forEach(function (p) {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'list-group-item list-group-item-action';
            item.innerHTML =
                '<span class="fw-semibold">' + escapar(p.nombre || 'Sin nombre') + '</span>' +
                '<br><span class="text-secondary small">DNI: ' + escapar(p.dni || '-') + '</span>';

            item.addEventListener('click', function () {
                document.getElementById('edit-cita-patient').value = p.nombre || '';
                const modalInstance = bootstrap.Modal.getInstance(modalBuscarPacienteAgendaEl);
                if (modalInstance) modalInstance.hide();
            });

            listaPacientesAgendaEl.appendChild(item);
        });
    }

    if (modalBuscarPacienteAgendaEl) {
        modalBuscarPacienteAgendaEl.addEventListener('show.bs.modal', function () {
            if (buscarPacienteAgendaInput) buscarPacienteAgendaInput.value = '';
            renderPacientesAgenda('');
        });
    }
    if (buscarPacienteAgendaInput) {
        buscarPacienteAgendaInput.addEventListener('input', function () {
            renderPacientesAgenda(buscarPacienteAgendaInput.value);
        });
    }

    /* ----------------------------------------------------------
     * BUSCADOR DE MÉDICOS (dentro del modal Editar cita)
     * ---------------------------------------------------------- */
    const listaMedicosAgendaEl = document.getElementById('listaMedicosAgenda');
    const buscarMedicoAgendaInput = document.getElementById('buscarMedicoAgendaInput');
    const modalBuscarMedicoAgendaEl = document.getElementById('modalBuscarMedicoAgenda');

    function renderMedicosAgenda(filtro) {
        if (!listaMedicosAgendaEl) return;

        const filtroLower = (filtro || '').trim().toLowerCase();
        const filtrados = medicosDisponibles.filter(function (m) {
            return m.nombre.toLowerCase().includes(filtroLower) ||
                   m.especialidad.toLowerCase().includes(filtroLower);
        });

        listaMedicosAgendaEl.innerHTML = '';

        if (filtrados.length === 0) {
            const vacio = document.createElement('p');
            vacio.className = 'text-secondary text-center mb-0';
            vacio.textContent = 'No se encontraron médicos con ese criterio.';
            listaMedicosAgendaEl.appendChild(vacio);
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
                document.getElementById('edit-cita-doctor').value = m.nombre;
                const modalInstance = bootstrap.Modal.getInstance(modalBuscarMedicoAgendaEl);
                if (modalInstance) modalInstance.hide();
            });

            listaMedicosAgendaEl.appendChild(item);
        });
    }

    if (modalBuscarMedicoAgendaEl) {
        modalBuscarMedicoAgendaEl.addEventListener('show.bs.modal', function () {
            if (buscarMedicoAgendaInput) buscarMedicoAgendaInput.value = '';
            renderMedicosAgenda('');
        });
    }
    if (buscarMedicoAgendaInput) {
        buscarMedicoAgendaInput.addEventListener('input', function () {
            renderMedicosAgenda(buscarMedicoAgendaInput.value);
        });
    }

    /* ----------------------------------------------------------
     * ENVIAR RECORDATORIO POR WHATSAPP
     * ---------------------------------------------------------- */
    let citaIdParaRecordatorio = null;

    const modalRecordatorioEl = document.getElementById('modalRecordatorio');
    const recordatorioNumeroInput = document.getElementById('recordatorioNumero');
    const recordatorioErrorEl = document.getElementById('recordatorioError');
    const btnConfirmarRecordatorio = document.getElementById('btnConfirmarRecordatorio');

    const modalRecordatorioInstance = modalRecordatorioEl ? new bootstrap.Modal(modalRecordatorioEl) : null;

    if (btnConfirmarRecordatorio) {
        btnConfirmarRecordatorio.addEventListener('click', function () {
            const numero = (recordatorioNumeroInput.value || '').trim();

            if (!/^\d{9}$/.test(numero)) {
                recordatorioErrorEl.classList.remove('d-none');
                recordatorioNumeroInput.classList.add('is-invalid');
                return;
            }
            recordatorioErrorEl.classList.add('d-none');
            recordatorioNumeroInput.classList.remove('is-invalid');

            let citas = obtenerCitas();
            const idx = citas.findIndex(function (c) { return String(c.id) === String(citaIdParaRecordatorio); });
            if (idx === -1) return;

            const cita = citas[idx];
            const mensaje =
                'Hola ' + cita.patient + '! Este es un recordatorio de tu cita:\n' +
                'Servicio: ' + cita.service + '\n' +
                'Médico: ' + cita.doctor + '\n' +
                'Fecha: ' + cita.date + '\n' +
                'Hora: ' + cita.time + '\n' +
                'Modalidad: ' + cita.mode +
                '\n\n¡Te esperamos en CliniAgenda!';

            const enlaceWhatsapp = 'https://wa.me/51' + numero + '?text=' + encodeURIComponent(mensaje);
            window.open(enlaceWhatsapp, '_blank');

            // Marcar como enviado
            citas[idx].reminderSent = true;
            guardarCitas(citas);
            renderAgenda();

            modalRecordatorioInstance.hide();
        });
    }

    if (recordatorioNumeroInput) {
        recordatorioNumeroInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (btnConfirmarRecordatorio) btnConfirmarRecordatorio.click();
            }
        });
    }

    // Primer render
    renderAgenda();
});