import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client.ts';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type DatamuseWord = { word: string; score: number; tags?: string[] };

const QUERIES = [
  'https://api.datamuse.com/words?ml=programming&max=1000',
  'https://api.datamuse.com/words?ml=software&max=1000',
  'https://api.datamuse.com/words?ml=algorithm&max=1000',
  'https://api.datamuse.com/words?topics=technology&max=1000',
  'https://api.datamuse.com/words?rel_trg=code&max=1000',
  'https://api.datamuse.com/words?rel_trg=javascript&max=1000',
];

const BLACKLIST = new Set([
  'THE',
  'AND',
  'FOR',
  'WITH',
  'THIS',
  'THAT',
  'FROM',
  'HAVE',
  'ARE',
]);

async function fetchWords(): Promise<string[]> {
  const results = await Promise.all(
    QUERIES.map((url) =>
      fetch(url).then((r) => r.json() as Promise<DatamuseWord[]>),
    ),
  );

  const words = results
    .flat()
    .map((w) => w.word.toUpperCase())
    .filter((w) => /^[A-Z]+$/.test(w))
    .filter((w) => w.length >= 3 && w.length <= 12)
    .filter((w) => !BLACKLIST.has(w));

  return [...new Set(words)];
}

async function main() {
  const words = await fetchWords();
  console.log(`${words.length} unique words retrieved`);

  const result = await prisma.word.createMany({
    data: words.map((word) => ({ word })),
    skipDuplicates: true,
  });

  console.log(`✅ ${result.count} inserted words (duplicates ignored)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
