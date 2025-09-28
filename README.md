# Docente IA Monolítico (multagente)

Docente IA minimalista que **dicta cualquier lesson** (de cualquier curso), evalúa con **rúbricas**, remedia con preguntas **socráticas** y responde **dudas** sin romper la secuencia. Preparado para correr como **monolito** (Express) y crecer sin dolor.

---

## 1) Qué hace

* Orquesta un flujo de enseñanza **paso a paso**: Tutor → Verifier → Planner → (Socratic Coach si falla) + HelpDesk para preguntas libres.
* Soporta **cualquier lesson** gracias a un **LessonAdapter** que normaliza formatos heterogéneos.
* Evalúa con **rúbricas** (score 0..1) y feedback accionable.
* Controla costo/latencia usando `reasoning.effort` por agente y tipo de paso.

---

## 2) Arquitectura (mínima)

* **Monolito** Express con capas claras:

  * `/api` HTTP
  * `/agents` multiagentes (Planner, Tutor, Verifier, Socratic, HelpDesk)
  * `/core` wrappers de LLM, tipos y adapter
  * `/store` repos (sessions en memoria, lessons en filesystem)
  * `/lessons` lessons en JSON

```
/app
  /api
    chat.controller.ts      # Endpoints
    chat.service.ts         # Orquestación por turno
  /agents
    planner.agent.ts        # dueño del flujo
    tutor.agent.ts          # explica/pregunta
    verifier.agent.ts       # evalúa con rúbrica
    socratic.agent.ts       # remediación breve
    helpdesk.agent.ts       # preguntas libres
  /core
    llm.config.ts           # modelo por defecto + reasoning.effort
    llm.ts                  # wrapper OpenAI Responses + JSON Schema
    models.ts               # Session, Turn, StudentEvent
    lesson-adapter.ts       # normaliza cualquier lesson
  /store
    lesson.repo.ts          # filesystem + caché
    session.repo.ts         # memoria
/lessons
  mineria/iperc/lesson01.json
index.ts                    # bootstrap Express
```

---

## 3) Requisitos

* Node.js 18+
* Cuenta de OpenAI con acceso a la API estándar
* `OPENAI_API_KEY` en variables de entorno

---

## 4) Instalación

```bash
npm i express openai
npm i -D typescript ts-node @types/express
```

Crea `tsconfig.json` básico:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

---

## 5) Configuración

Crea `.env`:

```
OPENAI_API_KEY=tu_api_key
PORT=3000
```

Modelos y esfuerzo por agente/step en `app/core/llm.config.ts`:

```ts
export const LLM_DEFAULTS = {
  model: "gpt-4o-mini",
  effortByAgent: { tutor: "medium", verifier: "high", socratic: "medium", help: "low", planner: "low" },
  effortByStepType: { QUIZ: "high", EXERCISE: "medium", CONTENT: "medium", ASK: "medium", NARRATION: "low" }
} as const;
```

> Puedes sobreescribir por llamada pasando `{ effort: "high", model: "gpt-4o" }` al wrapper `llmJson(...)`.

---

## 6) Ejecutar

```bash
npx ts-node index.ts
```

El servicio queda en `http://localhost:3000/chat`.

---

## 7) API

### POST `/chat/session`

Crea sesión.

```json
{ "lessonId": "mineria/iperc/lesson01", "userId": "walther" }
```

**Resp**

```json
{ "sessionId": "abc123" }
```

### POST `/chat/event`

Procesa un turno del alumno.

```json
{ "sessionId": "abc123", "event": { "type": "answer", "text": "Mi definición..." } }
```

O pregunta libre:

```json
{ "sessionId": "abc123", "event": { "type": "question", "text": "¿Qué es riesgo?" } }
```

**Resp**

```json
{ "reply": "texto del docente", "stepId": "s3", "isFinished": false, "score": 0.8, "feedback": "Bien, mejora tal punto" }
```

### GET `/chat/session/:id`

Devuelve el estado de sesión.

---

## 8) Formato de Lesson (mínimo)

```json
{
  "id": "mineria/iperc/lesson01",
  "title": "IPERC Continuo — Lección 01",
  "language": "es",
  "level": "basic",
  "objectives": ["Distinguir peligro y riesgo", "Aplicar jerarquía de controles"],
  "steps": [
    { "id": "s1", "type": "NARRATION", "prompt": "Bienvenida" },
    { "id": "s2", "type": "CONTENT", "prompt": "Explica peligro vs riesgo", "answerType": "open", "content": "..." },
    { "id": "s3", "type": "ASK", "prompt": "Define 'peligro' + 1 ejemplo", "answerType": "definition" },
    { "id": "s4", "type": "EXERCISE", "prompt": "Enumera 3 controles", "answerType": "list" },
    { "id": "s5", "type": "QUIZ", "prompt": "Elige y justifica", "answerType": "mcq", "data": { "options": ["A", "B", "C"] } }
  ]
}
```

> Si tus lessons vienen con otro shape, mapea en `LessonAdapter.normalize()`.

---

## 9) Multiagentes (funciones)

* **PlannerAgent**: decide **advance** o **retry** según el último `score` y fin de pasos.
* **TutorAgent**: presenta/guía el step (explica, pregunta, da consigna clara). `effort: medium`.
* **VerifierAgent**: evalúa contra la rúbrica o, si falta, usa una **por defecto** (definition/list/procedure/mcq). `effort: high`.
* **SocraticAgent**: remediación **breve** con 1–2 preguntas y una pista. `effort: medium`.
* **HelpDeskAgent**: responde **preguntas libres** en cualquier momento. `effort: low`.

---

## 10) Ejemplos cURL

```bash
# Crear sesión
curl -sX POST http://localhost:3000/chat/session \
 -H 'Content-Type: application/json' \
 -d '{"lessonId":"mineria/iperc/lesson01","userId":"walther"}'

# Enviar respuesta del alumno
curl -sX POST http://localhost:3000/chat/event \
 -H 'Content-Type: application/json' \
 -d '{"sessionId":"<ID>","event":{"type":"answer","text":"Mi definición es..."}}'

# Hacer una pregunta libre
curl -sX POST http://localhost:3000/chat/event \
 -H 'Content-Type: application/json' \
 -d '{"sessionId":"<ID>","event":{"type":"question","text":"¿Diferencia entre peligro y riesgo?"}}'
```

---

## 11) Persistencia

* **LessonRepo**: filesystem + caché en memoria (lee `lessons/.../*.json`).
* **SessionRepo**: memoria (suficiente para MVP). Puedes pasar a SQLite/Postgres sin tocar la API.

---

## 12) Ajustes de razonamiento

* Por defecto: **gpt-4o-mini**.
* `effort` controla temperatura y max_tokens por agente/step en `llm.config.ts`.
* Overrides por llamada: `llmJson({ ..., effort: "high", model: "gpt-4o" })`.

---

## 13) Roadmap (sugerido)

* Memoria persistente de sesiones (DB) + métricas de aprendizaje.
* Herramientas opcionales (matriz de riesgo, validador de unidades, buscador de fuentes).
* MCQ con keying automático y analítica de distractores.
* Export de evidencias (PDF/CSV) y rubricas por curso.
* Autogeneración de pasos desde temario (lesson builder).

---

## 14) Licencia

A definir por el autor.