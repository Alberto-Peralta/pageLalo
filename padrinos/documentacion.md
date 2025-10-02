# Sistema de Padrinos Misioneros - Documentación Completa
## Panel de Superusuario v1.0

---

## Tabla de Contenido

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Estructura de Archivos](#estructura-de-archivos)
5. [Base de Datos](#base-de-datos)
6. [Autenticación y Seguridad](#autenticación-y-seguridad)
7. [Funcionalidades del Panel](#funcionalidades-del-panel)
8. [API y Funciones](#api-y-funciones)
9. [Migración desde Sistema Anterior](#migración-desde-sistema-anterior)
10. [Solución de Problemas](#solución-de-problemas)
11. [Mantenimiento](#mantenimiento)
12. [Anexos](#anexos)

---

## Introducción

### Descripción General
El Sistema de Padrinos Misioneros es una aplicación web completa que permite gestionar promotores y sus respectivos padrinos. El sistema cuenta con dos niveles de acceso:

1. **Panel de Promotor**: Para que cada promotor gestione sus propios padrinos
2. **Panel de Superusuario**: Para administradores que supervisan múltiples promotores

### Objetivos
- Centralizar la gestión de múltiples promotores
- Proporcionar visibilidad global de todos los padrinos
- Facilitar la creación y administración de cuentas de promotores
- Generar reportes consolidados del sistema
- Mantener seguridad y separación de datos

### Tecnologías Utilizadas
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Realtime Database)
- **Frameworks CSS**: Tailwind CSS
- **Iconos**: Font Awesome 6.4.0
- **Arquitectura**: Modular, orientada a componentes

---

## Arquitectura del Sistema

### Diagrama de Componentes

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Superusuario  │    │    Promotor     │    │     Firebase    │
│                 │    │                 │    │                 │
│ - Gestión       │◄──►│ - Gestión       │◄──►│ - Auth          │
│   Promotores    │    │   Padrinos      │    │ - Database      │
│ - Vista Global  │    │ - Visitas       │    │ - Hosting       │
│ - Reportes      │    │ - Reportes      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Flujo de Datos

1. **Superusuario** crea cuentas de **Promotores**
2. **Promotores** gestionan sus **Padrinos**
3. **Padrinos** tienen **Visitas** registradas
4. **Superusuario** ve datos consolidados de todos

### Niveles de Acceso

| Rol | Permisos |
|-----|----------|
| Superusuario | Crear/editar/eliminar promotores, ver todos los datos, generar reportes globales |
| Promotor | Gestionar solo sus padrinos, registrar visitas, ver sus reportes |

---

## Instalación y Configuración

### Requisitos Previos

- Proyecto Firebase configurado
- Dominio web (local o hosting)
- Navegador web moderno
- Acceso a la consola de Firebase

### Paso 1: Preparación de Archivos

Crear la siguiente estructura de archivos:

```
proyecto/
├── index.html                    # Panel de promotores (existente)
├── super-admin.html             # Panel de superusuario (nuevo)
├── script.js                   # Lógica promotores (existente)
├── super-admin.js              # Lógica superusuario (nuevo)
├── auth.js                     # Auth promotores (existente)
├── super-admin-auth.js         # Auth superusuario (nuevo)
├── firebase-config.js          # Configuración Firebase (existente)
├── super-admin-setup.js        # Configuración inicial (nuevo)
├── styles.css                  # Estilos (existente)
├── reports.js                  # Reportes (existente)
└── reports.css                 # Estilos reportes (existente)
```

### Paso 2: Configuración de Firebase

#### 2.1 Reglas de Database

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || root.child('super_admins').child(auth.uid).exists())",
        ".write": "auth != null && (auth.uid == $uid || root.child('super_admins').child(auth.uid).exists())"
      }
    },
    "promoters": {
      ".read": "auth != null && root.child('super_admins').child(auth.uid).exists()",
      ".write": "auth != null && root.child('super_admins').child(auth.uid).exists()"
    },
    "super_admins": {
      ".read": "auth != null && root.child('super_admins').child(auth.uid).exists()",
      ".write": "auth != null && root.child('super_admins').child(auth.uid).exists()"
    }
  }
}
```

#### 2.2 Configuración de Authentication

- Habilitar Email/Password authentication
- Configurar dominio autorizado
- Establecer políticas de contraseñas

### Paso 3: Configuración Inicial

#### 3.1 Personalizar Emails de Superusuario

En `super-admin-auth.js`, modificar:

```javascript
const SUPER_ADMIN_EMAILS = [
    'tu-email@ejemplo.com',
    'admin@tudominio.com'
];
```

#### 3.2 Personalizar Datos Iniciales

En `super-admin-setup.js`, modificar:

```javascript
const SUPER_ADMINS = [
    {
        email: 'tu-email@ejemplo.com',
        password: 'TuPasswordSeguro123!',
        name: 'Tu Nombre'
    }
];
```

#### 3.3 Ejecutar Configuración

1. Cargar `super-admin-setup.js` en el navegador
2. Abrir consola de desarrollo (F12)
3. Ejecutar: `setupSuperAdminSystem()`
4. Verificar que se ejecute sin errores

### Paso 4: Verificación

1. Acceder a `super-admin.html`
2. Iniciar sesión con cuenta configurada
3. Verificar que aparezca el dashboard
4. Probar crear un promotor de prueba

---

## Estructura de Archivos

### Archivos del Sistema

#### Core del Sistema

**firebase-config.js**
- Configuración de Firebase
- Inicialización de servicios
- Exportación de funciones

**styles.css**
- Estilos base del sistema
- Animaciones y transiciones
- Estilos responsivos

#### Panel de Promotores (Existente)

**index.html**
- Interfaz para promotores individuales
- Gestión de padrinos personal
- Reportes individuales

**script.js**
- Lógica de gestión de padrinos
- Manejo de visitas
- Filtros y búsquedas

**auth.js**
- Autenticación de promotores
- Validación de contraseñas
- Manejo de sesiones

**reports.js & reports.css**
- Generación de reportes individuales
- Estilos específicos de reportes

#### Panel de Superusuario (Nuevo)

**super-admin.html**
- Interfaz del panel administrativo
- Gestión de promotores
- Vista consolidada

**super-admin.js**
- Lógica del panel de superusuario
- CRUD de promotores
- Gestión de datos globales

**super-admin-auth.js**
- Autenticación de superusuarios
- Creación de cuentas de promotores
- Validaciones de seguridad

**super-admin-setup.js**
- Configuración inicial del sistema
- Creación de cuentas administrativas
- Migración de datos

### Dependencias Externas

```html
<!-- CSS Framework -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Iconos -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<!-- Firebase SDK -->
<!-- Importado via ES6 modules desde firebase-config.js -->
```

---

## Base de Datos

### Estructura de Firebase Realtime Database

```
padrinosmg-database/
├── users/                           # Datos de promotores
│   ├── [promoter_uid]/
│   │   └── padrinos/               # Padrinos del promotor
│   │       ├── [padrino_id]/
│   │       │   ├── nombre: "Juan Pérez"
│   │       │   ├── numpad: "37144110"
│   │       │   ├── tratamiento: "SR"
│   │       │   ├── direccion: "Calle 123"
│   │       │   ├── telefono: "1234567890"
│   │       │   ├── correo: "juan@example.com"
│   │       │   ├── sector: "Centro"
│   │       │   ├── importe: 500.00
│   │       │   ├── coordenadas: "28.1234, -105.5678"
│   │       │   ├── etiqueta: "VIP"
│   │       │   ├── notas: "Notas especiales"
│   │       │   └── visits/          # Historial de visitas
│   │       │       ├── [visit_id]/
│   │       │       │   ├── status: "completed"
│   │       │       │   ├── amount: 500.00
│   │       │       │   ├── notes: "Visitado exitosamente"
│   │       │       │   └── timestamp: 1234567890123
│   │       │       └── [visit_id]/
│   │       └── [otro_padrino_id]/
│   └── [otro_promoter_uid]/
├── promoters/                       # Información de promotores
│   ├── [promoter_record_id]/
│   │   ├── userId: "[promoter_uid]" # Vinculación con Firebase Auth
│   │   ├── name: "María González"
│   │   ├── email: "maria@example.com"
│   │   ├── phone: "9876543210"
│   │   ├── zone: "Zona Norte"
│   │   ├── active: true
│   │   ├── createdAt: 1234567890123
│   │   ├── updatedAt: 1234567890123
│   │   ├── sponsorCount: 25         # Calculado
│   │   └── totalCollected: 12500.00 # Calculado
│   └── [otro_promoter_record_id]/
└── super_admins/                    # Datos de superusuarios
    ├── [super_admin_uid]/
    │   ├── email: "admin@example.com"
    │   ├── name: "Administrador Principal"
    │   ├── role: "super_admin"
    │   ├── createdAt: 1234567890123
    │   └── active: true
    └── [otro_super_admin_uid]/
```

### Tipos de Datos

#### Padrino (Sponsor)
```typescript
interface Sponsor {
  id: string;
  nombre: string;
  numpad?: string;
  tratamiento?: 'SR' | 'SRA' | 'SRITA' | 'JOVEN' | 'SRS' | 'BH' | 'QEPD';
  direccion?: string;
  telefono?: string;
  correo?: string;
  sector?: string;
  importe: number;
  coordenadas?: string; // "lat, lng"
  etiqueta?: string;
  notas?: string;
  visits?: { [key: string]: Visit };
}
```

#### Visita (Visit)
```typescript
interface Visit {
  status: 'pending' | 'completed' | 'visited_no_contribution' | 'not_home' | 'return_later';
  amount?: number;
  notes?: string;
  timestamp: number;
}
```

#### Promotor (Promoter)
```typescript
interface Promoter {
  id: string;
  userId: string; // Firebase Auth UID
  name: string;
  email: string;
  phone?: string;
  zone?: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  // Calculados dinámicamente:
  sponsorCount?: number;
  totalCollected?: number;
}
```

#### Superusuario (SuperAdmin)
```typescript
interface SuperAdmin {
  email: string;
  name: string;
  role: 'super_admin';
  createdAt: number;
  active: boolean;
}
```

### Consultas Comunes

#### Obtener todos los padrinos de un promotor
```javascript
const sponsorsRef = ref(database, `users/${promoterUid}/padrinos`);
const snapshot = await get(sponsorsRef);
```

#### Obtener todos los promotores activos
```javascript
const promotersRef = ref(database, 'promoters');
const snapshot = await get(promotersRef);
const activePromoters = Object.values(snapshot.val()).filter(p => p.active);
```

#### Calcular total recaudado global
```javascript
let totalCollected = 0;
const usersRef = ref(database, 'users');
const snapshot = await get(usersRef);
// Iterar por todos los usuarios y sus padrinos...
```

---

## Autenticación y Seguridad

### Niveles de Acceso

#### Superusuario
- **Identificación**: Email en lista `SUPER_ADMIN_EMAILS`
- **Permisos**: Acceso completo al sistema
- **Restricciones**: Solo emails autorizados

```javascript
const SUPER_ADMIN_EMAILS = [
    'admin@padrinosmg.com',
    'superadmin@padrinosmg.com'
];

const isSuperAdmin = (email) => {
    return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
};
```

#### Promotor Regular
- **Identificación**: Cuenta Firebase Auth estándar
- **Permisos**: Solo sus datos personales
- **Restricciones**: No puede ver otros promotores

### Validación de Contraseñas

Para operaciones críticas (eliminar promotores):

```javascript
const validatePassword = async (password) => {
    try {
        const user = auth.currentUser;
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        return true;
    } catch (error) {
        return false;
    }
};
```

### Reglas de Seguridad

#### Database Rules
```json
{
  "rules": {
    "users": {
      "$uid": {
        // Solo el usuario o un superadmin pueden acceder
        ".read": "auth != null && (auth.uid == $uid || root.child('super_admins').child(auth.uid).exists())",
        ".write": "auth != null && (auth.uid == $uid || root.child('super_admins').child(auth.uid).exists())"
      }
    },
    "promoters": {
      // Solo superadmins pueden gestionar promotores
      ".read": "auth != null && root.child('super_admins').child(auth.uid).exists()",
      ".write": "auth != null && root.child('super_admins').child(auth.uid).exists()"
    }
  }
}
```

### Mejores Prácticas de Seguridad

1. **Contraseñas Fuertes**
   - Mínimo 8 caracteres
   - Mayúsculas, minúsculas, números y símbolos
   - Cambiar contraseñas por defecto

2. **Validación de Entrada**
   - Sanitización de datos
   - Validación de tipos
   - Prevención de inyección

3. **Principio de Menor Privilegio**
   - Cada rol tiene acceso mínimo necesario
   - Validación en frontend y backend
   - Auditoría de accesos

4. **Gestión de Sesiones**
   - Timeout automático
   - Cierre de sesión al inactividad
   - Validación de estado de autenticación

---

## Funcionalidades del Panel

### Panel de Superusuario

#### Dashboard Principal
```
┌─────────────────────────────────────────────────────────┐
│ 📊 ESTADÍSTICAS GLOBALES                                │
├─────────────┬─────────────┬─────────────┬─────────────┤
│Total        │Promotores   │Total        │Total        │
│Promotores   │Activos      │Padrinos     │Recaudado    │
│     15      │     12      │    1,250    │ $125,000    │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### Gestión de Promotores

**Crear Promotor**
1. Clic en "Nuevo Promotor"
2. Completar formulario:
   - Nombre completo
   - Email (será su usuario)
   - Contraseña inicial
   - Teléfono (opcional)
   - Zona asignada (opcional)
   - Estado activo/inactivo
3. Sistema automáticamente:
   - Crea cuenta Firebase Auth
   - Configura estructura de datos
   - Envía credenciales (futuro)

**Editar Promotor**
- Modificar información personal
- Cambiar estado activo/inactivo
- Actualizar zona asignada
- Resetear contraseña (opcional)

**Eliminar Promotor**
- Confirmación con contraseña administrativa
- Eliminación completa de datos
- Proceso irreversible

#### Vista de Padrinos Consolidada

**Filtros Disponibles**
- Por promotor específico
- Búsqueda por texto (nombre, dirección, número)
- Estado de visita
- Sector/zona

**Información Mostrada**
- Nombre completo del padrino
- Promotor asignado
- Estado actual (Pendiente/Completado/Visitado)
- Monto esperado vs recaudado
- Última fecha de visita
- Información de contacto

#### Reportes Globales

**Estadísticas Generales**
- Total de promotores activos/inactivos
- Total de padrinos en el sistema
- Porcentaje de completados globalmente
- Monto total recaudado

**Por Promotor**
- Ranking de efectividad
- Padrinos por promotor
- Recaudación por promotor
- Tendencias temporales

**Por Zona/Sector**
- Distribución geográfica
- Efectividad por zona
- Concentración de padrinos

### Panel de Promotor (Existente)

#### Gestión de Padrinos
- Agregar nuevos padrinos
- Editar información existente
- Registrar visitas
- Ver historial detallado

#### Seguimiento de Visitas
- Marcar estados de visita:
  - Completado (con aporte)
  - Visitado (sin aporte)
  - No estaba en casa
  - Pidió que regresemos
- Agregar notas de visita
- Registrar montos recaudados

#### Reportes Individuales
- Estadísticas personales
- Progreso mensual
- Análisis de efectividad
- Exportación de datos

---

## API y Funciones

### Funciones Principales del Superusuario

#### Gestión de Promotores

```javascript
// Crear nuevo promotor
async function createPromoter(promoterData) {
    try {
        // Crear cuenta Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
            auth, 
            promoterData.email, 
            promoterData.password
        );
        
        // Guardar información en database
        const promoterInfo = {
            userId: userCredential.user.uid,
            ...promoterData,
            createdAt: Date.now(),
            active: true
        };
        
        await set(ref(database, `promoters/${Date.now()}`), promoterInfo);
        
        // Inicializar estructura de padrinos
        await set(ref(database, `users/${userCredential.user.uid}/padrinos`), {});
        
        return { success: true, uid: userCredential.user.uid };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Actualizar promotor
async function updatePromoter(promoterId, updateData) {
    const updateRef = ref(database, `promoters/${promoterId}`);
    await update(updateRef, {
        ...updateData,
        updatedAt: Date.now()
    });
}

// Eliminar promotor
async function deletePromoter(promoterId) {
    // Obtener información del promotor
    const promoterSnapshot = await get(ref(database, `promoters/${promoterId}`));
    const promoter = promoterSnapshot.val();
    
    if (promoter && promoter.userId) {
        // Eliminar todos los datos del promotor
        await remove(ref(database, `users/${promoter.userId}`));
    }
    
    // Eliminar registro de promotor
    await remove(ref(database, `promoters/${promoterId}`));
}
```

#### Consultas de Datos

```javascript
// Obtener todos los padrinos del sistema
async function getAllSponsors() {
    const allSponsors = [];
    const usersSnapshot = await get(ref(database, 'users'));
    
    if (usersSnapshot.exists()) {
        usersSnapshot.forEach(userChild => {
            const userId = userChild.key;
            const userData = userChild.val();
            
            if (userData.padrinos) {
                Object.entries(userData.padrinos).forEach(([sponsorId, sponsorData]) => {
                    allSponsors.push({
                        id: sponsorId,
                        userId: userId,
                        ...sponsorData
                    });
                });
            }
        });
    }
    
    return allSponsors;
}

// Calcular estadísticas globales
async function calculateGlobalStats() {
    const allSponsors = await getAllSponsors();
    const promotersSnapshot = await get(ref(database, 'promoters'));
    
    const stats = {
        totalPromoters: 0,
        activePromoters: 0,
        totalSponsors: allSponsors.length,
        totalCollected: 0,
        completedSponsors: 0
    };
    
    // Calcular promotores
    if (promotersSnapshot.exists()) {
        const promoters = Object.values(promotersSnapshot.val());
        stats.totalPromoters = promoters.length;
        stats.activePromoters = promoters.filter(p => p.active).length;
    }
    
    // Calcular padrinos completados y recaudación
    allSponsors.forEach(sponsor => {
        if (sponsor.visits) {
            const visits = Object.values(sponsor.visits);
            const lastVisit = visits.sort((a, b) => b.timestamp - a.timestamp)[0];
            
            if (lastVisit && lastVisit.status === 'completed') {
                stats.completedSponsors++;
                stats.totalCollected += (lastVisit.amount || 0);
            }
        }
    });
    
    return stats;
}
```

#### Filtros y Búsquedas

```javascript
// Filtrar padrinos por promotor
function filterSponsorsByPromoter(sponsors, promoterUserId) {
    if (promoterUserId === 'all') return sponsors;
    return sponsors.filter(sponsor => sponsor.userId === promoterUserId);
}

// Búsqueda de texto en padrinos
function searchSponsors(sponsors, searchTerm) {
    if (!searchTerm.trim()) return sponsors;
    
    const term = searchTerm.toLowerCase();
    return sponsors.filter(sponsor => 
        (sponsor.nombre && sponsor.nombre.toLowerCase().includes(term)) ||
        (sponsor.numpad && sponsor.numpad.toLowerCase().includes(term)) ||
        (sponsor.direccion && sponsor.direccion.toLowerCase().includes(term))
    );
}

// Obtener estado de padrino
function getSponsorStatus(sponsor) {
    if (!sponsor.visits || Object.keys(sponsor.visits).length === 0) {
        return 'pending';
    }
    
    const visits = Object.values(sponsor.visits);
    const lastVisit = visits.sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (lastVisit.status === 'completed') return 'completed';
    if (lastVisit.status === 'visited_no_contribution') return 'visited_no_contribution';
    return 'pending';
}
```

### Funciones de Utilidad

#### Validación de Datos

```javascript
// Validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validar contraseña
function isValidPassword(password) {
    // Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

// Sanitizar entrada
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
}
```

#### Formateo de Datos

```javascript
// Formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount || 0);
}

// Formatear fecha
function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Formatear teléfono
function formatPhoneNumber(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `52${cleaned}`;
    }
    return cleaned;
}
```

---

## Migración desde Sistema Anterior

### Escenarios de Migración

#### Escenario 1: Sistema Nuevo
- No hay datos previos
- Configuración desde cero
- Creación de primeros promotores

#### Escenario 2: Promotores Existentes
- Ya existen usuarios con padrinos
- Necesidad de vincular con registros de promotores
- Mantenimiento de datos históricos

### Proceso de Migración

#### Paso 1: Backup de Datos

```javascript
// Exportar datos existentes
async function backupExistingData() {
    const usersSnapshot = await get(ref(database, 'users'));
    const backupData = {
        timestamp: Date.now(),
        users: usersSnapshot.val() || {}
    };
    
    // Guardar en archivo local
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `backup-${Date.now()}.json`;
    link.click();
}
```

#### Paso 2: Identificar Usuarios Existentes

```javascript
// Listar usuarios sin registro de promotor
async function findUnlinkedUsers() {
    const usersSnapshot = await get(ref(database, 'users'));
    const promotersSnapshot = await get(ref(database, 'promoters'));
    
    const existingUsers = Object.keys(usersSnapshot.val() || {});
    const linkedUsers = new Set();
    
    // Obtener usuarios ya vinculados
    if (promotersSnapshot.exists()) {
        Object.values(promotersSnapshot.val()).forEach(promoter => {
            if (promoter.userId) {
                linkedUsers.add(promoter.userId);
            }
        });
    }
    
    // Encontrar usuarios sin vincular
    const unlinkedUsers = existingUsers.filter(uid => !linkedUsers.has(uid));
    return unlinkedUsers;
}
```

#### Paso 3: Crear Registros de Promotores

```javascript
// Migrar usuario existente a promotor
async function migrateUserToPromoter(userId, promoterInfo) {
    try {
        // Crear registro de promotor
        const promoterId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const promoterData = {
            userId: userId,
            name: promoterInfo.name,
            email: promoterInfo.email,
            active: true,
            createdAt: Date.now(),
            migratedAt: Date.now()
        };
        
        await set(ref(database, `promoters/${promoterId}`), promoterData);
        
        console.log(`Usuario ${userId} migrado como promotor ${promoterId}`);
        return { success: true, promoterId };
    } catch (error) {
        console.error(`Error migrando usuario ${userId}:`, error);
        return { success: false, error: error.message };
    }
}
```

#### Paso 4: Validar Migración

```javascript
// Verificar integridad después de migración
async function validateMigration() {
    const issues = [];
    
    // Verificar promotores sin usuarios
    const promotersSnapshot = await get(ref(database, 'promoters'));
    if (promotersSnapshot.exists()) {
        for (const [promoterId, promoter] of Object.entries(promotersSnapshot.val())) {
            if (promoter.userId) {
                const userSnapshot = await get(ref(database, `users/${promoter.userId}`));
                if (!userSnapshot.exists()) {
                    issues.push(`Promoter ${promoterId} referencia usuario inexistente ${promoter.userId}`);
                }
            }
        }
    }
    
    // Verificar usuarios sin promotores
    const usersSnapshot = await get(ref(database, 'users'));
    if (usersSnapshot.exists()) {
        const linkedUserIds = new Set();
        if (promotersSnapshot.exists()) {
            Object.values(promotersSnapshot.val()).forEach(promoter => {
                if (promoter.userId) linkedUserIds.add(promoter.userId);
            });
        }
        
        Object.keys(usersSnapshot.val()).forEach(userId => {
            if (!linkedUserIds.has(userId)) {
                issues.push(`Usuario ${userId} no tiene registro de promotor asociado`);
            }
        });
    }
    
    return issues;
}
```

### Script de Migración Automática

```javascript
// Script completo de migración
async function performMigration() {
    console.log('Iniciando proceso de migración...');
    
    try {
        // 1. Crear backup
        console.log('Creando backup...');
        await backupExistingData();
        
        // 2. Encontrar usuarios sin vincular
        console.log('Identificando usuarios existentes...');
        const unlinkedUsers = await findUnlinkedUsers();
        
        if (unlinkedUsers.length === 0) {
            console.log('No hay usuarios para migrar.');
            return;
        }
        
        console.log(`Encontrados ${unlinkedUsers.length} usuarios para migrar`);
        
        // 3. Migrar cada usuario
        for (const userId of unlinkedUsers) {
            // Obtener información del usuario de Firebase Auth
            const userInfo = await getUserInfo(userId);
            
            if (userInfo) {
                const promoterInfo = {
                    name: userInfo.displayName || 'Nombre por definir',
                    email: userInfo.email,
                    phone: userInfo.phoneNumber || '',
                    zone: 'Zona por definir'
                };
                
                const result = await migrateUserToPromoter(userId, promoterInfo);
                if (result.success) {
                    console.log(`✓ Migrado: ${userInfo.email}`);
                } else {
                    console.error(`✗ Error migrando ${userInfo.email}:`, result.error);
                }
            }
        }
        
        // 4. Validar migración
        console.log('Validando migración...');
        const issues = await validateMigration();
        
        if (issues.length === 0) {
            console.log('✅ Migración completada sin problemas');
        } else {
            console.log('⚠️ Problemas encontrados:');
            issues.forEach(issue => console.log(`- ${issue}`));
        }
        
    } catch (error) {
        console.error('Error en migración:', error);
    }
}
```

---

## Solución de Problemas

### Problemas Comunes

#### 1. Error: "Acceso no autorizado"

**Síntomas:**
- No puede acceder al panel de superusuario
- Mensaje: "Acceso no autorizado. Esta es el área de superusuario."

**Causas Posibles:**
- Email no está en lista `SUPER_ADMIN_EMAILS`
- Cuenta no existe en Firebase Auth
- Configuración incorrecta

**Soluciones:**
1. Verificar email en `super-admin-auth.js`:
   ```javascript
   const SUPER_ADMIN_EMAILS = [
       'tu-email@ejemplo.com',  // ← Agregar aquí
       'admin@padrinosmg.com'
   ];
   ```

2. Crear cuenta de superusuario:
   ```javascript
   // En consola del navegador
   setupSuperAdminSystem()
   ```

3. Verificar configuración de Firebase Auth

#### 2. Error: "No se pueden cargar los promotores"

**Síntomas:**
- Panel carga pero sin datos
- Error en consola de navegador
- Lista de promotores vacía

**Causas Posibles:**
- Reglas de Firebase Database incorrectas
- No hay cuentas de superusuario configuradas
- Problemas de permisos

**Soluciones:**
1. Verificar reglas de Database:
   ```json
   {
     "rules": {
       "promoters": {
         ".read": "root.child('super_admins').child(auth.uid).exists()",
         ".write": "root.child('super_admins').child(auth.uid).exists()"
       }
     }
   }
   ```

2. Verificar configuración de superusuario:
   ```javascript
   // Verificar en consola
   console.log(auth.currentUser?.uid);
   ```

3. Recrear registro de superusuario:
   ```javascript
   await set(ref(database, `super_admins/${auth.currentUser.uid}`), {
       email: auth.currentUser.email,
       name: 'Admin',
       role: 'super_admin',
       active: true
   });
   ```

#### 3. Error: "No se puede crear promotor"

**Síntomas:**
- Formulario no se envía
- Error al crear cuenta
- Mensaje de error en modal

**Causas Posibles:**
- Email ya existe en Firebase Auth
- Contraseña no cumple requisitos
- Permisos insuficientes

**Soluciones:**
1. Verificar email único:
   ```javascript
   // El email no debe existir previamente
   ```

2. Verificar requisitos de contraseña:
   - Mínimo 6 caracteres
   - Configurar en Firebase Console

3. Verificar permisos de escritura

#### 4. Los padrinos no aparecen en vista consolidada

**Síntomas:**
- Vista de padrinos vacía
- Filtros no funcionan
- No hay datos de padrinos

**Causas Posibles:**
- Promotores no tienen padrinos registrados
- Estructura de datos incorrecta
- Error en vinculación promoter-usuario

**Soluciones:**
1. Verificar estructura de datos:
   ```
   users/[uid]/padrinos/[padrinoId]/...
   ```

2. Verificar vinculación:
   ```javascript
   // promoters/[id]/userId debe coincidir con users/[uid]
   ```

3. Ejecutar migración si es necesario

#### 5. Error de permisos en Firebase

**Síntomas:**
- "Permission denied" en consola
- Datos no se cargan o guardan
- Error 403 en requests

**Causas Posibles:**
- Reglas de Database restrictivas
- Usuario no autenticado correctamente
- Estructura de permisos incorrecta

**Soluciones:**
1. Verificar autenticación:
   ```javascript
   console.log('Usuario autenticado:', auth.currentUser);
   ```

2. Verificar reglas temporalmente (¡SOLO PARA DEBUG!):
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```

3. Verificar estructura de super_admins en Database

### Herramientas de Debugging

#### Console Commands

```javascript
// Verificar estado de autenticación
console.log('Current user:', auth.currentUser);

// Verificar permisos de superusuario
const checkSuperAdmin = async () => {
    const adminRef = ref(database, `super_admins/${auth.currentUser?.uid}`);
    const snapshot = await get(adminRef);
    console.log('Is super admin:', snapshot.exists());
};

// Listar todos los promotores
const listPromoters = async () => {
    const snapshot = await get(ref(database, 'promoters'));
    console.log('Promoters:', snapshot.val());
};

// Verificar estructura de datos
const checkDataStructure = async () => {
    const usersSnapshot = await get(ref(database, 'users'));
    const promotersSnapshot = await get(ref(database, 'promoters'));
    
    console.log('Users count:', Object.keys(usersSnapshot.val() || {}).length);
    console.log('Promoters count:', Object.keys(promotersSnapshot.val() || {}).length);
};
```

#### Logs Importantes

```javascript
// Habilitar logs detallados
localStorage.setItem('debug', 'true');

// En el código, usar:
if (localStorage.getItem('debug')) {
    console.log('Debug info:', data);
}
```

### Recovery Procedures

#### Restaurar desde Backup

```javascript
// Restaurar datos desde archivo de backup
async function restoreFromBackup(backupData) {
    try {
        console.log('Iniciando restauración...');
        
        // Restaurar usuarios
        if (backupData.users) {
            await set(ref(database, 'users'), backupData.users);
        }
        
        console.log('Restauración completada');
    } catch (error) {
        console.error('Error en restauración:', error);
    }
}
```

#### Reset Sistema

```javascript
// PELIGRO: Resetear todo el sistema
async function resetSystem() {
    const confirmed = confirm('¿SEGURO? Esto eliminará TODOS los datos');
    if (!confirmed) return;
    
    await remove(ref(database, 'users'));
    await remove(ref(database, 'promoters'));
    await remove(ref(database, 'super_admins'));
    
    console.log('Sistema reseteado. Ejecutar setupSuperAdminSystem()');
}
```

---

## Mantenimiento

### Tareas de Mantenimiento Regular

#### Semanal
1. **Revisar logs de errores**
   - Consola del navegador
   - Firebase Console
   - Reportes de usuarios

2. **Verificar backups**
   - Exportar datos importantes
   - Probar restauración
   - Almacenar en múltiples ubicaciones

3. **Monitorear estadísticas**
   - Número de usuarios activos
   - Volumen de datos
   - Rendimiento de consultas

#### Mensual
1. **Actualizar dependencias**
   - Firebase SDK
   - Tailwind CSS
   - Font Awesome

2. **Revisar seguridad**
   - Contraseñas caducadas
   - Cuentas inactivas
   - Logs de acceso

3. **Optimizar base de datos**
   - Limpiar datos obsoletos
   - Indexar consultas frecuentes
   - Archivar datos históricos

#### Trimestral
1. **Revisar permisos**
   - Auditoría de cuentas de superusuario
   - Validar reglas de Database
   - Actualizar lista de emails autorizados

2. **Testing completo**
   - Probar todas las funcionalidades
   - Verificar en diferentes navegadores
   - Testing de performance

3. **Documentación**
   - Actualizar procedimientos
   - Documentar cambios
   - Training de usuarios

### Scripts de Mantenimiento

#### Backup Automático

```javascript
// Script para backup automático
const performBackup = async () => {
    try {
        const timestamp = new Date().toISOString().split('T')[0];
        
        // Backup usuarios
        const usersSnapshot = await get(ref(database, 'users'));
        const promotersSnapshot = await get(ref(database, 'promoters'));
        
        const backupData = {
            timestamp: Date.now(),
            date: timestamp,
            users: usersSnapshot.val() || {},
            promoters: promotersSnapshot.val() || {}
        };
        
        // Guardar localmente
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `backup-${timestamp}.json`;
        link.click();
        
        console.log(`Backup creado: backup-${timestamp}.json`);
        
    } catch (error) {
        console.error('Error en backup:', error);
    }
};

// Ejecutar backup
// performBackup();
```

#### Limpieza de Datos

```javascript
// Limpiar datos obsoletos
const cleanupOldData = async () => {
    try {
        const cutoffDate = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 días
        
        // Limpiar visitas antiguas (opcional)
        const usersSnapshot = await get(ref(database, 'users'));
        
        if (usersSnapshot.exists()) {
            for (const [userId, userData] of Object.entries(usersSnapshot.val())) {
                if (userData.padrinos) {
                    for (const [sponsorId, sponsorData] of Object.entries(userData.padrinos)) {
                        if (sponsorData.visits) {
                            const visitsToKeep = {};
                            
                            Object.entries(sponsorData.visits).forEach(([visitId, visitData]) => {
                                if (visitData.timestamp > cutoffDate) {
                                    visitsToKeep[visitId] = visitData;
                                }
                            });
                            
                            // Actualizar solo si hay cambios
                            if (Object.keys(visitsToKeep).length !== Object.keys(sponsorData.visits).length) {
                                await update(ref(database, `users/${userId}/padrinos/${sponsorId}`), {
                                    visits: visitsToKeep
                                });
                            }
                        }
                    }
                }
            }
        }
        
        console.log('Limpieza de datos completada');
        
    } catch (error) {
        console.error('Error en limpieza:', error);
    }
};
```

#### Estadísticas de Uso

```javascript
// Generar reporte de uso del sistema
const generateUsageReport = async () => {
    try {
        const report = {
            timestamp: Date.now(),
            date: new Date().toISOString(),
            statistics: {}
        };
        
        // Contar promotores
        const promotersSnapshot = await get(ref(database, 'promoters'));
        if (promotersSnapshot.exists()) {
            const promoters = Object.values(promotersSnapshot.val());
            report.statistics.totalPromoters = promoters.length;
            report.statistics.activePromoters = promoters.filter(p => p.active).length;
        }
        
        // Contar padrinos y visitas
        const usersSnapshot = await get(ref(database, 'users'));
        if (usersSnapshot.exists()) {
            let totalSponsors = 0;
            let totalVisits = 0;
            let totalAmount = 0;
            
            Object.values(usersSnapshot.val()).forEach(userData => {
                if (userData.padrinos) {
                    const sponsors = Object.values(userData.padrinos);
                    totalSponsors += sponsors.length;
                    
                    sponsors.forEach(sponsor => {
                        if (sponsor.visits) {
                            const visits = Object.values(sponsor.visits);
                            totalVisits += visits.length;
                            
                            visits.forEach(visit => {
                                if (visit.amount) {
                                    totalAmount += visit.amount;
                                }
                            });
                        }
                    });
                }
            });
            
            report.statistics.totalSponsors = totalSponsors;
            report.statistics.totalVisits = totalVisits;
            report.statistics.totalAmount = totalAmount;
        }
        
        console.log('Reporte de uso:', report);
        return report;
        
    } catch (error) {
        console.error('Error generando reporte:', error);
    }
};
```

### Monitoreo y Alertas

#### Configurar Alertas de Firebase

1. **Firebase Console → Monitoring**
   - Configurar alertas de uso
   - Monitorear errores de database
   - Alertas de authentication

2. **Métricas Importantes**
   - Número de operaciones de database
   - Tiempo de respuesta
   - Errores de autenticación
   - Uso de storage

#### Health Check Script

```javascript
// Verificar salud del sistema
const healthCheck = async () => {
    const health = {
        timestamp: Date.now(),
        status: 'healthy',
        checks: {}
    };
    
    try {
        // Test de conexión a database
        const testRef = ref(database, '.info/connected');
        const connectedSnapshot = await get(testRef);
        health.checks.database = connectedSnapshot.val() ? 'connected' : 'disconnected';
        
        // Test de autenticación
        health.checks.auth = auth.currentUser ? 'authenticated' : 'not-authenticated';
        
        // Test de permisos de superusuario
        if (auth.currentUser) {
            const adminSnapshot = await get(ref(database, `super_admins/${auth.currentUser.uid}`));
            health.checks.superAdmin = adminSnapshot.exists() ? 'authorized' : 'unauthorized';
        }
        
        // Test de datos críticos
        const promotersSnapshot = await get(ref(database, 'promoters'));
        health.checks.promoters = promotersSnapshot.exists() ? 'available' : 'empty';
        
    } catch (error) {
        health.status = 'error';
        health.error = error.message;
    }
    
    console.log('Health Check:', health);
    return health;
};

// Ejecutar health check cada 5 minutos
// setInterval(healthCheck, 5 * 60 * 1000);
```

---

## Anexos

### Anexo A: Lista de Archivos Completa

```
Sistema de Padrinos Misioneros/
├── Panel de Promotores (Existente)
│   ├── index.html                  # Interfaz principal para promotores
│   ├── script.js                  # Lógica de gestión de padrinos
│   ├── auth.js                    # Autenticación de promotores
│   ├── reports.js                 # Generación de reportes individuales
│   └── reports.css                # Estilos de reportes
│
├── Panel de Superusuario (Nuevo)
│   ├── super-admin.html           # Interfaz del panel administrativo
│   ├── super-admin.js            # Lógica del superusuario
│   ├── super-admin-auth.js       # Autenticación de superusuarios
│   └── super-admin-setup.js      # Configuración inicial del sistema
│
├── Archivos Compartidos
│   ├── firebase-config.js         # Configuración de Firebase
│   ├── styles.css                 # Estilos base del sistema
│   └── README.md                  # Documentación básica
│
└── Documentación
    ├── DOCUMENTATION.md           # Esta documentación completa
    ├── MIGRATION-GUIDE.md         # Guía de migración
    ├── TROUBLESHOOTING.md         # Guía de solución de problemas
    └── API-REFERENCE.md           # Referencia de API
```

### Anexo B: Configuración de Firebase

#### firebase-config.js Completo

```javascript
// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getDatabase, ref, set, get, update, remove, onValue, off } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "TU-API-KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const database = getDatabase(app);

// Export Firebase services for use in other files
export { auth, database, ref, set, get, update, remove, onValue, off };

// Make Firebase services available globally for script.js
window.firebaseServices = {
  auth,
  database,
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  off
};
```

#### Reglas de Database Completas

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || root.child('super_admins').child(auth.uid).exists())",
        ".write": "auth != null && (auth.uid == $uid || root.child('super_admins').child(auth.uid).exists())",
        "padrinos": {
          "$padrinoId": {
            ".validate": "newData.hasChildren(['nombre'])",
            "nombre": {
              ".validate": "newData.isString() && newData.val().length > 0"
            },
            "importe": {
              ".validate": "newData.isNumber() && newData.val() >= 0"
            },
            "visits": {
              "$visitId": {
                ".validate": "newData.hasChildren(['status', 'timestamp'])",
                "status": {
                  ".validate": "newData.isString() && newData.val().matches(/^(pending|completed|visited_no_contribution|not_home|return_later)$/)"
                },
                "timestamp": {
                  ".validate": "newData.isNumber()"
                },
                "amount": {
                  ".validate": "!newData.exists() || newData.isNumber()"
                },
                "notes": {
                  ".validate": "!newData.exists() || newData.isString()"
                }
              }
            }
          }
        }
      }
    },
    "promoters": {
      ".read": "auth != null && root.child('super_admins').child(auth.uid).exists()",
      ".write": "auth != null && root.child('super_admins').child(auth.uid).exists()",
      "$promoterId": {
        ".validate": "newData.hasChildren(['userId', 'name', 'email', 'active'])",
        "userId": {
          ".validate": "newData.isString()"
        },
        "name": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        "email": {
          ".validate": "newData.isString() && newData.val().matches(/^[^@]+@[^@]+\\.[^@]+$/)"
        },
        "active": {
          ".validate": "newData.isBoolean()"
        }
      }
    },
    "super_admins": {
      ".read": "auth != null && root.child('super_admins').child(auth.uid).exists()",
      ".write": "auth != null && root.child('super_admins').child(auth.uid).exists()",
      "$adminId": {
        ".validate": "newData.hasChildren(['email', 'role'])",
        "role": {
          ".validate": "newData.val() == 'super_admin'"
        }
      }
    }
  }
}
```

### Anexo C: Variables de Entorno y Configuración

#### Configuración Recomendada

```javascript
// Configuración de producción
const PRODUCTION_CONFIG = {
    // Timeouts
    AUTH_TIMEOUT: 30000,
    DATABASE_TIMEOUT: 15000,
    
    // Límites
    MAX_SPONSORS_PER_PAGE: 50,
    MAX_VISITS_PER_SPONSOR: 100,
    
    // Características
    ENABLE_OFFLINE_MODE: true,
    ENABLE_ANALYTICS: true,
    
    // Seguridad
    PASSWORD_MIN_LENGTH: 8,
    SESSION_TIMEOUT: 60 * 60 * 1000, // 1 hora
    
    // Backup
    AUTO_BACKUP_INTERVAL: 7 * 24 * 60 * 60 * 1000, // 7 días
    
    // UI
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 3000
};

// Configuración de desarrollo
const DEVELOPMENT_CONFIG = {
    ...PRODUCTION_CONFIG,
    ENABLE_DEBUG_LOGS: true,
    SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 horas
    AUTO_BACKUP_INTERVAL: 24 * 60 * 60 * 1000 // 1 día
};
```

### Anexo D: Códigos de Error

#### Códigos de Error del Sistema

| Código | Descripción | Solución |
|--------|-------------|----------|
| AUTH_001 | Email no autorizado como superusuario | Agregar email a SUPER_ADMIN_EMAILS |
| AUTH_002 | Contraseña incorrecta | Verificar credenciales |
| AUTH_003 | Cuenta deshabilitada | Contactar administrador |
| DATA_001 | No se pueden cargar promotores | Verificar reglas de Database |
| DATA_002 | Error al crear promotor | Verificar permisos y datos |
| DATA_003 | Error al eliminar promotor | Verificar confirmación de contraseña |
| PERM_001 | Permisos insuficientes | Verificar rol de superusuario |
| PERM_002 | Reglas de Database restrictivas | Actualizar reglas |
| CONN_001 | Error de conexión a Firebase | Verificar conectividad |
| CONN_002 | Timeout de operación | Reintentar operación |

### Anexo E: Checklist de Implementación

#### Pre-Implementación
- [ ] Backup completo del sistema actual
- [ ] Configuración de Firebase lista
- [ ] Credenciales de superusuario definidas
- [ ] Testing en entorno de desarrollo

#### Implementación
- [ ] Subir archivos del superusuario
- [ ] Ejecutar script de configuración inicial
- [ ] Configurar reglas de Firebase Database
- [ ] Crear cuentas iniciales de superusuario
- [ ] Probar funcionalidades básicas

#### Post-Implementación
- [ ] Migrar datos existentes (si aplica)
- [ ] Capacitar usuarios administradores
- [ ] Configurar monitoreo y alertas
- [ ] Documentar procedimientos personalizados
- [ ] Planificar rutinas de mantenimiento

#### Validación Final
- [ ] Todas las funcionalidades funcionan correctamente
- [ ] Permisos y seguridad configurados
- [ ] Backup y recuperación probados
- [ ] Documentación actualizada
- [ ] Usuarios capacitados

---

**Fin de la Documentación**

*Versión 1.0 - Septiembre 2025*  
*Sistema de Padrinos Misioneros - Panel de Superusuario*