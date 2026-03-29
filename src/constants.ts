import { Expense, Category } from './types';

export const CATEGORY_COLORS: Record<Category, string> = {
  'Gold & Jewelry': '#D4AF37', // Gold
  'Family Clothes': '#8E44AD', // Purple
  'Engagement': '#3498DB', // Blue
  'Janeu Ceremony': '#E67E22', // Orange
  'Marriage Clothes': '#E91E63', // Pink
  'Catering': '#27AE60', // Green
  'Venue': '#2C3E50', // Dark Slate
  'Decor': '#F1C40F', // Yellow
  'Photography': '#95A5A6', // Gray
  'Others': '#7F8C8D', // Dark Gray
};

export const INITIAL_EXPENSES: Expense[] = [
  // Gold & Jewelry
  { id: '1', title: 'Gold (Pending)', amount: 750000, category: 'Gold & Jewelry', status: 'Pending', date: '2026-03-20' },
  { id: '2', title: 'Engagement Ring', amount: 170000, category: 'Gold & Jewelry', status: 'Paid', date: '2026-03-15' },
  { id: '3', title: 'UD Chain', amount: 150000, category: 'Gold & Jewelry', status: 'Paid', date: '2026-03-10' },
  { id: '4', title: 'Madhu Ring', amount: 32000, category: 'Gold & Jewelry', status: 'Paid', date: '2026-03-12' },
  
  // Family Clothes
  { id: '5', title: 'Nilanshu Clothes', amount: 10000, category: 'Family Clothes', status: 'Paid', date: '2026-03-01' },
  { id: '6', title: 'Barimaa Clothes', amount: 6000, category: 'Family Clothes', status: 'Paid', date: '2026-03-02' },
  { id: '7', title: 'Dadi Clothes', amount: 1800, category: 'Family Clothes', status: 'Paid', date: '2026-03-03' },
  { id: '8', title: 'Baba Clothes', amount: 2000, category: 'Family Clothes', status: 'Paid', date: '2026-03-04' },
  { id: '9', title: 'Barepapa Clothes', amount: 1500, category: 'Family Clothes', status: 'Paid', date: '2026-03-05' },
  { id: '10', title: 'Kittu Clothes', amount: 20000, category: 'Family Clothes', status: 'Paid', date: '2026-03-06' },
  { id: '11', title: 'Papa Clothes', amount: 8000, category: 'Family Clothes', status: 'Paid', date: '2026-03-07' },
  { id: '12', title: 'Others (Family Clothes)', amount: 9500, category: 'Family Clothes', status: 'Paid', date: '2026-03-08' },
  
  // Engagement
  { id: '13', title: 'Hotel Booking', amount: 110000, category: 'Engagement', status: 'Paid', date: '2026-03-18' },
  { id: '14', title: 'UD Cloth (Engagement)', amount: 21000, category: 'Engagement', status: 'Paid', date: '2026-03-19' },
  { id: '15', title: 'Madhu (Suit/Saree/Makeup)', amount: 10200, category: 'Engagement', status: 'Paid', date: '2026-03-20' },
  
  // Janeu Ceremony
  { id: '16', title: 'Utensils', amount: 10000, category: 'Janeu Ceremony', status: 'Paid', date: '2026-03-22' },
  { id: '17', title: 'Clothes (Janeu)', amount: 17600, category: 'Janeu Ceremony', status: 'Paid', date: '2026-03-23' },
  
  // Marriage Clothes
  { id: '18', title: 'General Marriage Clothes', amount: 21600, category: 'Marriage Clothes', status: 'Paid', date: '2026-03-25' },
  { id: '19', title: 'Chotimaa Patna Clothes', amount: 24600, category: 'Marriage Clothes', status: 'Paid', date: '2026-03-26' },
  { id: '20', title: 'Suti Saree', amount: 6000, category: 'Marriage Clothes', status: 'Paid', date: '2026-03-27' },
];
