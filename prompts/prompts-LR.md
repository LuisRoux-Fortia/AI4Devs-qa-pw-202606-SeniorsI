# Prompts utilizados — LR

1. "Explora este repositorio y dime qué entiendes de su arquitectura: stack, estructura de carpetas, cómo se arranca, convenciones que detectes. No modifiques nada, solo análisis."

2. "Implementa el ejercicio de Playwright con config, specs y data-testid."

3. "Añade atributos data-testid estables a los componentes del tablero Kanban (PositionDetails, StageColumn, CandidateCard) para poder localizar el título de la posición, las columnas de fase y las tarjetas de candidato."

4. "Crea playwright.config.ts en /frontend que arranque solo el frontend (CRA) con BROWSER=none y reuseExistingServer, apuntando baseURL a http://localhost:3000."

5. "Genera pruebas E2E en tests/e2e/position.spec.ts: Escenario 1 valida que la página /positions/:id carga con título, columnas y candidatos en la columna correcta; Escenario 2 valida el drag & drop de una tarjeta entre columnas y que se dispara PUT /candidates/:id con la nueva fase."

6. "El backend hace fetch a URLs absolutas de localhost:3010. Mockea esas llamadas (interviewFlow, candidates y el PUT) con page.route para que las pruebas sean deterministas y no dependan de la base de datos, y captura el body del PUT para hacer aserciones."

7. "El drag & drop con react-beautiful-dnd no funciona con locator.dragTo(). Implementa un helper con page.mouse (mousedown, movimiento inicial que supere el umbral, movimientos intermedios con pausas y mouseup) y añade una alternativa por teclado como respaldo."
