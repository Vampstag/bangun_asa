/** Isi unduhan ikon 3D: panggung bersama dan modelnya. */
import { createStage, type Badge } from './stage';
import { shieldModel } from './shield';
import { houseKeyModel } from './house-key';
import { calculatorModel } from './calculator';

const MODELS = { shield: shieldModel, key: houseKeyModel, calc: calculatorModel };

export type { Badge };

export function createBadge(host: HTMLElement, kind: string, opts: { still: boolean }): Badge | null {
  const model = MODELS[kind as keyof typeof MODELS];
  return model ? createStage(host, model, opts) : null;
}
