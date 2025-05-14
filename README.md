# FlowPilot 🚀

<div align="center">
  <img src="/public/logoFlowPilot.png" alt="FlowPilot Logo" width="250" />
  <p><i>Gestión de proyectos colaborativa en tiempo real</i></p>
  
  <p align="center">
    <a href="#características">Características</a> •
    <a href="#tecnologías">Tecnologías</a> •
    <a href="#arquitectura">Arquitectura</a> •
    <a href="#instalación">Instalación</a> •
    <a href="#uso">Uso</a> •
    <a href="#demo">Demo</a>
  </p>
</div>

## 🌟 Resumen

FlowPilot es una plataforma moderna de gestión de proyectos diseñada para equipos que necesitan colaboración en tiempo real. Combina un tablero Kanban, mensajería instantánea y estadísticas detalladas para ofrecer una experiencia completa de gestión de proyectos.

Desarrollada con Next.js 15, MongoDB y Socket.IO, FlowPilot proporciona una experiencia fluida de usuario con actualizaciones en tiempo real, permitiendo a los equipos trabajar de forma coordinada y eficiente.

## ✨ Características

### Proyectos y Tareas

- **Tablero Kanban**: Gestiona tareas con una interfaz visual intuitiva
- **Estados Personalizados**: Mueve tareas entre estados (Por hacer, En progreso, En revisión, Completado)
- **Prioridades**: Asigna prioridades alta, media o baja a tareas
- **Asignación de Responsables**: Asigna tareas específicas a miembros del equipo

### Colaboración en Tiempo Real

- **Actualizaciones Instantáneas**: Cambios reflejados inmediatamente para todos los miembros
- **Chat Integrado**: Comunicación directa dentro de cada proyecto
- **Indicador de Presencia**: Visualización de usuarios conectados en tiempo real
- **Historial de Actividad**: Seguimiento de cambios y actualizaciones

### Análisis y Estadísticas

- **Dashboard Personalizado**: Visualización rápida del estado de proyectos y tareas
- **Gráficos Visuales**: Distribución de tareas, progreso del proyecto y más
- **Línea Temporal**: Seguimiento de tareas completadas a lo largo del tiempo
- **Métricas Personales**: Estadísticas individuales para cada usuario

### Gestión de Usuarios

- **Autenticación Segura**: Inicio de sesión con correo electrónico o proveedores OAuth
- **Roles y Permisos**: Administradores y usuarios con diferentes niveles de acceso
- **Perfil Personalizable**: Configuración de información de usuario
- **Tema Claro/Oscuro**: Personalización visual según preferencias

## 🛠️ Tecnologías

### Frontend

- [Next.js 15](https://nextjs.org/) con App Router
- [React 19](https://react.dev/) con Hooks avanzados
- [Tailwind CSS](https://tailwindcss.com/) para estilos adaptativos
- [Socket.IO Client](https://socket.io/docs/v4/client-api/) para comunicación en tiempo real
- [Hello Pangea/DND](https://github.com/hello-pangea/dnd) (fork de react-beautiful-dnd) para funcionalidad drag-and-drop
- [ApexCharts](https://apexcharts.com/) para visualización de datos

### Backend

- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction) para endpoints serverless
- [MongoDB](https://www.mongodb.com/) como base de datos principal
- [Socket.IO](https://socket.io/) para comunicación bidireccional en tiempo real
- [NextAuth.js](https://next-auth.js.org/) para autenticación y manejo de sesiones
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) para encriptación segura

### Herramientas de Desarrollo

- TypeScript para tipado estático
- ESLint y Prettier para linting y formateo
- Turbopack para desarrollo rápido
- Render para despliegue y hosting

## 🏗️ Arquitectura

FlowPilot utiliza una arquitectura moderna basada en componentes con comunicación en tiempo real:

```
Cliente <---> API Routes <---> MongoDB
   ↑           ↑
   ↓           ↓
Socket.IO <--> Socket.IO Server
```

- **Modelo de Datos**: Proyectos, Tareas, Usuarios, Comentarios y Mensajes
- **Contextos React**: Gestión de estado global para tema, autenticación y más
- **WebSockets**: Tres namespaces separados para chat, kanban y presencia de usuarios
- **API REST**: Endpoints para operaciones CRUD como respaldo

## 🚀 Instalación

### Requisitos Previos

- Node.js 16.x o superior
- NPM o Bun
- MongoDB (local o Atlas)

### Pasos

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/tu-usuario/flowpilot.git
   cd flowpilot
   ```

2. **Instalar dependencias**

   ```bash
   npm install
   # o
   bun install
   ```

3. **Configurar variables de entorno**

   Crea un archivo `.env.local` en la raíz del proyecto:

   ```
   # Base de datos
   MONGODB_URI=tu_uri_de_mongodb

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=tu_secreto_seguro

   # OAuth (opcional)
   GOOGLE_CLIENT_ID=tu_client_id
   GOOGLE_CLIENT_SECRET=tu_client_secret
   GITHUB_CLIENT_ID=tu_client_id
   GITHUB_CLIENT_SECRET=tu_client_secret
   ```

4. **Iniciar servidor de desarrollo**

   ```bash
   npm run dev
   # o
   bun dev
   ```

5. **Acceder a la aplicación**

   Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## 💡 Uso

### Primeros Pasos

1. **Regístrate** o inicia sesión con una cuenta existente
2. Accede al **Dashboard** para ver un resumen de proyectos y tareas
3. Crea un **nuevo proyecto** o únete a uno existente
4. Añade **tareas** y asígnalas a los miembros del equipo
5. Utiliza el **tablero Kanban** para gestionar el flujo de trabajo
6. Comunícate con tu equipo a través del **chat integrado**

### Flujo de Trabajo Recomendado

1. Planifica proyectos y define objetivos
2. Crea tareas específicas en el tablero Kanban
3. Asigna responsables y establece prioridades
4. Actualiza el estado de las tareas según avanzan
5. Comunícate con el equipo mediante el chat integrado
6. Analiza el progreso con las herramientas de estadísticas

## 🌐 Demo

Una versión demo está desplegada en: [https://flowpilot-8gjv.onrender.com](https://flowpilot-8gjv.onrender.com/)

### Credenciales Demo

- **Admin**: admin@ejemplo.com / password123
- **Usuario**: usuario@ejemplo.com / password123

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:

1. Haz fork del repositorio
2. Crea una nueva rama (`git checkout -b feature/amazing-feature`)
3. Realiza tus cambios
4. Haz commit (`git commit -m 'Add some amazing feature'`)
5. Push a la rama (`git push origin feature/amazing-feature`)
6. Abre un Pull Request

## 📜 Licencia

Este proyecto está licenciado bajo la licencia MIT. Consulta el archivo `LICENSE` para más información.

---

<div align="center">
  <sub>Hecho con ❤️ para gestionar proyectos eficientemente</sub>
</div>
