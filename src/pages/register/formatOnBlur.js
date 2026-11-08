export default function formatOnBlur(pattern, replacement) {
  return (event) => {
    const input = event.currentTarget;
    const value = input.value.replace(/[()./\s-]/g, '');
    if (pattern.test(value)) {
      input.value = value.replace(pattern, replacement);
    }
  };
}
