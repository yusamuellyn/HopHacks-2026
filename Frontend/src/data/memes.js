export const MEMES = [
  {
    id: 'tung-tung-tung-sahur',
    name: 'Tung Tung Tung Sahur',
    aliases: ['tung tung', 'sahur', 'tung tung tung'],
    age: '2025',
    origin: 'Italian brainrot / TikTok',
    description:
      'A wooden drum-man who only appears at sahur. Yesterday’s undisputed king of the timeline.',
    yesterdayPopularity: 96,
    color: '#f4c430',
    accent: '#7c2d12',
    sigil: 'drum',
  },
  {
    id: 'skibidi-toilet',
    name: 'Skibidi Toilet',
    aliases: ['skibidi', 'toilet'],
    age: '2023',
    origin: 'YouTube / DaFuq!?Boom!',
    description:
      'Singing toilets that ate the internet. Still dangerous in a crowd, slightly washed in 2026.',
    yesterdayPopularity: 62,
    color: '#5eead4',
    accent: '#134e4a',
    sigil: 'toilet',
  },
  {
    id: 'ohio',
    name: 'Ohio',
    aliases: ['only in ohio', 'ohio meme'],
    age: '2022',
    origin: 'TikTok / US meme belt',
    description:
      'The cursed-state catch-all. Anything unhinged is Ohio. Mid-tier aura, high chaos potential.',
    yesterdayPopularity: 58,
    color: '#fb7185',
    accent: '#9f1239',
    sigil: 'ohio',
  },
  {
    id: 'sixty-seven',
    name: '67',
    aliases: ['6-7', 'six seven', '6 7'],
    age: '2025',
    origin: 'Slang / schoolyard / TikTok',
    description:
      'A number that became a whole personality. Lowkey yesterday. Looks tired. Hits different at 67 HP.',
    yesterdayPopularity: 18,
    color: '#a3e635',
    accent: '#3f6212',
    sigil: '67',
  },
  {
    id: 'tralalero-tralala',
    name: 'Tralalero Tralala',
    aliases: ['tralalero', 'tralala'],
    age: '2025',
    origin: 'Italian brainrot',
    description:
      'Shark in sneakers. Nonsense that somehow became a religion. Still has fight left.',
    yesterdayPopularity: 74,
    color: '#38bdf8',
    accent: '#0c4a6e',
    sigil: 'shark',
  },
  {
    id: 'bombardino-crocodilo',
    name: 'Bombardino Crocodilo',
    aliases: ['bombardino', 'crocodilo', 'crocodile bomber'],
    age: '2025',
    origin: 'Italian brainrot',
    description:
      'Crocodile fused with a bomber plane. Loud, unwell, and here to take the belt.',
    yesterdayPopularity: 71,
    color: '#86efac',
    accent: '#14532d',
    sigil: 'croc',
  },
  {
    id: 'labubu',
    name: 'Labubu',
    aliases: ['labubus', 'pop mart'],
    age: '2024',
    origin: 'Pop Mart / Lisa / collector culture',
    description:
      'Fanged plush demon that escaped toy shelves into real life. Cute until it isn’t.',
    yesterdayPopularity: 81,
    color: '#f9a8d4',
    accent: '#9d174d',
    sigil: 'labubu',
  },
  {
    id: 'chill-guy',
    name: 'Chill Guy',
    aliases: ['just a chill guy', 'chillguy'],
    age: '2024',
    origin: 'X / gray dog meme',
    description:
      'The gray dog who is unbothered. Low damage, high defense. Might nap mid-battle.',
    yesterdayPopularity: 44,
    color: '#94a3b8',
    accent: '#334155',
    sigil: 'chill',
  },
  {
    id: 'rizz',
    name: 'Rizz',
    aliases: ['unspoken rizz', 'rizzler'],
    age: '2022',
    origin: 'Twitch / Kai Cenat / slang',
    description:
      'Charisma as a combat stat. Older meme, still throws game if the crowd believes.',
    yesterdayPopularity: 39,
    color: '#c084fc',
    accent: '#6b21a8',
    sigil: 'rizz',
  },
  {
    id: 'sigma',
    name: 'Sigma',
    aliases: ['sigma male', 'what the sigma'],
    age: '2021',
    origin: 'Manosphere parody / TikTok',
    description:
      'The grindset ghost. Washed as a lifestyle, lethal as irony. Stares through the camera.',
    yesterdayPopularity: 33,
    color: '#e5e7eb',
    accent: '#111827',
    sigil: 'sigma',
  },
  {
    id: 'gyatt',
    name: 'Gyatt',
    aliases: ['gyat', 'gyatt damn'],
    age: '2023',
    origin: 'Twitch / streaming slang',
    description:
      'A reaction that became a noun. High burst, no stamina. Comes in loud then disappears.',
    yesterdayPopularity: 28,
    color: '#fb923c',
    accent: '#9a3412',
    sigil: 'gyatt',
  },
  {
    id: 'fanum-tax',
    name: 'Fanum Tax',
    aliases: ['fanum', 'tax'],
    age: '2023',
    origin: 'AMP / Fanum / food-stealing bit',
    description:
      'The friend who takes a cut of your fries. Economy-based fighter. Steals mentions mid-combo.',
    yesterdayPopularity: 24,
    color: '#facc15',
    accent: '#854d0e',
    sigil: 'tax',
  },
  {
    id: 'very-demure',
    name: 'Very Demure',
    aliases: ['demure', 'mindful', 'very mindful'],
    age: '2024',
    origin: 'TikTok / Jools Lebron',
    description:
      'Soft voice, lethal poise. Wins by looking unbothered while the bar drains you.',
    yesterdayPopularity: 41,
    color: '#fda4af',
    accent: '#881337',
    sigil: 'demure',
  },
  {
    id: 'brat',
    name: 'Brat',
    aliases: ['bratsummer', 'charli xcx'],
    age: '2024',
    origin: 'Charli XCX / lime-green summer',
    description:
      'Lime-green chaos. Yesterday it was a whole season. Today it still has a mean right hook.',
    yesterdayPopularity: 47,
    color: '#c6ff4a',
    accent: '#365314',
    sigil: 'brat',
  },
]

export function searchMemes(query) {
  const q = query.trim().toLowerCase()
  if (!q) return MEMES
  return MEMES.filter((meme) => {
    const hay = `${meme.name} ${meme.aliases.join(' ')} ${meme.origin}`.toLowerCase()
    return hay.includes(q)
  })
}

export function getMemeById(id) {
  return MEMES.find((meme) => meme.id === id) ?? null
}
