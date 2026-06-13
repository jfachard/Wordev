import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { getFlatCuratedWords } from './curated-word';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ENGLISH_WORDS_URL =
  'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt';

const GUESS_MIN_LEN = 4;
const GUESS_MAX_LEN = 10;

const CORPORA_BASE =
  'https://raw.githubusercontent.com/dariusk/corpora/master/data/technology';

const CORPORA_FILES = [
  'computer_sciences.json',
  'programming_languages.json',
  'programming_languages_popular.json',
  'new_technologies.json',
];

async function fetchEnglishGuessWords(): Promise<
  { word: string; length: number }[]
> {
  const response = await fetch(ENGLISH_WORDS_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch English dictionary: ${response.status}`);
  }

  const unique = new Set<string>();

  for (const line of (await response.text()).split('\n')) {
    const word = line.trim().toUpperCase();
    if (!/^[A-Z]+$/.test(word)) continue;
    if (word.length < GUESS_MIN_LEN || word.length > GUESS_MAX_LEN) continue;
    unique.add(word);
  }

  return [...unique].map((word) => ({ word, length: word.length }));
}

// corpora files come in two shapes: a raw string[] or an object whose first
// array-valued property holds the words. This grabs the words either way.
function extractStrings(json: unknown): string[] {
  if (Array.isArray(json)) {
    return json.filter((x): x is string => typeof x === 'string');
  }
  if (json && typeof json === 'object') {
    for (const value of Object.values(json)) {
      if (Array.isArray(value)) {
        return value.filter((x): x is string => typeof x === 'string');
      }
    }
  }
  return [];
}

async function fetchCorporaTechWords(): Promise<
  { word: string; length: number }[]
> {
  const unique = new Set<string>();

  for (const file of CORPORA_FILES) {
    try {
      const res = await fetch(`${CORPORA_BASE}/${file}`);
      if (!res.ok) {
        console.warn(`⚠️  Skipping corpora ${file}: HTTP ${res.status}`);
        continue;
      }

      const words = extractStrings(await res.json())
        .map((w) => w.trim().toUpperCase())
        .filter((w) => /^[A-Z]+$/.test(w))
        .filter(
          (w) => w.length >= GUESS_MIN_LEN && w.length <= GUESS_MAX_LEN,
        );

      words.forEach((w) => unique.add(w));
    } catch (e) {
      console.warn(`⚠️  Skipping corpora ${file}:`, (e as Error).message);
    }
  }

  return [...unique].map((word) => ({ word, length: word.length }));
}

async function insertInChunks(
  words: { word: string; length: number; isAnswer: boolean }[],
  chunkSize = 500,
) {
  let totalInserted = 0;

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize);
    const result = await prisma.word.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    totalInserted += result.count;
  }

  return totalInserted;
}

async function main() {
  await prisma.$executeRaw`TRUNCATE TABLE "DailyWord", "Word" RESTART IDENTITY CASCADE`;

  const englishWords = await fetchEnglishGuessWords();
  const englishData = englishWords.map((w) => ({ ...w, isAnswer: false }));
  const englishInserted = await insertInChunks(englishData);
  console.log(
    `✅ English dictionary guesses inserted: ${englishInserted} (from ${englishWords.length} fetched)`,
  );

  const corporaWords = await fetchCorporaTechWords();
  const corporaData = corporaWords.map((w) => ({ ...w, isAnswer: false }));
  const corporaInserted = await insertInChunks(corporaData);
  console.log(
    `✅ Corpora tech guesses inserted: ${corporaInserted} (from ${corporaWords.length} fetched)`,
  );

  const curated = getFlatCuratedWords();

  for (const { word, length } of curated) {
    await prisma.word.upsert({
      where: { word },
      create: { word, length, isAnswer: true },
      update: { isAnswer: true },
    });
  }

  const total = await prisma.word.count();
  const totalAnswers = await prisma.word.count({ where: { isAnswer: true } });
  console.log(`✅ Curated answers upserted: ${curated.length}`);
  console.log(`📊 Total: ${total} words (${totalAnswers} answers)`);

  const distribution = await prisma.word.groupBy({
    by: ['length'],
    where: { isAnswer: true },
    _count: true,
    orderBy: { length: 'asc' },
  });

  console.log('Answer distribution:');
  distribution.forEach((d) => {
    console.log(`   ${d.length} letters : ${d._count} words`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
