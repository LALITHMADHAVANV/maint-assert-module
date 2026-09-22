/**
 * Utility functions for Indian Rupee (₹) formatting across TexTech CMMS
 */

export function formatRupee(
  amount: number | undefined | null,
  options?: { decimals?: boolean }
): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  const showDecimals = options?.decimals ?? (amount % 1 !== 0);
  return (
    '₹' +
    amount.toLocaleString('en-IN', {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 2,
    })
  );
}
