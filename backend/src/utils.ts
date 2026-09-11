export function formatErrorMessage(message: string) {
  return { message };
}

export function createChallanNumber() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CH-${stamp}-${random}`;
}
