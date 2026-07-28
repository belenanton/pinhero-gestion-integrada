# Sistema de Gestión Integrada — Grupo Piñhero / U360 / Emana

Prototipo funcional de una plataforma web de gestión centralizada para las tres unidades de negocio del grupo:

* **U360 / Grupo Piñhero:** gestión de lotes, clientes y financiación.
* **Emana:** gestión de máquinas perforadoras y sus movimientos operativos.

El objetivo del prototipo es demostrar una solución para centralizar la carga, consulta y trazabilidad de la información, manteniendo una arquitectura preparada para evolucionar e integrarse con los sistemas corporativos existentes.

**Demo:** https://pinhero-gestion-integrada.vercel.app
**Repositorio:** https://github.com/belenanton/pinhero-gestion-integrada

### Credenciales de prueba

* **Email:** `admin@pinhero.com`
* **Contraseña:** `xT9!qR4vLm2$Kp`

---

## 1. Objetivo del prototipo

El desafío plantea la necesidad de mejorar la gestión de información y facilitar el acceso remoto a los datos de las distintas unidades de negocio.

El MVP aborda dos procesos principales:

* Gestión de disponibilidad, ventas y financiación de lotes.
* Gestión independiente de máquinas perforadoras y sus movimientos operativos.

La propuesta diferencia entre las funcionalidades desarrolladas en el prototipo y las decisiones que deberían definirse para una futura implementación productiva, luego de relevar el ecosistema tecnológico real de la organización.

---

# 2. Funcionalidades implementadas en el prototipo

## Loteos y financiación

* Listado de lotes.
* Filtros por unidad de negocio y estado.
* Identificación de lotes disponibles y vendidos.
* Consulta del cliente asociado.
* Método de financiación.
* Consulta de cuotas pagadas.
* Registro de pagos.

## Operaciones móviles — Emana

* Listado de máquinas perforadoras.
* Consulta de estado operativo.
* Consulta de ubicación actual.
* Historial de movimientos.
* Registro, edición y eliminación de movimientos.
* Gestión independiente del módulo de lotes.

## Dashboard

* Cantidad total de lotes.
* Lotes disponibles y vendidos.
* Información de financiación.
* Estado de las máquinas.
* Información consolidada por unidad de negocio.

## Seguridad y experiencia de usuario

* Autenticación mediante JWT.
* Rutas protegidas.
* Confirmaciones y notificaciones visuales.



# 3. Arquitectura del prototipo

El MVP fue desarrollado con una arquitectura desacoplada:

```text
Usuarios
    │
    ▼
Frontend Web
React + Vite
    │ HTTPS
    ▼
Backend
Node.js + Express
API REST + JWT
    │
    ▼
PostgreSQL
```

Tecnologías utilizadas:

* **Frontend:** React + Vite, desplegado en Vercel.
* **Backend:** Node.js + Express, desplegado en Render.
* **Base de datos:** PostgreSQL mediante Supabase.
* **Autenticación:** JWT.
* **Containerización:** Docker y Docker Compose.

La separación entre frontend, backend y base de datos permite mantener la lógica de negocio centralizada en el backend y facilita la evolución futura de la solución.

Los dominios de lotes y operaciones móviles se mantienen independientes, ya que las máquinas de Emana se desplazan según las necesidades operativas y no dependen de la venta o ubicación de los lotes.




# 4. Accesibilidad remota

Es importante distinguir dos niveles en esta propuesta: el **nivel demostrativo**, resuelto en este prototipo con herramientas ágiles y de bajo costo (Vercel, Render, Supabase), y el **nivel profesional**, que se detalla en la sección 5 con una infraestructura administrada pensada para un entorno corporativo real, con mayores garantías de seguridad, control y escalabilidad.

El prototipo desarrollado está disponible mediante HTTPS y puede utilizarse desde cualquier navegador moderno, sin necesidad de instalar software ni establecer una VPN.

Para lograr esto de forma "ágil y sin vueltas" **en esta etapa de demostración**, el prototipo se apoya en tres decisiones de infraestructura concretas:

* **Vercel** para el frontend: despliega el sitio en una red de distribución global (CDN) con HTTPS automático, por lo que cualquier persona con el link y sus credenciales puede acceder desde su casa sin configuración adicional de su lado.
* **Render** para el backend: expone la API REST también sobre HTTPS, sin requerir que el personal administrativo tenga acceso a una red interna o VPN corporativa para consultar o cargar datos.
* **Supabase (PostgreSQL)** como base de datos administrada en la nube: centraliza la información en un único punto accesible por el backend, sin depender de un servidor físico dentro de la organización.

Esta combinación permite que el personal administrativo o directivo pueda consultar y cargar información desde distintas ubicaciones, incluyendo sus hogares, utilizando únicamente sus credenciales de acceso —sin instalaciones, sin VPN y sin pasos intermedios de IT.

**Nota:** Para este prototipo se utilizaron los planes gratuitos de Vercel, Render y Supabase, adecuados para una etapa de demostración y evaluación. Por tratarse de un plan free, el backend en Render puede tardar unos segundos en responder tras un período de inactividad (cold start). 


**A nivel profesional**, sin embargo, esta misma agilidad de acceso remoto debería sostenerse sobre una infraestructura que la organización controle directamente, con mayores garantías de seguridad, auditoría y continuidad operativa. Para producción se propone una infraestructura administrada como la detallada en la siguiente sección:


# 5. Propuesta de arquitectura para producción

El prototipo utiliza servicios cloud adecuados para una etapa de evaluación. Para una implementación productiva, evaluaría una infraestructura cloud administrada, por ejemplo sobre AWS, considerando servicios como:

* **ECS / Fargate:** ejecución del backend en contenedores, sin necesidad de administrar servidores manualmente.
* **RDS PostgreSQL:** base de datos administrada, con backups automáticos y alta disponibilidad.
* **VPC:** segmentación y seguridad de red, aislando los recursos de acceso público directo.
* **Secrets Manager:** gestión centralizada de credenciales, evitando exponer claves en el código o en variables de entorno sueltas.
* **CloudWatch:** monitoreo y logs, para detectar problemas antes de que impacten al negocio.
* **CloudFront:** distribución del frontend mediante CDN, manteniendo la misma agilidad de acceso remoto que ya ofrece el prototipo, pero con mayores garantías de seguridad y escalabilidad.
* **GitHub Actions:** integración y despliegue continuo, para poder iterar sobre el sistema sin procesos manuales de despliegue.

La elección definitiva de infraestructura debería realizarse luego de relevar el ecosistema tecnológico existente, las políticas de seguridad, los costos y las necesidades reales de la organización.

# 6. Visión de integración con SAP

La propuesta no busca reemplazar SAP, sino complementar los procesos operativos que requieran una gestión más ágil y accesible.
Esta convivencia implica que SAP y el sistema de gestión operen en paralelo, cada uno como fuente de verdad de su propio dominio, sincronizados de forma asincrónica.


Antes de implementar una integración definitiva, realizaría un relevamiento para conocer:

* Versión y configuración actual de SAP.
* Módulos utilizados.
* APIs o servicios disponibles.
* Middleware existente.
* Reglas de negocio.
* Confirmación de qué sistema es hoy la fuente de verdad en cada dominio, para validar (o ajustar) el criterio de convivencia planteado.
* Requerimientos de seguridad y auditoría.

A partir de este relevamiento se definiría la estrategia de integración más adecuada.

## Validación previa

Antes de sincronizar información con SAP, el sistema debería validar:

* Campos obligatorios.
* Formatos y tipos de datos.
* Existencia de entidades relacionadas.
* Reglas de negocio.
* Estados válidos de los lotes.
* Consistencia de pagos y cuotas.

Por ejemplo, el sistema debe impedir registrar una venta sobre un lote que ya se encuentra vendido.

## Sincronización propuesta

Para producción, propondría desacoplar la operación diaria de la disponibilidad inmediata de SAP mediante una arquitectura orientada a eventos:

```text
Usuario
   │
   ▼
API / Sistema de Gestión
   │
   ▼
Base de datos
   │
   ▼
Evento de integración
   │
   ▼
Cola de mensajería
   │
   ▼
Servicio de integración
   │
   ▼
SAP
```

Las operaciones relevantes, como ventas o pagos, podrían generar eventos de integración procesados por un servicio independiente.

Este servicio transformaría y enviaría la información utilizando el mecanismo disponible en la instalación de SAP, por ejemplo APIs, OData, RFC/BAPI u otro middleware corporativo.

En caso de indisponibilidad temporal de SAP, las operaciones podrían permanecer pendientes y ser procesadas mediante reintentos automáticos.

La integración debería contemplar también trazabilidad y reconciliación, registrando información como:

* Estado de sincronización.
* Fecha de procesamiento.
* Identificador de la operación en SAP.
* Mensaje de error.

### Modos de procesamiento 

Esta sincronización combina dos modos de procesamiento complementarios, cada uno elegido en función del tipo de necesidad que resuelve.

#### 1. Procesamiento en tiempo real (eventos)

El envío de eventos nuevos —una venta de lote, el registro de un pago— se procesa apenas ocurre: la operación se confirma en la base de datos, se genera un evento, se publica en la cola de mensajería y el servicio de integración lo consume y lo envía a SAP casi de inmediato.

**Por qué en tiempo real:** este tipo de operación es la que el negocio necesita ver reflejada cuanto antes en SAP, ya que de ella dependen decisiones comerciales (por ejemplo, saber si un lote sigue disponible). Procesarla con demora o en lotes agregaría una ventana de inconsistencia innecesaria entre lo que el equipo ve en el sistema de gestión y lo que ve en SAP.

#### 2. Tareas programadas (jobs)

Además del flujo en tiempo real, existirían dos jobs corriendo en segundo plano a intervalos regulares:

* **Job de reintentos** — se ejecutaría cada pocos minutos para identificar operaciones que no pudieron sincronizarse por una caída o indisponibilidad temporal de SAP, y las reprocesaría automáticamente hasta lograr su envío.

  **Por qué como job y no en tiempo real:** una caída de SAP es, por definición, un evento que no se puede resolver en el momento. Un job periódico permite reintentar sin necesidad de que un humano se entere de la falla y la reprocese a mano, y sin sobrecargar al servicio de integración con reintentos inmediatos que probablemente vuelvan a fallar si SAP sigue caído.

* **Job de reconciliación** — correría con una frecuencia menor (por ejemplo, una vez al día) y compararía la información registrada en el sistema de gestión contra lo efectivamente reflejado en SAP, para detectar inconsistencias que hayan escapado al flujo normal y generar alertas o reportes para su revisión.

  **Por qué como job y no en tiempo real:** la reconciliación no responde a un evento puntual, sino que necesita comparar el estado acumulado de ambos sistemas en un momento dado. No tendría sentido ejecutarla en cada operación individual; una frecuencia diaria es suficiente para detectar desvíos sin generar carga innecesaria sobre SAP o la base de datos.

#### Resultado: un flujo  automatizado

Gracias a esta combinación, el flujo diario de sincronización funcionaría de manera completamente automática, sin requerir que una persona cargue o revise manualmente cada operación.



# 7. Modelo de datos

### Dominio de Loteos

* `clientes`
* `lotes`
* `financiaciones`
* `cuotas`

La financiación se encuentra asociada a la operación de venta de un lote y mantiene el historial de cuotas correspondientes.

### Dominio de Operaciones Móviles

* `maquinas`
* `ubicaciones_maquina`

Cada máquina mantiene su historial de movimientos y ubicación de forma independiente al dominio de lotes y financiación.

### Dominio de Seguridad

* `usuarios`

---

# 8. Próximos pasos

Como evolución del MVP se propone:

* Incorporar estado de reserva de lotes.
* Gestión de proyectos o desarrollos urbanísticos.
* Gestión de cuotas vencidas y alertas de mora.
* Roles y permisos diferenciados.
* Auditoría completa de operaciones.
* Integración con el proveedor de identidad corporativo.
* Migración a infraestructura productiva.
* Implementación de la integración con SAP luego del relevamiento técnico correspondiente.

---

# 9. Ejecución local

### Requisitos

* Node.js 18+
* PostgreSQL

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Configurar las variables necesarias en `.env`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Configurar `VITE_API_URL` apuntando al backend.

### Docker

También es posible ejecutar el proyecto mediante:

```bash
docker compose up --build
```

---

## Consideración final

El prototipo busca demostrar una solución funcional y una visión arquitectónica orientada a la integración.

Las decisiones definitivas de infraestructura, seguridad e integración con SAP deberían surgir del relevamiento del ecosistema tecnológico existente y de las necesidades reales de cada unidad de negocio.



Desarrollado como parte del desafío técnico para el puesto de **Coordinador de Sistemas — Grupo Piñhero**.
