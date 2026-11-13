# Porter Desk — Sistema de gestión de reservas

Proyecto independiente de **front-end** para portafolio. Representa el panel administrativo de una agencia de viajes ficticia. Se desarrolló con HTML, CSS y JavaScript puro, sin frameworks ni backend.

## Funcionalidades

- **Inicio:** resumen de reservas, pendientes y confirmadas, valor confirmado en USD, gráfico de los últimos seis meses, distribución por estado y reservas recientes.
- **Reservas:** crear, consultar, editar y eliminar; cambiar el estado desde la tabla; buscar por cliente, correo o ID; filtrar por experiencia y estado; ordenar por fechas e importes; paginación.
- **Cálculo automático:** el precio por pasajero depende de la experiencia y el total se actualiza al cambiar la cantidad de pasajeros.
- **Clientes:** lista calculada a partir de las reservas, agrupando por correo electrónico. Permite ver las reservas de un cliente.
- **Configuración:** nombre y correo de la agencia, estado inicial de las nuevas reservas, filas por página y restauración de datos de ejemplo.
- **Exportación CSV:** descarga las reservas que coincidan con los filtros activos, con encabezados en español y codificación UTF-8.
- **Diseño adaptable:** menú lateral para móviles y tablas con desplazamiento horizontal en pantallas pequeñas.
- **Accesibilidad básica:** HTML semántico, etiquetas en formularios, cuadros de diálogo nativos, controles por teclado y soporte para movimiento reducido.

## Cómo usarlo

1. Descarga o clona el repositorio.
2. Abre `index.html` en un navegador moderno. No requiere instalación.
3. Selecciona **Nueva reserva** para registrar una reserva de prueba o navega por las secciones del menú.

También puedes publicarlo en **GitHub Pages** o **Netlify**. Toda la ejecución sucede en el navegador.

## Tecnologías

- HTML5 (estructura semántica)
- CSS3 (Grid, Flexbox y media queries)
- JavaScript vanilla ES6+ (DOM, eventos, arreglos, Intl y exportación Blob)
- `localStorage` (almacenamiento de datos en el navegador)

## Estructura

```text
porter-desk/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
├── README.md
└── LICENSE
```

## Datos y limitaciones

- Las reservas, clientes y precios son **ficticios**, creados únicamente con fines de demostración.
- En el primer inicio se cargan reservas de ejemplo. Los cambios se conservan al recargar, siempre que el navegador permita el almacenamiento local.
- **No hay inicio de sesión real, servidor, API, pagos ni sincronización entre usuarios.** No ingreses datos personales reales.
- Los clientes se generan a partir de las reservas; no existe una base de datos de clientes independiente.
- Los precios en USD son ilustrativos y se pueden modificar en la constante `TOURS`, dentro de `js/app.js`.
- El valor confirmado suma únicamente las reservas con estado **Confirmada**, y **no equivale a pagos recibidos**.
- El archivo CSV contiene las reservas que coinciden con los filtros, no solo la página actual de la tabla.
- Los valores internos de los estados se conservan en inglés (`Pending`, `Confirmed`, `Cancelled`) para mantener el funcionamiento y la compatibilidad de los datos almacenados. La interfaz y el CSV muestran sus traducciones al español.

## Qué demuestra para una entrevista técnica

Renderizado y actualización del DOM, delegación de eventos, búsqueda y filtrado de arreglos, CRUD, almacenamiento local, validación de formularios, gestión de estado sin frameworks, cálculos derivados, generación de archivos CSV, HTML semántico y CSS responsive.

## Licencia

MIT. Consulta `LICENSE`.
