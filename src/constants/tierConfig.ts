export const TIER_CONFIG = {
  A: { color: '#10b981', bg: '#10b98115', range: '85–100', description: 'Exceptional' },
  B: { color: '#3b82f6', bg: '#3b82f615', range: '70–84', description: 'Above Average' },
  C: { color: '#f59e0b', bg: '#f59e0b15', range: '55–69', description: 'Average' },
  D: { color: '#ef4444', bg: '#ef444415', range: '0–54', description: 'Below Average' },
};


export type TierKey = keyof typeof TIER_CONFIG;