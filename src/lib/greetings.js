'use strict';

// Cheeky pep talks shown under "Hey, <name>!" after sign-in. `spicy` ones use mild swearing (damn, hell, ass, bitch).
// GREETING_LEVEL=spicy (default) uses everything, "mild" uses only the clean ones, "off" shows none.
const G = (text, spicy = false) => ({ text, spicy });

const GREETINGS = [
  G('Make this day your bitch!', true),
  G('Go kick some educational ass today.', true),
  G("You're a damn good teacher. Don't let anyone tell you otherwise.", true),
  G('Give them hell today. Educational hell. With stickers.', true),
  G('Today you will hold it together like the badass you are.', true),
  G("Don't let Monday be a bitch to you. Be Monday's boss.", true),
  G('Hell yeah, it’s worksheet day!', true),
  G('Damn, you look like someone who has all the answers. Or at least the answer key.', true),
  G("You didn't come this far to only come this far. Go raise some hell.", true),
  G('Your mission: inspire 25 tiny humans before lunch. No pressure, ass-kicker.', true),
  G("Crush it today so Future You can sit on the couch with a snack and zero damns to give.", true),
  G('Be the teacher your students will brag about to their therapist, in a good way.'),
  G("Today's forecast: 100% chance of absolutely crushing it."),
  G('Coffee first, then world domination. Maybe in that order.'),
  G("Kids are tiny chaos goblins. You've got this."),
  G('Teach like nobody is grading you. (Nobody is. The kids are.)'),
  G('Another day, another chance to be a legend in a lanyard.'),
  G('Photocopier jams are temporary. Your greatness is forever.'),
  G('Fortune favors the bold and the people who brought extra markers.'),
  G('Be so good the substitute leaves a note that just says "WOW."'),
  G('Life is short. Make bold choices and laminate everything.'),
  G('Hold the line. Hold the stapler.'),
  G("You're not “just” a teacher. You're a superhero with a lanyard."),
  G('Dream big, print small, and never trust the break-room coffee.'),
  G("Smile. They can smell fear, but they respect swagger."),
  G('Sweet mother of math, you are good at this.'),
  G('Plot twist: today you are the main character.'),
  G('Fun fact: 100% of students who learned something today had a teacher. That is you.'),
];

function pick(level = 'spicy', rng = Math.random) {
  if (level === 'off') return null;
  const pool = level === 'mild' ? GREETINGS.filter((g) => !g.spicy) : GREETINGS;
  return pool[Math.floor(rng() * pool.length)].text;
}

module.exports = { pick, GREETINGS };
