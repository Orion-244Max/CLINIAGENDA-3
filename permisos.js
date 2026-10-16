/* ==========================================================
 * PERMISOS.JS
 * ----------------------------------------------------------
 * Sesión y roles (ADMIN, MEDICO, PACIENTE) simulados 100% en
 * localStorage. Se incluye en TODAS las páginas y se encarga de:
 *
 *   1. Crear 3 usuarios de prueba (admin / médico / paciente)
 *      la primera vez que se abre el sitio.
 *   2. Guardar / leer / cerrar la sesión actual.
 *   3. Mostrar u ocultar los enlaces del menú según el rol
 *      del usuario conectado.
 *
 * Debe cargarse ANTES que acceso.js, app.js, etc.
 * ========================================================== */

(function () {

    const USUARIOS_KEY = 'usuarios';
    const SESION_KEY = 'sesionActual';

    /* ----------------------------------------------------------
     * 1. USUARIOS (localStorage.usuarios)
     * ---------------------------------------------------------- */
    function obtenerUsuarios() {
        try { return JSON.parse(localStorage.getItem(USUARIOS_KEY)) || []; }
        catch (e) { return []; }
    }

    function guardarUsuarios(lista) {
        localStorage.setItem(USUARIOS_KEY, JSON.stringify(lista));
    }

    // Crea las 3 cuentas de demostración (una sola vez).
    function sembrarUsuariosDemo() {
        const existentes = obtenerUsuarios();
        if (existentes.length > 0) return;

        guardarUsuarios([
            {
                nombre: 'Administrador CliniAgenda',
                dni: '00000001',
                email: 'admin@cliniagenda.com',
                phone: '999999999',
                password: 'admin123',
                rol: 'ADMIN'
            },
            {
                nombre: 'Dr. Carlos Ramírez',
                dni: '00000002',
                email: 'medico@cliniagenda.com',
                phone: '999999998',
                password: 'medico123',
                rol: 'MEDICO'
            },
            {
                nombre: 'Paciente Demo',
                dni: '00000003',
                email: 'paciente@cliniagenda.com',
                phone: '999999997',
                password: 'paciente123',
                rol: 'PACIENTE'
            }
        ]);
    }

    /* ----------------------------------------------------------
     * 2. SESIÓN ACTUAL (localStorage.sesionActual)
     * ---------------------------------------------------------- */
    function obtenerSesion() {
        try { return JSON.parse(localStorage.getItem(SESION_KEY)); }
        catch (e) { return null; }
    }

    function guardarSesion(usuario) {
        localStorage.setItem(SESION_KEY, JSON.stringify({
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol
        }));
    }

    function cerrarSesion() {
        localStorage.removeItem(SESION_KEY);
        window.location.href = 'index.html';
    }

    // Utilidades disponibles para acceso.js (login / registro).
    window.CliniAuth = {
        obtenerUsuarios: obtenerUsuarios,
        guardarUsuarios: guardarUsuarios,
        obtenerSesion: obtenerSesion,
        guardarSesion: guardarSesion,
        cerrarSesion: cerrarSesion
    };

    /* ----------------------------------------------------------
     * 3. VISIBILIDAD DEL MENÚ SEGÚN EL ROL
     * ----------------------------------------------------------
     *   ADMIN    -> Pacientes, Agenda, + Nuevo paciente,
     *               Reservar cita, Registro/Login
     *   PACIENTE -> Agenda Paciente, Registro/Login
     *   MEDICO   -> Agenda Médico, Registro/Login
     *   (sin sesión) -> Inicio y Registro/Login únicamente
     * ---------------------------------------------------------- */
    const PAGINAS_POR_ROL = {
        'pacientes.html':       ['ADMIN'],
        'agenda.html':          ['ADMIN'],
        'paciente-form.html':   ['ADMIN'],
        'regiscita.html':       ['ADMIN'],
        'agenda-paciente.html': ['PACIENTE'],
        'agenda-medico.html':   ['MEDICO']
    };

    function nombreArchivo(href) {
        if (!href) return '';
        return href.split('/').pop().split('?')[0].split('#')[0].toLowerCase();
    }

    function aplicarPermisosNavbar() {
        const sesion = obtenerSesion();
        const rol = sesion ? sesion.rol : null;

        document.querySelectorAll('.navbar-nav > li.nav-item').forEach(function (li) {
            // No tocar el propio ítem de sesión (se gestiona aparte).
            if (li.id === 'navSesionActual') return;

            const link = li.querySelector('a[href]');
            if (!link) return; // ej: el botón de tema, que no es un <a>

            const archivo = nombreArchivo(link.getAttribute('href'));

            // "Inicio" solo aparece cuando no hay sesión iniciada.
            if (archivo === 'index.html') {
                li.style.display = sesion ? 'none' : '';
                return;
            }

            // "Registro / Login": visible solo SIN sesión iniciada.
            if (archivo === 'acceso.html') {
                li.style.display = sesion ? 'none' : '';
                return;
            }

            // Enlaces sin regla específica (por compatibilidad, se dejan visibles).
            if (!PAGINAS_POR_ROL[archivo]) {
                return;
            }

            const rolesPermitidos = PAGINAS_POR_ROL[archivo];
            const visible = !!rol && rolesPermitidos.indexOf(rol) !== -1;
            li.style.display = visible ? '' : 'none';
        });

        insertarInfoSesion(sesion);
    }

    /* ----------------------------------------------------------
     * 4. ROL DEL USUARIO CONECTADO
     * ---------------------------------------------------------- */
    function insertarInfoSesion(sesion) {
        const navbarList = document.querySelector('.navbar-nav');
        if (!navbarList) return;

        let item = document.getElementById('navSesionActual');

        if (!sesion) {
            if (item) item.remove();
            return;
        }

        const etiquetaRol = {
            ADMIN: 'Admin',
            MEDICO: 'Médico',
            PACIENTE: 'Paciente'
        }[sesion.rol] || sesion.rol;

        if (!item) {
            item = document.createElement('li');
            item.className = 'nav-item ms-lg-2 session-nav-item';
            item.id = 'navSesionActual';
            navbarList.appendChild(item);
        }

        item.innerHTML =
            '<span class="session-role">' + escaparTexto(etiquetaRol) + '</span>' +
            '<button type="button" class="session-logout" aria-label="Cerrar sesión" title="Cerrar sesión">' +
                '<span class="session-logout-icon" aria-hidden="true">↪</span>' +
                '<span class="session-logout-label">Cerrar sesión</span>' +
            '</button>';

        item.querySelector('.session-logout').addEventListener('click', cerrarSesion);
    }

    function escaparTexto(texto) {
        return String(texto == null ? '' : texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    document.addEventListener('DOMContentLoaded', function () {
        sembrarUsuariosDemo();
        aplicarPermisosNavbar();
    });

})();
