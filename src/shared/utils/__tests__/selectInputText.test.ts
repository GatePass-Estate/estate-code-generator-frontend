import { selectInputText } from '@/src/shared/utils/selectInputText';

it('uses setSelection on a native TextInput ref', () => {
  const input = { setSelection: jest.fn(), select: jest.fn() };
  selectInputText(input, 4);
  expect(input.setSelection).toHaveBeenCalledWith(0, 4);
  expect(input.select).not.toHaveBeenCalled();
});

it('falls back to select() on a react-native-web ref (a DOM input without setSelection)', () => {
  const input = { select: jest.fn() };
  expect(() => selectInputText(input, 4)).not.toThrow();
  expect(input.select).toHaveBeenCalledTimes(1);
});

it('does nothing without a ref or a selection method', () => {
  expect(() => selectInputText(null, 4)).not.toThrow();
  expect(() => selectInputText({}, 4)).not.toThrow();
});
