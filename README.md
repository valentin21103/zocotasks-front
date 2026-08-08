# ZOCO Tasks — Frontend

Aplicación interna para que un equipo comercial registre comercios interesados en
ZOCO y les haga seguimiento por un embudo de estados, con registro de
interacciones y análisis de oportunidad generado por IA.

Angular 20 · standalone components · TypeScript strict.

> **La arquitectura y el porqué de cada decisión están en
> [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).** Este README explica cómo
> levantarlo.

---

## Cómo levantarlo

Requiere Node 20 o superior y el backend corriendo.

```bash
npm install
npm start
```

Queda en `http://localhost:4200`.

El backend tiene que estar en `http://localhost:5279`:

```bash
cd zocotasks-backend
dotnet run --project ZocoTasks.API
```

## Configuración

Angular resuelve la configuración **en tiempo de compilación**, no con variables
de entorno del sistema. Todo lo configurable vive en `src/environments/`:

| Archivo | Cuándo se usa | `apiUrl` |
|---|---|---|
| `environment.ts` | `npm start` y build de desarrollo | `http://localhost:5279` |
| `environment.prod.ts` | `npm run build` (producción) | URL del backend desplegado |

El reemplazo lo hace `fileReplacements` en `angular.json`. Para apuntar a otro
backend, se edita el archivo que corresponda; no hay ningún otro lugar donde la
URL esté escrita.

No hay secretos en este repositorio: **un frontend no puede guardar secretos**,
porque todo lo que se compila llega al navegador del usuario. El JWT lo emite el
backend y se guarda en `localStorage` solo durante la sesión.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Build de producción en `dist/` |
| `npm test` | Tests unitarios (Karma + Jasmine) |
| `npm run watch` | Build de desarrollo en modo watch |

## Estructura

```
src/app/
├── core/        sesión, layout e interceptores — existe una sola vez
├── features/    una carpeta por pantalla, con su servicio adentro
└── shared/      lo que usan dos o más features
```

El criterio completo, con el porqué, está en
[`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md#2-estructura-de-carpetas).

## Estado

| Bloque | Estado |
|---|---|
| Estructura, configuración y documentación | ✅ |
| Capa de API: modelos, servicios, interceptores | ✅ |
| Autenticación: login, guards, roles | ✅ |
| Listado con búsqueda, filtros, orden y paginación | ⏳ |
| Alta y edición con validación reactiva | ⏳ |
| Ficha del comercio e interacciones | ⏳ |
| Cambio de estado y manejo del conflicto 409 | ⏳ |
| Analizar oportunidad | ⏳ |
| Tests | ⏳ |
