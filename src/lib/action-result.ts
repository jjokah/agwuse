/**
 * Standard result type returned by server actions.
 *
 * Usage:
 *   return { success: true, data: value } satisfies ActionResult<T>;
 *   return { success: false, error: "msg" } satisfies ActionResult;
 */
export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };
