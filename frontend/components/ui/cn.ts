/** Tiny className combiner: drops falsy values and joins with spaces. */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
