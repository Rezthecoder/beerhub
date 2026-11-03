/** Display details for a beer, derived from its name (the database only stores name, price and description). */
export function beerSpecs(name: string): { abv: string; type: string; origin: string } {
  if (name.includes('Sapporo')) return { abv: '5.0%', type: 'Premium lager', origin: 'Hokkaido' };
  if (name.includes('Asahi')) return { abv: '5.0%', type: 'Super dry lager', origin: 'Tokyo' };
  if (name.includes('Honkirin')) return { abv: '6.0%', type: 'Strong lager', origin: 'Tokyo' };
  if (name.includes('Nodogoshi')) return { abv: '5.0%', type: 'Light lager', origin: 'Tokyo' };
  if (name.includes('Ichiban')) return { abv: '5.0%', type: 'First-press lager', origin: 'Tokyo' };
  if (name.includes('Nama')) return { abv: '5.0%', type: 'Draft beer', origin: 'Tokyo' };
  if (name.includes('Kirin')) return { abv: '5.0%', type: 'Classic lager', origin: 'Tokyo' };
  return { abv: '5.0%', type: 'Japanese beer', origin: 'Japan' };
}
