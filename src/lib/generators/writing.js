'use strict';

const { sample } = require('./rng');

const PROMPTS = {
  opinion: {
    low: ['What is the best pet to have? Tell why.', 'Which is better, summer or winter? Give two reasons.', 'What is your favorite food? Tell why you like it.', 'Should kids have recess every day? Tell why.', 'What is the best game to play? Give reasons.', 'Which season do you like best? Tell why.'],
    high: ['Should students have homework every night? State your opinion and give reasons.', 'What is the most important rule at school? Support your opinion with reasons.', 'Should every school have a garden? Explain your opinion with facts and reasons.', 'Is it better to read a book or watch a movie? Support your choice.', 'What would make your school a better place? Give reasons for your idea.', 'Should kids be allowed to choose their own bedtime? Explain your thinking.'],
  },
  informative: {
    low: ['Tell about your favorite animal. Write three facts.', 'Explain how to make a sandwich. Use first, next, last.', 'Tell about a place in your community.', 'Write about something you learned this week.', 'Tell how to brush your teeth. Use steps.', 'Describe your favorite season. Write facts about it.'],
    high: ['Explain how to do something you are good at. Use clear steps and details.', 'Write about an animal. Include facts, details and a closing sentence.', 'Explain why the water cycle is important.', 'Write about a person who helps your community. Use facts and details.', 'Explain how plants grow. Use words that tell the order.', 'Choose a place in South Carolina and write an informative paragraph about it.'],
  },
  narrative: {
    low: ['Write about a fun day. What happened first, next, and last?', 'Tell a story about a lost toy.', 'Write about a time you helped someone.', 'Tell a story about a day at the beach.', 'Write about a surprise.', 'Tell a story about an animal that can talk.'],
    high: ['Write a story about finding a mysterious door. Include a beginning, middle and end.', 'Tell about a time you felt brave. Use details about what you thought and felt.', 'Write a story where the main character solves a problem.', 'Imagine you could spend one day as an animal. Tell what happens.', 'Write a story that begins with, "I could not believe my eyes."', 'Tell a story about a trip you will never forget.'],
  },
};

const TYPES = ['opinion', 'informative', 'narrative'];

function writing(rng, { type = 'opinion', grade = 1, count = 3, lines = 8 }) {
  const band = grade <= 2 ? 'low' : 'high';
  return { prompts: sample(rng, PROMPTS[type][band], count), lines, lineStyle: grade <= 2 ? 'primary' : 'wide' };
}

module.exports = { writing, TYPES, PROMPTS };
