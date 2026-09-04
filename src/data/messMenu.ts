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

export interface MonthlyMenu {
  date: number; // 1 to 31
  dayName: string;
  meals: MealMenu[];
}

export const MONTHLY_MESS_MENU: MonthlyMenu[] = [
  {
    date: 1,
    dayName: "Tue",
    meals: [
      { slot: "breakfast", items: [{ name: "Multi Grain Dosa (2 Pcs Thin)", estCalories: 150 }, { name: "Pav Bhaji", estCalories: 150 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "Mint Chutney", estCalories: 30 }, { name: "White Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Scrambled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Carrot & Cucumber Salad", estCalories: 30 }, { name: "Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Amaranthus Dal", estCalories: 120 }, { name: "Beetroot Tomato Rasam", estCalories: 150 }, { name: "Bisbele Bath", estCalories: 150 }, { name: "Kakarakaya (Bitter Gourd) Fry", estCalories: 150 }, { name: "Rajma Masala", estCalories: 150 }, { name: "Potato Chips", estCalories: 150 }, { name: "Dahi Vada", estCalories: 150 }, { name: "Dosakaya Tomato Chutney", estCalories: 30 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Aloo Samosa 1 Big Pc", estCalories: 150 }, { name: "Tomato Sauce", estCalories: 150 }, { name: "Ginger Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Makhani", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Mushroom Biryani", estCalories: 200 }, { name: "Snake Gourd Poriyal", estCalories: 150 }, { name: "Aloo Mutter Curry", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Guava Fruit", estCalories: 150 }, { name: "Tomato Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 2,
    dayName: "Wed",
    meals: [
      { slot: "breakfast", items: [{ name: "Methu Vada (Big size 3pcs, if not 4pcs)", estCalories: 150 }, { name: "Moong Dal Palak Tepla (Hand Made) 2 Pcs", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Tomato Chutney", estCalories: 30 }, { name: "Brown Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Boiled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Onions & Lemon Salad", estCalories: 30 }, { name: "Palak Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Gongura (Sorrel Leaves) Dal", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Vegetable Dum Pulav", estCalories: 150 }, { name: "Masala Fish Fry / Andhra Chicken Fry", estCalories: 150 }, { name: "Kaju Tomato Paneer Boiled Fry", estCalories: 150 }, { name: "Black Chana Masala", estCalories: 150 }, { name: "Triangle Fryums", estCalories: 150 }, { name: "Butter Milk", estCalories: 80 }, { name: "Coriander + Tomato Chutney", estCalories: 30 }, { name: "Gulab Jamun", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Corn Vada", estCalories: 150 }, { name: "Onion Tomato Chutney", estCalories: 30 }, { name: "Masala Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Chapathi", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Tomato Dal", estCalories: 120 }, { name: "Rasam", estCalories: 150 }, { name: "Sooji Upma, Coconut Chutney", estCalories: 30 }, { name: "Carrot Beans Poriyal", estCalories: 150 }, { name: "Soya Chunks Masala", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Fruit Custard with Pineapple", estCalories: 150 }, { name: "Lemon Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 3,
    dayName: "Thu",
    meals: [
      { slot: "breakfast", items: [{ name: "Poori (3 Pcs standard size)", estCalories: 150 }, { name: "Lemon Sevai", estCalories: 150 }, { name: "Aloo Mutter Curry", estCalories: 150 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "White Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Masala Onion Omlet", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Carrot & Cucumber Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Ridge Gourd Dal", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Pudina Rice", estCalories: 200 }, { name: "Guthi Vankaya Curry", estCalories: 150 }, { name: "Cluster Beans Masala", estCalories: 150 }, { name: "Finger Fryums", estCalories: 150 }, { name: "Lemon Water + Sabja Seeds", estCalories: 150 }, { name: "Potlakaya Perugu Chutney", estCalories: 30 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Poha Cutlet", estCalories: 150 }, { name: "Mint Sauce", estCalories: 150 }, { name: "Ginger Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Maharani", estCalories: 120 }, { name: "Beetroot Tomato Rasam", estCalories: 150 }, { name: "Veg Manchuria, Noodles, Tomato Sauce", estCalories: 150 }, { name: "Arbi Ka Gravy", estCalories: 150 }, { name: "Rasam", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Banana", estCalories: 150 }, { name: "Ginger Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 4,
    dayName: "Fri",
    meals: [
      { slot: "breakfast", items: [{ name: "Uggani + Mirchi Bajji", estCalories: 150 }, { name: "Methi Roti or Methi Chapathi (Hand made) 2 Pcs", estCalories: 150 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "Green Peas + Tomato Sabji", estCalories: 150 }, { name: "Brown Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Boiled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Beetroot & Cucumber Salad", estCalories: 30 }, { name: "Chapathi", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Tadka", estCalories: 120 }, { name: "Rasam", estCalories: 150 }, { name: "Jeera Rice", estCalories: 200 }, { name: "Raw Banana Fry", estCalories: 150 }, { name: "Aloo Gobhi Masala", estCalories: 150 }, { name: "Papad", estCalories: 150 }, { name: "Lassi", estCalories: 150 }, { name: "Beerakaya Chutney", estCalories: 30 }, { name: "Semiya Payasam", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Raw Banana Bhajji", estCalories: 150 }, { name: "Coconut Coriander Chutney", estCalories: 30 }, { name: "Masala Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Onions & Lemon Salad", estCalories: 30 }, { name: "Lacha Paratha", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Pesara Pappu", estCalories: 150 }, { name: "Sambar", estCalories: 120 }, { name: "Dhaba Style Chicken Curry (Non-Veg)", estCalories: 150 }, { name: "Paneer Butter Masala (Veg)", estCalories: 150 }, { name: "Tomato Peas Capsicum Masala", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "(Watermelon + Muskmelon + Papaya) Cut Fruit", estCalories: 150 }, { name: "Mango Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 5,
    dayName: "Sat",
    meals: [
      { slot: "breakfast", items: [{ name: "Onion & Carrot Utappam", estCalories: 150 }, { name: "Vegetable Poha", estCalories: 150 }, { name: "Peanut Chutney", estCalories: 30 }, { name: "Tomato Chutney", estCalories: 30 }, { name: "White Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Boiled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Carrot & Cucumber Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Mudda Pappu", estCalories: 150 }, { name: "Beetroot Tomato Rasam", estCalories: 150 }, { name: "Pulihora (Tamarind Rice)", estCalories: 200 }, { name: "Dondakaya Stir Fry", estCalories: 150 }, { name: "Chole Soya Chunks Curry", estCalories: 150 }, { name: "Papad", estCalories: 150 }, { name: "Majiga Pulusu", estCalories: 150 }, { name: "Avakaya (Mango Pickle)", estCalories: 30 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Punugulu 10 Pcs Std Size", estCalories: 150 }, { name: "Groundnut/Coconut Chutney", estCalories: 30 }, { name: "Ginger Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Mango Dal", estCalories: 120 }, { name: "Bachali Kura Pulusu (Malabar Spinach)", estCalories: 150 }, { name: "Set Dosa -2 Pcs, Coconut Chutney", estCalories: 30 }, { name: "Cabbage Beans Poriyal", estCalories: 150 }, { name: "Tomato Baingan Masala", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Muskmelon Cut Fruit", estCalories: 150 }, { name: "Red Chilli Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 6,
    dayName: "Sun",
    meals: [
      { slot: "breakfast", items: [{ name: "Shavige Bath", estCalories: 150 }, { name: "Paneer Paratha - 2 Pcs Thin", estCalories: 150 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "Thick Curd, Mango Pickle", estCalories: 60 }, { name: "Brown Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Egg Bhurji", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Beetroot & Cucumber Salad", estCalories: 30 }, { name: "Chapathi", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Fry", estCalories: 120 }, { name: "Chicken Dum Biryani/Paneer Dum Biryani", estCalories: 200 }, { name: "Chicken Thick Gravy / Hyderabadi Mirchi Ka Salan", estCalories: 150 }, { name: "Onion Raitha", estCalories: 150 }, { name: "Fryums", estCalories: 150 }, { name: "Nannari Sharbath", estCalories: 150 }, { name: "Fresh Gongura Chutney", estCalories: 30 }, { name: "Vanilla Ice Cream (Not Frozen Dessert)", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Dahi Puri (8 Pcs)", estCalories: 150 }, { name: "Onions", estCalories: 150 }, { name: "Masala Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Pesara Pappu", estCalories: 150 }, { name: "Rasam", estCalories: 150 }, { name: "Ragi Dosa, Tomato Chutney", estCalories: 30 }, { name: "Dondakaya Fry", estCalories: 150 }, { name: "Vegetable Kurma Gravy", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Papaya Cut Fruit", estCalories: 150 }, { name: "Tomato Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 7,
    dayName: "Mon",
    meals: [
      { slot: "breakfast", items: [{ name: "Carrot Idly", estCalories: 150 }, { name: "Bhature - 2 Pcs Big", estCalories: 150 }, { name: "Groundnut Chutney, Sambar", estCalories: 120 }, { name: "Chole Curry", estCalories: 150 }, { name: "Brown Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Egg Bhurji", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Beetroot & Cucumber Salad", estCalories: 30 }, { name: "Chapathi", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Palak Dal", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Tomato Rice", estCalories: 200 }, { name: "Pesara Punugulu Curry (Pakka Andhra Style)", estCalories: 150 }, { name: "Drumstick Tomato Masala", estCalories: 150 }, { name: "Rava Vadiyalu", estCalories: 150 }, { name: "Butter Milk", estCalories: 80 }, { name: "Sorakaya Perugu Chutney, Ghee + Podi", estCalories: 30 }, { name: "Jilebi", estCalories: 150 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Dry Maggi", estCalories: 150 }, { name: "Tomato Sauce", estCalories: 150 }, { name: "Masala Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Onions & Lemon Salad", estCalories: 30 }, { name: "Methi Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Pesara Pappu", estCalories: 150 }, { name: "Tomato Rasam", estCalories: 150 }, { name: "Bhagara Rice", estCalories: 200 }, { name: "Telangana Chicken Curry (Non-Veg)", estCalories: 150 }, { name: "Achari Paneer (Veg)", estCalories: 150 }, { name: "Ladies Finger Boiled Fry", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Mixed Fruit Salad", estCalories: 30 }, { name: "Gongura Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 8,
    dayName: "Tue",
    meals: [
      { slot: "breakfast", items: [{ name: "Onion Dosa - 2 Pcs Std Size", estCalories: 150 }, { name: "Vada Pav", estCalories: 150 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "Mint Chutney", estCalories: 30 }, { name: "Brown Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Boiled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Carrot & Cucumber Salad", estCalories: 30 }, { name: "Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Amaranthus Dal", estCalories: 120 }, { name: "Beetroot Tomato Rasam", estCalories: 150 }, { name: "Bisbele Bath", estCalories: 150 }, { name: "Kakarakaya (Bitter Gourd) Fry", estCalories: 150 }, { name: "Rajma Masala", estCalories: 150 }, { name: "Potato Chips", estCalories: 150 }, { name: "Dahi Vada", estCalories: 150 }, { name: "Dosakaya Tomato Chutney", estCalories: 30 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Kachori 1 Big Pc", estCalories: 150 }, { name: "Tomato Sauce", estCalories: 150 }, { name: "Masala Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Makhani", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Mushroom Biryani", estCalories: 200 }, { name: "Snake Gourd Poriyal", estCalories: 150 }, { name: "Aloo Mutter Curry", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Guava Fruit", estCalories: 150 }, { name: "Tomato Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 9,
    dayName: "Wed",
    meals: [
      { slot: "breakfast", items: [{ name: "Onion Rava Bonda (Big size 3pcs, if not 4pcs)", estCalories: 150 }, { name: "Cucumber Poha", estCalories: 150 }, { name: "Sambar", estCalories: 120 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "White Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Masala Onion Omlet", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Onions & Lemon Salad", estCalories: 30 }, { name: "Palak Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Gongura (Sorrel Leaves) Dal", estCalories: 120 }, { name: "Pachi Pulusu", estCalories: 150 }, { name: "Special Rice", estCalories: 200 }, { name: "Boiled Stir Fry Chicken Masala (Dry)", estCalories: 150 }, { name: "Boiled Stir Fry Paneer Masala (Dry)", estCalories: 150 }, { name: "Vegetable Jalfrezi", estCalories: 150 }, { name: "Chips/Fryums/Papad", estCalories: 150 }, { name: "Lemon Water + Sabja Seeds", estCalories: 150 }, { name: "Fresh Vegetable Chutney", estCalories: 30 }, { name: "Badusha", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Onion Soft Pakoda", estCalories: 150 }, { name: "Tomato Chutney", estCalories: 30 }, { name: "Ginger Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Chapathi", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Tomato Dal", estCalories: 120 }, { name: "Rasam", estCalories: 150 }, { name: "Broken Wheat Rava Upma, Coconut Chutney", estCalories: 30 }, { name: "Carrot Beans Poriyal", estCalories: 150 }, { name: "Arbi Ka Gravy", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Fruit Custard with mixed fruits", estCalories: 150 }, { name: "Lemon Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 10,
    dayName: "Thu",
    meals: [
      { slot: "breakfast", items: [{ name: "Poori (3 pcs standard size)", estCalories: 150 }, { name: "Tomato Suji Upma", estCalories: 150 }, { name: "Aloo Basin Chutney", estCalories: 30 }, { name: "Peanut Chutney", estCalories: 30 }, { name: "Brown Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Egg Bhurji (Non-Veg)", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Carrot & Cucumber Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Ridge Gourd Dal", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Pudina Rice", estCalories: 200 }, { name: "Guthi Vankaya Curry", estCalories: 150 }, { name: "Kala Chana Masala", estCalories: 150 }, { name: "Finger Fryums", estCalories: 150 }, { name: "Lemon Water + Sabja Seeds", estCalories: 150 }, { name: "Potlakaya Perugu Chutney", estCalories: 30 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Sambar Vada 2 Pcs", estCalories: 120 }, { name: "Masala Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Fry", estCalories: 120 }, { name: "Beetroot Tomato Rasam", estCalories: 150 }, { name: "Gobhi Manchuria, Noodles, Tomato Sauce", estCalories: 150 }, { name: "Rajma Masala", estCalories: 150 }, { name: "Rasam", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Banana", estCalories: 150 }, { name: "Ginger Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 11,
    dayName: "Fri",
    meals: [
      { slot: "breakfast", items: [{ name: "Uggani + Mirchi Bajji", estCalories: 150 }, { name: "Pudina Chapathi (Hand Made) 2 Pcs", estCalories: 150 }, { name: "Dal Chutney", estCalories: 120 }, { name: "Aloo Mutter Curry", estCalories: 150 }, { name: "White Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Boiled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Beetroot & Cucumber Salad", estCalories: 30 }, { name: "Chapathi", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Tadka", estCalories: 120 }, { name: "Rasam", estCalories: 150 }, { name: "Jeera Rice", estCalories: 200 }, { name: "Raw Banana Fry", estCalories: 150 }, { name: "Lobia Masala (Cowpeas in Onion Tomato Gravy)", estCalories: 150 }, { name: "Papad", estCalories: 150 }, { name: "Lassi", estCalories: 150 }, { name: "Beerakaya Chutney", estCalories: 30 }, { name: "Poornalu", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Vada Pav 2 Pcs", estCalories: 150 }, { name: "Mint Sauce", estCalories: 150 }, { name: "Ginger Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Onions & Lemon Salad", estCalories: 30 }, { name: "Missi Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Kadai Chicken (Non-Veg)", estCalories: 150 }, { name: "Kadai Paneer (Veg)", estCalories: 150 }, { name: "Amritsari Chole", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "(Watermelon + Muskmelon + Papaya) Cut Fruit", estCalories: 150 }, { name: "Fresh Vegetable Chutney/Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 12,
    dayName: "Sat",
    meals: [
      { slot: "breakfast", items: [{ name: "Masala Ghee Roast Dosa 2 Pcs Std Size", estCalories: 150 }, { name: "Vegetable Moong Dal Kitchidi", estCalories: 120 }, { name: "Groundnut Chutney", estCalories: 30 }, { name: "Sambar", estCalories: 120 }, { name: "Brown Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Scrambled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Carrot & Cucumber Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Mudda Pappu", estCalories: 150 }, { name: "Beetroot Tomato Rasam", estCalories: 150 }, { name: "Pulihora (Tamarind Rice)", estCalories: 200 }, { name: "Cauliflower Fry", estCalories: 150 }, { name: "Chole Soya Chunks Curry", estCalories: 150 }, { name: "Papad", estCalories: 150 }, { name: "Majiga Pulusu", estCalories: 150 }, { name: "Avakaya (Mango Pickle)", estCalories: 30 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Mysore Bonda 2 Pcs Std Size", estCalories: 150 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "Masala Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Mango Dal", estCalories: 120 }, { name: "Bachali Kura Pulusu (Malabar Spinach)", estCalories: 150 }, { name: "Podi Onion Dosa -2 Pcs, Dal Chutney", estCalories: 120 }, { name: "Cabbage Beans Poriyal", estCalories: 150 }, { name: "Tomato Baingan Masala", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Muskmelon Cut Fruit", estCalories: 150 }, { name: "Red Chilli Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 13,
    dayName: "Sun",
    meals: [
      { slot: "breakfast", items: [{ name: "Coconut Sevai", estCalories: 150 }, { name: "Aloo Paratha (2 Pcs Thin)", estCalories: 150 }, { name: "Onion Tomato Chutney", estCalories: 30 }, { name: "Thick Curd, Mango Pickle", estCalories: 60 }, { name: "White Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Egg Bhurji", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Beetroot & Cucumber Salad", estCalories: 30 }, { name: "Chapathi", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Makhani", estCalories: 120 }, { name: "Chicken Dum Biryani/Paneer Dum Biryani", estCalories: 200 }, { name: "Chicken Thick Gravy / Hyderabadi Mirchi Ka Salan", estCalories: 150 }, { name: "Onion Raitha", estCalories: 150 }, { name: "Fryums", estCalories: 150 }, { name: "Nannari Sharbath", estCalories: 150 }, { name: "Fresh Gongura Chutney", estCalories: 30 }, { name: "Kulfi (Not Frozen Dessert)", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Pani Puri (8 Pcs)", estCalories: 150 }, { name: "Onions", estCalories: 150 }, { name: "Ginger Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Pesara Pappu", estCalories: 150 }, { name: "Rasam", estCalories: 150 }, { name: "Ragi Rava Upma, Coconut Chutney", estCalories: 30 }, { name: "Dondakaya Fry", estCalories: 150 }, { name: "Vegetable Kolhapuri", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Papaya Cut Fruit", estCalories: 150 }, { name: "Tomato Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 14,
    dayName: "Mon",
    meals: [
      { slot: "breakfast", items: [{ name: "Konaseema Pottikkalu (14) / Idly Upma (28)", estCalories: 150 }, { name: "Poori - 3 Pcs Big", estCalories: 150 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "Chole Curry", estCalories: 150 }, { name: "White Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Scrambled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Beetroot & Cucumber Salad", estCalories: 30 }, { name: "Chapathi", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Palak Dal", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Tomato Rice", estCalories: 200 }, { name: "Potato Fry (Andhra Style)", estCalories: 150 }, { name: "Drumstick Tomato Masala", estCalories: 150 }, { name: "Rava Vadiyalu", estCalories: 150 }, { name: "Butter Milk", estCalories: 80 }, { name: "Sorakaya Perugu Chutney, Ghee + Podi", estCalories: 30 }, { name: "Sweet Boondi", estCalories: 150 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Sweet Corn Masala", estCalories: 150 }, { name: "Tomato/Mint Sauce", estCalories: 150 }, { name: "Ginger Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Onions & Lemon Salad", estCalories: 30 }, { name: "Methi Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Pesara Pappu", estCalories: 150 }, { name: "Tomato Rasam", estCalories: 150 }, { name: "Bhagara Rice", estCalories: 200 }, { name: "Chettinad Chicken Curry (Non-Veg)", estCalories: 150 }, { name: "Paneer Pepper Fry (Veg)", estCalories: 150 }, { name: "Bhindi Masala", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Mixed Fruit Salad", estCalories: 30 }, { name: "Gongura Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 15,
    dayName: "Tue",
    meals: [
      { slot: "breakfast", items: [{ name: "Multi Grain Dosa (2 Pcs Thin)", estCalories: 150 }, { name: "Pav Bhaji", estCalories: 150 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "Mint Chutney", estCalories: 30 }, { name: "White Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Scrambled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Carrot & Cucumber Salad", estCalories: 30 }, { name: "Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Amaranthus Dal", estCalories: 120 }, { name: "Beetroot Tomato Rasam", estCalories: 150 }, { name: "Bisbele Bath", estCalories: 150 }, { name: "Kakarakaya (Bitter Gourd) Fry", estCalories: 150 }, { name: "Rajma Masala", estCalories: 150 }, { name: "Potato Chips", estCalories: 150 }, { name: "Dahi Vada", estCalories: 150 }, { name: "Dosakaya Tomato Chutney", estCalories: 30 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Aloo Samosa 1 Big Pc", estCalories: 150 }, { name: "Tomato Sauce", estCalories: 150 }, { name: "Ginger Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Makhani", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Mushroom Biryani", estCalories: 200 }, { name: "Snake Gourd Poriyal", estCalories: 150 }, { name: "Aloo Mutter Curry", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Guava Fruit", estCalories: 150 }, { name: "Tomato Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 16,
    dayName: "Wed",
    meals: [
      { slot: "breakfast", items: [{ name: "Methu Vada (Big size 3pcs, if not 4pcs)", estCalories: 150 }, { name: "Moong Dal Palak Tepla (Hand Made) 2 Pcs", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Tomato Chutney", estCalories: 30 }, { name: "Brown Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Boiled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Onions & Lemon Salad", estCalories: 30 }, { name: "Palak Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Gongura (Sorrel Leaves) Dal", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Vegetable Dum Pulav", estCalories: 150 }, { name: "Masala Fish Fry / Andhra Chicken Fry", estCalories: 150 }, { name: "Kaju Tomato Paneer Boiled Fry", estCalories: 150 }, { name: "Black Chana Masala", estCalories: 150 }, { name: "Triangle Fryums", estCalories: 150 }, { name: "Butter Milk", estCalories: 80 }, { name: "Coriander + Tomato Chutney", estCalories: 30 }, { name: "Gulab Jamun", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Corn Vada", estCalories: 150 }, { name: "Onion Tomato Chutney", estCalories: 30 }, { name: "Masala Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Chapathi", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Tomato Dal", estCalories: 120 }, { name: "Rasam", estCalories: 150 }, { name: "Sooji Upma, Coconut Chutney", estCalories: 30 }, { name: "Carrot Beans Poriyal", estCalories: 150 }, { name: "Soya Chunks Masala", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Fruit Custard with Pineapple", estCalories: 150 }, { name: "Lemon Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 17,
    dayName: "Thu",
    meals: [
      { slot: "breakfast", items: [{ name: "Poori (3 Pcs standard size)", estCalories: 150 }, { name: "Lemon Sevai", estCalories: 150 }, { name: "Aloo Mutter Curry", estCalories: 150 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "White Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Masala Onion Omlet", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Carrot & Cucumber Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Ridge Gourd Dal", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Pudina Rice", estCalories: 200 }, { name: "Guthi Vankaya Curry", estCalories: 150 }, { name: "Cluster Beans Masala", estCalories: 150 }, { name: "Finger Fryums", estCalories: 150 }, { name: "Lemon Water + Sabja Seeds", estCalories: 150 }, { name: "Potlakaya Perugu Chutney", estCalories: 30 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Poha Cutlet", estCalories: 150 }, { name: "Mint Sauce", estCalories: 150 }, { name: "Ginger Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Maharani", estCalories: 120 }, { name: "Beetroot Tomato Rasam", estCalories: 150 }, { name: "Veg Manchuria, Noodles, Tomato Sauce", estCalories: 150 }, { name: "Arbi Ka Gravy", estCalories: 150 }, { name: "Rasam", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Banana", estCalories: 150 }, { name: "Ginger Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 18,
    dayName: "Fri",
    meals: [
      { slot: "breakfast", items: [{ name: "Uggani + Mirchi Bajji", estCalories: 150 }, { name: "Methi Roti or Methi Chapathi (Hand made) 2 Pcs", estCalories: 150 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "Green Peas + Tomato Sabji", estCalories: 150 }, { name: "Brown Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Boiled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Beetroot & Cucumber Salad", estCalories: 30 }, { name: "Chapathi", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Tadka", estCalories: 120 }, { name: "Rasam", estCalories: 150 }, { name: "Jeera Rice", estCalories: 200 }, { name: "Raw Banana Fry", estCalories: 150 }, { name: "Aloo Gobhi Masala", estCalories: 150 }, { name: "Papad", estCalories: 150 }, { name: "Lassi", estCalories: 150 }, { name: "Beerakaya Chutney", estCalories: 30 }, { name: "Semiya Payasam", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Raw Banana Bhajji", estCalories: 150 }, { name: "Coconut Coriander Chutney", estCalories: 30 }, { name: "Masala Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Onions & Lemon Salad", estCalories: 30 }, { name: "Lacha Paratha", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Pesara Pappu", estCalories: 150 }, { name: "Sambar", estCalories: 120 }, { name: "Dhaba Style Chicken Curry (Non-Veg)", estCalories: 150 }, { name: "Paneer Butter Masala (Veg)", estCalories: 150 }, { name: "Tomato Peas Capsicum Masala", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "(Watermelon + Muskmelon + Papaya) Cut Fruit", estCalories: 150 }, { name: "Mango Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 19,
    dayName: "Sat",
    meals: [
      { slot: "breakfast", items: [{ name: "Onion & Carrot Utappam", estCalories: 150 }, { name: "Vegetable Poha", estCalories: 150 }, { name: "Peanut Chutney", estCalories: 30 }, { name: "Tomato Chutney", estCalories: 30 }, { name: "White Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Boiled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Carrot & Cucumber Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Mudda Pappu", estCalories: 150 }, { name: "Beetroot Tomato Rasam", estCalories: 150 }, { name: "Pulihora (Tamarind Rice)", estCalories: 200 }, { name: "Dondakaya Stir Fry", estCalories: 150 }, { name: "Chole Soya Chunks Curry", estCalories: 150 }, { name: "Papad", estCalories: 150 }, { name: "Majiga Pulusu", estCalories: 150 }, { name: "Avakaya (Mango Pickle)", estCalories: 30 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Punugulu 10 Pcs Std Size", estCalories: 150 }, { name: "Groundnut/Coconut Chutney", estCalories: 30 }, { name: "Ginger Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Mango Dal", estCalories: 120 }, { name: "Bachali Kura Pulusu (Malabar Spinach)", estCalories: 150 }, { name: "Set Dosa -2 Pcs, Coconut Chutney", estCalories: 30 }, { name: "Cabbage Beans Poriyal", estCalories: 150 }, { name: "Tomato Baingan Masala", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Muskmelon Cut Fruit", estCalories: 150 }, { name: "Red Chilli Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 20,
    dayName: "Sun",
    meals: [
      { slot: "breakfast", items: [{ name: "Shavige Bath", estCalories: 150 }, { name: "Paneer Paratha - 2 Pcs Thin", estCalories: 150 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "Thick Curd, Mango Pickle", estCalories: 60 }, { name: "Brown Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Egg Bhurji", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Beetroot & Cucumber Salad", estCalories: 30 }, { name: "Chapathi", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Fry", estCalories: 120 }, { name: "Chicken Dum Biryani/Paneer Dum Biryani", estCalories: 200 }, { name: "Chicken Thick Gravy / Hyderabadi Mirchi Ka Salan", estCalories: 150 }, { name: "Onion Raitha", estCalories: 150 }, { name: "Fryums", estCalories: 150 }, { name: "Nannari Sharbath", estCalories: 150 }, { name: "Fresh Gongura Chutney", estCalories: 30 }, { name: "Vanilla Ice Cream (Not Frozen Dessert)", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Dahi Puri (8 Pcs)", estCalories: 150 }, { name: "Onions", estCalories: 150 }, { name: "Masala Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Pesara Pappu", estCalories: 150 }, { name: "Rasam", estCalories: 150 }, { name: "Ragi Dosa, Tomato Chutney", estCalories: 30 }, { name: "Dondakaya Fry", estCalories: 150 }, { name: "Vegetable Kurma Gravy", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Papaya Cut Fruit", estCalories: 150 }, { name: "Tomato Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 21,
    dayName: "Mon",
    meals: [
      { slot: "breakfast", items: [{ name: "Carrot Idly", estCalories: 150 }, { name: "Bhature - 2 Pcs Big", estCalories: 150 }, { name: "Groundnut Chutney, Sambar", estCalories: 120 }, { name: "Chole Curry", estCalories: 150 }, { name: "Brown Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Egg Bhurji", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Beetroot & Cucumber Salad", estCalories: 30 }, { name: "Chapathi", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Palak Dal", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Tomato Rice", estCalories: 200 }, { name: "Pesara Punugulu Curry (Pakka Andhra Style)", estCalories: 150 }, { name: "Drumstick Tomato Masala", estCalories: 150 }, { name: "Rava Vadiyalu", estCalories: 150 }, { name: "Butter Milk", estCalories: 80 }, { name: "Sorakaya Perugu Chutney, Ghee + Podi", estCalories: 30 }, { name: "Jilebi", estCalories: 150 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Dry Maggi", estCalories: 150 }, { name: "Tomato Sauce", estCalories: 150 }, { name: "Masala Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Onions & Lemon Salad", estCalories: 30 }, { name: "Methi Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Pesara Pappu", estCalories: 150 }, { name: "Tomato Rasam", estCalories: 150 }, { name: "Bhagara Rice", estCalories: 200 }, { name: "Telangana Chicken Curry (Non-Veg)", estCalories: 150 }, { name: "Achari Paneer (Veg)", estCalories: 150 }, { name: "Ladies Finger Boiled Fry", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Mixed Fruit Salad", estCalories: 30 }, { name: "Gongura Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 22,
    dayName: "Tue",
    meals: [
      { slot: "breakfast", items: [{ name: "Onion Dosa - 2 Pcs Std Size", estCalories: 150 }, { name: "Vada Pav", estCalories: 150 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "Mint Chutney", estCalories: 30 }, { name: "Brown Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Boiled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Carrot & Cucumber Salad", estCalories: 30 }, { name: "Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Amaranthus Dal", estCalories: 120 }, { name: "Beetroot Tomato Rasam", estCalories: 150 }, { name: "Bisbele Bath", estCalories: 150 }, { name: "Kakarakaya (Bitter Gourd) Fry", estCalories: 150 }, { name: "Rajma Masala", estCalories: 150 }, { name: "Potato Chips", estCalories: 150 }, { name: "Dahi Vada", estCalories: 150 }, { name: "Dosakaya Tomato Chutney", estCalories: 30 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Kachori 1 Big Pc", estCalories: 150 }, { name: "Tomato Sauce", estCalories: 150 }, { name: "Masala Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Makhani", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Mushroom Biryani", estCalories: 200 }, { name: "Snake Gourd Poriyal", estCalories: 150 }, { name: "Aloo Mutter Curry", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Guava Fruit", estCalories: 150 }, { name: "Tomato Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 23,
    dayName: "Wed",
    meals: [
      { slot: "breakfast", items: [{ name: "Onion Rava Bonda (Big size 3pcs, if not 4pcs)", estCalories: 150 }, { name: "Cucumber Poha", estCalories: 150 }, { name: "Sambar", estCalories: 120 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "White Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Masala Onion Omlet", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Onions & Lemon Salad", estCalories: 30 }, { name: "Palak Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Gongura (Sorrel Leaves) Dal", estCalories: 120 }, { name: "Pachi Pulusu", estCalories: 150 }, { name: "Special Rice", estCalories: 200 }, { name: "Boiled Stir Fry Chicken Masala (Dry)", estCalories: 150 }, { name: "Boiled Stir Fry Paneer Masala (Dry)", estCalories: 150 }, { name: "Vegetable Jalfrezi", estCalories: 150 }, { name: "Chips/Fryums/Papad", estCalories: 150 }, { name: "Lemon Water + Sabja Seeds", estCalories: 150 }, { name: "Fresh Vegetable Chutney", estCalories: 30 }, { name: "Badusha", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Onion Soft Pakoda", estCalories: 150 }, { name: "Tomato Chutney", estCalories: 30 }, { name: "Ginger Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Chapathi", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Tomato Dal", estCalories: 120 }, { name: "Rasam", estCalories: 150 }, { name: "Broken Wheat Rava Upma, Coconut Chutney", estCalories: 30 }, { name: "Carrot Beans Poriyal", estCalories: 150 }, { name: "Arbi Ka Gravy", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Fruit Custard with mixed fruits", estCalories: 150 }, { name: "Lemon Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 24,
    dayName: "Thu",
    meals: [
      { slot: "breakfast", items: [{ name: "Poori (3 pcs standard size)", estCalories: 150 }, { name: "Tomato Suji Upma", estCalories: 150 }, { name: "Aloo Basin Chutney", estCalories: 30 }, { name: "Peanut Chutney", estCalories: 30 }, { name: "Brown Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Egg Bhurji (Non-Veg)", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Carrot & Cucumber Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Ridge Gourd Dal", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Pudina Rice", estCalories: 200 }, { name: "Guthi Vankaya Curry", estCalories: 150 }, { name: "Kala Chana Masala", estCalories: 150 }, { name: "Finger Fryums", estCalories: 150 }, { name: "Lemon Water + Sabja Seeds", estCalories: 150 }, { name: "Potlakaya Perugu Chutney", estCalories: 30 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Sambar Vada 2 Pcs", estCalories: 120 }, { name: "Masala Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Fry", estCalories: 120 }, { name: "Beetroot Tomato Rasam", estCalories: 150 }, { name: "Gobhi Manchuria, Noodles, Tomato Sauce", estCalories: 150 }, { name: "Rajma Masala", estCalories: 150 }, { name: "Rasam", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Banana", estCalories: 150 }, { name: "Ginger Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 25,
    dayName: "Fri",
    meals: [
      { slot: "breakfast", items: [{ name: "Uggani + Mirchi Bajji", estCalories: 150 }, { name: "Pudina Chapathi (Hand Made) 2 Pcs", estCalories: 150 }, { name: "Dal Chutney", estCalories: 120 }, { name: "Aloo Mutter Curry", estCalories: 150 }, { name: "White Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Boiled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Beetroot & Cucumber Salad", estCalories: 30 }, { name: "Chapathi", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Tadka", estCalories: 120 }, { name: "Rasam", estCalories: 150 }, { name: "Jeera Rice", estCalories: 200 }, { name: "Raw Banana Fry", estCalories: 150 }, { name: "Lobia Masala (Cowpeas in Onion Tomato Gravy)", estCalories: 150 }, { name: "Papad", estCalories: 150 }, { name: "Lassi", estCalories: 150 }, { name: "Beerakaya Chutney", estCalories: 30 }, { name: "Poornalu", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Vada Pav 2 Pcs", estCalories: 150 }, { name: "Mint Sauce", estCalories: 150 }, { name: "Ginger Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Onions & Lemon Salad", estCalories: 30 }, { name: "Missi Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Kadai Chicken (Non-Veg)", estCalories: 150 }, { name: "Kadai Paneer (Veg)", estCalories: 150 }, { name: "Amritsari Chole", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "(Watermelon + Muskmelon + Papaya) Cut Fruit", estCalories: 150 }, { name: "Fresh Vegetable Chutney/Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 26,
    dayName: "Sat",
    meals: [
      { slot: "breakfast", items: [{ name: "Masala Ghee Roast Dosa 2 Pcs Std Size", estCalories: 150 }, { name: "Vegetable Moong Dal Kitchidi", estCalories: 120 }, { name: "Groundnut Chutney", estCalories: 30 }, { name: "Sambar", estCalories: 120 }, { name: "Brown Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Scrambled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Carrot & Cucumber Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Mudda Pappu", estCalories: 150 }, { name: "Beetroot Tomato Rasam", estCalories: 150 }, { name: "Pulihora (Tamarind Rice)", estCalories: 200 }, { name: "Cauliflower Fry", estCalories: 150 }, { name: "Chole Soya Chunks Curry", estCalories: 150 }, { name: "Papad", estCalories: 150 }, { name: "Majiga Pulusu", estCalories: 150 }, { name: "Avakaya (Mango Pickle)", estCalories: 30 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Mysore Bonda 2 Pcs Std Size", estCalories: 150 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "Masala Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Mango Dal", estCalories: 120 }, { name: "Bachali Kura Pulusu (Malabar Spinach)", estCalories: 150 }, { name: "Podi Onion Dosa -2 Pcs, Dal Chutney", estCalories: 120 }, { name: "Cabbage Beans Poriyal", estCalories: 150 }, { name: "Tomato Baingan Masala", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Muskmelon Cut Fruit", estCalories: 150 }, { name: "Red Chilli Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 27,
    dayName: "Sun",
    meals: [
      { slot: "breakfast", items: [{ name: "Coconut Sevai", estCalories: 150 }, { name: "Aloo Paratha (2 Pcs Thin)", estCalories: 150 }, { name: "Onion Tomato Chutney", estCalories: 30 }, { name: "Thick Curd, Mango Pickle", estCalories: 60 }, { name: "White Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Egg Bhurji", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Beetroot & Cucumber Salad", estCalories: 30 }, { name: "Chapathi", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Makhani", estCalories: 120 }, { name: "Chicken Dum Biryani/Paneer Dum Biryani", estCalories: 200 }, { name: "Chicken Thick Gravy / Hyderabadi Mirchi Ka Salan", estCalories: 150 }, { name: "Onion Raitha", estCalories: 150 }, { name: "Fryums", estCalories: 150 }, { name: "Nannari Sharbath", estCalories: 150 }, { name: "Fresh Gongura Chutney", estCalories: 30 }, { name: "Kulfi (Not Frozen Dessert)", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Pani Puri (8 Pcs)", estCalories: 150 }, { name: "Onions", estCalories: 150 }, { name: "Ginger Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Pesara Pappu", estCalories: 150 }, { name: "Rasam", estCalories: 150 }, { name: "Ragi Rava Upma, Coconut Chutney", estCalories: 30 }, { name: "Dondakaya Fry", estCalories: 150 }, { name: "Vegetable Kolhapuri", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Papaya Cut Fruit", estCalories: 150 }, { name: "Tomato Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 28,
    dayName: "Mon",
    meals: [
      { slot: "breakfast", items: [{ name: "Konaseema Pottikkalu (14) / Idly Upma (28)", estCalories: 150 }, { name: "Poori - 3 Pcs Big", estCalories: 150 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "Chole Curry", estCalories: 150 }, { name: "White Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Scrambled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Beetroot & Cucumber Salad", estCalories: 30 }, { name: "Chapathi", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Palak Dal", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Tomato Rice", estCalories: 200 }, { name: "Potato Fry (Andhra Style)", estCalories: 150 }, { name: "Drumstick Tomato Masala", estCalories: 150 }, { name: "Rava Vadiyalu", estCalories: 150 }, { name: "Butter Milk", estCalories: 80 }, { name: "Sorakaya Perugu Chutney, Ghee + Podi", estCalories: 30 }, { name: "Sweet Boondi", estCalories: 150 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Sweet Corn Masala", estCalories: 150 }, { name: "Tomato/Mint Sauce", estCalories: 150 }, { name: "Ginger Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Onions & Lemon Salad", estCalories: 30 }, { name: "Methi Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Pesara Pappu", estCalories: 150 }, { name: "Tomato Rasam", estCalories: 150 }, { name: "Bhagara Rice", estCalories: 200 }, { name: "Chettinad Chicken Curry (Non-Veg)", estCalories: 150 }, { name: "Paneer Pepper Fry (Veg)", estCalories: 150 }, { name: "Bhindi Masala", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Mixed Fruit Salad", estCalories: 30 }, { name: "Gongura Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 29,
    dayName: "Tue",
    meals: [
      { slot: "breakfast", items: [{ name: "Multi Grain Dosa (2 Pcs Thin)", estCalories: 150 }, { name: "Pav Bhaji", estCalories: 150 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "Mint Chutney", estCalories: 30 }, { name: "White Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Scrambled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Carrot & Cucumber Salad", estCalories: 30 }, { name: "Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Amaranthus Dal", estCalories: 120 }, { name: "Beetroot Tomato Rasam", estCalories: 150 }, { name: "Bisbele Bath", estCalories: 150 }, { name: "Kakarakaya (Bitter Gourd) Fry", estCalories: 150 }, { name: "Rajma Masala", estCalories: 150 }, { name: "Potato Chips", estCalories: 150 }, { name: "Dahi Vada", estCalories: 150 }, { name: "Dosakaya Tomato Chutney", estCalories: 30 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Aloo Samosa 1 Big Pc", estCalories: 150 }, { name: "Tomato Sauce", estCalories: 150 }, { name: "Ginger Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Makhani", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Mushroom Biryani", estCalories: 200 }, { name: "Snake Gourd Poriyal", estCalories: 150 }, { name: "Aloo Mutter Curry", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Guava Fruit", estCalories: 150 }, { name: "Tomato Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 30,
    dayName: "Wed",
    meals: [
      { slot: "breakfast", items: [{ name: "Methu Vada (Big size 3pcs, if not 4pcs)", estCalories: 150 }, { name: "Moong Dal Palak Tepla (Hand Made) 2 Pcs", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Tomato Chutney", estCalories: 30 }, { name: "Brown Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Boiled Egg", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Onions & Lemon Salad", estCalories: 30 }, { name: "Palak Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Gongura (Sorrel Leaves) Dal", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Vegetable Dum Pulav", estCalories: 150 }, { name: "Masala Fish Fry / Andhra Chicken Fry", estCalories: 150 }, { name: "Kaju Tomato Paneer Boiled Fry", estCalories: 150 }, { name: "Black Chana Masala", estCalories: 150 }, { name: "Triangle Fryums", estCalories: 150 }, { name: "Butter Milk", estCalories: 80 }, { name: "Coriander + Tomato Chutney", estCalories: 30 }, { name: "Gulab Jamun", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Corn Vada", estCalories: 150 }, { name: "Onion Tomato Chutney", estCalories: 30 }, { name: "Masala Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Chapathi", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Tomato Dal", estCalories: 120 }, { name: "Rasam", estCalories: 150 }, { name: "Sooji Upma, Coconut Chutney", estCalories: 30 }, { name: "Carrot Beans Poriyal", estCalories: 150 }, { name: "Soya Chunks Masala", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Fruit Custard with Pineapple", estCalories: 150 }, { name: "Lemon Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
  {
    date: 31,
    dayName: "Thu",
    meals: [
      { slot: "breakfast", items: [{ name: "Poori (3 Pcs standard size)", estCalories: 150 }, { name: "Lemon Sevai", estCalories: 150 }, { name: "Aloo Mutter Curry", estCalories: 150 }, { name: "Coconut Chutney", estCalories: 30 }, { name: "White Bread+Butter+Jam", estCalories: 150 }, { name: "Sprouts (1 small cup)", estCalories: 150 }, { name: "Tea/Coffee/Milk", estCalories: 80 }, { name: "Masala Onion Omlet", estCalories: 150 }] },
      { slot: "lunch", items: [{ name: "Carrot & Cucumber Salad", estCalories: 30 }, { name: "Pulka", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Ridge Gourd Dal", estCalories: 120 }, { name: "Sambar", estCalories: 120 }, { name: "Pudina Rice", estCalories: 200 }, { name: "Guthi Vankaya Curry", estCalories: 150 }, { name: "Cluster Beans Masala", estCalories: 150 }, { name: "Finger Fryums", estCalories: 150 }, { name: "Lemon Water + Sabja Seeds", estCalories: 150 }, { name: "Potlakaya Perugu Chutney", estCalories: 30 }, { name: "Ghee + Podi", estCalories: 150 }] },
      { slot: "snacks", items: [{ name: "Poha Cutlet", estCalories: 150 }, { name: "Mint Sauce", estCalories: 150 }, { name: "Ginger Tea/Coffee/Milk", estCalories: 80 }] },
      { slot: "dinner", items: [{ name: "Beetroot & Carrot Salad", estCalories: 30 }, { name: "Roti", estCalories: 150 }, { name: "White Rice", estCalories: 200 }, { name: "Dal Maharani", estCalories: 120 }, { name: "Beetroot Tomato Rasam", estCalories: 150 }, { name: "Veg Manchuria, Noodles, Tomato Sauce", estCalories: 150 }, { name: "Arbi Ka Gravy", estCalories: 150 }, { name: "Rasam", estCalories: 150 }, { name: "Thick Curd", estCalories: 60 }, { name: "Banana", estCalories: 150 }, { name: "Ginger Pickle", estCalories: 30 }, { name: "Milk + Coffee Powder", estCalories: 80 }] },
    ]
  },
];
