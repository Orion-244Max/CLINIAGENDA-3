/* ==========================================================
 * PACIENTES.JS
 * Maneja el listado, edición y eliminación de pacientes.
 * Toda la información vive en localStorage bajo la clave
 * "pacientes" (la crea paciente-form.js al registrar).
 * ========================================================== */

document.addEventListener('DOMContentLoaded', function () {

    const STORAGE_KEY = 'pacientes';

    const tbody = document.getElementById('tablaPacientesBody');
    const totalEl = document.getElementById('totalRegistrados');
    const estadoVacio = document.getElementById('estadoVacio');
    const contenedorTabla = document.getElementById('contenedorTabla');
    const modalEditar = document.getElementById('modalEditarPaciente');
    const formEditar = modalEditar ? modalEditar.querySelector('form') : null;

    function obtenerPacientes() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function guardarPacientes(lista) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    }

    function escapar(texto) {
        return String(texto == null ? '' : texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* ----------------------------------------------------------
     * RENDERIZAR TABLA COMPLETA DESDE LOCALSTORAGE
     * ---------------------------------------------------------- */
    function renderTabla() {
        const pacientes = obtenerPacientes();

        if (totalEl) totalEl.textContent = pacientes.length;

        if (!tbody) return;
        tbody.innerHTML = '';

        if (pacientes.length === 0) {
            if (contenedorTabla) contenedorTabla.classList.add('d-none');
            if (estadoVacio) estadoVacio.classList.remove('d-none');
            return;
        }

        if (contenedorTabla) contenedorTabla.classList.remove('d-none');
        if (estadoVacio) estadoVacio.classList.add('d-none');

        pacientes.forEach(function (p, index) {
            const badgeClass = p.sexo === 'Femenino' ? 'badge-femenino' : 'badge-masculino';

            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td>' + (index + 1) + '</td>' +
                '<td class="fw-semibold">' + escapar(p.nombre) + '</td>' +
                '<td>' + escapar(p.dni) + '</td>' +
                '<td>' + escapar(p.email) + '</td>' +
                '<td>' + escapar(p.telefono) + '</td>' +
                '<td>' + escapar(p.fechaNacimiento) + '</td>' +
                '<td><span class="badge ' + badgeClass + '">' + escapar(p.sexo || 'No especificado') + '</span></td>' +
                '<td>' +
                '  <div class="d-flex justify-content-center gap-2">' +
                '    <button type="button" class="btn btn-warning btn-sm fw-medium px-3 btn-editar-paciente" ' +
                '      data-bs-toggle="modal" data-bs-target="#modalEditarPaciente" ' +
                '      data-id="' + escapar(p.id) + '" data-nombre="' + escapar(p.nombre) + '" data-dni="' + escapar(p.dni) + '" ' +
                '      data-email="' + escapar(p.email) + '" data-telefono="' + escapar(p.telefono) + '" ' +
                '      data-fecha="' + escapar(p.fechaNacimiento) + '" data-sexo="' + escapar(p.sexo) + '" data-direccion="' + escapar(p.direccion) + '">' +
                '      Editar' +
                '    </button>' +
                '    <button type="button" class="btn btn-danger btn-sm fw-medium px-3 btn-eliminar-paciente" data-id="' + escapar(p.id) + '">' +
                '      Eliminar' +
                '    </button>' +
                '  </div>' +
                '</td>';

            tbody.appendChild(tr);
        });

        // Enlazar botones "Eliminar" recién creados
        tbody.querySelectorAll('.btn-eliminar-paciente').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const id = btn.getAttribute('data-id');
                const confirmar = confirm(
                    '¿Estás seguro de que deseas eliminar a este paciente?\n\nEsta acción no se puede deshacer.'
                );
                if (!confirmar) return;

                let lista = obtenerPacientes();
                lista = lista.filter(function (p) { return String(p.id) !== String(id); });
                guardarPacientes(lista);
                renderTabla();
            });
        });
    }

    /* ----------------------------------------------------------
     * MODAL EDITAR: precargar datos al abrir
     * ---------------------------------------------------------- */
    if (modalEditar) {
        modalEditar.addEventListener('show.bs.modal', function (evento) {
            const boton = evento.relatedTarget;
            if (!boton) return;

            const campoId = document.getElementById('edit-id');
            const campoNombre = document.getElementById('edit-nombre');
            const campoDni = document.getElementById('edit-dni');
            const campoEmail = document.getElementById('edit-email');
            const campoTelefono = document.getElementById('edit-telefono');
            const campoFecha = document.getElementById('edit-fecha');
            const campoSexo = document.getElementById('edit-sexo');
            const campoDireccion = document.getElementById('edit-direccion');

            if (campoId) campoId.value = boton.getAttribute('data-id') || '';
            if (campoNombre) campoNombre.value = boton.getAttribute('data-nombre') || '';
            if (campoDni) campoDni.value = boton.getAttribute('data-dni') || '';
            if (campoEmail) campoEmail.value = boton.getAttribute('data-email') || '';
            if (campoTelefono) campoTelefono.value = boton.getAttribute('data-telefono') || '';
            if (campoFecha) campoFecha.value = boton.getAttribute('data-fecha') || '';
            if (campoSexo) campoSexo.value = boton.getAttribute('data-sexo') || '';
            if (campoDireccion) campoDireccion.value = boton.getAttribute('data-direccion') || '';
        });
    }

    /* ----------------------------------------------------------
     * MODAL EDITAR: guardar cambios en localStorage
     * ---------------------------------------------------------- */
    if (formEditar) {
        formEditar.addEventListener('submit', function (e) {
            e.preventDefault();

            const id = document.getElementById('edit-id').value;
            let lista = obtenerPacientes();
            const idx = lista.findIndex(function (p) { return String(p.id) === String(id); });

            const actualizado = {
                id: id,
                nombre: document.getElementById('edit-nombre').value.trim(),
                dni: document.getElementById('edit-dni').value.trim(),
                email: document.getElementById('edit-email').value.trim(),
                telefono: document.getElementById('edit-telefono').value.trim(),
                fechaNacimiento: document.getElementById('edit-fecha').value,
                sexo: document.getElementById('edit-sexo').value,
                direccion: document.getElementById('edit-direccion').value.trim()
            };

            if (idx >= 0) {
                lista[idx] = actualizado;
            } else {
                lista.push(actualizado);
            }

            guardarPacientes(lista);
            renderTabla();

            const modalInstance = bootstrap.Modal.getInstance(modalEditar);
            if (modalInstance) modalInstance.hide();
        });
    }

    /* ----------------------------------------------------------
     * EVITAR DOBLE ENVÍO EN CUALQUIER FORM DE LA PÁGINA
     * ---------------------------------------------------------- */
    document.querySelectorAll('form').forEach(function (formulario) {
        formulario.addEventListener('submit', function () {
            const boton = formulario.querySelector('button[type="submit"]');
            if (!boton) return;
            boton.disabled = true;
            const textoOriginal = boton.textContent;
            boton.textContent = 'Procesando...';
            setTimeout(function () {
                boton.disabled = false;
                boton.textContent = textoOriginal;
            }, 1500);
        });
    });

    // Primer render al cargar la página
    renderTabla();
});