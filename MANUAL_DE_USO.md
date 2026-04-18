# Manual de Uso - NSJ Store (Desktop App)

Bienvenido a la versión de escritorio de tu sistema de ventas de figuras de anime.

## 💾 ¿Dónde se guardan mis datos?

Todos los datos (clientes, figuras registradas, pagos, etc.) ya no se limitan al navegador web, sino que ahora se persisten de manera oficial en un archivo `JSON` de tu computadora. Nunca los perderás si limpias el historial.

Dependiendo de tu Sistema Operativo, aquí es donde lo encontrarás localizado:
- **Windows:** `C:\Users\{TuUsuario}\AppData\Roaming\proyect-store-anime\VentasDB.json`
- **Mac:** `~/Library/Application Support/proyect-store-anime/VentasDB.json`

*(Nota: en Windows la carpeta AppData está oculta por defecto, debes activar "Mostrar elementos ocultos" en la pestaña "Vista" de tu explorador de archivos).*

## 🔄 ¿Cómo hacer copias de seguridad (Backups)?
Cuidar tu información es crítico. Como todo es manejado como un archivo, realizar tus copias es ridículamente fácil:

1. Ingresa a la ruta en tu computadora.
2. **Copia** el archivo `VentasDB.json`.
3. Guárdalo (pégalo) en Google Drive, y/o un disco duro externo.
4. Para **restaurar** los datos (si cambias de negocio o computadora), simplemente instala y abre tu app, luego cierra la ventana de la app y reemplaza el archivo nuevo y vacío por tu *VentasDB.json* respaldado en esa ruta.

## 🚀 ¿Cómo iniciar la Aplicación Modo Desarrollador?
Como ahora corres un servicio de Electron y React en conjunto, basta con escribir en consola:
```bash
npm run dev
```

Esto abrirá la ventana nativa de escritorio cargando la moderna interfaz, pero con la base ligada al Archivo de Datos Local de Node.js.

¡A vender!
