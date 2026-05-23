export function formatCurrency(amount: number): string {
  try {
    return new Intl.NumberFormat("en-PH", {
      currency: "PHP",
      maximumFractionDigits: 0,
      style: "currency",
    }).format(amount);
  } catch (error) {
    // Fail-safe fallback formatting if Intl is missing or crashes
    return `₱${Math.round(amount).toLocaleString()}`;
  }
}
