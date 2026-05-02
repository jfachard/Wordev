export const CURATED_WORDS = {
  // === 4 LETTERS ===
  4: [
    // Git / workflow
    'FORK',
    'PULL',
    'PUSH',
    'HEAD',
    'DIFF',
    // Langages / runtimes
    'RUST',
    'PERL',
    'JAVA',
    'BASH',
    'YAML',
    'JSON',
    'HTML',
    'SASS',
    // Concepts
    'BYTE',
    'BOOL',
    'ENUM',
    'LOOP',
    'NULL',
    'VOID',
    'TRUE',
    'HEAP',
    // Réseau / Unix
    'PING',
    'GREP',
    'CURL',
    'PORT',
    'HOST',
    'LINK',
    'NODE',
    'ROOT',
    'ROOT',
    'UNIX',
    'DISK',
    'FILE',
    'PATH',
    // Data
    'HASH',
    'TREE',
    'LIST',
    'POST',
    // Autres
    'CRON',
    'FLAG',
    'LOCK',
    'PIPE',
    'SHELL',
  ],

  // === 5 LETTERS ===
  5: [
    // Langages / frameworks
    'REACT',
    'REDUX',
    'SWIFT',
    'LINUX',
    'REDIS',
    'NGINX',
    'SCALA',
    // Git / workflow
    'MERGE',
    'CLONE',
    'STASH',
    'BLAME',
    'PATCH',
    // Concepts fondamentaux
    'ARRAY',
    'STACK',
    'QUEUE',
    'CACHE',
    'CLASS',
    'CONST',
    'FLOAT',
    'BUILD',
    'DEBUG',
    'FETCH',
    'PARSE',
    'SLICE',
    'QUERY',
    'PROXY',
    // Async / concurrence
    'ASYNC',
    'AWAIT',
    'MUTEX',
    'ATOMIC',
    // Réseau / sécurité
    'TOKEN',
    'BEARS',
    'HTTPS',
    // Data
    'BYTES',
    'MODEL',
    'INDEX',
    'TABLE',
    'UNION',
    // Erreurs / debug
    'THROW',
    'CATCH',
    'TRACE',
    'PANIC',
    // Hardware / OS
    'PIXEL',
    'CHIPS',
    // Autres
    'REGEX',
    'SCOPE',
    'SHELL',
    'SLEEP',
    'CHMOD',
  ],

  // === 6 LETTERS ===
  6: [
    // Git
    'COMMIT',
    'BRANCH',
    'REBASE',
    'REMOTE',
    'ORIGIN',
    // Concepts
    'LAMBDA',
    'OBJECT',
    'STRING',
    'STRUCT',
    'VECTOR',
    'TUPLE',
    'BINARY',
    'BUCKET',
    'CURSOR',
    'MODULE',
    'METHOD',
    'SCHEMA',
    // Async / concurrence
    'THREAD',
    'FUTURE',
    'SIGNAL',
    // Réseau
    'PACKET',
    'ROUTER',
    'SOCKET',
    'SERVER',
    'CLIENT',
    'COOKIE',
    // Outils / écosystème
    'DOCKER',
    'GITHUB',
    'GITLAB',
    'DEVOPS',
    // OS / système
    'KERNEL',
    'DAEMON',
    'BUFFER',
    'SYNTAX',
    'SCRIPT',
    'BACKUP',
    // Debug
    'LOGGER',
    'LINKER',
    'ESCAPE',
    // Data
    'RECORD',
    'FILTER',
    'REDUCE',
  ],

  // === 7 LETTERS ===
  7: [
    'PROGRAM',
    'COMPILE',
    'EXECUTE',
    'CONSOLE',
    'COMMAND',
    'BOOLEAN',
    'INTEGER',
    'DECIMAL',
    'PAYLOAD',
    'REQUEST',
    'REFRESH',
    'REPLACE',
    'DEFAULT',
    'CONTEXT',
    'PRIVATE',
    'FOREACH',
    'LISTENER',
    'PACKAGE',
    'VERSION',
    'RELEASE',
    'GRADLE',
    'WEBPACK',
    'ROUTING',
    'BACKEND',
  ],

  // === 8 LETTERS ===
  8: [
    'FUNCTION',
    'VARIABLE',
    'DATABASE',
    'FRONTEND',
    'TERMINAL',
    'KEYBOARD',
    'SNAPSHOT',
    'REGISTRY',
    'SEGFAULT',
    'PIPELINE',
    'CALLBACK',
    'INSTANCE',
    'RESPONSE',
    'ITERATOR',
    'DOCUMENT',
    'SECURITY',
    'ENCODING',
    'FIREWALL',
    'POINTERS',
  ],

  // === 9 LETTERS ===
  9: [
    'ALGORITHM',
    'INTERFACE',
    'COMPONENT',
    'RECURSION',
    'PARAMETER',
    'EXCEPTION',
    'FRAMEWORK',
    'MIDDLEWARE',
    'NAMESPACE',
    'REPOSITORY',
    'DEPLOYMENT',
    'PROTOCOL',
  ],

  // === 10 LETTERS ===
  10: [
    'TYPESCRIPT',
    'JAVASCRIPT',
    'PARAMETERS',
    'PROGRAMMING',
    'ENCRYPTION',
    'COMPILATION',
    'INHERITANCE',
    'REFACTORING',
    'MIGRATIONS',
    'CONTROLLER',
  ],
} as const;

export function getFlatCuratedWords(): { word: string; length: number }[] {
  const flat: { word: string; length: number }[] = [];

  for (const [lengthKey, words] of Object.entries(CURATED_WORDS)) {
    const expectedLength = Number(lengthKey);

    for (const word of words) {
      if (word.length !== expectedLength) {
        console.warn(
          `The word “${word}” is misclassified: it is in the ${expectedLength} bucket, but its actual length is ${word.length}`,
        );
        continue;
      }
      flat.push({ word, length: word.length });
    }
  }

  const unique = Array.from(new Map(flat.map((w) => [w.word, w])).values());

  return unique;
}
