/** A small, explicit alternative to throwing for expected failures. */
export type Result<T, E extends string = string> =
  | { ok: true; value: T }
  | { ok: false; error: E; message: string };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E extends string>(error: E, message: string): Result<never, E> => ({ ok: false, error, message });

/** The shape every Server Action returns to `useActionState`. */
export type ActionState<F extends Record<string, string> = Record<string, string>> =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string; fields?: Partial<F> };

export const idle: ActionState = { status: "idle" };
