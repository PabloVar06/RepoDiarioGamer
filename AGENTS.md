# SAVEPOINT — reglas del repositorio

- Contexto: Proyecto 4, Fase 2 (Harness); E1 es el diario gamer y E2, metas y rachas.
- Stack: Node/Express/TypeScript/Mongoose/MongoDB; React/Vite/Router/Tailwind/GSAP.
- Estructura: `backend/src/`, `frontend/src/`, `docs/`, `scripts/` y `tests/harness/`.
- Nunca leer ni modificar `.env` ni sus variantes, tampoco mediante scripts,
  búsquedas globales, dotenv o comandos que los carguen indirectamente.
- No implementar funcionalidades sin una spec aprobada explícitamente por el usuario.
  Guardarla en `docs/specs/` con aprobación y alcance; DESIGN.md no la sustituye.
- Respetar los criterios de aceptación de la spec y vincularlos con pruebas.
- Ejecutar tests antes de cerrar tickets y registrar comandos y resultados.
  Si no existen tests del área, falta cobertura o fallan, no declarar cerrado el ticket.
- Mantener la arquitectura existente: backend routes → controllers → services → modelos;
  frontend React/TypeScript con servicios HTTP en `frontend/src/api/`.
- Evitar modificaciones fuera del alcance, refactorizaciones y dependencias no acordadas.
- Leer `docs/diagnostico.md`; conservar sus hallazgos diferidos y las funciones de E1.
- `DESIGN.md` es la fuente de verdad visual; no implementar el nuevo diseño
  hasta aprobar la spec del frontend. Conservar Tailwind y la lógica de negocio.
- E2 trata metas y rachas según DESIGN.md; sus reglas funcionales requieren spec aprobada.
- Distinguir fechas civiles de instantes; especificar `America/Guayaquil` para
  cálculos ecuatorianos y evitar desfases al mostrar días almacenados en UTC.
- Mantener coherencia entre `VITE_API_URL` y el prefijo `/api`.
- Usar la skill `.agents/skills/savepoint-sdd/SKILL.md` para trabajo con specs y tickets.
- Ver `docs/harness.md` para hooks, compatibilidad y verificaciones reproducibles.
- Instalar hooks con `python3 scripts/harness.py install`; no omitirlos para cerrar trabajo.
- Tests del harness: `python3 -B -m unittest discover -s tests/harness -v`.
- Typecheck complementario: `(cd backend && ./node_modules/.bin/tsc --noEmit)`
  y `(cd frontend && ./node_modules/.bin/tsc --noEmit)`; no equivale a tests funcionales.
- No ejecutar builds, dev servers ni tests que carguen `.env`; usar configuración
  sintética explícita y desactivar esa carga antes de ejecutar pruebas de aplicación.
- No hacer commit, publicar ni desplegar salvo instrucción explícita del usuario.
- Los commits corresponden a fases o tickets concretos; usar Conventional Commits
  en español (`feat`, `fix`, `docs`, `test`, `refactor`, `chore`), máximo 72 caracteres.
- `/commit` es manual (Codex: `$commit` si no admite `/commit`); revisar solo staging,
  sin `git add`, sin incluir cambios nuevos y sin commit si hay posibles credenciales.
- No ejecutar `git push` sin autorización explícita; la skill commit nunca lo ejecuta.
