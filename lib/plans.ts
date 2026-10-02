export const currentPlans = {
  pass: { amount: 500, seconds: 300, title: '5-minute chat pass', price: '₹5', period: '/ 5-minute chat pass' },
  daily: { amount: 19900, seconds: 86400, title: '1-day Premium pass', price: '₹199', period: '/ 24 hours' },
  monthly: { amount: 199900, seconds: 30 * 86400, title: '30-day Premium pass', price: '₹1,999', period: '/ 30 days' },
} as const;
export type CurrentPlan = keyof typeof currentPlans;
export type AccessPlan = CurrentPlan | 'premium';
export function coversPlan(active: AccessPlan, desired: CurrentPlan) {
  const rank = { pass: 0, daily: 1, monthly: 2, premium: 2 };
  return rank[active] >= rank[desired];
}
