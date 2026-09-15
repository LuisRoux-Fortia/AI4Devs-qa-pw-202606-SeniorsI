import { Page, Request } from '@playwright/test';

/**
 * Datos de prueba controlados (fixtures) que replican la forma REAL de las
 * respuestas del backend, según:
 *   - positionService.getInterviewFlowByPositionService
 *   - positionService.getCandidatesByPositionService
 *
 * Mantener estos datos aquí (y no "quemados" dentro de cada test) permite
 * actualizarlos en un solo sitio.
 */
export const POSITION_ID = 1;
export const POSITION_NAME = 'Senior Full-Stack Engineer';

export const STAGES = [
  { id: 1, name: 'Llamada telefónica', orderIndex: 1 },
  { id: 2, name: 'Entrevista técnica', orderIndex: 2 },
  { id: 3, name: 'Entrevista cultural', orderIndex: 3 },
];

export const CANDIDATES = [
  {
    fullName: 'John Doe',
    currentInterviewStep: 'Llamada telefónica',
    candidateId: 1,
    applicationId: 10,
    averageScore: 3,
  },
  {
    fullName: 'Jane Smith',
    currentInterviewStep: 'Entrevista técnica',
    candidateId: 2,
    applicationId: 11,
    averageScore: 4,
  },
  {
    fullName: 'Carlos Ruiz',
    currentInterviewStep: 'Llamada telefónica',
    candidateId: 3,
    applicationId: 12,
    averageScore: 2,
  },
];

/** Cuerpo esperado de la respuesta del interviewFlow (forma que consume el front). */
const interviewFlowResponse = {
  interviewFlow: {
    positionName: POSITION_NAME,
    interviewFlow: {
      id: 1,
      description: 'Flujo estándar de contratación',
      interviewSteps: STAGES.map((s) => ({
        id: s.id,
        interviewFlowId: 1,
        interviewTypeId: s.id,
        name: s.name,
        orderIndex: s.orderIndex,
      })),
    },
  },
};

export interface PutCapture {
  /** Peticiones PUT /candidates/:id capturadas, con su URL y body parseado. */
  requests: Array<{ url: string; method: string; body: any }>;
}

/**
 * Registra los mocks del backend (localhost:3010) sobre `page` y devuelve un
 * objeto donde se acumulan las peticiones PUT de cambio de fase para poder
 * hacer aserciones sobre ellas.
 *
 * El frontend hace fetch a URLs absolutas (http://localhost:3010/...), por eso
 * interceptamos por patrón de host/ruta y no por baseURL.
 */
export async function mockBackend(page: Page): Promise<PutCapture> {
  const capture: PutCapture = { requests: [] };

  // GET /positions/:id/interviewFlow
  await page.route('**/positions/*/interviewFlow', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(interviewFlowResponse),
    });
  });

  // GET /positions/:id/candidates
  await page.route('**/positions/*/candidates', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(CANDIDATES),
    });
  });

  // PUT /candidates/:id  -> captura el body y responde 200 OK
  await page.route('**/candidates/*', async (route) => {
    const request: Request = route.request();
    if (request.method() === 'PUT') {
      capture.requests.push({
        url: request.url(),
        method: request.method(),
        body: request.postDataJSON(),
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Candidate stage updated successfully',
          data: {},
        }),
      });
    } else {
      await route.continue();
    }
  });

  return capture;
}
