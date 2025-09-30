# 🎬 Fliverse - Backend API

<div align="center">

<img src="https://fliverse.es/logo.png" alt="Fliverse Logo" width="200" height="200"/>
  
  **API REST para la plataforma web comunitaria Fliverse**
  
  [![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-4.21.2-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Sequelize](https://img.shields.io/badge/Sequelize-6.37.6-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org/)

</div>

---

## Tabla de Contenidos

- [Sobre el Proyecto](#sobre-el-proyecto)
- [Características](#características)
- [Tecnologías](#tecnologías)
- [Instalación y Configuración](#instalación-y-configuración)
- [API Endpoints](#api-endpoints)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentación API](#documentación-api)
- [Licencia](#licencia)
- [Autor](#autor)

---

## Sobre el Proyecto

**Fliverse Backend** es la API REST desarrollada como **Proyecto de Fin de Grado (TFG)** que proporciona todos los servicios y funcionalidades necesarias para la plataforma web Fliverse.

### Objetivo Principal

Proporcionar una API robusta y escalable que permita:
- **Autenticación** segura de usuarios con JWT y OAuth2 (Google)
- **Gestión** completa de contenido audiovisual
- **Administración** de listas personalizadas y valoraciones
- **Sistema** de comentarios y interacción social
- **Integración** con servicios externos (Azure Storage)

---

## Características

### Funcionalidades de la API

- **Sistema de Autenticación**
  - Registro e inicio de sesión con JWT
  - Integración con Google OAuth2
  - Middleware de autenticación y autorización
  - Sistema de recuperación de contraseñas

- **Gestión de Contenido**
  - CRUD completo para películas y series
  - Sistema de búsqueda avanzada
  - Gestión de imágenes con Azure Blob Storage

- **Listas y Valoraciones**
  - Creación y gestión de listas personalizadas
  - Sistema de valoraciones (0-10)
  - Seguimiento de contenido visto/por ver

- **Sistema Social**
  - Comentarios en contenido
  - Perfiles de usuario
  - Sistema de notificaciones por email

### Características Técnicas

- **Seguridad**: Rate limiting, validación de datos, encriptación
- **Documentación**: Swagger/OpenAPI integrado
- **Almacenamiento de imágenes**: Azure Storage Account

---

## Tecnologías

### Backend Framework
- **[Node.js](https://nodejs.org/)** - Runtime de JavaScript
- **[Express.js](https://expressjs.com/)** - Framework web

### Base de Datos
- **[PostgreSQL](https://www.postgresql.org/)** - Base de datos relacional
- **[Sequelize](https://sequelize.org/)** - ORM para Node.js

### Autenticación y Seguridad
- **[JSON Web Tokens](https://www.npmjs.com/package/jsonwebtoken)** - Autenticación
- **[BCrypt](https://www.npmjs.com/package/bcrypt)** - Hash de contraseñas
- **[Google Auth Library](https://www.npmjs.com/package/google-auth-library)** - OAuth2 con Google
- **[Express Rate Limit](https://www.npmjs.com/package/express-rate-limit)** - Rate limiting

### Servicios Externos
- **[Azure Blob Storage](https://www.npmjs.com/package/@azure/storage-blob)** - Almacenamiento de archivos
- **[Nodemailer](https://www.npmjs.com/package/nodemailer)** - Envío de emails
- **[Multer](https://www.npmjs.com/package/multer)** - Manejo de archivos

### Documentación y Desarrollo
- **[Swagger UI Express](https://www.npmjs.com/package/swagger-ui-express)** - Documentación interactiva
- **[Swagger JSDoc](https://www.npmjs.com/package/swagger-jsdoc)** - Generación de documentación
- **[Nodemon](https://www.npmjs.com/package/nodemon)** - Desarrollo con hot reload

### Utilidades
- **[Dotenv](https://www.npmjs.com/package/dotenv)** - Variables de entorno
- **[Generate Password](https://www.npmjs.com/package/generate-password)** - Generación de contraseñas aleatorias

---

## Instalación y Configuración

### Prerrequisitos

Asegúrate de tener instalado:
- **Node.js** (versión 18 o superior)
- **npm** (viene con Node.js)
- **PostgreSQL** (versión 14 o superior)

```bash
# Verificar versiones
node --version
npm --version
psql --version
```

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/BetaGun03/fliverse-backend.git
   cd fliverse-backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Crear archivo .env en la raíz del proyecto
   touch .env
   ```

   Configurar las siguientes variables en `.env`:
   ```env
   # Puerto del servidor
   PORT=3000

   # Base de datos
   PGUSER=tu_usuario
   PGPASSWORD=tu_contraseña
   PGSERVER=direccion_del_servidor

   # Google OAuth
   GOOGLE_CLIENT_ID=tu_google_client_id

   # JWT
   JWT_SECRET=tu_jwt_secret

   # Autenticación para Swagger
   SWAGGER_USER=tu_usuario_swagger
   SWAGGER_PASSWORD_HASH=tu_contraseña_swagger_hasheada

   # Email de Zoho
   ZOHO_USER=tu_email
   ZOHO_PASSWORD=tu_contraseña_email

   # Azure Storage Account
   AZURE_STORAGE_ACCOUNT_NAME=tu_azure_storage_account_name
   AZURE_STORAGE_ACCOUNT_KEY=tu_azure_storage_account_key
   AZURE_STORAGE_CONTAINER_NAME=tu_contenedor
   AZURE_STORAGE_CONNECTION_STRING=tu_connection_string_para_azure

   # CORS
   ALLOWED_ORIGIN=http://tu_dominio_frontend
   ALLOWED_ORIGIN_LOCAL=http://localhost:3000
   ```

4. **Iniciar el servidor**
   ```bash
   nodemon ./app.js
   ```

5. **Verificar instalación**
   ```
   Servidor local (redirecciona hacia la documentación): http://localhost:3000
   Documentación de la API: http://localhost:3000/api-docs
   ```

---

## Endpoints de la API

### Usuarios
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/users/register` | Registro de usuario |
| `POST` | `/users/login` | Inicio de sesión |
| `POST` | `/users/loginGoogle` | Autenticación con Google |
| `POST` | `/users/logout` | Cierre de sesión |
| `POST` | `/users/logoutAll` | Cerrar sesión en todos los dispositivos |
| `GET` | `/users/me` | Obtener perfil del usuario autenticado |
| `PATCH` | `/users/me` | Actualizar perfil del usuario |
| `DELETE` | `/users/me` | Eliminar cuenta del usuario |
| `GET` | `/users/me/profile_pic` | Obtener imagen de perfil |

### Contenido
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/contents` | Crear nuevo contenido |
| `PATCH` | `/contents/:id` | Actualizar contenido específico |
| `GET` | `/contents/searchById` | Buscar contenido por ID |
| `GET` | `/contents/searchByTitle` | Buscar contenido por título |
| `GET` | `/contents/posterById` | Obtener póster por ID |
| `GET` | `/contents/posterByTitle` | Obtener póster por título |
| `GET` | `/contents/random` | Obtener contenido aleatorio |
| `GET` | `/contents/latest` | Obtener contenido más reciente |
| `GET` | `/contents/genres` | Obtener géneros disponibles |

### Listas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/lists` | Crear nueva lista |
| `GET` | `/lists` | Obtener listas del usuario |
| `GET` | `/lists/:id` | Obtener lista específica por ID |
| `PATCH` | `/lists/:id` | Actualizar lista específica |
| `POST` | `/lists/:id/contents` | Añadir contenido a lista específica |

### Comentarios
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/comments` | Crear nuevo comentario |
| `GET` | `/comments/:id` | Obtener comentario específico |
| `GET` | `/comments/content/:contentId` | Obtener comentarios de un contenido |

### Valoraciones
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/ratings` | Crear nueva valoración |
| `GET` | `/ratings` | Obtener valoraciones del usuario |
| `GET` | `/ratings/:contentId` | Obtener valoración específica por contenido |
| `PATCH` | `/ratings/:contentId` | Actualizar valoración de contenido |
| `DELETE` | `/ratings/:contentId` | Eliminar valoración de contenido |
| `GET` | `/ratings/average/:contentId` | Obtener valoración promedio de contenido |

### Contenido-Usuario (Seguimiento)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/contents_user` | Marcar contenido como visto/por ver |
| `GET` | `/contents_user` | Obtener relaciones contenido-usuario |
| `GET` | `/contents_user/watched` | Obtener contenido marcado como visto |
| `GET` | `/contents_user/:contentId` | Obtener relación específica contenido-usuario |
| `PATCH` | `/contents_user/:contentId` | Actualizar estado de contenido |
| `DELETE` | `/contents_user/:contentId` | Eliminar seguimiento de contenido |

---

## Estructura del Proyecto

```
├── 📄 app.js                    # Archivo principal de la aplicación
├── 📄 package.json              # Dependencias y scripts
├── 📄 vercel.json              # Configuración de despliegue en Vercel
├── 📁 api-docs/                # Configuración de la documentación Swagger
│   └── 📄 swagger.js           # Configuración de Swagger
├── 📁 config/                  # Configuraciones
│   ├── 📄 azureStorage.js      # Configuración Azure Storage
│   └── 📄 mailer.js            # Configuración de email
├── 📁 db/                      # Base de datos
│   └── 📄 sequelizeConnection.js # Conexión Sequelize para la base de datos
├── 📁 html-templates/          # Plantillas de email
│   ├── 📄 loginEmail.html      # Email de inicio de sesión
│   ├── 📄 logoutFromAllDevices.html     # Email de cierre de sesión en todos los dispositivos
│   ├── 📄 registerEmail.html   # Email de registro
│   └── 📄 userUpdatedInfo.html   # Email de actualización de información del usuario
├── 📁 middlewares/             # Middlewares personalizados
│   ├── 📄 auth.js              # Middleware de autenticación
│   ├── 📄 express-rate-limit.js # Rate limiting
│   ├── 📄 swaggerAuth.js       # Autenticación Swagger
│   └── 📄 upload.js            # Manejo de archivos
├── 📁 models/                  # Modelos de Sequelize
│   ├── 📄 comment.js           # Modelo de comentarios
│   ├── 📄 content_list.js      # Modelo de contenido-lista
│   ├── 📄 content_user.js      # Modelo de contenido-usuario
│   ├── 📄 content.js           # Modelo de contenido
│   ├── 📄 list.js              # Modelo de listas
│   ├── 📄 rating.js            # Modelo de valoraciones
│   ├── 📄 relations.js         # Relaciones entre modelos
│   └── 📄 user.js              # Modelo de usuario
└── 📁 routers/                 # Rutas de la API
    ├── 📄 comment.js           # Rutas de comentarios
    ├── 📄 content_user.js      # Relaciones usuario-contenido
    ├── 📄 content.js           # Rutas de contenido
    ├── 📄 list.js              # Rutas de listas
    ├── 📄 rating.js            # Rutas de valoraciones
    └── 📄 user.js              # Rutas de usuarios
```

---

## Documentación API

La API incluye documentación interactiva generada automáticamente con Swagger/OpenAPI.

### Acceso a la Documentación

- **Desarrollo**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### Características de la Documentación

- **Interfaz Interactiva**: Probar endpoints directamente desde el navegador
- **Esquemas Detallados**: Modelos de datos completos
- **Ejemplos de Uso**: Requests y responses de ejemplo
- **Autenticación**: Soporte para testing con JWT

---

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## Autor

**Jaime Hedrera Rosa** - *Desarrollador Full Stack*

- **Portafolio**: [jaimehedrera.es](https://jaimehedrera.es)
- **LinkedIn**: [Jaime Hedrera Rosa](https://www.linkedin.com/in/jaimehedrerarosa)
- **Email**: [business@jaimehedrera.es](mailto:business@jaimehedrera.es)
- **GitHub**: [@BetaGun03](https://github.com/BetaGun03)

---

<div align="center">
  <p>Desarrollado como TFG por Jaime Hedrera Rosa.</p>
</div>