document.addEventListener('DOMContentLoaded', function () {

    const form = document.querySelector('form');
    if (!form) return;

    const patient = document.getElementById('patientName');
    const doctor = document.getElementById('doctorName');
    const service = document.getElementById('serviceSelect');
    const date = document.getElementById('appointmentDate');
    const time = document.getElementById('appointmentTime');
    const mode = document.getElementById('appointmentMode');

    /* ==========================================================
     * 0. UTILIDADES DE VALIDACIÓN VISUAL (compartidas)
     * ========================================================== */
    function limpiarValidaciones() {
        form.querySelectorAll('.validacion-error, .validacion-correcto').forEach(el => el.remove());
        form.querySelectorAll('.is-invalid, .is-valid').forEach(c => {
            c.classList.remove('is-invalid');
            c.classList.remove('is-valid');
        });
    }

    function mostrarError(campo, mensaje) {
        campo.classList.add('is-invalid');
        const error = document.createElement('div');
        error.className = 'validacion-error';
        error.textContent = '⚠ ' + mensaje;
        campo.parentNode.appendChild(error);
    }

    function mostrarCorrecto(campo, mensaje) {
        campo.classList.add('is-valid');
        const correcto = document.createElement('div');
        correcto.className = 'validacion-correcto';
        correcto.textContent = '✓ ' + mensaje;
        campo.parentNode.appendChild(correcto);
    }

    // Valida todos los campos de la cita. Devuelve true/false.
    function validarFormularioCita(mostrarMensajes) {
        let formularioValido = true;

        if (mostrarMensajes) limpiarValidaciones();

        function chequear(campo, condicionValida, mensajeError, mensajeOk) {
            if (!condicionValida) {
                formularioValido = false;
                if (mostrarMensajes) mostrarError(campo, mensajeError);
            } else if (mostrarMensajes) {
                mostrarCorrecto(campo, mensajeOk);
            }
        }

        chequear(patient, patient.value.trim() !== '', 'Falta seleccionar al paciente.', 'Paciente correcto.');
        chequear(doctor, doctor.value.trim() !== '', 'Falta seleccionar al médico.', 'Médico correcto.');
        chequear(service, service.value !== '', 'Falta seleccionar el servicio.', 'Servicio seleccionado correctamente.');
        chequear(date, date.value !== '', 'Falta seleccionar la fecha de la cita.', 'Fecha seleccionada correctamente.');
        chequear(time, time.value !== '', 'Falta seleccionar la hora de la cita.', 'Hora seleccionada correctamente.');
        chequear(mode, mode.value !== '', 'Falta seleccionar la modalidad.', 'Modalidad seleccionada correctamente.');

        return formularioValido;
    }

    /* ==========================================================
     * 1. BOTÓN "VALIDAR"
     * ========================================================== */
    const btnValidar = document.getElementById('btnValidarCita');
    if (btnValidar) {
        btnValidar.addEventListener('click', function () {
            const valido = validarFormularioCita(true);
            if (valido) {
                alert('✓ La información de la cita está completa y correcta.');
            }
        });
    }

    // Limpiar mensajes al escribir/cambiar
    ['patientName', 'doctorName', 'serviceSelect', 'appointmentDate', 'appointmentTime', 'appointmentMode']
        .forEach(function (id) {
            const campo = document.getElementById(id);
            if (!campo) return;

            function limpiarMensaje() {
                const error = campo.parentNode.querySelector('.validacion-error');
                const correcto = campo.parentNode.querySelector('.validacion-correcto');
                if (error) error.remove();
                if (correcto) correcto.remove();
                campo.classList.remove('is-invalid', 'is-valid');
            }

            campo.addEventListener('input', limpiarMensaje);
            campo.addEventListener('change', limpiarMensaje);
        });

    /* ==========================================================
     * 2. BUSCADOR DE PACIENTES REGISTRADOS
     *    Toma la lista guardada por paciente-form.js en localStorage.
     * ========================================================== */
    const listaPacientesEl = document.getElementById('listaPacientes');
    const buscarPacienteInput = document.getElementById('buscarPacienteInput');
    const sinPacientesEl = document.getElementById('sinPacientes');
    const modalBuscarPacienteEl = document.getElementById('modalBuscarPaciente');

    function obtenerPacientesGuardados() {
        try {
            return JSON.parse(localStorage.getItem('pacientes')) || [];
        } catch (e) {
            return [];
        }
    }

    function renderPacientes(filtro) {
        if (!listaPacientesEl) return;

        const pacientes = obtenerPacientesGuardados();
        const filtroLower = (filtro || '').trim().toLowerCase();

        const filtrados = pacientes.filter(function (p) {
            const nombre = (p.nombre || '').toLowerCase();
            const dni = (p.dni || '').toLowerCase();
            return nombre.includes(filtroLower) || dni.includes(filtroLower);
        });

        listaPacientesEl.innerHTML = '';

        if (pacientes.length === 0) {
            if (sinPacientesEl) sinPacientesEl.classList.remove('d-none');
            return;
        }
        if (sinPacientesEl) sinPacientesEl.classList.add('d-none');

        if (filtrados.length === 0) {
            const vacio = document.createElement('p');
            vacio.className = 'text-secondary text-center mb-0';
            vacio.textContent = 'No se encontraron pacientes con ese criterio.';
            listaPacientesEl.appendChild(vacio);
            return;
        }

        filtrados.forEach(function (p) {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'list-group-item list-group-item-action';
            item.innerHTML =
                '<span class="fw-semibold">' + (p.nombre || 'Sin nombre') + '</span>' +
                '<br><span class="text-secondary small">DNI: ' + (p.dni || '-') + ' · ' + (p.telefono || 'sin teléfono') + '</span>';

            item.addEventListener('click', function () {
                patient.value = p.nombre || '';
                patient.dispatchEvent(new Event('change'));
                const modalInstance = bootstrap.Modal.getInstance(modalBuscarPacienteEl);
                if (modalInstance) modalInstance.hide();
            });

            listaPacientesEl.appendChild(item);
        });
    }

    if (modalBuscarPacienteEl) {
        modalBuscarPacienteEl.addEventListener('show.bs.modal', function () {
            if (buscarPacienteInput) buscarPacienteInput.value = '';
            renderPacientes('');
        });
    }

    if (buscarPacienteInput) {
        buscarPacienteInput.addEventListener('input', function () {
            renderPacientes(buscarPacienteInput.value);
        });
    }

    /* ==========================================================
     * 3. BUSCADOR DE MÉDICOS
     *    Lista fija de médicos disponibles por especialidad.
     * ========================================================== */
    const medicosDisponibles = [
        { nombre: 'Dr. Carlos Ramírez', especialidad: 'Cardiología' },
        { nombre: 'Dra. Lucía Flores', especialidad: 'Pediatría' },
        { nombre: 'Dr. Jorge Medina', especialidad: 'Medicina General' },
        { nombre: 'Dra. Andrea Salas', especialidad: 'Ginecología' },
        { nombre: 'Dr. Miguel Torres', especialidad: 'Odontología' },
        { nombre: 'Dra. Paola Rivas', especialidad: 'Laboratorio' }
    ];

    const listaMedicosEl = document.getElementById('listaMedicos');
    const buscarMedicoInput = document.getElementById('buscarMedicoInput');
    const modalBuscarMedicoEl = document.getElementById('modalBuscarMedico');

    function renderMedicos(filtro) {
        if (!listaMedicosEl) return;

        const filtroLower = (filtro || '').trim().toLowerCase();
        const filtrados = medicosDisponibles.filter(function (m) {
            return m.nombre.toLowerCase().includes(filtroLower) ||
                   m.especialidad.toLowerCase().includes(filtroLower);
        });

        listaMedicosEl.innerHTML = '';

        if (filtrados.length === 0) {
            const vacio = document.createElement('p');
            vacio.className = 'text-secondary text-center mb-0';
            vacio.textContent = 'No se encontraron médicos con ese criterio.';
            listaMedicosEl.appendChild(vacio);
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
                doctor.value = m.nombre;
                doctor.dispatchEvent(new Event('change'));

                // Si el servicio aún no fue elegido, lo sugerimos según la especialidad del médico
                if (service && service.value === '') {
                    const opcionCoincidente = Array.from(service.options)
                        .find(function (opt) { return opt.value === m.especialidad; });
                    if (opcionCoincidente) {
                        service.value = m.especialidad;
                        service.dispatchEvent(new Event('change'));
                    }
                }

                const modalInstance = bootstrap.Modal.getInstance(modalBuscarMedicoEl);
                if (modalInstance) modalInstance.hide();
            });

            listaMedicosEl.appendChild(item);
        });
    }

    if (modalBuscarMedicoEl) {
        modalBuscarMedicoEl.addEventListener('show.bs.modal', function () {
            if (buscarMedicoInput) buscarMedicoInput.value = '';
            renderMedicos('');
        });
    }

    if (buscarMedicoInput) {
        buscarMedicoInput.addEventListener('input', function () {
            renderMedicos(buscarMedicoInput.value);
        });
    }

    /* ==========================================================
     * 4. REGISTRAR CITA → PEDIR NÚMERO DE WHATSAPP → ENVIAR
     * ========================================================== */
    const btnRegistrarCita = document.getElementById('btnRegistrarCita');
    const modalWhatsappEl = document.getElementById('modalWhatsapp');
    const whatsappNumeroInput = document.getElementById('whatsappNumero');
    const whatsappErrorEl = document.getElementById('whatsappError');
    const btnConfirmarWhatsapp = document.getElementById('btnConfirmarWhatsapp');

    let modalWhatsappInstance = null;
    if (modalWhatsappEl) {
        modalWhatsappInstance = new bootstrap.Modal(modalWhatsappEl);
    }

    if (btnRegistrarCita && modalWhatsappInstance) {
        btnRegistrarCita.addEventListener('click', function () {
            const valido = validarFormularioCita(true);

            if (!valido) {
                alert('Por favor completa todos los campos antes de registrar la cita.');
                return;
            }

            if (whatsappNumeroInput) whatsappNumeroInput.value = '';
            if (whatsappErrorEl) whatsappErrorEl.classList.add('d-none');

            modalWhatsappInstance.show();
        });
    }

    if (btnConfirmarWhatsapp) {
        btnConfirmarWhatsapp.addEventListener('click', function () {
            const numero = (whatsappNumeroInput.value || '').trim();

            if (!/^\d{9}$/.test(numero)) {
                whatsappErrorEl.classList.remove('d-none');
                whatsappNumeroInput.classList.add('is-invalid');
                return;
            }

            whatsappErrorEl.classList.add('d-none');
            whatsappNumeroInput.classList.remove('is-invalid');

            // Construir el mensaje de confirmación con los datos de la cita
            const notes = document.getElementById('appointmentNotes');
            const notasTexto = notes ? notes.value.trim() : '';
            const mensaje =
                'Hola! Tu cita ha sido registrada:\n' +
                'Paciente: ' + patient.value + '\n' +
                'Médico: ' + doctor.value + '\n' +
                'Servicio: ' + service.value + '\n' +
                'Fecha: ' + date.value + '\n' +
                'Hora: ' + time.value + '\n' +
                'Modalidad: ' + mode.value +
                (notasTexto !== '' ? '\nObservaciones: ' + notasTexto : '') +
                '\n\n¡Te esperamos en CliniAgenda!';

            // Código de país Perú (+51). Ajustar si se requiere otro país.
            const enlaceWhatsapp = 'https://wa.me/51' + numero + '?text=' + encodeURIComponent(mensaje);

            // Abrimos WhatsApp en una nueva pestaña
            window.open(enlaceWhatsapp, '_blank');

            // Guardamos la cita en localStorage para que aparezca en la Agenda
            // (reminderSent queda en false: la Agenda maneja el recordatorio aparte)
            let citas = [];
            try { citas = JSON.parse(localStorage.getItem('citas')) || []; } catch (e) { citas = []; }

            citas.push({
                id: Date.now(),
                patient: patient.value,
                doctor: doctor.value,
                service: service.value,
                date: date.value,
                time: time.value,
                mode: mode.value,
                notes: notasTexto,
                reminderSent: false
            });

            localStorage.setItem('citas', JSON.stringify(citas));

            // Cerramos el modal y llevamos al usuario a la agenda ya actualizada
            modalWhatsappInstance.hide();
            window.location.href = 'agenda.html';
        });
    }

    // Permitir confirmar con Enter dentro del campo de número
    if (whatsappNumeroInput) {
        whatsappNumeroInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (btnConfirmarWhatsapp) btnConfirmarWhatsapp.click();
            }
        });
    }

});