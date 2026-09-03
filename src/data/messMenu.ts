import { MealMenu } from '../types';

export interface WeeklyMenu {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  meals: MealMenu[];
}

export const HARDCODED_MESS_MENU: WeeklyMenu[] = [
  {
    dayOfWeek: 1, // Monday
    meals: [
      { slot: 'breakfast', items: [{ name: 'Uttapam', estCalories: 150 }, { name: 'Coconut Chutney', estCalories: 50 }, { name: 'Sambar', estCalories: 80 }, { name: 'White Bread / Butter / Jam', estCalories: 150 }, { name: 'Sprouts / 1 small apple', estCalories: 50 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }, { name: 'Omelette', estCalories: 120 }] },
      { slot: 'lunch', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Dal Tadka', estCalories: 150 }, { name: 'Aloo Matar', estCalories: 180 }, { name: 'Steamed Rice', estCalories: 150 }, { name: 'Raita', estCalories: 80 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }] },
      { slot: 'snacks', items: [{ name: 'Veg Sandwich', estCalories: 200 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }] },
      { slot: 'dinner', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Dal Makhani', estCalories: 200 }, { name: 'Paneer Bhurji', estCalories: 250 }, { name: 'Jeera Rice', estCalories: 180 }, { name: 'Gulab Jamun', estCalories: 150 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }, { name: 'Milk / Bournvita', estCalories: 120 }] }
    ]
  },
  {
    dayOfWeek: 2, // Tuesday
    meals: [
      { slot: 'breakfast', items: [{ name: 'Idli (4 Pcs) / Dosa (2 Pcs)', estCalories: 200 }, { name: 'Coconut Chutney', estCalories: 50 }, { name: 'Sambar', estCalories: 80 }, { name: 'White Bread / Butter / Jam', estCalories: 150 }, { name: 'Sprouts / 1 small apple', estCalories: 50 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }, { name: 'Omelette', estCalories: 120 }] },
      { slot: 'lunch', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Puri / Chapati', estCalories: 150 }, { name: 'Dal Makhani / Dal Tadka', estCalories: 180 }, { name: 'Mix Veg', estCalories: 120 }, { name: 'Steamed Rice', estCalories: 150 }, { name: 'Raita / Curd', estCalories: 80 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }] },
      { slot: 'snacks', items: [{ name: 'Aloo Samosa (1 Pcs) / Pav Bhaji', estCalories: 250 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }] },
      { slot: 'dinner', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Puri / Chapati', estCalories: 150 }, { name: 'Rajma Masala', estCalories: 200 }, { name: 'Palak Paneer', estCalories: 220 }, { name: 'Steamed Rice', estCalories: 150 }, { name: 'Gulab Jamun', estCalories: 150 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }, { name: 'Milk / Bournvita', estCalories: 120 }] }
    ]
  },
  {
    dayOfWeek: 3, // Wednesday
    meals: [
      { slot: 'breakfast', items: [{ name: 'Aloo Paratha (2 Pcs) / Puri / Sabzi', estCalories: 300 }, { name: 'Pickles', estCalories: 20 }, { name: 'White Bread / Butter / Jam', estCalories: 150 }, { name: 'Sprouts / 1 small apple', estCalories: 50 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }, { name: 'Boiled Egg', estCalories: 70 }] },
      { slot: 'lunch', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Matar Paneer / Kadai Paneer', estCalories: 250 }, { name: 'Mix Veg', estCalories: 120 }, { name: 'Jeera Rice', estCalories: 180 }, { name: 'Raita / Curd', estCalories: 80 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }] },
      { slot: 'snacks', items: [{ name: 'Chowmein / Maggi', estCalories: 250 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }] },
      { slot: 'dinner', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Dal Tadka', estCalories: 150 }, { name: 'Paneer Butter Masala', estCalories: 300 }, { name: 'Steamed Rice', estCalories: 150 }, { name: 'Kheer', estCalories: 200 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }, { name: 'Milk / Bournvita', estCalories: 120 }] }
    ]
  },
  {
    dayOfWeek: 4, // Thursday
    meals: [
      { slot: 'breakfast', items: [{ name: 'Poha / Upma', estCalories: 200 }, { name: 'Sev', estCalories: 50 }, { name: 'White Bread / Butter / Jam', estCalories: 150 }, { name: 'Sprouts / 1 small apple', estCalories: 50 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }, { name: 'Scrambled Egg', estCalories: 140 }] },
      { slot: 'lunch', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Chhole Bhature', estCalories: 400 }, { name: 'Aloo Gobi', estCalories: 150 }, { name: 'Steamed Rice', estCalories: 150 }, { name: 'Boondi Raita', estCalories: 90 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }] },
      { slot: 'snacks', items: [{ name: 'Bread Pakora', estCalories: 250 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }] },
      { slot: 'dinner', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Dal Fry', estCalories: 150 }, { name: 'Malai Kofta', estCalories: 300 }, { name: 'Jeera Rice', estCalories: 180 }, { name: 'Fruit Custard', estCalories: 150 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }, { name: 'Milk / Bournvita', estCalories: 120 }] }
    ]
  },
  {
    dayOfWeek: 5, // Friday
    meals: [
      { slot: 'breakfast', items: [{ name: 'Masala Dosa', estCalories: 250 }, { name: 'Coconut Chutney', estCalories: 50 }, { name: 'Sambar', estCalories: 80 }, { name: 'White Bread / Butter / Jam', estCalories: 150 }, { name: 'Sprouts / 1 small apple', estCalories: 50 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }, { name: 'Omelette', estCalories: 120 }] },
      { slot: 'lunch', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Rajma', estCalories: 200 }, { name: 'Bhindi Fry', estCalories: 120 }, { name: 'Steamed Rice', estCalories: 150 }, { name: 'Plain Curd', estCalories: 70 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }] },
      { slot: 'snacks', items: [{ name: 'Samosa', estCalories: 200 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }] },
      { slot: 'dinner', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Dal Makhani', estCalories: 200 }, { name: 'Paneer Tikka Masala', estCalories: 250 }, { name: 'Veg Biryani', estCalories: 300 }, { name: 'Jalebi', estCalories: 200 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }, { name: 'Milk / Bournvita', estCalories: 120 }] }
    ]
  },
  {
    dayOfWeek: 6, // Saturday
    meals: [
      { slot: 'breakfast', items: [{ name: 'Puri Bhaji', estCalories: 300 }, { name: 'Pickles', estCalories: 20 }, { name: 'White Bread / Butter / Jam', estCalories: 150 }, { name: 'Sprouts / 1 small apple', estCalories: 50 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }, { name: 'Boiled Egg', estCalories: 70 }] },
      { slot: 'lunch', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Kadhi Pakora', estCalories: 200 }, { name: 'Aloo Jeera', estCalories: 150 }, { name: 'Steamed Rice', estCalories: 150 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }] },
      { slot: 'snacks', items: [{ name: 'Bhel Puri / Chaat', estCalories: 150 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }] },
      { slot: 'dinner', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Dal Tadka', estCalories: 150 }, { name: 'Kadai Paneer', estCalories: 250 }, { name: 'Jeera Rice', estCalories: 180 }, { name: 'Ice Cream', estCalories: 150 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }, { name: 'Milk / Bournvita', estCalories: 120 }] }
    ]
  },
  {
    dayOfWeek: 0, // Sunday
    meals: [
      { slot: 'breakfast', items: [{ name: 'Chhole Bhature', estCalories: 400 }, { name: 'Pickles', estCalories: 20 }, { name: 'White Bread / Butter / Jam', estCalories: 150 }, { name: 'Sprouts / 1 small apple', estCalories: 50 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }, { name: 'Scrambled Egg', estCalories: 140 }] },
      { slot: 'lunch', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Dal Makhani', estCalories: 200 }, { name: 'Shahi Paneer', estCalories: 300 }, { name: 'Veg Pulao', estCalories: 250 }, { name: 'Raita', estCalories: 80 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }] },
      { slot: 'snacks', items: [{ name: 'Patties', estCalories: 200 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }] },
      { slot: 'dinner', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Dal Fry', estCalories: 150 }, { name: 'Mix Veg', estCalories: 120 }, { name: 'Steamed Rice', estCalories: 150 }, { name: 'Rasgulla', estCalories: 150 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }, { name: 'Milk / Bournvita', estCalories: 120 }] }
    ]
  }
];
