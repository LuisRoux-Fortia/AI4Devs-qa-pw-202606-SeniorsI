import { test, expect, Locator } from '@playwright/test';
import {
  mockBackend,
  PutCapture,
  POSITION_ID,
  POSITION_NAME,
  STAGES,
  CANDIDATES,
} from './support/mocks';
import { dragCardToColumn } from './support/dnd';

/**
 * Pruebas E2E de la interfaz `position` (tablero Kanban de candidatos).
 *
 * Escenario 1 — La página carga correctamente (título, columnas, candidatos).
 * Escenario 2 — Mover un candidato entre fases dispara PUT /candidates/:id
 *               con la nueva fase y actualiza la UI.
 *
 * El backend se simula con `page.route` (ver support/mocks.ts), de modo que
 * las pruebas son deterministas y no dependen de la base de datos.
 */

// Localizador de una columna de fase por su título visible.
const columnByTitle = (page: import('@playwright/test').Page, title: string): Locator =>
  page.locator('[data-testid="stage-column"]').filter({
    has: page.locator('[data-testid="stage-column-title"]', { hasText: title }),
  });

// Localizador de una tarjeta de candidato por su nombre.
const cardByName = (page: import('@playwright/test').Page, name: string): Locator =>
  page.locator('[data-testid="candidate-card"]').filter({
    has: page.locator('[data-testid="candidate-card-name"]', { hasText: name }),
  });

let putCapture: PutCapture;

test.beforeEach(async ({ page }) => {
  putCapture = await mockBackend(page);
  await page.goto(`/positions/${POSITION_ID}`);
  // Esperamos a que el tablero esté renderizado con sus columnas.
  await expect(page.getByTestId('kanban-board')).toBeVisible();
  await expect(page.getByTestId('stage-column')).toHaveCount(STAGES.length);
});

test.describe('Escenario 1 — Carga de la página position', () => {
  test('muestra el título de la posición', async ({ page }) => {
    await expect(page.getByTestId('position-title')).toHaveText(POSITION_NAME);
  });

  test('muestra todas las columnas de fases del proceso', async ({ page }) => {
    for (const stage of STAGES) {
      await expect(columnByTitle(page, stage.name)).toBeVisible();
    }
  });

  test('muestra cada candidato en la columna correspondiente a su fase', async ({ page }) => {
    for (const candidate of CANDIDATES) {
      const column = columnByTitle(page, candidate.currentInterviewStep);
      await expect(
        column.locator('[data-testid="candidate-card-name"]', { hasText: candidate.fullName }),
      ).toBeVisible();
    }
  });

  test('no dispara ninguna petición PUT solo por cargar la página', async () => {
    expect(putCapture.requests).toHaveLength(0);
  });
});

test.describe('Escenario 2 — Cambio de fase de un candidato', () => {
  test('mueve un candidato de una fase a otra y notifica al backend', async ({ page }) => {
    const candidate = CANDIDATES[0]; // John Doe — "Llamada telefónica" (col 0)
    const originStage = STAGES[0]; // Llamada telefónica
    const targetStage = STAGES[1]; // Entrevista técnica (id 2)

    const originColumn = columnByTitle(page, originStage.name);
    const targetColumn = columnByTitle(page, targetStage.name);
    const card = cardByName(page, candidate.fullName);

    // Estado inicial: la tarjeta está en la columna de origen.
    await expect(
      originColumn.locator('[data-testid="candidate-card-name"]', { hasText: candidate.fullName }),
    ).toBeVisible();

    // Arrastramos la tarjeta a la columna destino.
    await dragCardToColumn(page, card, targetColumn);

    // 1) Validación visual: la tarjeta aparece ahora en la columna destino...
    await expect(
      targetColumn.locator('[data-testid="candidate-card-name"]', { hasText: candidate.fullName }),
    ).toBeVisible();
    // ...y ya no está en la de origen.
    await expect(
      originColumn.locator('[data-testid="candidate-card-name"]', { hasText: candidate.fullName }),
    ).toHaveCount(0);

    // 2) Validación de backend: se disparó exactamente un PUT /candidates/:id.
    await expect.poll(() => putCapture.requests.length).toBe(1);

    const put = putCapture.requests[0];
    expect(put.method).toBe('PUT');
    expect(put.url).toContain(`/candidates/${candidate.candidateId}`);
    // El body contiene la nueva fase (id de la columna destino) y la aplicación.
    expect(put.body).toMatchObject({
      applicationId: candidate.applicationId,
      currentInterviewStep: targetStage.id,
    });
  });
});
