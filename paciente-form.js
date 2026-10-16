/* ==========================================================
 * PACIENTE-FORM.JS (Consolidado)
 * Maneja la validación del formulario y el guardado en
 * LocalStorage para simular el registro de pacientes.
 * ========================================================== */

document.addEventListener('DOMContentLoaded', function () {

    const btnValidar = document.getElementById('btnValidarPaciente');
    const form = document.querySelector('form');

    if (!form) return;

    // ==========================================================
    // 1. VALIDACIÓN VISUAL DE CAMPOS
    // ==========================================================
    if (btnValidar) {
        btnValidar.addEventListener('click', function () {
            let valido = true;

            const nombre = document.getElementById('nombrePaciente');
            const dni = document.getElementById('dniPaciente');
            const fecha = document.getElementById('fechaNacPaciente');
            const correo = document.getElementById('emailPaciente');
            const telefono = document.getElementById('telPaciente');
            const sexo = document.getElementById('sexoPaciente');

            // Limpiar mensajes anteriores
            form.querySelectorAll('.validacion-error, .validacion-correcto').forEach(e => e.remove());
            form.querySelectorAll('.is-invalid, .is-valid').forEach(c => {
                c.classList.remove('is-invalid');
                c.classList.remove('is-valid');
            });

            function error(campo, mensaje) {
                valido = false;
                campo.classList.add('is-invalid');
                const msj = document.createElement('div');
                msj.className = 'validacion-error text-danger mt-1 small';
                msj.textContent = '⚠ ' + mensaje;
                campo.parentNode.appendChild(msj);
            }

            function correcto(campo, mensaje) {
                campo.classList.add('is-valid');
                const msj = document.createElement('div');
                msj.className = 'validacion-correcto text-success mt-1 small';
                msj.textContent = '✓ ' + mensaje;
                campo.parentNode.appendChild(msj);
            }

            // Validaciones (Nombre, DNI, Fecha, Correo, Teléfono, Sexo)
            if (nombre.value.trim() === '') { error(nombre, 'Falta completar el nombre.'); } 
            else if (nombre.value.trim().length < 3) { error(nombre, 'Mínimo 3 caracteres.'); } 
            else { correcto(nombre, 'Correcto.'); }

            if (dni.value.trim() === '') { error(dni, 'Falta completar el DNI.'); } 
            else if (!/^\d{8}$/.test(dni.value.trim())) { error(dni, 'Exactamente 8 números.'); } 
            else { correcto(dni, 'Correcto.'); }

            if (fecha.value === '') { error(fecha, 'Falta la fecha.'); } 
            else { correcto(fecha, 'Correcto.'); }

            if (correo.value.trim() === '') { error(correo, 'Falta el correo.'); } 
            else if (!correo.validity.valid) { error(correo, 'Correo inválido.'); } 
            else { correcto(correo, 'Correcto.'); }

            if (telefono.value.trim() === '') { error(telefono, 'Falta el teléfono.'); } 
            else if (!/^\d{9}$/.test(telefono.value.trim())) { error(telefono, 'Exactamente 9 números.'); } 
            else { correcto(telefono, 'Correcto.'); }

            if (sexo.value === '') { error(sexo, 'Falta el sexo.'); } 
            else { correcto(sexo, 'Correcto.'); }
        });
    }

    // ==========================================================
    // 2. LIMPIAR ERRORES AL ESCRIBIR
    // ==========================================================
    const campos = ['nombrePaciente', 'dniPaciente', 'fechaNacPaciente', 'emailPaciente', 'telPaciente', 'sexoPaciente'];
    
    campos.forEach(function (id) {
        const campo = document.getElementById(id);
        if (!campo) return;

        function limpiar() {
            const errorMsj = campo.parentNode.querySelector('.validacion-error');
            const correctoMsj = campo.parentNode.querySelector('.validacion-correcto');
            if (errorMsj) errorMsj.remove();
            if (correctoMsj) correctoMsj.remove();
            campo.classList.remove('is-invalid', 'is-valid');
        }

        campo.addEventListener('input', limpiar);
        campo.addEventListener('change', limpiar);
    });

    // ==========================================================
    // 3. GUARDAR EN LOCALSTORAGE Y REDIRIGIR AL HACER SUBMIT
    // ==========================================================
    form.addEventListener('submit', function (e) {
        e.preventDefault(); // Detiene el envío hacia el backend de Spring Boot

        // IMPORTANTE: Capturamos los datos usando los IDs reales de tu HTML (terminan en "Paciente")
        const nuevoPaciente = {
            id: Date.now(), 
            nombre: document.getElementById('nombrePaciente')?.value || '',
            dni: document.getElementById('dniPaciente')?.value || '',
            email: document.getElementById('emailPaciente')?.value || '',
            telefono: document.getElementById('telPaciente')?.value || '',
            fechaNacimiento: document.getElementById('fechaNacPaciente')?.value || '',
            sexo: document.getElementById('sexoPaciente')?.value || 'Masculino',
            // Asumimos que la dirección no tiene el sufijo "Paciente", si lo tiene, cámbialo a 'direccionPaciente'
            direccion: document.getElementById('dirPaciente')?.value || ''
        };

        // Guardar en localStorage
        let lista = JSON.parse(localStorage.getItem('pacientes')) || [];
        lista.push(nuevoPaciente);
        localStorage.setItem('pacientes', JSON.stringify(lista));

        // Redirigir automáticamente a la tabla
        window.location.href = 'pacientes.html';
    });

});