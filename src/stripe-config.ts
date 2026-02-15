export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
  currencySymbol: string;
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1T0sosP8QPuGl0NRX1YyYzgX',
    name: 'LDA - Life data analysis',
    description: 'Advanced life data analysis tools and features',
    mode: 'subscription',
    price: 17.00,
    currency: 'brl',
    currencySymbol: 'R$'
  }
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}