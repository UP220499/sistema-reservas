export const HISTORY_ACTION = {
  CREAR: 'CREAR',
  EDITAR: 'EDITAR',
  REAGENDAR: 'REAGENDAR',
  CANCELAR: 'CANCELAR',
} as const;

export type HistoryAction =
  (typeof HISTORY_ACTION)[keyof typeof HISTORY_ACTION];

export function isHistoryAction(value: unknown): value is HistoryAction {
  return (
    typeof value === 'string' &&
    (value === HISTORY_ACTION.CREAR ||
      value === HISTORY_ACTION.EDITAR ||
      value === HISTORY_ACTION.REAGENDAR ||
      value === HISTORY_ACTION.CANCELAR)
  );
}
