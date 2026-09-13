export interface QuoteItem {
  id: number;
  quote: string;
  author: string;
  category: 'studies' | 'career' | 'finance' | 'time' | 'character';
}

export const QUOTES_POOL: QuoteItem[] = [
  // ── 1. STUDIES & INTELLECTUAL RIGOR (1-32) ──
  {
    id: 1,
    quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
    category: "studies"
  },
  {
    id: 2,
    quote: "Deep work is the ability to focus without distraction on a cognitively demanding task.",
    author: "Cal Newport",
    category: "studies"
  },
  {
    id: 3,
    quote: "An investment in knowledge always pays the best interest.",
    author: "Benjamin Franklin",
    category: "studies"
  },
  {
    id: 4,
    quote: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
    author: "Brian Herbert",
    category: "studies"
  },
  {
    id: 5,
    quote: "Study without desire spoils the memory, and it retains nothing that it takes in.",
    author: "Leonardo da Vinci",
    category: "studies"
  },
  {
    id: 6,
    quote: "Intellectual growth should commence at birth and cease only at death.",
    author: "Albert Einstein",
    category: "studies"
  },
  {
    id: 7,
    quote: "If you cannot explain something in simple terms, you do not understand it completely.",
    author: "Richard Feynman",
    category: "studies"
  },
  {
    id: 8,
    quote: "Self-education is, I firmly believe, the only kind of education there is.",
    author: "Isaac Asimov",
    category: "studies"
  },
  {
    id: 9,
    quote: "Success in learning comes from continuous iteration, not momentary inspiration.",
    author: "Barbara Oakley",
    category: "studies"
  },
  {
    id: 10,
    quote: "The more that you read, the more things you will know. The more that you learn, the more places you will go.",
    author: "Dr. Seuss",
    category: "studies"
  },
  {
    id: 11,
    quote: "Clarity of mind requires the elimination of superficial distractions during study.",
    author: "Marcus Aurelius",
    category: "studies"
  },
  {
    id: 12,
    quote: "Learning is not attained by chance; it must be sought for with ardor and attended to with diligence.",
    author: "Abigail Adams",
    category: "studies"
  },
  {
    id: 13,
    quote: "The mind is not a vessel to be filled, but a fire to be kindled.",
    author: "Plutarch",
    category: "studies"
  },
  {
    id: 14,
    quote: "One hour of uninterrupted focus produces more insight than eight hours of fragmented effort.",
    author: "Herbert Simon",
    category: "studies"
  },
  {
    id: 15,
    quote: "True mastery appears when fundamentals become second nature through rigorous practice.",
    author: "Miyamoto Musashi",
    category: "studies"
  },
  {
    id: 16,
    quote: "Read 500 pages every day. That is how knowledge builds up, like compound interest.",
    author: "Warren Buffett",
    category: "studies"
  },
  {
    id: 17,
    quote: "The authority of those who teach is often an obstacle to those who want to learn.",
    author: "Cicero",
    category: "studies"
  },
  {
    id: 18,
    quote: "Difficulty in comprehension is an invitation to deepen cognitive discipline.",
    author: "Thomas Aquinas",
    category: "studies"
  },
  {
    id: 19,
    quote: "Concentrate every minute like a Roman on doing what is in front of you with precise and genuine gravity.",
    author: "Marcus Aurelius",
    category: "studies"
  },
  {
    id: 20,
    quote: "Knowledge has to be improved, challenged, and increased constantly, or it vanishes.",
    author: "Peter Drucker",
    category: "studies"
  },
  {
    id: 21,
    quote: "Active recall and spaced repetition form the unbreakable backbone of academic retention.",
    author: "Hermann Ebbinghaus",
    category: "studies"
  },
  {
    id: 22,
    quote: "Never let the fear of a complex syllabus deter you from systematic daily progress.",
    author: "Marie Curie",
    category: "studies"
  },
  {
    id: 23,
    quote: "He who learns but does not think, is lost. He who thinks but does not learn is in great danger.",
    author: "Confucius",
    category: "studies"
  },
  {
    id: 24,
    quote: "The greatest obstacle to discovery is not ignorance; it is the illusion of knowledge.",
    author: "Daniel J. Boorstin",
    category: "studies"
  },
  {
    id: 25,
    quote: "Treat your study desk like a laboratory: clean, intentional, and strictly dedicated to excellence.",
    author: "Louis Pasteur",
    category: "studies"
  },
  {
    id: 26,
    quote: "Understanding causes brings clarity; merely memorizing facts yields fragile knowledge.",
    author: "Aristotle",
    category: "studies"
  },
  {
    id: 27,
    quote: "Develop a passion for learning. If you do, you will never cease to grow.",
    author: "Anthony J. D'Angelo",
    category: "studies"
  },
  {
    id: 28,
    quote: "A single book can alter the trajectory of a disciplined mind.",
    author: "Malcolm X",
    category: "studies"
  },
  {
    id: 29,
    quote: "Patience and persistence will accomplish more than brilliant bursts of unstructured effort.",
    author: "Thomas Edison",
    category: "studies"
  },
  {
    id: 30,
    quote: "Depth of comprehension beats speed of consumption every single time.",
    author: "Naval Ravikant",
    category: "studies"
  },
  {
    id: 31,
    quote: "The expert in anything was once a beginner who refused to surrender.",
    author: "Helen Hayes",
    category: "studies"
  },
  {
    id: 32,
    quote: "Doubt is the origin of wisdom; rigorous inquiry is its catalyst.",
    author: "René Descartes",
    category: "studies"
  },

  // ── 2. CAREER & PROFESSIONAL MASTERY (33-64) ──
  {
    id: 33,
    quote: "Be so good they cannot ignore you.",
    author: "Steve Martin",
    category: "career"
  },
  {
    id: 34,
    quote: "The best way to predict the future is to create it through relentless competence.",
    author: "Peter Drucker",
    category: "career"
  },
  {
    id: 35,
    quote: "Opportunities do not happen. You create them by building undeniable skills.",
    author: "Chris Grosser",
    category: "career"
  },
  {
    id: 36,
    quote: "Choose a career path where accountability, leverage, and specific knowledge compound.",
    author: "Naval Ravikant",
    category: "career"
  },
  {
    id: 37,
    quote: "Quality is not an act, it is a habit built into every line of work you deliver.",
    author: "Aristotle",
    category: "career"
  },
  {
    id: 38,
    quote: "A professional is someone who can do his best work when he doesn't particularly feel like it.",
    author: "Alistair Cooke",
    category: "career"
  },
  {
    id: 39,
    quote: "The separation of talent and skill is one of the greatest misunderstood concepts. Skill is only developed by hours and hours of beating on your craft.",
    author: "Will Smith",
    category: "career"
  },
  {
    id: 40,
    quote: "Your reputation is built on what you finish, not what you start.",
    author: "Henry Ford",
    category: "career"
  },
  {
    id: 41,
    quote: "The future belongs to those who learn more skills and combine them in creative ways.",
    author: "Robert Greene",
    category: "career"
  },
  {
    id: 42,
    quote: "Deliver more than is expected. It is the rarest and most rewarded professional virtue.",
    author: "Larry Page",
    category: "career"
  },
  {
    id: 43,
    quote: "Don't wish it were easier; wish you were better. Don't wish for fewer problems; wish for more skills.",
    author: "Jim Rohn",
    category: "career"
  },
  {
    id: 44,
    quote: "Hard work spotlights the character of people: some turn up their sleeves, some turn up their noses, and some don't turn up at all.",
    author: "Sam Ewing",
    category: "career"
  },
  {
    id: 45,
    quote: "High agency is finding a way to get what you want, regardless of the obstacles.",
    author: "Paul Graham",
    category: "career"
  },
  {
    id: 46,
    quote: "Whatever your hand finds to do, do it with all your might and technical precision.",
    author: "King Solomon",
    category: "career"
  },
  {
    id: 47,
    quote: "Mastery requires patience. The amateur wants results tomorrow; the master plays the decade game.",
    author: "Robert Greene",
    category: "career"
  },
  {
    id: 48,
    quote: "Small daily improvements over time lead to stunning professional outcomes.",
    author: "Robin Sharma",
    category: "career"
  },
  {
    id: 49,
    quote: "Consistency will always defeat intermittent genius in long-term career trajectories.",
    author: "Alex Hormozi",
    category: "career"
  },
  {
    id: 50,
    quote: "Do what you do so well that people cannot help but recommend your work.",
    author: "Walt Disney",
    category: "career"
  },
  {
    id: 51,
    quote: "Professionalism means keeping your promises even when the circumstance has become inconvenient.",
    author: "David Maister",
    category: "career"
  },
  {
    id: 52,
    quote: "The secret of getting ahead is getting started with systematic execution.",
    author: "Mark Twain",
    category: "career"
  },
  {
    id: 53,
    quote: "Build leverage through code, media, or specialized judgment that scales beyond your physical hours.",
    author: "Naval Ravikant",
    category: "career"
  },
  {
    id: 54,
    quote: "Do not wait for leadership opportunities; demonstrate competence in small tasks and authority will follow.",
    author: "Colin Powell",
    category: "career"
  },
  {
    id: 55,
    quote: "Never confuse activity with achievement. Measure what actually moves the needle.",
    author: "John Wooden",
    category: "career"
  },
  {
    id: 56,
    quote: "A true professional never blames tools or conditions; they adjust the strategy and execute.",
    author: "Jocko Willink",
    category: "career"
  },
  {
    id: 57,
    quote: "Work quietly on your craft, and let the finished product make the noise.",
    author: "Frank Ocean",
    category: "career"
  },
  {
    id: 58,
    quote: "Every breakthrough in your career begins when you accept total responsibility for outcomes.",
    author: "Brian Tracy",
    category: "career"
  },
  {
    id: 59,
    quote: "If you want to achieve greatness, stop asking for permission and start building proof of work.",
    author: "Unknown",
    category: "career"
  },
  {
    id: 60,
    quote: "The value of your career is defined by the difficulty of the problems you can reliably solve.",
    author: "Elon Musk",
    category: "career"
  },
  {
    id: 61,
    quote: "Refine your standards daily until your floor is higher than the average person's ceiling.",
    author: "Tim Grover",
    category: "career"
  },
  {
    id: 62,
    quote: "In the business world, the rearview mirror is always clearer than the windshield; stay forward-focused.",
    author: "Warren Buffett",
    category: "career"
  },
  {
    id: 63,
    quote: "Precision in execution transforms ordinary concepts into industry standards.",
    author: "Jony Ive",
    category: "career"
  },
  {
    id: 64,
    quote: "When preparation meets opportunity, the world calls it luck; the craftsman knows better.",
    author: "Seneca",
    category: "career"
  },

  // ── 3. FINANCIAL DISCIPLINE & FRUGALITY (65-96) ──
  {
    id: 65,
    quote: "Do not save what is left after spending; spend what is left after saving.",
    author: "Warren Buffett",
    category: "finance"
  },
  {
    id: 66,
    quote: "Wealth consists not in having great possessions, but in having few wants.",
    author: "Epictetus",
    category: "finance"
  },
  {
    id: 67,
    quote: "Beware of little expenses; a small leak will sink a great ship.",
    author: "Benjamin Franklin",
    category: "finance"
  },
  {
    id: 68,
    quote: "Spending money to show people how much money you have is the fastest way to have less money.",
    author: "Morgan Housel",
    category: "finance"
  },
  {
    id: 69,
    quote: "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.",
    author: "Dave Ramsey",
    category: "finance"
  },
  {
    id: 70,
    quote: "The person who buys what he does not need steals from himself.",
    author: "Swedish Proverb",
    category: "finance"
  },
  {
    id: 71,
    quote: "True wealth is what you don't see: the cars not purchased, the watches not worn, the first-class upgrades declined.",
    author: "Morgan Housel",
    category: "finance"
  },
  {
    id: 72,
    quote: "Too many people spend money they haven't earned, to buy things they don't want, to impress people they don't like.",
    author: "Will Rogers",
    category: "finance"
  },
  {
    id: 73,
    quote: "Frugality without creativity is deprivation; frugality with purpose is ultimate freedom.",
    author: "Thomas Sowell",
    category: "finance"
  },
  {
    id: 74,
    quote: "If you buy things you do not need, soon you will have to sell things you need.",
    author: "Warren Buffett",
    category: "finance"
  },
  {
    id: 75,
    quote: "Wealth is the ability to fully experience life without anxiety over financial obligations.",
    author: "Henry David Thoreau",
    category: "finance"
  },
  {
    id: 76,
    quote: "A budget is telling your money where to go instead of wondering where it went.",
    author: "John C. Maxwell",
    category: "finance"
  },
  {
    id: 77,
    quote: "Every dollar saved today is an employee working for your future financial independence.",
    author: "Charlie Munger",
    category: "finance"
  },
  {
    id: 78,
    quote: "The art is not in making money, but in keeping it through disciplined choices.",
    author: "Proverb",
    category: "finance"
  },
  {
    id: 79,
    quote: "Rich people stay rich by living like they are broke; broke people stay broke by living like they are rich.",
    author: "Anonymous",
    category: "finance"
  },
  {
    id: 80,
    quote: "Money is a terrible master but an excellent servant when guided by clear priorities.",
    author: "P.T. Barnum",
    category: "finance"
  },
  {
    id: 81,
    quote: "Control your expenses better than your competition controls theirs; discipline creates endurance.",
    author: "Sam Walton",
    category: "finance"
  },
  {
    id: 82,
    quote: "Delaying gratification is the highest form of financial intelligence.",
    author: "James Clear",
    category: "finance"
  },
  {
    id: 83,
    quote: "Financial freedom is available to those who learn about it and work for it systematically.",
    author: "Robert Kiyosaki",
    category: "finance"
  },
  {
    id: 84,
    quote: "It is not the man who has too little, but the man who craves more, that is poor.",
    author: "Seneca",
    category: "finance"
  },
  {
    id: 85,
    quote: "Do not trade long-term financial sovereignty for temporary social validation.",
    author: "Naval Ravikant",
    category: "finance"
  },
  {
    id: 86,
    quote: "Compound interest is the eighth wonder of the world. He who understands it, earns it; he who doesn't, pays it.",
    author: "Albert Einstein",
    category: "finance"
  },
  {
    id: 87,
    quote: "Impulsive spending is emotional leakage; track your expenses to regain mental clarity.",
    author: "Anonymous",
    category: "finance"
  },
  {
    id: 88,
    quote: "The quickest way to double your money is to fold it over and put it back in your pocket.",
    author: "Will Rogers",
    category: "finance"
  },
  {
    id: 89,
    quote: "Simplicity of life brings richness of resource; eliminate luxury traps early in your journey.",
    author: "Marcus Aurelius",
    category: "finance"
  },
  {
    id: 90,
    quote: "A man in debt is so far a slave.",
    author: "Ralph Waldo Emerson",
    category: "finance"
  },
  {
    id: 91,
    quote: "Treat every rupee as seed capital for your long-term independence.",
    author: "Mohnish Pabrai",
    category: "finance"
  },
  {
    id: 92,
    quote: "Never spend your money before you have earned it.",
    author: "Thomas Jefferson",
    category: "finance"
  },
  {
    id: 93,
    quote: "He who will not economize will have to agonize.",
    author: "Confucius",
    category: "finance"
  },
  {
    id: 94,
    quote: "Financial discipline buys the most precious asset on earth: control of your own calendar.",
    author: "Morgan Housel",
    category: "finance"
  },
  {
    id: 95,
    quote: "Contentment with little is the greatest asset; sufficiency is nature's wealth.",
    author: "Epicurus",
    category: "finance"
  },
  {
    id: 96,
    quote: "Before you purchase something non-essential, calculate how many working hours it costs you.",
    author: "Henry David Thoreau",
    category: "finance"
  },

  // ── 4. TIME UTILIZATION & URGENCY (97-128) ──
  {
    id: 97,
    quote: "It is not that we have a short time to live, but that we waste a lot of it.",
    author: "Seneca",
    category: "time"
  },
  {
    id: 98,
    quote: "Time is what we want most, but what we use worst.",
    author: "William Penn",
    category: "time"
  },
  {
    id: 99,
    quote: "You may delay, but time will not.",
    author: "Benjamin Franklin",
    category: "time"
  },
  {
    id: 100,
    quote: "Until you value yourself, you won't value your time. Until you value your time, you will not do anything with it.",
    author: "M. Scott Peck",
    category: "time"
  },
  {
    id: 101,
    quote: "Lack of direction, not lack of time, is the real problem. We all have twenty-four hour days.",
    author: "Zig Ziglar",
    category: "time"
  },
  {
    id: 102,
    quote: "You do not rise to the level of your goals; you fall to the level of your systems for managing each day.",
    author: "James Clear",
    category: "time"
  },
  {
    id: 103,
    quote: "Do not act as if you had ten thousand years to throw away. Death stands at your elbow. Be good while you live and have it in your power.",
    author: "Marcus Aurelius",
    category: "time"
  },
  {
    id: 104,
    quote: "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
    author: "Stephen Covey",
    category: "time"
  },
  {
    id: 105,
    quote: "Time is a created thing. To say 'I don't have time' is like saying 'I don't want to.'",
    author: "Lao Tzu",
    category: "time"
  },
  {
    id: 106,
    quote: "Yesterday is gone. Tomorrow has not yet come. We have only today. Let us begin.",
    author: "Mother Teresa",
    category: "time"
  },
  {
    id: 107,
    quote: "Guard your time with fierce jealousy; people will steal your hours more readily than your money.",
    author: "Seneca",
    category: "time"
  },
  {
    id: 108,
    quote: "Procrastination is the thief of time; collar him early before he robs your future.",
    author: "Charles Dickens",
    category: "time"
  },
  {
    id: 109,
    quote: "Focus is a muscle. Every hour spent working without multitasking strengthens its capacity.",
    author: "Cal Newport",
    category: "time"
  },
  {
    id: 110,
    quote: "Lost wealth may be replaced by industry, lost knowledge by study, but lost time is gone forever.",
    author: "Samuel Smiles",
    category: "time"
  },
  {
    id: 111,
    quote: "Dost thou love life? Then do not squander time, for that's the stuff life is made of.",
    author: "Benjamin Franklin",
    category: "time"
  },
  {
    id: 112,
    quote: "The secret to productivity is elimination: say no to the non-essential so you can execute the critical.",
    author: "Greg McKeown",
    category: "time"
  },
  {
    id: 113,
    quote: "Treat every morning as a fresh assignment where minutes count toward mastery.",
    author: "Marcus Aurelius",
    category: "time"
  },
  {
    id: 114,
    quote: "He who allows his day to drift aimlessly will wake up wondering where his decade went.",
    author: "Peter Drucker",
    category: "time"
  },
  {
    id: 115,
    quote: "Action will remove the doubt that theory cannot solve. Move today.",
    author: "Tehyi Hsieh",
    category: "time"
  },
  {
    id: 116,
    quote: "Spend your time on assets that compound: deep skills, good health, and reliable character.",
    author: "Naval Ravikant",
    category: "time"
  },
  {
    id: 117,
    quote: "Efficiency is doing things right; effectiveness is doing the right things.",
    author: "Peter Drucker",
    category: "time"
  },
  {
    id: 118,
    quote: "Every minute you spend looking back wastes the forward momentum you need right now.",
    author: "Ken Venturi",
    category: "time"
  },
  {
    id: 119,
    quote: "A year from now you may wish you had started today.",
    author: "Karen Lamb",
    category: "time"
  },
  {
    id: 120,
    quote: "Schedule your deep work first; if you let trivial tasks fill the container, mastery will never fit.",
    author: "Stephen Covey",
    category: "time"
  },
  {
    id: 121,
    quote: "One day or day one? The decision happens in your calendar right now.",
    author: "Paulo Coelho",
    category: "time"
  },
  {
    id: 122,
    quote: "Respect the clock: small 15-minute leaks in your schedule sink massive life ambitions.",
    author: "David Allen",
    category: "time"
  },
  {
    id: 123,
    quote: "Urgency without anxiety is the hallmark of the high achiever.",
    author: "Tim Ferriss",
    category: "time"
  },
  {
    id: 124,
    quote: "Do not wait for ideal conditions; take the present hour and forge them yourself.",
    author: "George Washington",
    category: "time"
  },
  {
    id: 125,
    quote: "How we spend our days is, of course, how we spend our lives.",
    author: "Annie Dillard",
    category: "time"
  },
  {
    id: 126,
    quote: "Win the morning and you control the momentum of the entire day.",
    author: "Tim Ferriss",
    category: "time"
  },
  {
    id: 127,
    quote: "Do something today that your future self will thank you for.",
    author: "Sean Patrick Flanery",
    category: "time"
  },
  {
    id: 128,
    quote: "Time flies over us, but leaves its shadow behind; make sure your shadow is proof of effort.",
    author: "Nathaniel Hawthorne",
    category: "time"
  },

  // ── 5. CHARACTER DEVELOPMENT & SELF-MASTERY (129-160) ──
  {
    id: 129,
    quote: "Waste no more time arguing what a good man should be. Be one.",
    author: "Marcus Aurelius",
    category: "character"
  },
  {
    id: 130,
    quote: "No man is free who is not master of himself.",
    author: "Epictetus",
    category: "character"
  },
  {
    id: 131,
    quote: "Integrity is doing the right thing, even when no one is watching.",
    author: "C.S. Lewis",
    category: "character"
  },
  {
    id: 132,
    quote: "Character is like a tree and reputation like a shadow. The shadow is what we think of it; the tree is the real thing.",
    author: "Abraham Lincoln",
    category: "character"
  },
  {
    id: 133,
    quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Will Durant",
    category: "character"
  },
  {
    id: 134,
    quote: "Discipline equals freedom in every dimension of life.",
    author: "Jocko Willink",
    category: "character"
  },
  {
    id: 135,
    quote: "The first and greatest victory is to conquer yourself.",
    author: "Plato",
    category: "character"
  },
  {
    id: 136,
    quote: "He who has a why to live can bear almost any how.",
    author: "Friedrich Nietzsche",
    category: "character"
  },
  {
    id: 137,
    quote: "Do not pray for an easy life; pray for the strength to endure a difficult one.",
    author: "Bruce Lee",
    category: "character"
  },
  {
    id: 138,
    quote: "Self-respect is the fruit of discipline; the sense of dignity grows with the ability to say no to oneself.",
    author: "Abraham Joshua Heschel",
    category: "character"
  },
  {
    id: 139,
    quote: "You have power over your mind, not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius",
    category: "character"
  },
  {
    id: 140,
    quote: "The impediment to action advances action. What stands in the way becomes the way.",
    author: "Marcus Aurelius",
    category: "character"
  },
  {
    id: 141,
    quote: "When you are content to be simply yourself and don't compare or compete, everybody will respect you.",
    author: "Lao Tzu",
    category: "character"
  },
  {
    id: 142,
    quote: "The measure of a man is what he does with power and responsibility.",
    author: "Plato",
    category: "character"
  },
  {
    id: 143,
    quote: "A disciplined mind leads to happiness, and an undisciplined mind leads to suffering.",
    author: "Dalai Lama",
    category: "character"
  },
  {
    id: 144,
    quote: "Character cannot be developed in ease and quiet. Only through experience of trial and suffering can the soul be strengthened.",
    author: "Helen Keller",
    category: "character"
  },
  {
    id: 145,
    quote: "Never let success go to your head, and never let failure go to your heart.",
    author: "Will Smith",
    category: "character"
  },
  {
    id: 146,
    quote: "Between stimulus and response there is a space. In that space is our power to choose our response.",
    author: "Viktor Frankl",
    category: "character"
  },
  {
    id: 147,
    quote: "Hold yourself to a higher standard than anybody else expects of you.",
    author: "Henry Ward Beecher",
    category: "character"
  },
  {
    id: 148,
    quote: "To know oneself is the beginning of all wisdom.",
    author: "Aristotle",
    category: "character"
  },
  {
    id: 149,
    quote: "It is not the critic who counts, but the man who is actually in the arena.",
    author: "Theodore Roosevelt",
    category: "character"
  },
  {
    id: 150,
    quote: "Difficulties strengthen the mind, as labor does the body.",
    author: "Seneca",
    category: "character"
  },
  {
    id: 151,
    quote: "Mastering others is strength. Mastering yourself is true power.",
    author: "Lao Tzu",
    category: "character"
  },
  {
    id: 152,
    quote: "Stand up straight with your shoulders back and accept full accountability for your life.",
    author: "Jordan Peterson",
    category: "character"
  },
  {
    id: 153,
    quote: "Humility is not thinking less of yourself; it is thinking of yourself less.",
    author: "C.S. Lewis",
    category: "character"
  },
  {
    id: 154,
    quote: "Silence is often the most profound display of self-control and strength.",
    author: "Epictetus",
    category: "character"
  },
  {
    id: 155,
    quote: "A person who conquers his impulses is greater than a general who conquers a thousand cities.",
    author: "Dhammapada",
    category: "character"
  },
  {
    id: 156,
    quote: "Act with honor when unseen, and your reputation will take care of itself.",
    author: "Seneca",
    category: "character"
  },
  {
    id: 157,
    quote: "Patience is bitter, but its fruit is sweet and enduring.",
    author: "Jean-Jacques Rousseau",
    category: "character"
  },
  {
    id: 158,
    quote: "Do not let the behavior of others destroy your inner peace and moral code.",
    author: "Dalai Lama",
    category: "character"
  },
  {
    id: 159,
    quote: "Self-command is not only itself a great virtue, but from it all the other virtues seem to derive their lustre.",
    author: "Adam Smith",
    category: "character"
  },
  {
    id: 160,
    quote: "The ultimate test of character is how you treat those who can do nothing for you.",
    author: "Johann Wolfgang von Goethe",
    category: "character"
  },

  // ── 6. STUDIES & INTELLECTUAL RIGOR II (161-185) ──
  {
    id: 161,
    quote: "Mastery requires patience, deliberate practice, and an appetite for difficult problems.",
    author: "Barbara Oakley",
    category: "studies"
  },
  {
    id: 162,
    quote: "Real education begins when you realize you know almost nothing and start investigating anyway.",
    author: "Carl Sagan",
    category: "studies"
  },
  {
    id: 163,
    quote: "You do not understand something unless you can explain it simply and clearly.",
    author: "Albert Einstein",
    category: "studies"
  },
  {
    id: 164,
    quote: "The mind is not a vessel to be filled, but a fire to be kindled.",
    author: "Plutarch",
    category: "studies"
  },
  {
    id: 165,
    quote: "Clear thinking requires courageous intellectual honesty and continuous study.",
    author: "Richard Feynman",
    category: "studies"
  },
  {
    id: 166,
    quote: "A single book can alter the trajectory of a disciplined mind forever.",
    author: "Arthur Schopenhauer",
    category: "studies"
  },
  {
    id: 167,
    quote: "The purpose of learning is growth, and our minds can continue growing as long as we live.",
    author: "Mortimer Adler",
    category: "studies"
  },
  {
    id: 168,
    quote: "Focus is the art of saying no to a thousand good ideas to master the one that matters.",
    author: "Steve Jobs",
    category: "studies"
  },
  {
    id: 169,
    quote: "Academics without sustained discipline is merely potential left unfulfilled.",
    author: "Thomas Sowell",
    category: "studies"
  },
  {
    id: 170,
    quote: "To know what you know and know what you do not know, that is true knowledge.",
    author: "Confucius",
    category: "studies"
  },
  {
    id: 171,
    quote: "Knowledge becomes power only when it is organized into definite plans of action.",
    author: "Napoleon Hill",
    category: "studies"
  },
  {
    id: 172,
    quote: "Read not to contradict and confute, but to weigh and consider.",
    author: "Francis Bacon",
    category: "studies"
  },
  {
    id: 173,
    quote: "Repetition is the mother of learning and the architect of accomplishment.",
    author: "Zig Ziglar",
    category: "studies"
  },
  {
    id: 174,
    quote: "Curiosity is the engine of intellectual achievement; cultivate it without apology.",
    author: "Marie Curie",
    category: "studies"
  },
  {
    id: 175,
    quote: "The expert in anything was once a beginner who refused to quit learning.",
    author: "Helen Hayes",
    category: "studies"
  },
  {
    id: 176,
    quote: "Deep comprehension comes from active problem solving, not passive review.",
    author: "Terence Tao",
    category: "studies"
  },
  {
    id: 177,
    quote: "Every master stayed in the library and lab long enough to solve the problem.",
    author: "Robin Sharma",
    category: "studies"
  },
  {
    id: 178,
    quote: "Intellectual humility is the foundational prerequisite to intellectual mastery.",
    author: "Socrates",
    category: "studies"
  },
  {
    id: 179,
    quote: "The roots of education are bitter, but the fruit is sweet.",
    author: "Aristotle",
    category: "studies"
  },
  {
    id: 180,
    quote: "Do not study to merely pass tests; study to command reality and create value.",
    author: "Neil deGrasse Tyson",
    category: "studies"
  },
  {
    id: 181,
    quote: "A library of unread concepts is far more valuable than an ego satisfied with obsolete facts.",
    author: "Nassim Nicholas Taleb",
    category: "studies"
  },
  {
    id: 182,
    quote: "Rigorous research eliminates assumptions and replaces guesswork with empirical confidence.",
    author: "Ada Lovelace",
    category: "studies"
  },
  {
    id: 183,
    quote: "The illiterate of the future will be those who cannot learn, unlearn, and relearn.",
    author: "Alvin Toffler",
    category: "studies"
  },
  {
    id: 184,
    quote: "Take notes in your own words; active synthesis precedes lasting retention.",
    author: "John Locke",
    category: "studies"
  },
  {
    id: 185,
    quote: "Genius is nothing more than continuous attention applied to a worthy subject.",
    author: "Claude Helvetius",
    category: "studies"
  },

  // ── 7. CAREER & PROFESSIONAL EXCELLENCE II (186-210) ──
  {
    id: 186,
    quote: "Build skills that are rare and valuable, and the market will reward you unconditionally.",
    author: "Cal Newport",
    category: "career"
  },
  {
    id: 187,
    quote: "Don't wish it were easier; wish you were better. Wish for more skills, not fewer challenges.",
    author: "Jim Rohn",
    category: "career"
  },
  {
    id: 188,
    quote: "The score takes care of itself when you execute the fundamental details flawlessly.",
    author: "Bill Walsh",
    category: "career"
  },
  {
    id: 189,
    quote: "Opportunities are usually disguised as hard work, so most people don't recognize them.",
    author: "Ann Landers",
    category: "career"
  },
  {
    id: 190,
    quote: "Manage yourself like an executive responsible for high returns on effort and time.",
    author: "Peter Drucker",
    category: "career"
  },
  {
    id: 191,
    quote: "Excellence is not an accident; it is the deliberate result of sincere effort and execution.",
    author: "Will Durant",
    category: "career"
  },
  {
    id: 192,
    quote: "The best way to build a reputation is to deliver results before you make promises.",
    author: "Henry Ford",
    category: "career"
  },
  {
    id: 193,
    quote: "Competence without arrogance is the rarest and most respected quality in any industry.",
    author: "Colin Powell",
    category: "career"
  },
  {
    id: 194,
    quote: "Treat every assignment, big or small, as a direct reflection of your personal standards.",
    author: "Indra Nooyi",
    category: "career"
  },
  {
    id: 195,
    quote: "Do what you are paid to do and then do a little more; that margin compounds into leadership.",
    author: "Napoleon Hill",
    category: "career"
  },
  {
    id: 196,
    quote: "A professional does not wait for inspiration; a professional shows up and delivers.",
    author: "Steven Pressfield",
    category: "career"
  },
  {
    id: 197,
    quote: "Learn to solve complex problems with minimal supervision, and you become indispensable.",
    author: "Ray Dalio",
    category: "career"
  },
  {
    id: 198,
    quote: "Reputation takes decades to construct and minutes to shatter; ground yours in honest execution.",
    author: "Warren Buffett",
    category: "career"
  },
  {
    id: 199,
    quote: "Focus on creating disproportionate value, and compensation will naturally follow.",
    author: "Naval Ravikant",
    category: "career"
  },
  {
    id: 200,
    quote: "The quality of your work in the dark determines whether you will shine under the spotlight.",
    author: "Kobe Bryant",
    category: "career"
  },
  {
    id: 201,
    quote: "Hard work beats talent when talent fails to work hard consistently.",
    author: "Tim Notke",
    category: "career"
  },
  {
    id: 202,
    quote: "Do not fear criticism from those who produce nothing; learn from the feedback of builders.",
    author: "Theodore Roosevelt",
    category: "career"
  },
  {
    id: 203,
    quote: "Craftsmanship is caring deeply about the smallest unseen joints of the work you deliver.",
    author: "Jony Ive",
    category: "career"
  },
  {
    id: 204,
    quote: "Take complete ownership of your team's outcomes; excuses have zero market value.",
    author: "Jocko Willink",
    category: "career"
  },
  {
    id: 205,
    quote: "Great careers are forged in the quiet hours when nobody is cheering you on.",
    author: "Serena Williams",
    category: "career"
  },
  {
    id: 206,
    quote: "Never let success go to your head, and never let failure reach your heart.",
    author: "Ziad K. Abdelnour",
    category: "career"
  },
  {
    id: 207,
    quote: "The secret of getting ahead in any field is getting started with relentless consistency.",
    author: "Mark Twain",
    category: "career"
  },
  {
    id: 208,
    quote: "Position yourself at the intersection of technical competence and continuous curiosity.",
    author: "Satya Nadella",
    category: "career"
  },
  {
    id: 209,
    quote: "You cannot build a reputation on what you are planning to do; execute today.",
    author: "Henry Ford",
    category: "career"
  },
  {
    id: 210,
    quote: "Hold yourself to higher standards and expectations than anyone else would dare ask of you.",
    author: "Sheryl Sandberg",
    category: "career"
  },

  // ── 8. FINANCIAL DISCIPLINE & REDUCING SPENDING II (211-235) ──
  {
    id: 211,
    quote: "A penny saved is a penny earned, but a dollar invested is freedom purchased.",
    author: "Benjamin Franklin",
    category: "finance"
  },
  {
    id: 212,
    quote: "Do not save what is left after spending, but spend what is left after saving.",
    author: "Warren Buffett",
    category: "finance"
  },
  {
    id: 213,
    quote: "Wealthy people stay wealthy by living modestly; poor habits create perpetual financial anxiety.",
    author: "Thomas Stanley",
    category: "finance"
  },
  {
    id: 214,
    quote: "Every impulse purchase is a silent vote against your future independence.",
    author: "Morgan Housel",
    category: "finance"
  },
  {
    id: 215,
    quote: "Frugality is not about deprivation; it is about choosing sovereign freedom over social validation.",
    author: "JL Collins",
    category: "finance"
  },
  {
    id: 216,
    quote: "Before buying anything non-essential, wait 48 hours; emotional impulse fades while capital remains.",
    author: "Dave Ramsey",
    category: "finance"
  },
  {
    id: 217,
    quote: "The art is not in merely earning money, but in keeping it and letting it compound.",
    author: "Proverb",
    category: "finance"
  },
  {
    id: 218,
    quote: "Financial peace isn't acquiring more stuff; it's learning to live comfortably on less than you make.",
    author: "Dave Ramsey",
    category: "finance"
  },
  {
    id: 219,
    quote: "True wealth is what you don't see: the debt avoided, the investments held, the freedom preserved.",
    author: "Morgan Housel",
    category: "finance"
  },
  {
    id: 220,
    quote: "He who buys what he does not need steals peace from his own future.",
    author: "Swedish Proverb",
    category: "finance"
  },
  {
    id: 221,
    quote: "Compound interest rewards the patient and punishes the impulsive.",
    author: "Albert Einstein",
    category: "finance"
  },
  {
    id: 222,
    quote: "Never spend money before you have earned it, and never risk what is essential for what is trivial.",
    author: "Thomas Jefferson",
    category: "finance"
  },
  {
    id: 223,
    quote: "The quickest way to double your money is to fold it in half and put it back in your pocket.",
    author: "Will Rogers",
    category: "finance"
  },
  {
    id: 224,
    quote: "Beware of little leaks in your budget; small daily drips sink great ships.",
    author: "Benjamin Franklin",
    category: "finance"
  },
  {
    id: 225,
    quote: "True financial luxury is zero consumer debt and absolute clarity at month-end.",
    author: "Robert Kiyosaki",
    category: "finance"
  },
  {
    id: 226,
    quote: "Do not spend your hard-earned energy buying trinkets to impress people you do not respect.",
    author: "Will Smith",
    category: "finance"
  },
  {
    id: 227,
    quote: "A budget tells your money where to go instead of wondering where it vanished.",
    author: "John C. Maxwell",
    category: "finance"
  },
  {
    id: 228,
    quote: "If you buy what you do not need, you will soon be forced to sacrifice what you do need.",
    author: "Warren Buffett",
    category: "finance"
  },
  {
    id: 229,
    quote: "Financial discipline today buys sovereign personal autonomy tomorrow.",
    author: "Charlie Munger",
    category: "finance"
  },
  {
    id: 230,
    quote: "Invest in assets that build your knowledge and security, never in status symbols that drain your capital.",
    author: "Seneca",
    category: "finance"
  },
  {
    id: 231,
    quote: "Contentment with modest needs is the greatest and most enduring wealth.",
    author: "Epicurus",
    category: "finance"
  },
  {
    id: 232,
    quote: "A person with a clear spending plan controls their destiny; an unbudgeted life drifts into debt.",
    author: "George S. Clason",
    category: "finance"
  },
  {
    id: 233,
    quote: "Save first, automate your investments, and build the habit of living on the rest.",
    author: "Ramit Sethi",
    category: "finance"
  },
  {
    id: 234,
    quote: "Status seeking is a tax levied on the insecure and paid directly to the patient.",
    author: "Naval Ravikant",
    category: "finance"
  },
  {
    id: 235,
    quote: "Rule number one of compounding: never lose capital on reckless speculation.",
    author: "Peter Lynch",
    category: "finance"
  },

  // ── 9. TIME UTILIZATION & FOCUS II (236-260) ──
  {
    id: 236,
    quote: "Time is infinitely more valuable than money; you can generate more wealth, but never more time.",
    author: "Jim Rohn",
    category: "time"
  },
  {
    id: 237,
    quote: "It is not that we have a short time to live, but that we squander so much of it on trivia.",
    author: "Seneca",
    category: "time"
  },
  {
    id: 238,
    quote: "The bad news is time flies. The good news is you are the pilot.",
    author: "Michael Altshuler",
    category: "time"
  },
  {
    id: 239,
    quote: "Until you value your own time, nobody else will respect it. Guard your hours fiercely.",
    author: "M. Scott Peck",
    category: "time"
  },
  {
    id: 240,
    quote: "Procrastination is the delusion that tomorrow will offer more energy than today.",
    author: "Tim Urban",
    category: "time"
  },
  {
    id: 241,
    quote: "Guard your calendar with the strict jealousy that a miser guards gold.",
    author: "Seneca",
    category: "time"
  },
  {
    id: 242,
    quote: "A day without focused effort is an irrecoverable portion of your life surrendered.",
    author: "Marcus Aurelius",
    category: "time"
  },
  {
    id: 243,
    quote: "You cannot change how many hours exist in a day; you can only elevate how deeply you use them.",
    author: "Randy Pausch",
    category: "time"
  },
  {
    id: 244,
    quote: "Deep productivity requires ruthlessly cutting low-value tasks and digital distractions.",
    author: "Cal Newport",
    category: "time"
  },
  {
    id: 245,
    quote: "High productivity is never an accident; it is the natural result of disciplined planning.",
    author: "Paul J. Meyer",
    category: "time"
  },
  {
    id: 246,
    quote: "The early morning hours belong to the builders who choose focus over comfort.",
    author: "Robin Sharma",
    category: "time"
  },
  {
    id: 247,
    quote: "Stop acting as if you have ten thousand years left to waste on pointless arguments.",
    author: "Marcus Aurelius",
    category: "time"
  },
  {
    id: 248,
    quote: "Don't count the passing days; make every single day count through deliberate execution.",
    author: "Muhammad Ali",
    category: "time"
  },
  {
    id: 249,
    quote: "Wasting time is not harmless recreation; it is the gradual surrender of your potential.",
    author: "Peter Kreeft",
    category: "time"
  },
  {
    id: 250,
    quote: "Your calendar reveals your true priorities far more accurately than your spoken intentions.",
    author: "James Clear",
    category: "time"
  },
  {
    id: 251,
    quote: "One uninterrupted hour of deep concentration accomplishes more than four hours of fragmented attention.",
    author: "Herbert Simon",
    category: "time"
  },
  {
    id: 252,
    quote: "Saying no to secondary distractions is the only way to say yes to world-class results.",
    author: "Warren Buffett",
    category: "time"
  },
  {
    id: 253,
    quote: "Lost money can be regained by industry; lost knowledge by study; but lost time is gone forever.",
    author: "Samuel Smiles",
    category: "time"
  },
  {
    id: 254,
    quote: "Every morning brings two choices: sleep in with your dreams, or get up and execute for them.",
    author: "Carmelo Anthony",
    category: "time"
  },
  {
    id: 255,
    quote: "Efficiency is doing things right; effectiveness is doing the vital things first.",
    author: "Peter Drucker",
    category: "time"
  },
  {
    id: 256,
    quote: "Eliminate the trivial so that what is truly important has space to flourish.",
    author: "Greg McKeown",
    category: "time"
  },
  {
    id: 257,
    quote: "The trajectory of your future depends completely on how you invest the present hour.",
    author: "Mahatma Gandhi",
    category: "time"
  },
  {
    id: 258,
    quote: "Do not wait for ideal conditions; seize the raw minute and make it purposeful.",
    author: "Napoleon Hill",
    category: "time"
  },
  {
    id: 259,
    quote: "A schedule without whitespace breeds fatigue; a schedule without discipline breeds regret.",
    author: "Oliver Burkeman",
    category: "time"
  },
  {
    id: 260,
    quote: "Treat every hour as an honorable contract between who you are and who you want to become.",
    author: "Epictetus",
    category: "time"
  },

  // ── 10. CHARACTER, INTEGRITY & SELF-DISCIPLINE II (261-285) ──
  {
    id: 261,
    quote: "Character is not built in emergencies; it is forged in daily discipline and merely tested in crisis.",
    author: "John Wooden",
    category: "character"
  },
  {
    id: 262,
    quote: "Mastery over others is strength; mastery over your own impulses is supreme power.",
    author: "Lao Tzu",
    category: "character"
  },
  {
    id: 263,
    quote: "You have power over your own mind, not outside events. Master this, and you become unbreakable.",
    author: "Marcus Aurelius",
    category: "character"
  },
  {
    id: 264,
    quote: "Discipline equals freedom in mental clarity, financial stability, and physical health.",
    author: "Jocko Willink",
    category: "character"
  },
  {
    id: 265,
    quote: "Character is doing what is right when nobody is watching and nobody will ever know.",
    author: "J.C. Watts",
    category: "character"
  },
  {
    id: 266,
    quote: "Waste no more time debating what a person of principle should be. Embody it.",
    author: "Marcus Aurelius",
    category: "character"
  },
  {
    id: 267,
    quote: "The first, greatest, and most necessary victory is the victory over oneself.",
    author: "Plato",
    category: "character"
  },
  {
    id: 268,
    quote: "One who cannot master their emotions and impulses cannot command their destiny.",
    author: "Sun Tzu",
    category: "character"
  },
  {
    id: 269,
    quote: "Integrity is choosing courage over comfort and honoring values over immediate convenience.",
    author: "Brené Brown",
    category: "character"
  },
  {
    id: 270,
    quote: "A person with a clear sense of purpose can endure and overcome almost any difficulty.",
    author: "Friedrich Nietzsche",
    category: "character"
  },
  {
    id: 271,
    quote: "Circumstances do not make the character; they reveal what has already been built inside.",
    author: "James Allen",
    category: "character"
  },
  {
    id: 272,
    quote: "Stand upright on your own two feet, not held upright by the approval of others.",
    author: "Marcus Aurelius",
    category: "character"
  },
  {
    id: 273,
    quote: "Small disciplines executed with quiet consistency compound into monumental character.",
    author: "John C. Maxwell",
    category: "character"
  },
  {
    id: 274,
    quote: "It is not what happens to you, but how you choose to respond that defines your legacy.",
    author: "Epictetus",
    category: "character"
  },
  {
    id: 275,
    quote: "Calm reserve and measured action convey far more strength than reactive speech.",
    author: "Baltasar Gracián",
    category: "character"
  },
  {
    id: 276,
    quote: "Never permit temporary emotional impulses to compromise your long-term moral code.",
    author: "Confucius",
    category: "character"
  },
  {
    id: 277,
    quote: "Humility is not thinking less of your capabilities, but thinking about your ego less.",
    author: "C.S. Lewis",
    category: "character"
  },
  {
    id: 278,
    quote: "The true measure of character is what you would do if you knew you could never be discovered.",
    author: "Thomas Macaulay",
    category: "character"
  },
  {
    id: 279,
    quote: "Endure hardship with dignity and master your desires; here lies indestructible tranquility.",
    author: "Epictetus",
    category: "character"
  },
  {
    id: 280,
    quote: "Strength of character is forged in absolute personal accountability and zero excuses.",
    author: "George Washington",
    category: "character"
  },
  {
    id: 281,
    quote: "Do what you ought to do, when you ought to do it, whether you feel motivated or not.",
    author: "Thomas Huxley",
    category: "character"
  },
  {
    id: 282,
    quote: "A steady soul is never destabilized by cheap criticism or inflated by fleeting praise.",
    author: "Ralph Waldo Emerson",
    category: "character"
  },
  {
    id: 283,
    quote: "The greatest victory over unfair circumstances is refusing to become bitter or corrupt.",
    author: "Marcus Aurelius",
    category: "character"
  },
  {
    id: 284,
    quote: "Keep your commitments to yourself with the same sacred seriousness you keep promises to others.",
    author: "Stephen Covey",
    category: "character"
  },
  {
    id: 285,
    quote: "Live with honor, speak with honesty, and act with steadfast purpose every single day.",
    author: "Viktor Frankl",
    category: "character"
  }
];
