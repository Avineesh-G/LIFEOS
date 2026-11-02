import { MealMenu } from '../types';

export interface WeeklyMenu {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  meals: MealMenu[];
}

export interface MonthlyMenu {
  date: number; // 1 to 31
  dayName: string;
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
      { slot: 'breakfast', items: [{ name: 'Vada (3 Pcs) / Pongal', estCalories: 220 }, { name: 'Coconut Chutney', estCalories: 50 }, { name: 'Sambar', estCalories: 80 }, { name: 'White Bread / Butter / Jam', estCalories: 150 }, { name: 'Sprouts / 1 small apple', estCalories: 50 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }, { name: 'Omelette', estCalories: 120 }] },
      { slot: 'lunch', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Chana Dal', estCalories: 140 }, { name: 'Bhindi Masala', estCalories: 110 }, { name: 'Steamed Rice', estCalories: 150 }, { name: 'Curd', estCalories: 80 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }] },
      { slot: 'snacks', items: [{ name: 'Kachori / Bhel Puri', estCalories: 220 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }] },
      { slot: 'dinner', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Dal Fry', estCalories: 150 }, { name: 'Chicken Curry / Kadai Paneer', estCalories: 250 }, { name: 'Fried Rice', estCalories: 200 }, { name: 'Ice Cream / Kheer', estCalories: 160 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }, { name: 'Milk / Bournvita', estCalories: 120 }] }
    ]
  },
  {
    dayOfWeek: 4, // Thursday
    meals: [
      { slot: 'breakfast', items: [{ name: 'Puri Aloo / Poori Chole', estCalories: 250 }, { name: 'Coconut Chutney', estCalories: 50 }, { name: 'White Bread / Butter / Jam', estCalories: 150 }, { name: 'Sprouts / 1 small apple', estCalories: 50 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }, { name: 'Omelette', estCalories: 120 }] },
      { slot: 'lunch', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Rajma / Chole Curry', estCalories: 180 }, { name: 'Gobi Aloo', estCalories: 130 }, { name: 'Steamed Rice', estCalories: 150 }, { name: 'Raita', estCalories: 80 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }] },
      { slot: 'snacks', items: [{ name: 'Mirchi Bajji / Veg Cutlet', estCalories: 210 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }] },
      { slot: 'dinner', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Dal Tadka', estCalories: 150 }, { name: 'Veg Korma / Mushroom Masala', estCalories: 180 }, { name: 'Steamed Rice', estCalories: 150 }, { name: 'Fruit Salad / Halwa', estCalories: 140 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }, { name: "Milk / Bournvita", estCalories: 120 }] }
    ]
  },
  {
    dayOfWeek: 5, // Friday
    meals: [
      { slot: 'breakfast', items: [{ name: 'Pesarattu / Upma', estCalories: 190 }, { name: 'Ginger Chutney', estCalories: 40 }, { name: 'Coconut Chutney', estCalories: 50 }, { name: 'White Bread / Butter / Jam', estCalories: 150 }, { name: 'Sprouts / 1 small apple', estCalories: 50 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }, { name: 'Omelette', estCalories: 120 }] },
      { slot: 'lunch', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Dal Tadka', estCalories: 150 }, { name: 'Baingan Bharta', estCalories: 120 }, { name: 'Jeera Rice', estCalories: 180 }, { name: 'Curd / Lassi', estCalories: 90 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }] },
      { slot: 'snacks', items: [{ name: 'Pasta / Maggi', estCalories: 230 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }] },
      { slot: 'dinner', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Naan / Chapati', estCalories: 180 }, { name: 'Dal Makhani', estCalories: 200 }, { name: 'Egg Curry / Paneer Butter Masala', estCalories: 240 }, { name: "Veg Biryani", estCalories: 260 }, { name: 'Sweet / Rasgulla', estCalories: 150 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }, { name: 'Milk / Bournvita', estCalories: 120 }] }
    ]
  },
  {
    dayOfWeek: 6, // Saturday
    meals: [
      { slot: 'breakfast', items: [{ name: 'Poha / Sevai Upma', estCalories: 180 }, { name: 'Mint Chutney', estCalories: 30 }, { name: 'White Bread / Butter / Jam', estCalories: 150 }, { name: 'Sprouts / 1 small apple', estCalories: 50 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }, { name: 'Omelette', estCalories: 120 }] },
      { slot: 'lunch', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Kadi Pakoda / Sambhar', estCalories: 160 }, { name: 'Aloo Jeera', estCalories: 140 }, { name: 'Steamed Rice', estCalories: 150 }, { name: 'Curd', estCalories: 80 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }] },
      { slot: 'snacks', items: [{ name: 'Bread Pakoda / Punugulu', estCalories: 220 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }] },
      { slot: 'dinner', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Dal Fry', estCalories: 150 }, { name: 'Aloo Gobi / Chana Masala', estCalories: 160 }, { name: 'Steamed Rice', estCalories: 150 }, { name: 'Payasam / Kheer', estCalories: 170 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }, { name: 'Milk / Bournvita', estCalories: 120 }] }
    ]
  },
  {
    dayOfWeek: 0, // Sunday
    meals: [
      { slot: 'breakfast', items: [{ name: 'Masala Dosa / Paratha', estCalories: 240 }, { name: 'Coconut Chutney', estCalories: 50 }, { name: 'Sambar', estCalories: 80 }, { name: 'White Bread / Butter / Jam', estCalories: 150 }, { name: 'Sprouts / 1 small apple', estCalories: 50 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }, { name: 'Omelette', estCalories: 120 }] },
      { slot: 'lunch', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Roti', estCalories: 100 }, { name: 'Chicken Dum Biryani / Paneer Biryani', estCalories: 380 }, { name: 'Gravy / Mirchi Ka Salan', estCalories: 150 }, { name: 'Raita', estCalories: 60 }, { name: 'Special Dessert / Ice Cream', estCalories: 180 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }] },
      { slot: 'snacks', items: [{ name: 'Cake / Pastry', estCalories: 200 }, { name: 'Tea / Coffee / Milk', estCalories: 80 }] },
      { slot: 'dinner', items: [{ name: 'Onion & Tomato Salad', estCalories: 30 }, { name: 'Chapati', estCalories: 100 }, { name: 'Dal Tadka', estCalories: 150 }, { name: 'Mix Veg / Kurma', estCalories: 140 }, { name: 'Steamed Rice', estCalories: 150 }, { name: 'Custard / Fruit Bowl', estCalories: 130 }, { name: 'Pickles / Papad / Chutney', estCalories: 40 }, { name: 'Milk / Bournvita', estCalories: 120 }] }
    ]
  }
];

export const MONTHLY_MESS_MENU: MonthlyMenu[] = [
  {
    "date": 1,
    "dayName": "Sunday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Shavige Bath",
            "estCalories": 200
          },
          {
            "name": "Paneer Paratha - 2 Pcs Thin",
            "estCalories": 280
          },
          {
            "name": "Peanut Chutney",
            "estCalories": 60
          },
          {
            "name": "Thick Curd, Mango Pickle",
            "estCalories": 80
          },
          {
            "name": "Brown Bread+butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Egg Bhurji",
            "estCalories": 140,
            "diet": "non-veg"
          },
          {
            "name": "Brown Bread+Peanut Butter+Jam",
            "estCalories": 180
          },
          {
            "name": "Apple + Pomegranate Fresh Juice without Sugar",
            "estCalories": 80
          },
          {
            "name": "Cornflakes",
            "estCalories": 150
          },
          {
            "name": "Raagi Malt",
            "estCalories": 90,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Fry",
            "estCalories": 150
          },
          {
            "name": "Chicken Dum Biryani/Paneer Dum Biryani",
            "estCalories": 350
          },
          {
            "name": "Chicken Thick Gravy / Hyderabadi Mirchi Ka Salan",
            "estCalories": 180,
            "diet": "non-veg"
          },
          {
            "name": "Tomato Rasam",
            "estCalories": 45
          },
          {
            "name": "Onion Raitha",
            "estCalories": 60
          },
          {
            "name": "Triangular Fryums",
            "estCalories": 70
          },
          {
            "name": "Mint Lemon Jal Jeera Drink (200 ml)",
            "estCalories": 40
          },
          {
            "name": "Fresh Gongura Chutney",
            "estCalories": 35
          },
          {
            "name": "Basundhi (60 ml)",
            "estCalories": 160
          },
          {
            "name": "Vanilla Ice Cream (Not Frozen Dessert)",
            "estCalories": 140
          },
          {
            "name": "Gulab Jamun",
            "estCalories": 150
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Cup Cake (Egg Less) 2 Pcs",
            "estCalories": 180,
            "diet": "non-veg"
          },
          {
            "name": "Dahi Puri (8 Pcs)",
            "estCalories": 220
          },
          {
            "name": "Masala Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Pulka",
            "estCalories": 80
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Pesara Pappu",
            "estCalories": 130
          },
          {
            "name": "Radish Sambar",
            "estCalories": 80
          },
          {
            "name": "Ragi Idly, Groundnut Chutney",
            "estCalories": 190
          },
          {
            "name": "Dondakaya Stir Fry",
            "estCalories": 100
          },
          {
            "name": "Vegetable Kurma Gravy",
            "estCalories": 140
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Papaya Cut Fruit",
            "estCalories": 60
          },
          {
            "name": "Tomato Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Lemon Coriander Soup",
            "estCalories": 45
          }
        ]
      }
    ]
  },
  {
    "date": 2,
    "dayName": "Monday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Ghee + Veg Pongal",
            "estCalories": 220
          },
          {
            "name": "Bhature - 2 Pcs Big",
            "estCalories": 280
          },
          {
            "name": "Groundnut Chutney, Sambar",
            "estCalories": 60
          },
          {
            "name": "Chole Curry",
            "estCalories": 180
          },
          {
            "name": "White Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Boiled Egg",
            "estCalories": 75,
            "diet": "non-veg"
          },
          {
            "name": "Banana Milk Shake without Sugar",
            "estCalories": 120
          },
          {
            "name": "Cornflakes",
            "estCalories": 150
          },
          {
            "name": "Boiled Mixed Beans Salad",
            "estCalories": 90,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Boiled Chana Salad with Onion & Tomato",
            "estCalories": 90
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Palak Dal",
            "estCalories": 140
          },
          {
            "name": "Brinjal Sambar",
            "estCalories": 80
          },
          {
            "name": "Tomato Rice",
            "estCalories": 190
          },
          {
            "name": "Pesara Punugulu Curry (Pakka Andhra Style)",
            "estCalories": 170
          },
          {
            "name": "Capsicum Tomato Masala",
            "estCalories": 120
          },
          {
            "name": "Fryums",
            "estCalories": 70
          },
          {
            "name": "Butter Milk",
            "estCalories": 45
          },
          {
            "name": "Sorakaya Perugu Chutney",
            "estCalories": 60
          },
          {
            "name": "Jilebi",
            "estCalories": 160
          },
          {
            "name": "Ghee + Podi",
            "estCalories": 60
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Dry Maggi (Non-Sticky)",
            "estCalories": 220
          },
          {
            "name": "Tomato Sauce",
            "estCalories": 20
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Pesara Pappu",
            "estCalories": 130
          },
          {
            "name": "Andhra Charu",
            "estCalories": 45
          },
          {
            "name": "Bhagara Rice",
            "estCalories": 200
          },
          {
            "name": "Hyderabadi Chicken Curry",
            "estCalories": 240,
            "diet": "non-veg"
          },
          {
            "name": "Paneer Butter Masala",
            "estCalories": 230,
            "diet": "veg"
          },
          {
            "name": "Ladies Finger Boiled Fry",
            "estCalories": 100
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Water Melon Cut Fruit",
            "estCalories": 50
          },
          {
            "name": "Radish Fresh Chutney",
            "estCalories": 35
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Butter Methi Naan",
            "estCalories": 220
          },
          {
            "name": "Sweet Corn Soup",
            "estCalories": 65
          }
        ]
      }
    ]
  },
  {
    "date": 3,
    "dayName": "Tuesday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Onion Dosa - 2 Pcs Std Size",
            "estCalories": 240
          },
          {
            "name": "Vada Pav",
            "estCalories": 220
          },
          {
            "name": "Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "Mint Chutney",
            "estCalories": 35
          },
          {
            "name": "Brown Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Ragi Malt with Salt (1 Medium Glass)",
            "estCalories": 90
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Boiled Egg",
            "estCalories": 75,
            "diet": "non-veg"
          },
          {
            "name": "Brown Bread+Peanut Butter+Jam",
            "estCalories": 180
          },
          {
            "name": "Pomegranate Fresh Juice without Sugar",
            "estCalories": 70
          },
          {
            "name": "Chocos",
            "estCalories": 150
          },
          {
            "name": "Crunchy Soya Vegetable Salad",
            "estCalories": 80,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Carrot & Cucumber Salad",
            "estCalories": 30
          },
          {
            "name": "Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dosakaya Pappu",
            "estCalories": 140
          },
          {
            "name": "Beetroot Tomato Rasam",
            "estCalories": 45
          },
          {
            "name": "Bisbele Bath",
            "estCalories": 210
          },
          {
            "name": "Kakarakaya (Bitter Gourd) Fry",
            "estCalories": 110
          },
          {
            "name": "Rajma Masala",
            "estCalories": 160
          },
          {
            "name": "Potato Chips",
            "estCalories": 90
          },
          {
            "name": "Dahi Vada",
            "estCalories": 150
          },
          {
            "name": "Dosakaya Tomato Chutney",
            "estCalories": 40
          },
          {
            "name": "Ghee + Podi",
            "estCalories": 60
          },
          {
            "name": "Makkan Peda",
            "estCalories": 180
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Aloo Samosa 1 Big Pc",
            "estCalories": 220
          },
          {
            "name": "Tomato Sauce, Salt Mirchi",
            "estCalories": 20
          },
          {
            "name": "Ginger Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Pulka",
            "estCalories": 80
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Makhani",
            "estCalories": 180
          },
          {
            "name": "Kadamba Sambar",
            "estCalories": 80
          },
          {
            "name": "Mushroom Biryani",
            "estCalories": 280
          },
          {
            "name": "Cluster Beans Coconut Fry",
            "estCalories": 110
          },
          {
            "name": "Aloo Mutter Curry",
            "estCalories": 150
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Banana Fruit",
            "estCalories": 90
          },
          {
            "name": "Ginger Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Broccoli Soup",
            "estCalories": 50
          }
        ]
      }
    ]
  },
  {
    "date": 4,
    "dayName": "Wednesday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Pesarattu Thin 2 Pcs Std Size",
            "estCalories": 220
          },
          {
            "name": "Tomato Suji Upma",
            "estCalories": 180
          },
          {
            "name": "Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "Ginger Chutney",
            "estCalories": 40
          },
          {
            "name": "White Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Masala Onion Omelet",
            "estCalories": 120,
            "diet": "non-veg"
          },
          {
            "name": "Pineapple Fresh Juice without Sugar",
            "estCalories": 75
          },
          {
            "name": "Chocos",
            "estCalories": 150
          },
          {
            "name": "Greek Yogurt Salad",
            "estCalories": 90,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Palak Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Amaranthus Dal",
            "estCalories": 140
          },
          {
            "name": "Pachi Pulusu",
            "estCalories": 50
          },
          {
            "name": "Bhagara Rice",
            "estCalories": 200
          },
          {
            "name": "Kadai Chicken",
            "estCalories": 240,
            "diet": "non-veg"
          },
          {
            "name": "Kadai Paneer",
            "estCalories": 230
          },
          {
            "name": "Vegetable Jalfrezi",
            "estCalories": 130
          },
          {
            "name": "Papad",
            "estCalories": 40
          },
          {
            "name": "Butter Milk",
            "estCalories": 45
          },
          {
            "name": "Fresh Vegetable Chutney",
            "estCalories": 35
          },
          {
            "name": "Semiya Sabudana Kheer",
            "estCalories": 160
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Bhelpuri",
            "estCalories": 180
          },
          {
            "name": "Ginger Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Tomato Dal",
            "estCalories": 140
          },
          {
            "name": "Garlic Rasam",
            "estCalories": 45
          },
          {
            "name": "Broken Wheat Rava Upma, Coconut Chutney",
            "estCalories": 190
          },
          {
            "name": "Bottle Guard Chana Dal Fry",
            "estCalories": 110
          },
          {
            "name": "Aloo Mutter Curry",
            "estCalories": 150
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Pine Apple Cut Fruit",
            "estCalories": 60
          },
          {
            "name": "Lemon Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Tomato Soup with Roasted Bread",
            "estCalories": 70
          }
        ]
      }
    ]
  },
  {
    "date": 5,
    "dayName": "Thursday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Medu Vada (3 Pcs)",
            "estCalories": 240
          },
          {
            "name": "Pav Bhaji",
            "estCalories": 250
          },
          {
            "name": "Sambar",
            "estCalories": 80
          },
          {
            "name": "Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "Brown Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Papaya Fresh Juice without Sugar",
            "estCalories": 70
          },
          {
            "name": "Cornflakes",
            "estCalories": 150
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Carrot & Cucumber Salad",
            "estCalories": 30
          },
          {
            "name": "Pulka",
            "estCalories": 80
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Ridge Gourd Dal",
            "estCalories": 130
          },
          {
            "name": "Drumstick Brinjal Sambar",
            "estCalories": 80
          },
          {
            "name": "Pudina Rice",
            "estCalories": 180
          },
          {
            "name": "Guthi Vankaya Curry",
            "estCalories": 160
          },
          {
            "name": "Kala Chana Masala",
            "estCalories": 160
          },
          {
            "name": "Finger Fryums",
            "estCalories": 70
          },
          {
            "name": "Lemon Water + Sabja Seeds",
            "estCalories": 25
          },
          {
            "name": "Potlakaya Perugu Chutney",
            "estCalories": 60
          },
          {
            "name": "Ghee + Podi",
            "estCalories": 60
          },
          {
            "name": "Mothichoor Laddu",
            "estCalories": 170
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Mysore Bonda 2 Pcs Std Size (Less Oily)",
            "estCalories": 220
          },
          {
            "name": "Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Fry",
            "estCalories": 150
          },
          {
            "name": "Beetroot Tomato Rasam",
            "estCalories": 45
          },
          {
            "name": "Veg Manchurian, Noodles, Tomato Sauce",
            "estCalories": 280
          },
          {
            "name": "Dhaba Style Egg Curry",
            "estCalories": 180,
            "diet": "non-veg"
          },
          {
            "name": "Rajma Masala",
            "estCalories": 160
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Green Grapes",
            "estCalories": 60
          },
          {
            "name": "Gongura Fresh Chutney",
            "estCalories": 35
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Chicken Tikka Fry/Malabar Fish Fry",
            "estCalories": 240,
            "diet": "non-veg"
          },
          {
            "name": "Paneer Tikka/Chilli Babycorn",
            "estCalories": 210,
            "diet": "veg"
          },
          {
            "name": "Paneer Bhurji",
            "estCalories": 200,
            "diet": "veg"
          },
          {
            "name": "Creamy Mushroom Soup",
            "estCalories": 75
          }
        ]
      }
    ]
  },
  {
    "date": 6,
    "dayName": "Friday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Poori (3 pcs standard size)",
            "estCalories": 240
          },
          {
            "name": "Rice Rava Upma (Dry)",
            "estCalories": 180
          },
          {
            "name": "Aloo Basin Chutney",
            "estCalories": 70
          },
          {
            "name": "Dal Chutney",
            "estCalories": 60
          },
          {
            "name": "Brown Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Ragi Malt with Salt (1 Medium Glass)",
            "estCalories": 90
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Boiled Egg",
            "estCalories": 75,
            "diet": "non-veg"
          },
          {
            "name": "Brown Bread+Peanut Butter+Jam",
            "estCalories": 180
          },
          {
            "name": "Grapes Fresh Juice with Light Sugar",
            "estCalories": 90
          },
          {
            "name": "Museli",
            "estCalories": 150
          },
          {
            "name": "Boiled Chick Peas Salad",
            "estCalories": 85,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Beetroot & Cucumber Salad",
            "estCalories": 30
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Tadka",
            "estCalories": 150
          },
          {
            "name": "Andhra Charu",
            "estCalories": 45
          },
          {
            "name": "Jeera Rice",
            "estCalories": 180
          },
          {
            "name": "Raw Banana Fry",
            "estCalories": 120
          },
          {
            "name": "Turnip Spinach Curry (Punjabi Style)",
            "estCalories": 120
          },
          {
            "name": "Papad",
            "estCalories": 40
          },
          {
            "name": "Lassi",
            "estCalories": 120
          },
          {
            "name": "Beerakaya Chutney",
            "estCalories": 40
          },
          {
            "name": "Carrot Halwa",
            "estCalories": 180
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Sambar Vada 2 Pcs (Separate)",
            "estCalories": 240
          },
          {
            "name": "Masala Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Beetroot Chapathi",
            "estCalories": 105
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal",
            "estCalories": 140
          },
          {
            "name": "Mix Veg Sambar",
            "estCalories": 80
          },
          {
            "name": "Chicken Tikka Masala",
            "estCalories": 240,
            "diet": "non-veg"
          },
          {
            "name": "Paneer Lababdar",
            "estCalories": 230,
            "diet": "veg"
          },
          {
            "name": "Amritsari Chole",
            "estCalories": 170
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Muskmelon Cut Fruit",
            "estCalories": 50
          },
          {
            "name": "Amla Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Mix Veg Raagi Soup",
            "estCalories": 55
          }
        ]
      }
    ]
  },
  {
    "date": 7,
    "dayName": "Saturday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Uggani + Mirchi Bajji",
            "estCalories": 280
          },
          {
            "name": "Moong Dal Palak Tepla (Hand Made) 2 Pcs",
            "estCalories": 220
          },
          {
            "name": "Groundnut Chutney",
            "estCalories": 60
          },
          {
            "name": "Onion Tomato Chutney",
            "estCalories": 40
          },
          {
            "name": "Brown Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Ragi Malt with Salt (1 Medium Glass)",
            "estCalories": 90
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Boiled Egg",
            "estCalories": 75,
            "diet": "non-veg"
          },
          {
            "name": "Brown Bread+Peanut Butter+Jam",
            "estCalories": 180
          },
          {
            "name": "Mosambi Fresh Juice without Sugar",
            "estCalories": 65
          },
          {
            "name": "Cornflakes",
            "estCalories": 150
          },
          {
            "name": "Boiled Peanut Sundal",
            "estCalories": 110,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Carrot & Cucumber Salad",
            "estCalories": 30
          },
          {
            "name": "Pulka",
            "estCalories": 80
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Mudda Pappu",
            "estCalories": 140
          },
          {
            "name": "Pachi Pulusu",
            "estCalories": 50
          },
          {
            "name": "Pulihora (Tamarind Rice)",
            "estCalories": 200
          },
          {
            "name": "Cauli Flower Fry",
            "estCalories": 120
          },
          {
            "name": "Chole Curry",
            "estCalories": 180
          },
          {
            "name": "Papad",
            "estCalories": 40
          },
          {
            "name": "Majjiga Pulusu",
            "estCalories": 65
          },
          {
            "name": "Avakaya (Mango Pickle)",
            "estCalories": 20
          },
          {
            "name": "Ghee + Podi",
            "estCalories": 60
          },
          {
            "name": "Cauli Flower Tomato Stir Fry",
            "estCalories": 120
          },
          {
            "name": "Chocolate Cake (Egg Less)",
            "estCalories": 180,
            "diet": "non-veg"
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Vada Pav 2 Pcs",
            "estCalories": 360
          },
          {
            "name": "Mint Sauce",
            "estCalories": 25
          },
          {
            "name": "Cold Badam Milk (1 Medium Glass)",
            "estCalories": 150
          },
          {
            "name": "Cold Badam Milk 150 ml",
            "estCalories": 150
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Maharani",
            "estCalories": 160
          },
          {
            "name": "Drumstick Sambar",
            "estCalories": 80
          },
          {
            "name": "Ghee + Podi + Idly, Coconut Chutney",
            "estCalories": 220
          },
          {
            "name": "Tomato Baingan Fry",
            "estCalories": 110
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Banana",
            "estCalories": 90
          },
          {
            "name": "Red Chilli Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Veg Manchow Soup",
            "estCalories": 65
          }
        ]
      }
    ]
  },
  {
    "date": 8,
    "dayName": "Sunday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Shavige Bath",
            "estCalories": 200
          },
          {
            "name": "Aloo Paratha (2 Pcs Thin)",
            "estCalories": 260
          },
          {
            "name": "Mint Coriander Chutney",
            "estCalories": 35
          },
          {
            "name": "Thick Curd, Mango Pickle",
            "estCalories": 80
          },
          {
            "name": "White Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Egg Bhurji",
            "estCalories": 140,
            "diet": "non-veg"
          },
          {
            "name": "Apple + Pomegranate Fresh Juice without Sugar",
            "estCalories": 80
          },
          {
            "name": "Museli",
            "estCalories": 150
          },
          {
            "name": "Ragi Malt",
            "estCalories": 90,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Makhani",
            "estCalories": 180
          },
          {
            "name": "Chicken Fry Piece Biryani/Paneer Fry Piece Biryani",
            "estCalories": 360
          },
          {
            "name": "Chicken Thick Gravy / Hyderabadi Mirchi Ka Salan",
            "estCalories": 180,
            "diet": "non-veg"
          },
          {
            "name": "Onion Raitha",
            "estCalories": 60
          },
          {
            "name": "Tomato Rasam",
            "estCalories": 45
          },
          {
            "name": "Fryums",
            "estCalories": 70
          },
          {
            "name": "Mint Lemon Jal Jeera Drink (200 ml)",
            "estCalories": 40
          },
          {
            "name": "Fresh Gongura Chutney",
            "estCalories": 35
          },
          {
            "name": "Vanilla Ice Cream (Not Frozen Dessert)",
            "estCalories": 140
          },
          {
            "name": "Gajar Ka Halwa",
            "estCalories": 180
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Dahi Papdi Chat",
            "estCalories": 220
          },
          {
            "name": "Onions",
            "estCalories": 25
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Pulka",
            "estCalories": 80
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Pesara Pappu",
            "estCalories": 130
          },
          {
            "name": "Radish Sambar",
            "estCalories": 80
          },
          {
            "name": "Karam Dosa (2 Pcs Thin), Coconut Chutney",
            "estCalories": 230
          },
          {
            "name": "Dondakaya Fry",
            "estCalories": 100
          },
          {
            "name": "Drumstick Tomato Curry",
            "estCalories": 120
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Papaya Cut Fruit",
            "estCalories": 60
          },
          {
            "name": "Tomato Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Lemon Coriander Soup",
            "estCalories": 45
          }
        ]
      }
    ]
  },
  {
    "date": 9,
    "dayName": "Monday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Vegetable Moong Dal Kitchidi",
            "estCalories": 180
          },
          {
            "name": "Bhature - 3 Pcs Big",
            "estCalories": 360
          },
          {
            "name": "Peanut Chutney, Sambar",
            "estCalories": 60
          },
          {
            "name": "Chole Curry",
            "estCalories": 180
          },
          {
            "name": "Brown Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Masala Omelet",
            "estCalories": 120,
            "diet": "non-veg"
          },
          {
            "name": "Brown Bread+Peanut Butter+Jam",
            "estCalories": 180
          },
          {
            "name": "Cold Badam Milk without Sugar",
            "estCalories": 120
          },
          {
            "name": "Museli",
            "estCalories": 150
          },
          {
            "name": "Boiled Red Beans Salad",
            "estCalories": 90,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Boiled Chana Salad with Onion & Tomato",
            "estCalories": 90
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Palak Dal",
            "estCalories": 140
          },
          {
            "name": "Brinjal Sambar",
            "estCalories": 80
          },
          {
            "name": "Ghee Rice",
            "estCalories": 220
          },
          {
            "name": "French Beans Potato Fry",
            "estCalories": 120
          },
          {
            "name": "Ghobi Masala",
            "estCalories": 130
          },
          {
            "name": "Fryums",
            "estCalories": 70
          },
          {
            "name": "Butter Milk",
            "estCalories": 45
          },
          {
            "name": "Sorakaya Perugu Chutney, Ghee + Podi",
            "estCalories": 60
          },
          {
            "name": "Semiya Sabudana Kheer",
            "estCalories": 160
          },
          {
            "name": "Ghee + Podi",
            "estCalories": 60
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Mexican Sweet Corn Salad",
            "estCalories": 110
          },
          {
            "name": "Lemon Sauce",
            "estCalories": 20
          },
          {
            "name": "Masala Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Methi Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Tadka",
            "estCalories": 150
          },
          {
            "name": "Jeera-Milagu Rasam",
            "estCalories": 45
          },
          {
            "name": "Bhagara Rice",
            "estCalories": 200
          },
          {
            "name": "Chettinad Chicken Curry",
            "estCalories": 240,
            "diet": "non-veg"
          },
          {
            "name": "Paneer Green Peas Masala",
            "estCalories": 220,
            "diet": "veg"
          },
          {
            "name": "Snake Gourd Poriyal",
            "estCalories": 90
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Water Melon Cut Fruit",
            "estCalories": 50
          },
          {
            "name": "Gongura Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Butter Methi Naan",
            "estCalories": 220
          },
          {
            "name": "Mix Veg Raagi Soup",
            "estCalories": 55
          }
        ]
      }
    ]
  },
  {
    "date": 10,
    "dayName": "Tuesday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Ghee Podi Dosa (2 Pcs Thin)",
            "estCalories": 240
          },
          {
            "name": "Pav Bhaji",
            "estCalories": 250
          },
          {
            "name": "Coconut Chutney, Sambar",
            "estCalories": 80
          },
          {
            "name": "Mint Chutney",
            "estCalories": 35
          },
          {
            "name": "White Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Ragi Malt with Salt (1 Medium Glass)",
            "estCalories": 90
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Scrambled Egg",
            "estCalories": 130,
            "diet": "non-veg"
          },
          {
            "name": "Pomegranate Fresh Juice with Light Sugar",
            "estCalories": 90
          },
          {
            "name": "Museli",
            "estCalories": 150
          },
          {
            "name": "Boiled Soya Bean Salad",
            "estCalories": 90,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Carrot & Cucumber Salad",
            "estCalories": 30
          },
          {
            "name": "Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Amaranthus Dal",
            "estCalories": 140
          },
          {
            "name": "Beetroot Tomato Rasam",
            "estCalories": 45
          },
          {
            "name": "Bisbele Bath",
            "estCalories": 210
          },
          {
            "name": "Kakarakaya (Bitter Gourd) Fry",
            "estCalories": 110
          },
          {
            "name": "Rajma Masala",
            "estCalories": 160
          },
          {
            "name": "Kara Boondi",
            "estCalories": 110
          },
          {
            "name": "Dahi Vada",
            "estCalories": 150
          },
          {
            "name": "Dosakaya Tomato Chutney",
            "estCalories": 40
          },
          {
            "name": "Ghee + Podi",
            "estCalories": 60
          },
          {
            "name": "Kalakand",
            "estCalories": 160
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Aloo Samosa 1 Big Pc",
            "estCalories": 220
          },
          {
            "name": "Tomato Sauce, Salt Mirchi",
            "estCalories": 20
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Pulka",
            "estCalories": 80
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Makhani",
            "estCalories": 180
          },
          {
            "name": "Kadamba Sambar",
            "estCalories": 80
          },
          {
            "name": "Mushroom Biryani",
            "estCalories": 280
          },
          {
            "name": "French Beans Coconut Poriyal",
            "estCalories": 100
          },
          {
            "name": "Aloo Mutter Curry",
            "estCalories": 150
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Banana",
            "estCalories": 90
          },
          {
            "name": "Tomato Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Broccoli Soup",
            "estCalories": 50
          }
        ]
      }
    ]
  },
  {
    "date": 11,
    "dayName": "Wednesday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Methu Vada (3 Pcs)",
            "estCalories": 240
          },
          {
            "name": "Mix Veg Suji Bun (2 Pcs)",
            "estCalories": 210
          },
          {
            "name": "Sambar",
            "estCalories": 80
          },
          {
            "name": "Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "Brown Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Boiled Egg",
            "estCalories": 75,
            "diet": "non-veg"
          },
          {
            "name": "Brown Bread+Peanut Butter+Jam",
            "estCalories": 180
          },
          {
            "name": "Muskmelon Fresh Juice without Sugar",
            "estCalories": 60
          },
          {
            "name": "Chocos",
            "estCalories": 150
          },
          {
            "name": "Boiled Chick Peas Salad",
            "estCalories": 85,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Palak Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Gongura (Sorrel Leaves) Dal",
            "estCalories": 140
          },
          {
            "name": "Rasam",
            "estCalories": 45
          },
          {
            "name": "Vegetable Dum Pulav",
            "estCalories": 210
          },
          {
            "name": "Andhra Chicken Fry",
            "estCalories": 250,
            "diet": "non-veg"
          },
          {
            "name": "Kaju Tomato Paneer Fry",
            "estCalories": 240
          },
          {
            "name": "Red Beans Curry",
            "estCalories": 160
          },
          {
            "name": "Triangular Fryums",
            "estCalories": 70
          },
          {
            "name": "Butter Milk",
            "estCalories": 45
          },
          {
            "name": "Coriander + Tomato Chutney",
            "estCalories": 35
          },
          {
            "name": "Gulab Jamun",
            "estCalories": 150
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Bandi Style Ragda Chat",
            "estCalories": 200
          },
          {
            "name": "Onion Small pieces",
            "estCalories": 120
          },
          {
            "name": "Ginger Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Tomato Dal",
            "estCalories": 140
          },
          {
            "name": "Drumstick Sambar",
            "estCalories": 80
          },
          {
            "name": "Sooji Upma, Coconut Chutney",
            "estCalories": 200
          },
          {
            "name": "Bottle Guard Tomato Stir Fry",
            "estCalories": 100
          },
          {
            "name": "Soya Chunks Masala",
            "estCalories": 150
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Green Grapes",
            "estCalories": 60
          },
          {
            "name": "Lemon Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Tomato Soup with Roasted Bread",
            "estCalories": 70
          }
        ]
      }
    ]
  },
  {
    "date": 12,
    "dayName": "Thursday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Methi Poori (3 Pcs standard size)",
            "estCalories": 240
          },
          {
            "name": "Lemon Sevai",
            "estCalories": 180
          },
          {
            "name": "Aloo Mutter Curry",
            "estCalories": 150
          },
          {
            "name": "Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "White Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Masala Onion Omelet",
            "estCalories": 120,
            "diet": "non-veg"
          },
          {
            "name": "Grapes Fresh Juice without sugar",
            "estCalories": 75
          },
          {
            "name": "Cornflakes",
            "estCalories": 150
          },
          {
            "name": "Boiled Chickpeas Salad",
            "estCalories": 40,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Carrot & Cucumber Salad",
            "estCalories": 30
          },
          {
            "name": "Pulka",
            "estCalories": 80
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Sorrel Leaves Dal (Gongura Pappu)",
            "estCalories": 140
          },
          {
            "name": "Drumstick Brinjal Sambar",
            "estCalories": 80
          },
          {
            "name": "Pudina Rice",
            "estCalories": 180
          },
          {
            "name": "Guthi Vankaya Curry",
            "estCalories": 160
          },
          {
            "name": "Ridge Gourd Fry",
            "estCalories": 100
          },
          {
            "name": "Finger Fryums",
            "estCalories": 70
          },
          {
            "name": "Lemon Water + Sabja Seeds",
            "estCalories": 25
          },
          {
            "name": "Potlakaya Perugu Chutney",
            "estCalories": 60
          },
          {
            "name": "Ghee + Podi",
            "estCalories": 60
          },
          {
            "name": "Shahi Ki Tukda",
            "estCalories": 190
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Boiled Peanuts with Onion/Tomato",
            "estCalories": 120
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Fry",
            "estCalories": 150
          },
          {
            "name": "Beetroot Tomato Rasam",
            "estCalories": 45
          },
          {
            "name": "Veg Manchuria, Noodles, Tomato Sauce",
            "estCalories": 280
          },
          {
            "name": "Black Channa Curry",
            "estCalories": 160
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Banana",
            "estCalories": 90
          },
          {
            "name": "Gongura Fresh Chutney",
            "estCalories": 35
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Chicken 65 / Andhra Fish Fry",
            "estCalories": 240,
            "diet": "non-veg"
          },
          {
            "name": "Paneer 65",
            "estCalories": 210,
            "diet": "veg"
          },
          {
            "name": "Creamy Mushroom Soup",
            "estCalories": 75
          }
        ]
      }
    ]
  },
  {
    "date": 13,
    "dayName": "Friday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Uggani + Mirchi Bajji",
            "estCalories": 280
          },
          {
            "name": "Vegetable Daliya Kitchidi",
            "estCalories": 170
          },
          {
            "name": "Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "Mango Pickle",
            "estCalories": 20
          },
          {
            "name": "Brown Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Boiled Egg",
            "estCalories": 75,
            "diet": "non-veg"
          },
          {
            "name": "Brown Bread+Peanut Butter+Jam",
            "estCalories": 180
          },
          {
            "name": "Sweet Lime + Pineapple Fresh Juice without sugar",
            "estCalories": 75
          },
          {
            "name": "Museli",
            "estCalories": 150
          },
          {
            "name": "Boiled Peanut Sundal",
            "estCalories": 110,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Beetroot & Cucumber Salad",
            "estCalories": 30
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Tadka",
            "estCalories": 150
          },
          {
            "name": "Rasam",
            "estCalories": 45
          },
          {
            "name": "Jeera Rice",
            "estCalories": 180
          },
          {
            "name": "Raw Banana Fry",
            "estCalories": 120
          },
          {
            "name": "Red Rajma Masala",
            "estCalories": 160
          },
          {
            "name": "Papad",
            "estCalories": 40
          },
          {
            "name": "Butter Milk",
            "estCalories": 45
          },
          {
            "name": "Beerakaya Chutney",
            "estCalories": 40
          },
          {
            "name": "Moong Dal Payasam",
            "estCalories": 170
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Aloo Bonda (Medium size 2 pc)",
            "estCalories": 220
          },
          {
            "name": "Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Lacha Paratha",
            "estCalories": 220
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Pesara Pappu",
            "estCalories": 130
          },
          {
            "name": "Mix Veg Sambar",
            "estCalories": 80
          },
          {
            "name": "Garlic Chicken Curry",
            "estCalories": 240,
            "diet": "non-veg"
          },
          {
            "name": "Paneer Tikka Masala",
            "estCalories": 230,
            "diet": "veg"
          },
          {
            "name": "Tomato Peas Capsicum Masala",
            "estCalories": 120
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Muskmelon Cut Fruit",
            "estCalories": 50
          },
          {
            "name": "Mango Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Sweet Corn Soup",
            "estCalories": 65
          }
        ]
      }
    ]
  },
  {
    "date": 14,
    "dayName": "Saturday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Mix Veg Utappam - 2 Pcs Std Size",
            "estCalories": 220
          },
          {
            "name": "Vegetable Poha",
            "estCalories": 180
          },
          {
            "name": "Peanut Chutney",
            "estCalories": 60
          },
          {
            "name": "Tomato Chutney",
            "estCalories": 40
          },
          {
            "name": "White Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Boiled Egg",
            "estCalories": 75,
            "diet": "non-veg"
          },
          {
            "name": "Watermelon & Pomegranate Juice with Light Sugar",
            "estCalories": 85
          },
          {
            "name": "Chocos",
            "estCalories": 150
          },
          {
            "name": "Sweet Potato Salad",
            "estCalories": 100,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Carrot & Cucumber Salad",
            "estCalories": 30
          },
          {
            "name": "Pulka",
            "estCalories": 80
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Mudda Pappu",
            "estCalories": 140
          },
          {
            "name": "Pachi Pulusu",
            "estCalories": 50
          },
          {
            "name": "Pulihora (Tamarind Rice)",
            "estCalories": 200
          },
          {
            "name": "Radish Tomato Stir Fry",
            "estCalories": 100
          },
          {
            "name": "Chole Curry",
            "estCalories": 180
          },
          {
            "name": "Papad",
            "estCalories": 40
          },
          {
            "name": "Majiga Pulusu",
            "estCalories": 65
          },
          {
            "name": "Avakaya (Mango Pickle)",
            "estCalories": 20
          },
          {
            "name": "Ghee + Podi",
            "estCalories": 60
          },
          {
            "name": "Carrot Halwa",
            "estCalories": 180
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Punugulu 8 Pcs Medium Size",
            "estCalories": 240
          },
          {
            "name": "Groundnut/Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "Cold Badam Milk 150 ml",
            "estCalories": 150
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Maharani",
            "estCalories": 160
          },
          {
            "name": "Bendakaya (Bhindi) Pulusu",
            "estCalories": 110
          },
          {
            "name": "Vegetable Fried Rice, Gobhi Manchuria, Tomato Sauce",
            "estCalories": 320
          },
          {
            "name": "Cabbage Beans Poriyal",
            "estCalories": 90
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Fruit Custard with Custard Apple",
            "estCalories": 160
          },
          {
            "name": "Red Chilli Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Red Lentil Soup",
            "estCalories": 60
          }
        ]
      }
    ]
  },
  {
    "date": 15,
    "dayName": "Sunday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Shavige Bath",
            "estCalories": 200
          },
          {
            "name": "Paneer Paratha - 2 Pcs Thin",
            "estCalories": 280
          },
          {
            "name": "Peanut Chutney",
            "estCalories": 60
          },
          {
            "name": "Thick Curd, Mango Pickle",
            "estCalories": 80
          },
          {
            "name": "Brown Bread+butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Egg Bhurji",
            "estCalories": 140,
            "diet": "non-veg"
          },
          {
            "name": "Brown Bread+Peanut Butter+Jam",
            "estCalories": 180
          },
          {
            "name": "Apple + Pomegranate Fresh Juice without Sugar",
            "estCalories": 80
          },
          {
            "name": "Cornflakes",
            "estCalories": 150
          },
          {
            "name": "Raagi Malt",
            "estCalories": 90,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Fry",
            "estCalories": 150
          },
          {
            "name": "Chicken Dum Biryani/Paneer Dum Biryani",
            "estCalories": 350
          },
          {
            "name": "Chicken Thick Gravy / Hyderabadi Mirchi Ka Salan",
            "estCalories": 180,
            "diet": "non-veg"
          },
          {
            "name": "Tomato Rasam",
            "estCalories": 45
          },
          {
            "name": "Onion Raitha",
            "estCalories": 60
          },
          {
            "name": "Triangular Fryums",
            "estCalories": 70
          },
          {
            "name": "Mint Lemon Jal Jeera Drink (200 ml)",
            "estCalories": 40
          },
          {
            "name": "Fresh Gongura Chutney",
            "estCalories": 35
          },
          {
            "name": "Basundhi (60 ml)",
            "estCalories": 160
          },
          {
            "name": "Vanilla Ice Cream (Not Frozen Dessert)",
            "estCalories": 140
          },
          {
            "name": "Gulab Jamun",
            "estCalories": 150
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Dahi Puri (8 Pcs)",
            "estCalories": 220
          },
          {
            "name": "Onions",
            "estCalories": 25
          },
          {
            "name": "Masala Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Pulka",
            "estCalories": 80
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Pesara Pappu",
            "estCalories": 130
          },
          {
            "name": "Radish Sambar",
            "estCalories": 80
          },
          {
            "name": "Ragi Idly, Groundnut Chutney",
            "estCalories": 190
          },
          {
            "name": "Dondakaya Stir Fry",
            "estCalories": 100
          },
          {
            "name": "Vegetable Kurma Gravy",
            "estCalories": 140
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Papaya Cut Fruit",
            "estCalories": 60
          },
          {
            "name": "Tomato Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Lemon Coriander Soup",
            "estCalories": 45
          }
        ]
      }
    ]
  },
  {
    "date": 16,
    "dayName": "Monday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Ghee + Veg Pongal",
            "estCalories": 220
          },
          {
            "name": "Bhature - 2 Pcs Big",
            "estCalories": 280
          },
          {
            "name": "Groundnut Chutney, Sambar",
            "estCalories": 60
          },
          {
            "name": "Chole Curry",
            "estCalories": 180
          },
          {
            "name": "White Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Boiled Egg",
            "estCalories": 75,
            "diet": "non-veg"
          },
          {
            "name": "Banana Milk Shake without Sugar",
            "estCalories": 120
          },
          {
            "name": "Cornflakes",
            "estCalories": 150
          },
          {
            "name": "Boiled Mixed Beans Salad",
            "estCalories": 90,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Boiled Chana Salad with Onion & Tomato",
            "estCalories": 90
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Palak Dal",
            "estCalories": 140
          },
          {
            "name": "Brinjal Sambar",
            "estCalories": 80
          },
          {
            "name": "Tomato Rice",
            "estCalories": 190
          },
          {
            "name": "Pesara Punugulu Curry (Pakka Andhra Style)",
            "estCalories": 170
          },
          {
            "name": "Capsicum Tomato Masala",
            "estCalories": 120
          },
          {
            "name": "Fryums",
            "estCalories": 70
          },
          {
            "name": "Butter Milk",
            "estCalories": 45
          },
          {
            "name": "Sorakaya Perugu Chutney",
            "estCalories": 60
          },
          {
            "name": "Jilebi",
            "estCalories": 160
          },
          {
            "name": "Ghee + Podi",
            "estCalories": 60
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Dry Maggi (Non-Sticky)",
            "estCalories": 220
          },
          {
            "name": "Tomato Sauce",
            "estCalories": 20
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Pesara Pappu",
            "estCalories": 130
          },
          {
            "name": "Andhra Charu",
            "estCalories": 45
          },
          {
            "name": "Bhagara Rice",
            "estCalories": 200
          },
          {
            "name": "Hyderabadi Chicken Curry",
            "estCalories": 240,
            "diet": "non-veg"
          },
          {
            "name": "Paneer Butter Masala",
            "estCalories": 230,
            "diet": "veg"
          },
          {
            "name": "Ladies Finger Boiled Fry",
            "estCalories": 100
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Water Melon Cut Fruit",
            "estCalories": 50
          },
          {
            "name": "Radish Fresh Chutney",
            "estCalories": 35
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Butter Methi Naan",
            "estCalories": 220
          },
          {
            "name": "Sweet Corn Soup",
            "estCalories": 65
          }
        ]
      }
    ]
  },
  {
    "date": 17,
    "dayName": "Tuesday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Masala Dosa - 2 Pcs Std Size",
            "estCalories": 250
          },
          {
            "name": "Vada Pav",
            "estCalories": 220
          },
          {
            "name": "Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "Mint Chutney",
            "estCalories": 35
          },
          {
            "name": "Brown Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Ragi Malt with Salt (1 Medium Glass)",
            "estCalories": 90
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Boiled Egg",
            "estCalories": 75,
            "diet": "non-veg"
          },
          {
            "name": "Brown Bread+Peanut Butter+Jam",
            "estCalories": 180
          },
          {
            "name": "Pomegranate Fresh Juice without Sugar",
            "estCalories": 70
          },
          {
            "name": "Chocos",
            "estCalories": 150
          },
          {
            "name": "Crunchy Soya Vegetable Salad",
            "estCalories": 80,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Carrot & Cucumber Salad",
            "estCalories": 30
          },
          {
            "name": "Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dosakaya Pappu",
            "estCalories": 140
          },
          {
            "name": "Beetroot Tomato Rasam",
            "estCalories": 45
          },
          {
            "name": "Bisbele Bath",
            "estCalories": 210
          },
          {
            "name": "Kakarakaya (Bitter Gourd) Fry",
            "estCalories": 110
          },
          {
            "name": "Rajma Masala",
            "estCalories": 160
          },
          {
            "name": "Potato Chips",
            "estCalories": 90
          },
          {
            "name": "Dahi Vada",
            "estCalories": 150
          },
          {
            "name": "Dosakaya Tomato Chutney",
            "estCalories": 40
          },
          {
            "name": "Ghee + Podi",
            "estCalories": 60
          },
          {
            "name": "Makkan Peda",
            "estCalories": 180
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Aloo Samosa 1 Big Pc",
            "estCalories": 220
          },
          {
            "name": "Tomato Sauce, Salt Mirchi",
            "estCalories": 20
          },
          {
            "name": "Ginger Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Pulka",
            "estCalories": 80
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Makhani",
            "estCalories": 180
          },
          {
            "name": "Kadamba Sambar",
            "estCalories": 80
          },
          {
            "name": "Mushroom Biryani",
            "estCalories": 280
          },
          {
            "name": "Cluster Beans Coconut Fry",
            "estCalories": 110
          },
          {
            "name": "Aloo Mutter Curry",
            "estCalories": 150
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Banana Fruit",
            "estCalories": 90
          },
          {
            "name": "Ginger Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Broccoli Soup",
            "estCalories": 50
          }
        ]
      }
    ]
  },
  {
    "date": 18,
    "dayName": "Wednesday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Pesarattu Thin 2 Pcs Std Size",
            "estCalories": 220
          },
          {
            "name": "Tomato Suji Upma",
            "estCalories": 180
          },
          {
            "name": "Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "Ginger Chutney",
            "estCalories": 40
          },
          {
            "name": "White Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Masala Onion Omelet",
            "estCalories": 120,
            "diet": "non-veg"
          },
          {
            "name": "Pineapple Fresh Juice without Sugar",
            "estCalories": 75
          },
          {
            "name": "Chocos",
            "estCalories": 150
          },
          {
            "name": "Greek Yogurt Salad",
            "estCalories": 90,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Palak Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Amaranthus Dal",
            "estCalories": 140
          },
          {
            "name": "Pachi Pulusu",
            "estCalories": 50
          },
          {
            "name": "Bhagara Rice",
            "estCalories": 200
          },
          {
            "name": "Kadai Chicken",
            "estCalories": 240,
            "diet": "non-veg"
          },
          {
            "name": "Kadai Paneer",
            "estCalories": 230
          },
          {
            "name": "Vegetable Jalfrezi",
            "estCalories": 130
          },
          {
            "name": "Papad",
            "estCalories": 40
          },
          {
            "name": "Butter Milk",
            "estCalories": 45
          },
          {
            "name": "Fresh Vegetable Chutney",
            "estCalories": 35
          },
          {
            "name": "Double ka Meeta",
            "estCalories": 220
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Bhelpuri",
            "estCalories": 180
          },
          {
            "name": "Ginger Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Tomato Dal",
            "estCalories": 140
          },
          {
            "name": "Garlic Rasam",
            "estCalories": 45
          },
          {
            "name": "Broken Wheat Rava Upma, Coconut Chutney",
            "estCalories": 190
          },
          {
            "name": "Bottle Guard Chana Dal Fry",
            "estCalories": 110
          },
          {
            "name": "Aloo Mutter Curry",
            "estCalories": 150
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Pine Apple Cut Fruit",
            "estCalories": 60
          },
          {
            "name": "Lemon Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Tomato Soup with Roasted Bread",
            "estCalories": 70
          }
        ]
      }
    ]
  },
  {
    "date": 19,
    "dayName": "Thursday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Medu Vada (3 Pcs)",
            "estCalories": 240
          },
          {
            "name": "Pav Bhaji",
            "estCalories": 250
          },
          {
            "name": "Sambar",
            "estCalories": 80
          },
          {
            "name": "Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "Brown Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Papaya Fresh Juice without Sugar",
            "estCalories": 70
          },
          {
            "name": "Cornflakes",
            "estCalories": 150
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Carrot & Cucumber Salad",
            "estCalories": 30
          },
          {
            "name": "Pulka",
            "estCalories": 80
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Ridge Gourd Dal",
            "estCalories": 130
          },
          {
            "name": "Drumstick Brinjal Sambar",
            "estCalories": 80
          },
          {
            "name": "Pudina Rice",
            "estCalories": 180
          },
          {
            "name": "Guthi Vankaya Curry",
            "estCalories": 160
          },
          {
            "name": "Kala Chana Masala",
            "estCalories": 160
          },
          {
            "name": "Finger Fryums",
            "estCalories": 70
          },
          {
            "name": "Lemon Water + Sabja Seeds",
            "estCalories": 25
          },
          {
            "name": "Potlakaya Perugu Chutney",
            "estCalories": 60
          },
          {
            "name": "Ghee + Podi",
            "estCalories": 60
          },
          {
            "name": "Mothichoor Laddu",
            "estCalories": 170
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Mysore Bonda 2 Pcs Std Size (Less Oily)",
            "estCalories": 220
          },
          {
            "name": "Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Fry",
            "estCalories": 150
          },
          {
            "name": "Beetroot Tomato Rasam",
            "estCalories": 45
          },
          {
            "name": "Veg Manchurian, Noodles, Tomato Sauce",
            "estCalories": 280
          },
          {
            "name": "Dhaba Style Egg Curry",
            "estCalories": 180,
            "diet": "non-veg"
          },
          {
            "name": "Rajma Masala",
            "estCalories": 160
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Green Grapes",
            "estCalories": 60
          },
          {
            "name": "Gongura Fresh Chutney",
            "estCalories": 35
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Chicken Tikka Fry/Malabar Fish Fry",
            "estCalories": 240,
            "diet": "non-veg"
          },
          {
            "name": "Paneer Tikka/Chilli Babycorn",
            "estCalories": 210,
            "diet": "veg"
          },
          {
            "name": "Paneer Bhurji",
            "estCalories": 200,
            "diet": "veg"
          },
          {
            "name": "Creamy Mushroom Soup",
            "estCalories": 75
          }
        ]
      }
    ]
  },
  {
    "date": 20,
    "dayName": "Friday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Poori (3 pcs standard size)",
            "estCalories": 240
          },
          {
            "name": "Rice Rava Upma (Dry)",
            "estCalories": 180
          },
          {
            "name": "Aloo Basin Chutney",
            "estCalories": 70
          },
          {
            "name": "Dal Chutney",
            "estCalories": 60
          },
          {
            "name": "Brown Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Ragi Malt with Salt (1 Medium Glass)",
            "estCalories": 90
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Boiled Egg",
            "estCalories": 75,
            "diet": "non-veg"
          },
          {
            "name": "Brown Bread+Peanut Butter+Jam",
            "estCalories": 180
          },
          {
            "name": "Grapes Fresh Juice with Light Sugar",
            "estCalories": 90
          },
          {
            "name": "Museli",
            "estCalories": 150
          },
          {
            "name": "Boiled Chick Peas Salad",
            "estCalories": 85,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Beetroot & Cucumber Salad",
            "estCalories": 30
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Tadka",
            "estCalories": 150
          },
          {
            "name": "Andhra Charu",
            "estCalories": 45
          },
          {
            "name": "Jeera Rice",
            "estCalories": 180
          },
          {
            "name": "Raw Banana Fry",
            "estCalories": 120
          },
          {
            "name": "Turnip Spinach Curry (Punjabi Style)",
            "estCalories": 120
          },
          {
            "name": "Papad",
            "estCalories": 40
          },
          {
            "name": "Lassi",
            "estCalories": 120
          },
          {
            "name": "Beerakaya Chutney",
            "estCalories": 40
          },
          {
            "name": "Carrot Halwa",
            "estCalories": 180
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Sambar Vada 2 Pcs (Separate)",
            "estCalories": 240
          },
          {
            "name": "Masala Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Beetroot Chapathi",
            "estCalories": 105
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal",
            "estCalories": 140
          },
          {
            "name": "Mix Veg Sambar",
            "estCalories": 80
          },
          {
            "name": "Chicken Tikka Masala",
            "estCalories": 240,
            "diet": "non-veg"
          },
          {
            "name": "Paneer Lababdar",
            "estCalories": 230,
            "diet": "veg"
          },
          {
            "name": "Amritsari Chole",
            "estCalories": 170
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Muskmelon Cut Fruit",
            "estCalories": 50
          },
          {
            "name": "Amla Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Mix Veg Raagi Soup",
            "estCalories": 55
          }
        ]
      }
    ]
  },
  {
    "date": 21,
    "dayName": "Saturday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Uggani + Mirchi Bajji",
            "estCalories": 280
          },
          {
            "name": "Moong Dal Palak Tepla (Hand Made) 2 Pcs",
            "estCalories": 220
          },
          {
            "name": "Groundnut Chutney",
            "estCalories": 60
          },
          {
            "name": "Onion Tomato Chutney",
            "estCalories": 40
          },
          {
            "name": "Brown Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Ragi Malt with Salt (1 Medium Glass)",
            "estCalories": 90
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Boiled Egg",
            "estCalories": 75,
            "diet": "non-veg"
          },
          {
            "name": "Brown Bread+Peanut Butter+Jam",
            "estCalories": 180
          },
          {
            "name": "Mosambi Fresh Juice without Sugar",
            "estCalories": 65
          },
          {
            "name": "Cornflakes",
            "estCalories": 150
          },
          {
            "name": "Boiled Peanut Sundal",
            "estCalories": 110,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Carrot & Cucumber Salad",
            "estCalories": 30
          },
          {
            "name": "Pulka",
            "estCalories": 80
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Mudda Pappu",
            "estCalories": 140
          },
          {
            "name": "Pachi Pulusu",
            "estCalories": 50
          },
          {
            "name": "Pulihora (Tamarind Rice)",
            "estCalories": 200
          },
          {
            "name": "Cauli Flower Fry",
            "estCalories": 120
          },
          {
            "name": "Chole Curry",
            "estCalories": 180
          },
          {
            "name": "Papad",
            "estCalories": 40
          },
          {
            "name": "Majjiga Pulusu",
            "estCalories": 65
          },
          {
            "name": "Avakaya (Mango Pickle)",
            "estCalories": 20
          },
          {
            "name": "Ghee + Podi",
            "estCalories": 60
          },
          {
            "name": "Cauli Flower Tomato Stir Fry",
            "estCalories": 120
          },
          {
            "name": "Chocolate Cake (Egg Less)",
            "estCalories": 180,
            "diet": "non-veg"
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Vada Pav 2 Pcs",
            "estCalories": 360
          },
          {
            "name": "Mint Sauce",
            "estCalories": 25
          },
          {
            "name": "Cold Badam Milk (1 Medium Glass)",
            "estCalories": 150
          },
          {
            "name": "Cold Badam Milk 150 ml",
            "estCalories": 150
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Maharani",
            "estCalories": 160
          },
          {
            "name": "Drumstick Sambar",
            "estCalories": 80
          },
          {
            "name": "Ghee + Podi + Idly, Coconut Chutney",
            "estCalories": 220
          },
          {
            "name": "Tomato Baingan Fry",
            "estCalories": 110
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Banana",
            "estCalories": 90
          },
          {
            "name": "Red Chilli Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Veg Manchow Soup",
            "estCalories": 65
          }
        ]
      }
    ]
  },
  {
    "date": 22,
    "dayName": "Sunday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Shavige Bath",
            "estCalories": 200
          },
          {
            "name": "Aloo Paratha (2 Pcs Thin)",
            "estCalories": 260
          },
          {
            "name": "Mint Coriander Chutney",
            "estCalories": 35
          },
          {
            "name": "Thick Curd, Mango Pickle",
            "estCalories": 80
          },
          {
            "name": "White Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Egg Bhurji",
            "estCalories": 140,
            "diet": "non-veg"
          },
          {
            "name": "Apple + Pomegranate Fresh Juice without Sugar",
            "estCalories": 80
          },
          {
            "name": "Museli",
            "estCalories": 150
          },
          {
            "name": "Ragi Malt",
            "estCalories": 90,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Makhani",
            "estCalories": 180
          },
          {
            "name": "Chicken Fry Piece Biryani/Paneer Fry Piece Biryani",
            "estCalories": 360
          },
          {
            "name": "Chicken Thick Gravy / Hyderabadi Mirchi Ka Salan",
            "estCalories": 180,
            "diet": "non-veg"
          },
          {
            "name": "Onion Raitha",
            "estCalories": 60
          },
          {
            "name": "Tomato Rasam",
            "estCalories": 45
          },
          {
            "name": "Fryums",
            "estCalories": 70
          },
          {
            "name": "Mint Lemon Jal Jeera Drink (200 ml)",
            "estCalories": 40
          },
          {
            "name": "Fresh Gongura Chutney",
            "estCalories": 35
          },
          {
            "name": "Vanilla Ice Cream (Not Frozen Dessert)",
            "estCalories": 140
          },
          {
            "name": "Gajar Ka Halwa",
            "estCalories": 180
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Dahi Papdi Chat",
            "estCalories": 220
          },
          {
            "name": "Onions",
            "estCalories": 25
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Pulka",
            "estCalories": 80
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Pesara Pappu",
            "estCalories": 130
          },
          {
            "name": "Radish Sambar",
            "estCalories": 80
          },
          {
            "name": "Karam Dosa (2 Pcs Thin), Coconut Chutney",
            "estCalories": 230
          },
          {
            "name": "Dondakaya Fry",
            "estCalories": 100
          },
          {
            "name": "Drumstick Tomato Curry",
            "estCalories": 120
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Papaya Cut Fruit",
            "estCalories": 60
          },
          {
            "name": "Tomato Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Lemon Coriander Soup",
            "estCalories": 45
          }
        ]
      }
    ]
  },
  {
    "date": 23,
    "dayName": "Monday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Vegetable Moong Dal Kitchidi",
            "estCalories": 180
          },
          {
            "name": "Bhature - 3 Pcs Big",
            "estCalories": 360
          },
          {
            "name": "Peanut Chutney, Sambar",
            "estCalories": 60
          },
          {
            "name": "Chole Curry",
            "estCalories": 180
          },
          {
            "name": "Brown Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Masala Omelet",
            "estCalories": 120,
            "diet": "non-veg"
          },
          {
            "name": "Brown Bread+Peanut Butter+Jam",
            "estCalories": 180
          },
          {
            "name": "Cold Badam Milk without Sugar",
            "estCalories": 120
          },
          {
            "name": "Museli",
            "estCalories": 150
          },
          {
            "name": "Boiled Red Beans Salad",
            "estCalories": 90,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Boiled Chana Salad with Onion & Tomato",
            "estCalories": 90
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Palak Dal",
            "estCalories": 140
          },
          {
            "name": "Brinjal Sambar",
            "estCalories": 80
          },
          {
            "name": "Ghee Rice",
            "estCalories": 220
          },
          {
            "name": "French Beans Potato Fry",
            "estCalories": 120
          },
          {
            "name": "Ghobi Masala",
            "estCalories": 130
          },
          {
            "name": "Fryums",
            "estCalories": 70
          },
          {
            "name": "Butter Milk",
            "estCalories": 45
          },
          {
            "name": "Sorakaya Perugu Chutney, Ghee + Podi",
            "estCalories": 60
          },
          {
            "name": "Semiya Sabudana Kheer",
            "estCalories": 160
          },
          {
            "name": "Ghee + Podi",
            "estCalories": 60
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Mexican Sweet Corn Salad",
            "estCalories": 110
          },
          {
            "name": "Lemon Sauce",
            "estCalories": 20
          },
          {
            "name": "Masala Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Methi Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Tadka",
            "estCalories": 150
          },
          {
            "name": "Jeera-Milagu Rasam",
            "estCalories": 45
          },
          {
            "name": "Bhagara Rice",
            "estCalories": 200
          },
          {
            "name": "Chettinad Chicken Curry",
            "estCalories": 240,
            "diet": "non-veg"
          },
          {
            "name": "Paneer Green Peas Masala",
            "estCalories": 220,
            "diet": "veg"
          },
          {
            "name": "Snake Gourd Poriyal",
            "estCalories": 90
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Water Melon Cut Fruit",
            "estCalories": 50
          },
          {
            "name": "Gongura Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Butter Methi Naan",
            "estCalories": 220
          },
          {
            "name": "Mix Veg Raagi Soup",
            "estCalories": 55
          }
        ]
      }
    ]
  },
  {
    "date": 24,
    "dayName": "Tuesday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Ghee Podi Dosa (2 Pcs Thin)",
            "estCalories": 240
          },
          {
            "name": "Pav Bhaji",
            "estCalories": 250
          },
          {
            "name": "Coconut Chutney, Sambar",
            "estCalories": 80
          },
          {
            "name": "Mint Chutney",
            "estCalories": 35
          },
          {
            "name": "White Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Ragi Malt with Salt (1 Medium Glass)",
            "estCalories": 90
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Scrambled Egg",
            "estCalories": 130,
            "diet": "non-veg"
          },
          {
            "name": "Pomegranate Fresh Juice with Light Sugar",
            "estCalories": 90
          },
          {
            "name": "Museli",
            "estCalories": 150
          },
          {
            "name": "Boiled Soya Bean Salad",
            "estCalories": 90,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Carrot & Cucumber Salad",
            "estCalories": 30
          },
          {
            "name": "Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Amaranthus Dal",
            "estCalories": 140
          },
          {
            "name": "Beetroot Tomato Rasam",
            "estCalories": 45
          },
          {
            "name": "Bisbele Bath",
            "estCalories": 210
          },
          {
            "name": "Kakarakaya (Bitter Gourd) Fry",
            "estCalories": 110
          },
          {
            "name": "Rajma Masala",
            "estCalories": 160
          },
          {
            "name": "Kara Boondi",
            "estCalories": 110
          },
          {
            "name": "Dahi Vada",
            "estCalories": 150
          },
          {
            "name": "Dosakaya Tomato Chutney",
            "estCalories": 40
          },
          {
            "name": "Ghee + Podi",
            "estCalories": 60
          },
          {
            "name": "Kalakand",
            "estCalories": 160
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Aloo Samosa 1 Big Pc",
            "estCalories": 220
          },
          {
            "name": "Tomato Sauce, Salt Mirchi",
            "estCalories": 20
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Pulka",
            "estCalories": 80
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Makhani",
            "estCalories": 180
          },
          {
            "name": "Kadamba Sambar",
            "estCalories": 80
          },
          {
            "name": "Mushroom Biryani",
            "estCalories": 280
          },
          {
            "name": "French Beans Coconut Poriyal",
            "estCalories": 100
          },
          {
            "name": "Aloo Mutter Curry",
            "estCalories": 150
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Banana",
            "estCalories": 90
          },
          {
            "name": "Tomato Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Broccoli Soup",
            "estCalories": 50
          }
        ]
      }
    ]
  },
  {
    "date": 25,
    "dayName": "Wednesday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Methu Vada (3 Pcs)",
            "estCalories": 240
          },
          {
            "name": "Mix Veg Suji Bun (2 Pcs)",
            "estCalories": 210
          },
          {
            "name": "Sambar",
            "estCalories": 80
          },
          {
            "name": "Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "Brown Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Boiled Egg",
            "estCalories": 75,
            "diet": "non-veg"
          },
          {
            "name": "Brown Bread+Peanut Butter+Jam",
            "estCalories": 180
          },
          {
            "name": "Muskmelon Fresh Juice without Sugar",
            "estCalories": 60
          },
          {
            "name": "Chocos",
            "estCalories": 150
          },
          {
            "name": "Boiled Chick Peas Salad",
            "estCalories": 85,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Palak Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Gongura (Sorrel Leaves) Dal",
            "estCalories": 140
          },
          {
            "name": "Rasam",
            "estCalories": 45
          },
          {
            "name": "Vegetable Dum Pulav",
            "estCalories": 210
          },
          {
            "name": "Andhra Chicken Fry",
            "estCalories": 250,
            "diet": "non-veg"
          },
          {
            "name": "Kaju Tomato Paneer Fry",
            "estCalories": 240
          },
          {
            "name": "Red Beans Curry",
            "estCalories": 160
          },
          {
            "name": "Triangular Fryums",
            "estCalories": 70
          },
          {
            "name": "Butter Milk",
            "estCalories": 45
          },
          {
            "name": "Coriander + Tomato Chutney",
            "estCalories": 35
          },
          {
            "name": "Gulab Jamun",
            "estCalories": 150
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Bandi Style Ragda Chat",
            "estCalories": 200
          },
          {
            "name": "Onion Small pieces",
            "estCalories": 120
          },
          {
            "name": "Ginger Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Tomato Dal",
            "estCalories": 140
          },
          {
            "name": "Drumstick Sambar",
            "estCalories": 80
          },
          {
            "name": "Sooji Upma, Coconut Chutney",
            "estCalories": 200
          },
          {
            "name": "Bottle Guard Tomato Stir Fry",
            "estCalories": 100
          },
          {
            "name": "Soya Chunks Masala",
            "estCalories": 150
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Green Grapes",
            "estCalories": 60
          },
          {
            "name": "Lemon Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Tomato Soup with Roasted Bread",
            "estCalories": 70
          }
        ]
      }
    ]
  },
  {
    "date": 26,
    "dayName": "Thursday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Methi Poori (3 Pcs standard size)",
            "estCalories": 240
          },
          {
            "name": "Lemon Sevai",
            "estCalories": 180
          },
          {
            "name": "Chickpea Masala",
            "estCalories": 160
          },
          {
            "name": "Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "White Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Masala Onion Omelet",
            "estCalories": 120,
            "diet": "non-veg"
          },
          {
            "name": "Grapes Fresh Juice without sugar",
            "estCalories": 75
          },
          {
            "name": "Cornflakes",
            "estCalories": 150
          },
          {
            "name": "Boiled Chickpeas Salad",
            "estCalories": 40,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Carrot & Cucumber Salad",
            "estCalories": 30
          },
          {
            "name": "Pulka",
            "estCalories": 80
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Sorrel Leaves Dal (Gongura Pappu)",
            "estCalories": 140
          },
          {
            "name": "Drumstick Brinjal Sambar",
            "estCalories": 80
          },
          {
            "name": "Pudina Rice",
            "estCalories": 180
          },
          {
            "name": "Guthi Vankaya Curry",
            "estCalories": 160
          },
          {
            "name": "Ridge Gourd Fry",
            "estCalories": 100
          },
          {
            "name": "Finger Fryums",
            "estCalories": 70
          },
          {
            "name": "Lemon Water + Sabja Seeds",
            "estCalories": 25
          },
          {
            "name": "Potlakaya Perugu Chutney",
            "estCalories": 60
          },
          {
            "name": "Ghee + Podi",
            "estCalories": 60
          },
          {
            "name": "Shahi Ki Tukda",
            "estCalories": 190
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Boiled Black Chana with Onion/Tomato",
            "estCalories": 100
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Fry",
            "estCalories": 150
          },
          {
            "name": "Beetroot Tomato Rasam",
            "estCalories": 45
          },
          {
            "name": "Veg Manchuria, Noodles, Tomato Sauce",
            "estCalories": 280
          },
          {
            "name": "Black Channa Curry",
            "estCalories": 160
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Banana",
            "estCalories": 90
          },
          {
            "name": "Gongura Fresh Chutney",
            "estCalories": 35
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Chicken 65 / Andhra Fish Fry",
            "estCalories": 240,
            "diet": "non-veg"
          },
          {
            "name": "Paneer 65",
            "estCalories": 210,
            "diet": "veg"
          },
          {
            "name": "Creamy Mushroom Soup",
            "estCalories": 75
          }
        ]
      }
    ]
  },
  {
    "date": 27,
    "dayName": "Friday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Uggani + Mirchi Bajji",
            "estCalories": 280
          },
          {
            "name": "Vegetable Daliya Kitchidi",
            "estCalories": 170
          },
          {
            "name": "Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "Mango Pickle",
            "estCalories": 20
          },
          {
            "name": "Brown Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Boiled Egg",
            "estCalories": 75,
            "diet": "non-veg"
          },
          {
            "name": "Brown Bread+Peanut Butter+Jam",
            "estCalories": 180
          },
          {
            "name": "Sweet Lime + Pineapple Fresh Juice without sugar",
            "estCalories": 75
          },
          {
            "name": "Museli",
            "estCalories": 150
          },
          {
            "name": "Boiled Peanut Sundal",
            "estCalories": 110,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Beetroot & Cucumber Salad",
            "estCalories": 30
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Tadka",
            "estCalories": 150
          },
          {
            "name": "Rasam",
            "estCalories": 45
          },
          {
            "name": "Jeera Rice",
            "estCalories": 180
          },
          {
            "name": "Raw Banana Fry",
            "estCalories": 120
          },
          {
            "name": "Red Rajma Masala",
            "estCalories": 160
          },
          {
            "name": "Papad",
            "estCalories": 40
          },
          {
            "name": "Butter Milk",
            "estCalories": 45
          },
          {
            "name": "Beerakaya Chutney",
            "estCalories": 40
          },
          {
            "name": "Moong Dal Payasam",
            "estCalories": 170
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Aloo Bonda (Medium size 2 pc)",
            "estCalories": 220
          },
          {
            "name": "Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Lacha Paratha",
            "estCalories": 220
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Pesara Pappu",
            "estCalories": 130
          },
          {
            "name": "Mix Veg Sambar",
            "estCalories": 80
          },
          {
            "name": "Garlic Chicken Curry",
            "estCalories": 240,
            "diet": "non-veg"
          },
          {
            "name": "Paneer Tikka Masala",
            "estCalories": 230,
            "diet": "veg"
          },
          {
            "name": "Tomato Peas Capsicum Masala",
            "estCalories": 120
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Muskmelon Cut Fruit",
            "estCalories": 50
          },
          {
            "name": "Mango Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Sweet Corn Soup",
            "estCalories": 65
          }
        ]
      }
    ]
  },
  {
    "date": 28,
    "dayName": "Saturday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Mix Veg Utappam - 2 Pcs Std Size",
            "estCalories": 220
          },
          {
            "name": "Vegetable Poha",
            "estCalories": 180
          },
          {
            "name": "Peanut Chutney",
            "estCalories": 60
          },
          {
            "name": "Tomato Chutney",
            "estCalories": 40
          },
          {
            "name": "White Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Boiled Egg",
            "estCalories": 75,
            "diet": "non-veg"
          },
          {
            "name": "Watermelon & Pomegranate Juice with Light Sugar",
            "estCalories": 85
          },
          {
            "name": "Chocos",
            "estCalories": 150
          },
          {
            "name": "Sweet Potato Salad",
            "estCalories": 100,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Carrot & Cucumber Salad",
            "estCalories": 30
          },
          {
            "name": "Pulka",
            "estCalories": 80
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Mudda Pappu",
            "estCalories": 140
          },
          {
            "name": "Pachi Pulusu",
            "estCalories": 50
          },
          {
            "name": "Pulihora (Tamarind Rice)",
            "estCalories": 200
          },
          {
            "name": "Radish Tomato Stir Fry",
            "estCalories": 100
          },
          {
            "name": "Chole Curry",
            "estCalories": 180
          },
          {
            "name": "Papad",
            "estCalories": 40
          },
          {
            "name": "Majiga Pulusu",
            "estCalories": 65
          },
          {
            "name": "Avakaya (Mango Pickle)",
            "estCalories": 20
          },
          {
            "name": "Ghee + Podi",
            "estCalories": 60
          },
          {
            "name": "Carrot Halwa",
            "estCalories": 180
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Punugulu 8 Pcs Medium Size",
            "estCalories": 240
          },
          {
            "name": "Groundnut/Coconut Chutney",
            "estCalories": 50
          },
          {
            "name": "Cold Badam Milk 150 ml",
            "estCalories": 150
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Maharani",
            "estCalories": 160
          },
          {
            "name": "Bendakaya (Bhindi) Pulusu",
            "estCalories": 110
          },
          {
            "name": "Vegetable Fried Rice, Gobhi Manchuria, Tomato Sauce",
            "estCalories": 320
          },
          {
            "name": "Cabbage Beans Poriyal",
            "estCalories": 90
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Fruit Custard with Custard Apple",
            "estCalories": 160
          },
          {
            "name": "Red Chilli Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Red Lentil Soup",
            "estCalories": 60
          }
        ]
      }
    ]
  },
  {
    "date": 29,
    "dayName": "Sunday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Shavige Bath",
            "estCalories": 200
          },
          {
            "name": "Paneer Paratha - 2 Pcs Thin",
            "estCalories": 280
          },
          {
            "name": "Peanut Chutney",
            "estCalories": 60
          },
          {
            "name": "Thick Curd, Mango Pickle",
            "estCalories": 80
          },
          {
            "name": "Brown Bread+butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Egg Bhurji",
            "estCalories": 140,
            "diet": "non-veg"
          },
          {
            "name": "Brown Bread+Peanut Butter+Jam",
            "estCalories": 180
          },
          {
            "name": "Apple + Pomegranate Fresh Juice without Sugar",
            "estCalories": 80
          },
          {
            "name": "Cornflakes",
            "estCalories": 150
          },
          {
            "name": "Raagi Malt",
            "estCalories": 90,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Dal Fry",
            "estCalories": 150
          },
          {
            "name": "Chicken Dum Biryani/Paneer Dum Biryani",
            "estCalories": 350
          },
          {
            "name": "Chicken Thick Gravy / Hyderabadi Mirchi Ka Salan",
            "estCalories": 180,
            "diet": "non-veg"
          },
          {
            "name": "Tomato Rasam",
            "estCalories": 45
          },
          {
            "name": "Onion Raitha",
            "estCalories": 60
          },
          {
            "name": "Triangular Fryums",
            "estCalories": 70
          },
          {
            "name": "Mint Lemon Jal Jeera Drink (200 ml)",
            "estCalories": 40
          },
          {
            "name": "Fresh Gongura Chutney",
            "estCalories": 35
          },
          {
            "name": "Basundhi (60 ml)",
            "estCalories": 160
          },
          {
            "name": "Vanilla Ice Cream (Not Frozen Dessert)",
            "estCalories": 140
          },
          {
            "name": "Gulab Jamun",
            "estCalories": 150
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Dahi Puri (8 Pcs)",
            "estCalories": 220
          },
          {
            "name": "Onions",
            "estCalories": 25
          },
          {
            "name": "Masala Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Beetroot & Carrot Salad",
            "estCalories": 30
          },
          {
            "name": "Pulka",
            "estCalories": 80
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Pesara Pappu",
            "estCalories": 130
          },
          {
            "name": "Radish Sambar",
            "estCalories": 80
          },
          {
            "name": "Ragi Idly, Groundnut Chutney",
            "estCalories": 190
          },
          {
            "name": "Dondakaya Stir Fry",
            "estCalories": 100
          },
          {
            "name": "Vegetable Kurma Gravy",
            "estCalories": 140
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Papaya Cut Fruit",
            "estCalories": 60
          },
          {
            "name": "Tomato Pickle",
            "estCalories": 20
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Lemon Coriander Soup",
            "estCalories": 45
          }
        ]
      }
    ]
  },
  {
    "date": 30,
    "dayName": "Monday",
    "meals": [
      {
        "slot": "breakfast",
        "items": [
          {
            "name": "Ghee + Veg Pongal",
            "estCalories": 220
          },
          {
            "name": "Bhature - 2 Pcs Big",
            "estCalories": 280
          },
          {
            "name": "Groundnut Chutney, Sambar",
            "estCalories": 60
          },
          {
            "name": "Chole Curry",
            "estCalories": 180
          },
          {
            "name": "White Bread+Butter+Jam",
            "estCalories": 150
          },
          {
            "name": "Sprouts (1 small cup)",
            "estCalories": 50
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          },
          {
            "name": "Boiled Egg",
            "estCalories": 75,
            "diet": "non-veg"
          },
          {
            "name": "Banana Milk Shake without Sugar",
            "estCalories": 120
          },
          {
            "name": "Cornflakes",
            "estCalories": 150
          },
          {
            "name": "Boiled Mixed Beans Salad",
            "estCalories": 90,
            "diet": "veg"
          }
        ]
      },
      {
        "slot": "lunch",
        "items": [
          {
            "name": "Boiled Chana Salad with Onion & Tomato",
            "estCalories": 90
          },
          {
            "name": "Chapathi",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Palak Dal",
            "estCalories": 140
          },
          {
            "name": "Brinjal Sambar",
            "estCalories": 80
          },
          {
            "name": "Tomato Rice",
            "estCalories": 190
          },
          {
            "name": "Pesara Punugulu Curry (Pakka Andhra Style)",
            "estCalories": 170
          },
          {
            "name": "Capsicum Tomato Masala",
            "estCalories": 120
          },
          {
            "name": "Fryums",
            "estCalories": 70
          },
          {
            "name": "Butter Milk",
            "estCalories": 45
          },
          {
            "name": "Sorakaya Perugu Chutney",
            "estCalories": 60
          },
          {
            "name": "Jilebi",
            "estCalories": 160
          },
          {
            "name": "Ghee + Podi",
            "estCalories": 60
          }
        ]
      },
      {
        "slot": "snacks",
        "items": [
          {
            "name": "Dry Maggi (Non-Sticky)",
            "estCalories": 220
          },
          {
            "name": "Tomato Sauce",
            "estCalories": 20
          },
          {
            "name": "Tea/Coffee/Milk",
            "estCalories": 80
          }
        ]
      },
      {
        "slot": "dinner",
        "items": [
          {
            "name": "Onions & Lemon Salad",
            "estCalories": 25
          },
          {
            "name": "Roti",
            "estCalories": 100
          },
          {
            "name": "White Rice",
            "estCalories": 150
          },
          {
            "name": "Pesara Pappu",
            "estCalories": 130
          },
          {
            "name": "Andhra Charu",
            "estCalories": 45
          },
          {
            "name": "Bhagara Rice",
            "estCalories": 200
          },
          {
            "name": "Hyderabadi Chicken Curry",
            "estCalories": 240,
            "diet": "non-veg"
          },
          {
            "name": "Paneer Butter Masala",
            "estCalories": 230,
            "diet": "veg"
          },
          {
            "name": "Ladies Finger Boiled Fry",
            "estCalories": 100
          },
          {
            "name": "Thick Curd",
            "estCalories": 80
          },
          {
            "name": "Water Melon Cut Fruit",
            "estCalories": 50
          },
          {
            "name": "Radish Fresh Chutney",
            "estCalories": 35
          },
          {
            "name": "Milk + Coffee Powder",
            "estCalories": 80
          },
          {
            "name": "Butter Methi Naan",
            "estCalories": 220
          },
          {
            "name": "Sweet Corn Soup",
            "estCalories": 65
          }
        ]
      }
    ]
  }
];
