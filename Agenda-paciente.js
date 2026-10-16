/* ==========================================================
 * MI-AGENDA-PACIENTE.JS
 * Muestra únicamente las citas del paciente seleccionado
 * (simula la sesión eligiendo un paciente de la lista guardada
 * en localStorage) y permite cancelar sus propias citas.
 * ========================================================== */

document.addEventListener('DOMContentLoaded', function () {

    const SESSION_KEY = 'pacienteActualDni';

    const grid = document.getElementById('misCitasGrid');
    const vacioEl = document.getElementById('misCitasVacio');
    const nombreEl = document.getElementById('pacienteActualNombre');

    function obtenerCitas() {
        try { return JSON.parse(localStorage.getItem('citas')) || []; }
        catch (e) { return []; }
    }
    function guardarCitas(lista) {
        localStorage.setItem('citas', JSON.stringify(lista));
    }
    function obtenerPacientes() {
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

    function pacienteActual() {
        const dni = localStorage.getItem(SESSION_KEY);
        if (!dni) return null;
        return obtenerPacientes().find(function (p) { return String(p.dni) === String(dni); }) || null;
    }

    /* ----------------------------------------------------------
     * RENDER PRINCIPAL
     * ---------------------------------------------------------- */
    function render() {
        const paciente = pacienteActual();

        if (!paciente) {
            nombreEl.textContent = 'Ningún paciente seleccionado';
            grid.innerHTML = '';
            vacioEl.classList.remove('d-none');
            vacioEl.querySelector('p') && (vacioEl.querySelector('p').textContent =
                'Selecciona tu usuario arriba para ver tus citas programadas.');
            actualizarStats([]);
            return;
        }

        nombreEl.textContent = paciente.nombre;

        const citas = obtenerCitas().filter(function (c) {
            return (c.patient || '').trim().toLowerCase() === (paciente.nombre || '').trim().toLowerCase();
        });

        actualizarStats(citas);

        grid.innerHTML = '';

        if (citas.length === 0) {
            vacioEl.classList.remove('d-none');
            vacioEl.querySelector('p') && (vacioEl.querySelector('p').textContent =
                'No tienes citas registradas todavía.');
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
                    '<p class="text-secondary mb-0">' + escapar(cita.doctor) + '</p>' +

                    '<div class="agenda-meta">' +
                    '  <span>' + escapar(cita.date) + '</span>' +
                    '  <span>' + escapar(cita.mode) + '</span>' +
                    '</div>' +

                    '<p class="text-secondary">' + escapar(notas) + '</p>' +

                    '<div class="d-flex flex-wrap gap-2 mt-2">' +
                    '  <button type="button" class="btn btn-outline-dark btn-sm btn-mi-detalle">Ver detalle</button>' +
                    '  <button type="button" class="btn btn-danger btn-sm btn-cancelar-cita" data-id="' + escapar(cita.id) + '">Cancelar cita</button>' +
                    '</div>' +

                    '</article>';

                grid.appendChild(col);
            });

        enlazarBotones();
    }

    function actualizarStats(citas) {
        document.getElementById('statMisCitas').textContent = citas.length;
        document.getElementById('statMisRecordatorios').textContent =
            citas.filter(function (c) { return !c.reminderSent; }).length;

        const hoy = hoyISO();
        const proximas = citas
            .filter(function (c) { return c.date >= hoy; })
            .sort(function (a, b) { return (a.date + ' ' + a.time).localeCompare(b.date + ' ' + b.time); });

        document.getElementById('statProximaCita').textContent =
            proximas.length > 0 ? (proximas[0].date + ' ' + proximas[0].time) : '—';
    }

    function enlazarBotones() {
        grid.querySelectorAll('.btn-mi-detalle').forEach(function (button) {
            button.addEventListener('click', function () {
                const card = button.closest('article');
                if (!card) return;

                document.getElementById('miModalService').textContent = card.dataset.service || '';
                document.getElementById('miModalDoctor').textContent = card.dataset.doctor || '';
                document.getElementById('miModalSchedule').textContent = card.dataset.schedule || '';
                document.getElementById('miModalMode').textContent = card.dataset.mode || '';
                document.getElementById('miModalNotes').textContent = card.dataset.notes || '';

                new bootstrap.Modal(document.getElementById('miCitaModal')).show();
            });
        });

        grid.querySelectorAll('.btn-cancelar-cita').forEach(function (button) {
            button.addEventListener('click', function () {
                const id = button.getAttribute('data-id');
                const confirmar = confirm('¿Deseas cancelar esta cita? Esta acción no se puede deshacer.');
                if (!confirmar) return;

                let citas = obtenerCitas();
                citas = citas.filter(function (c) { return String(c.id) !== String(id); });
                guardarCitas(citas);
                render();
            });
        });
    }

    /* ----------------------------------------------------------
     * MODAL: SELECCIONAR PACIENTE (simula el inicio de sesión)
     * ---------------------------------------------------------- */
    const listaMiPacienteEl = document.getElementById('listaMiPaciente');
    const buscarMiPacienteInput = document.getElementById('buscarMiPacienteInput');
    const sinMiPacienteEl = document.getElementById('sinMiPaciente');
    const modalSeleccionarPacienteEl = document.getElementById('modalSeleccionarPaciente');

    function renderListaSeleccion(filtro) {
        if (!listaMiPacienteEl) return;

        const pacientes = obtenerPacientes();
        const filtroLower = (filtro || '').trim().toLowerCase();
        const filtrados = pacientes.filter(function (p) {
            return (p.nombre || '').toLowerCase().includes(filtroLower) ||
                   (p.dni || '').toLowerCase().includes(filtroLower);
        });

        listaMiPacienteEl.innerHTML = '';

        if (pacientes.length === 0) {
            sinMiPacienteEl.classList.remove('d-none');
            return;
        }
        sinMiPacienteEl.classList.add('d-none');

        if (filtrados.length === 0) {
            const vacio = document.createElement('p');
            vacio.className = 'text-secondary text-center mb-0';
            vacio.textContent = 'No se encontraron pacientes con ese criterio.';
            listaMiPacienteEl.appendChild(vacio);
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
                localStorage.setItem(SESSION_KEY, p.dni || '');
                render();
                const modalInstance = bootstrap.Modal.getInstance(modalSeleccionarPacienteEl);
                if (modalInstance) modalInstance.hide();
            });

            listaMiPacienteEl.appendChild(item);
        });
    }

    if (modalSeleccionarPacienteEl) {
        modalSeleccionarPacienteEl.addEventListener('show.bs.modal', function () {
            if (buscarMiPacienteInput) buscarMiPacienteInput.value = '';
            renderListaSeleccion('');
        });
    }
    if (buscarMiPacienteInput) {
        buscarMiPacienteInput.addEventListener('input', function () {
            renderListaSeleccion(buscarMiPacienteInput.value);
        });
    }

    render();
});
