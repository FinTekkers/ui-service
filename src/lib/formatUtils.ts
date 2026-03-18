export function formatAmount(amount: string | number): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(numAmount);
}

export function formatPercent(value: string | number): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numValue / 100);
}
