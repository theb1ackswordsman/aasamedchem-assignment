export type Unit = 'g' | 'kg' | 'mL' | 'L' | 'unit';
export type Dimension = 'weight' | 'volume' | 'count';

export function convertToBase(quantity: number, unit: Unit): number {
  switch (unit) {
    case 'g':    return quantity;
    case 'kg':   return quantity * 1000;
    case 'mL':   return quantity;
    case 'L':    return quantity * 1000;
    case 'unit': return quantity;
    default: throw new Error(`Unknown unit: ${unit}`);
  }
}

export function convertFromBase(baseQty: number, targetUnit: Unit): number {
  switch (targetUnit) {
    case 'g':    return baseQty;
    case 'kg':   return baseQty / 1000;
    case 'mL':   return baseQty;
    case 'L':    return baseQty / 1000;
    case 'unit': return baseQty;
    default: throw new Error(`Unknown unit: ${targetUnit}`);
  }
}

export function calculatePrice(orderedQty: number, orderedUnit: Unit, basePricePerUnit: number): number {
  const baseQty = convertToBase(orderedQty, orderedUnit);
  return Math.round(baseQty * basePricePerUnit * 100) / 100;
}

export function getUnitsForDimension(dimension: Dimension): Unit[] {
  switch (dimension) {
    case 'weight': return ['g', 'kg'];
    case 'volume': return ['mL', 'L'];
    case 'count':  return ['unit'];
  }
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount);
}

export function formatQty(qty: number, unit: Unit): string {
  return `${qty.toLocaleString('en-IN', { maximumFractionDigits: 4 })} ${unit}`;
}
