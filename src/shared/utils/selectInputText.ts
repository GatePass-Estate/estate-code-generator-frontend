/** The selection methods of a TextInput ref, on native (`setSelection`) or web (DOM `select`). */
type SelectableInput = {
  setSelection?: (start: number, end: number) => void;
  select?: () => void;
};

/**
 * Selects the first `length` characters of a TextInput (its whole value when that is the length).
 * Native refs have `setSelection`; on react-native-web the ref is the DOM `<input>`, which has
 * `select()` instead, and calling the missing method would throw.
 */
export function selectInputText(input: SelectableInput | null | undefined, length: number): void {
  if (!input) return;
  if (typeof input.setSelection === 'function') input.setSelection(0, length);
  else if (typeof input.select === 'function') input.select();
}
