// START HERE: edit titles, instructions and optional timerSeconds.
// Keep titles <= 30 characters and instructions <= 110 for the glasses layout.
// Use unique lowercase ids. timerSeconds: 0 means no timer; maximum 3600.
// These bundled examples are editable prompts, not automatic doneness checks.
export const recipes = [
  {
    id: 'coffee',
    title: 'Pour-over coffee',
    summary: '1 cup · 15 g coffee · 250 ml water',
    steps: [
      { title: 'Prepare', instruction: 'Rinse filter. Add 15 g coffee. Set a cup below.', timerSeconds: 0 },
      { title: 'Bloom', instruction: 'Add 40 ml hot water. Let it bloom for 30 sec.', timerSeconds: 30 },
      { title: 'Pour slowly', instruction: 'Add water to 250 ml. Let it drain at its own pace.', timerSeconds: 90 },
      { title: 'Serve', instruction: 'Remove dripper. Let coffee cool before drinking.', timerSeconds: 0 }
    ]
  },
  {
    id: 'pasta',
    title: 'Tomato pasta',
    summary: '1 serving · 100 g pasta · 150 g sauce',
    steps: [
      { title: 'Prepare', instruction: 'Boil water. Set out 100 g pasta and 150 g sauce.', timerSeconds: 0 },
      { title: 'Warm the sauce', instruction: 'Warm sauce gently and stir. Try a 2-minute timer.', timerSeconds: 120 },
      { title: 'Cook the pasta', instruction: 'Boil pasta. Follow packet timing; 8 min is a sample.', timerSeconds: 480 },
      { title: 'Combine and serve', instruction: 'Drain the pasta. Mix with warm sauce and serve.', timerSeconds: 0 }
    ]
  }
];
