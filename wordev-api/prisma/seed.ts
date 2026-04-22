import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { getFlatCuratedWords } from './curated-word';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const WORDLE_LIST_URL =
  'https://raw.githubusercontent.com/tabatkins/wordle-list/main/words';

async function fetchWordleList(): Promise<{ word: string; length: number }[]> {
  const response = await fetch(WORDLE_LIST_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch Wordle list: ${response.status}`);
  }

  const text = await response.text();

  const words = text
    .trim()
    .split('\n')
    .map((w) => w.trim().toUpperCase())
    .filter((w) => /^[A-Z]+$/.test(w))
    .filter((w) => w.length === 5);

  const unique = [...new Set(words)];

  return unique.map((word) => ({ word, length: word.length }));
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

  const wordleWords = await fetchWordleList();

  const wordleData = wordleWords.map((w) => ({ ...w, isAnswer: false }));
  const wordleInserted = await insertInChunks(wordleData);

  const curated = getFlatCuratedWords();

  let curatedCreated = 0;
  let curatedUpdated = 0;

  for (const { word, length } of curated) {
    const result = await prisma.word.upsert({
      where: { word },
      create: { word, length, isAnswer: true },
      update: { isAnswer: true },
    });
  }

  const totalAnswers = await prisma.word.count({ where: { isAnswer: true } });

  const total = await prisma.word.count();

  const distribution = await prisma.word.groupBy({
    by: ['length'],
    where: { isAnswer: true },
    _count: true,
    orderBy: { length: 'asc' },
  });

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
