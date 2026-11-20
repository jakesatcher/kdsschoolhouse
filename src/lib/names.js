'use strict';

// Character names for stories and word problems: 100 boy names and 100 girl names drawn from many cultures and
// communities. The original six characters (Zach, AC, Screech, Kelly, Lisa, Jessie) are in the banks.
// Names are plain letters, so they print the same everywhere and match easily in tests.
const BOYS = [
  // original characters
  'Zach', 'AC', 'Screech',
  // English, Irish and other European
  'Liam', 'Noah', 'Ethan', 'Jack', 'Owen', 'Caleb', 'Henry', 'Sean', 'Patrick', 'Connor', 'Stefan', 'Anders', 'Lars', 'Dmitri', 'Ivan', 'Nikolai', 'Pavel', 'Tomas', 'Luka',
  'Marco', 'Giovanni', 'Angelo', 'Leo', 'Theo', 'Nico', 'Elias',
  // Hispanic and Latino
  'Mateo', 'Carlos', 'Diego', 'Luis', 'Miguel', 'Javier', 'Santiago', 'Rafael', 'Joaquin',
  // Black American and African
  'Andre', 'Marcus', 'Jamal', 'Darius', 'DeShawn', 'Malik', 'Terrell', 'Isaiah', 'Elijah', 'Jayden', 'Tyrone', 'Kofi', 'Kwame', 'Tunde', 'Chidi', 'Emeka', 'Jabari', 'Amani', 'Sekou',
  // Arabic and Muslim communities
  'Omar', 'Ahmed', 'Ali', 'Yusuf', 'Hassan', 'Ibrahim', 'Khalid', 'Amir', 'Mustafa', 'Hamza', 'Zayn',
  // South Asian
  'Rahul', 'Arjun', 'Aarav', 'Vikram', 'Rohan', 'Dev', 'Ravi', 'Imran',
  // East and Southeast Asian
  'Kenji', 'Hiro', 'Takeshi', 'Haruto', 'Wei', 'Jun', 'Chen', 'Minh', 'Hung', 'Tuan', 'Sung', 'Jin', 'Joon',
  // Jewish
  'Yosef', 'Eitan', 'Noam', 'Dov',
  // Pacific Islander and Native American
  'Kai', 'Keanu', 'Manu', 'Tane', 'Sione', 'Takoda', 'Chayton',
];
const GIRLS = [
  // original characters
  'Kelly', 'Lisa', 'Jessie',
  // English, Irish and other European
  'Emma', 'Olivia', 'Ava', 'Mia', 'Chloe', 'Grace', 'Lily', 'Amelia', 'Tessa', 'Iris', 'Ruth', 'Maeve', 'Siobhan', 'Niamh', 'Bridget', 'Freya', 'Ingrid', 'Anya', 'Katya', 'Natasha', 'Irina',
  'Marta', 'Zofia', 'Giulia', 'Gianna', 'Chiara', 'Eleni', 'Zoe',
  // Hispanic and Latino
  'Sofia', 'Isabella', 'Valentina', 'Camila', 'Lucia', 'Carmen', 'Rosa', 'Elena', 'Ximena', 'Daniela', 'Nayeli',
  // Black American and African
  'Aaliyah', 'Imani', 'Nia', 'Jada', 'Keisha', 'Tamika', 'Destiny', 'Zuri', 'Amara', 'Ayana', 'Folake', 'Ngozi', 'Adaeze', 'Abena', 'Ama', 'Nala',
  // Arabic and Muslim communities
  'Fatima', 'Aisha', 'Layla', 'Yasmin', 'Zainab', 'Noor', 'Mariam', 'Leila', 'Samira',
  // South Asian
  'Priya', 'Anika', 'Ananya', 'Diya', 'Meera', 'Kavya', 'Sana', 'Riya', 'Anjali',
  // East and Southeast Asian
  'Mei', 'Lin', 'Yuki', 'Sakura', 'Hana', 'Aiko', 'Mika', 'Jiwoo', 'Soo', 'Linh', 'Mai', 'Thao',
  // Jewish
  'Naomi', 'Miriam', 'Talia', 'Dalia', 'Yael',
  // Pacific Islander and Native American
  'Lani', 'Malia', 'Leilani', 'Noelani', 'Tala', 'Aponi', 'Kaya',
];

const GENDER = {};
BOYS.forEach((n) => { GENDER[n] = 'm'; });
GIRLS.forEach((n) => { GENDER[n] = 'f'; });
const ALL = [...BOYS, ...GIRLS];

// Names already used on the sheet being built, so one worksheet does not repeat a name until the banks run low.
// Cleared at the start of every sheet, so the same seed always gives the same sheet.
const used = new Set();
const resetSheet = () => used.clear();

// n distinct names (random mix of boys and girls) from the banks, never repeating one already used on this sheet
function pickNames(rng, n = 3) {
  const out = [];
  while (out.length < n) {
    let pool = ALL.filter((x) => !used.has(x) && !out.includes(x));
    if (!pool.length) { used.clear(); pool = ALL.filter((x) => !out.includes(x)); }
    const name = pool[Math.floor(rng() * pool.length)];
    out.push(name); used.add(name);
  }
  return out;
}
// A few names with their gender, for prompts that ask the AI to write the story itself
function promptNames(rng, boys = 4, girls = 4) {
  const take = (list, k) => { const copy = [...list]; const out = []; while (out.length < k && copy.length) out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]); return out; };
  return { boys: take(BOYS, boys), girls: take(GIRLS, girls) };
}

module.exports = { BOYS, GIRLS, ALL, GENDER, pickNames, promptNames, resetSheet };
