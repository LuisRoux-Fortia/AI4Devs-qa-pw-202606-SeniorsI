import { Locator, Page } from '@playwright/test';

/**
 * Drag & drop fiable para `react-beautiful-dnd`.
 *
 * rbd no reacciona a un simple `locator.dragTo()`: necesita
 *   1) un `mousedown` sobre el elemento arrastrable,
 *   2) un primer movimiento pequeño que supere el umbral de "sloppy click"
 *      para que la librería inicie el arrastre,
 *   3) movimientos intermedios (con pausas para dar tiempo a los
 *      requestAnimationFrame internos de rbd),
 *   4) un `mouseup` sobre el destino.
 *
 * Por eso hacemos el arrastre manualmente con la API `page.mouse`.
 */
export async function dragCardToColumn(page: Page, card: Locator, targetColumn: Locator) {
  await card.scrollIntoViewIfNeeded();
  await targetColumn.scrollIntoViewIfNeeded();

  const cardBox = await card.boundingBox();
  const targetBox = await targetColumn.boundingBox();
  if (!cardBox || !targetBox) {
    throw new Error('No se pudo obtener el boundingBox de la tarjeta o la columna destino');
  }

  const start = { x: cardBox.x + cardBox.width / 2, y: cardBox.y + cardBox.height / 2 };
  // Apuntamos a la zona superior de la columna destino para insertar la tarjeta ahí.
  const end = { x: targetBox.x + targetBox.width / 2, y: targetBox.y + 40 };

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.waitForTimeout(200);

  // 1) Movimiento inicial para que rbd "levante" la tarjeta.
  await page.mouse.move(start.x + 10, start.y + 10, { steps: 6 });
  await page.waitForTimeout(200);

  // 2) Viaje hacia la columna destino.
  await page.mouse.move(end.x, end.y, { steps: 25 });
  await page.waitForTimeout(200);

  // 3) Pequeño ajuste final para que rbd registre el droppable de destino.
  await page.mouse.move(end.x, end.y + 1, { steps: 6 });
  await page.waitForTimeout(200);

  await page.mouse.up();
  await page.waitForTimeout(300);
}

/**
 * Alternativa por teclado (sensor nativo de rbd), útil como respaldo si el
 * arrastre por ratón resulta inestable en algún entorno.
 * Enfoca la tarjeta, Espacio para levantar, flechas para moverse entre
 * columnas y Espacio de nuevo para soltar.
 */
export async function dragCardWithKeyboard(page: Page, card: Locator, arrowPresses: number) {
  await card.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(150);
  for (let i = 0; i < arrowPresses; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
  }
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
}
