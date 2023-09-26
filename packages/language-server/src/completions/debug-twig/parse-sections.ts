import { TwigDebugInfo } from './types';

const sectionLineRegex: Record<keyof TwigDebugInfo, RegExp> = {
  Filters: /^\* (?<identifier>[a-zA-Z_][a-zA-Z0-9_]*)(?:\((?<args>[^)]*)\))?/,
  Functions: /^\* (?<identifier>[a-zA-Z_][a-zA-Z0-9_]*)\((?<args>[^)]*)\)/,
  Globals: /^\* (?<identifier>[a-zA-Z_][a-zA-Z0-9_]*) = (?<args>.+)/,
  Tests: /^\* (?<identifier>[a-z ]+)/,
};

const headerRegex = /^([A-Za-z ]+)$/;


export const parseSections = (input: string): TwigDebugInfo => {
  const sections: TwigDebugInfo = {
    Filters: [],
    Functions: [],
    Globals: [],
    Tests: [],
  };

  const sectionNames = Object.keys(sections);

  let currentSectionName: keyof TwigDebugInfo | '' = '';

  const lines = input.split('\n').map((line) => line.trim());

  for (const line of lines) {
    const sectionHeaderMatch = line.match(headerRegex);
    if (sectionHeaderMatch) {
      currentSectionName = sectionHeaderMatch[1].trim() as keyof TwigDebugInfo;
      sections[currentSectionName] = [];
      continue;
    }

    if (!currentSectionName || !sectionNames.includes(currentSectionName)) {
      continue;
    }

    const sectionLineMatch = line.match(sectionLineRegex[currentSectionName]);
    if (!sectionLineMatch) {
      continue;
    }

    const { identifier, args } = sectionLineMatch.groups!;

    if (currentSectionName === 'Globals') {
      sections[currentSectionName].push({
        identifier,
        value: args,
      });

      continue;
    }

    if (currentSectionName === 'Tests') {
      sections[currentSectionName].push(identifier);
      continue;
    }

    const argsArr = (args || '').split(',')
      .map((arg) => {
        const [identifier, defaultValue] = arg.trim().split('=');
        return {
          identifier,
          defaultValue,
        };
      });

    sections[currentSectionName].push({
      identifier,
      arguments: argsArr,
    });
  }

  return sections;
};
