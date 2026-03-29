export type Category = 'Gold & Jewelry' | 'Family Clothes' | 'Engagement' | 'Janeu Ceremony' | 'Marriage Clothes' | 'Catering' | 'Venue' | 'Decor' | 'Photography' | 'Others';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  status: 'Paid' | 'Pending';
  date: string;
}

export interface CategorySummary {
  name: Category;
  total: number;
  paid: number;
  pending: number;
  color: string;
}
