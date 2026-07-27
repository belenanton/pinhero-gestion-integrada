# Gestión Integrada

Aplicación full-stack para gestionar lotes, financiaciones y operaciones móviles de maquinaria.

## Requisitos
- Docker Desktop
- Docker Compose

## Levantar el proyecto
```bash
docker-compose up --build
```

## Servicios
- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Base de datos PostgreSQL: localhost:5432

## Estructura
- backend: API REST con Express y PostgreSQL
- frontend: interfaz en React + Vite
- db: scripts de inicialización de PostgreSQL
