export const DELETE_CONFIRMATION = "delete";

export function hasDeleteConfirmation(value?: string): boolean {
  return value?.trim().toLowerCase() === DELETE_CONFIRMATION;
}
