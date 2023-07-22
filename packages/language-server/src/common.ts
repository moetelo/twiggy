import {
  MarkupKind,
  SignatureInformation,
  ParameterInformation,
} from 'vscode-languageserver';

export const globalVariables = [
  {
    label: `_self`,
    documentation: 'References the current template name',
  },
  {
    label: `_context`,
    documentation: 'References the current context',
  },
  {
    label: `_charset`,
    documentation: 'References the current charset',
  },
];

type twigFunction = {
  name: string;
  documentation: string[];
  parameters: ParameterInformation[];
  return: string;
};

const twigFunctions: twigFunction[] = [
  {
    name: 'max',
    documentation: [
      'Returns the biggest value of a sequence or a set of values:',
      '```twig',
      '{{ max(1, 3, 2) }}',
      '{{ max([1, 3, 2]) }}',
      '```',
      'When called with a mapping, max ignores keys and only compares values:',
      '```twig',
      '{{ max({2: "e", 1: "a", 3: "b", 5: "d", 4: "c"}) }}',
      '{# returns "e" #}',
      '```',
    ],
    parameters: [
      {
        label: 'mixed ...$values',
        documentation: 'Any comparable values.',
      },
    ],
    return: 'mixed',
  },
  {
    name: 'min',
    documentation: [
      'Returns the lowest value of a sequence or a set of values',
      '```twig',
      '{{ min(1, 3, 2) }}',
      '{{ min([1, 3, 2]) }}',
      '```',
      'When called with a mapping, min ignores keys and only compares values:',
      '```twig',
      '{{ min({2: "e", 3: "a", 1: "b", 5: "d", 4: "c"}) }}',
      '{# returns "a" #}',
      '```',
    ],
    parameters: [
      {
        label: 'mixed ...$values',
        documentation: 'Any comparable values.',
      },
    ],
    return: 'mixed',
  },
  {
    name: 'date',
    documentation: [
      'Converts an input to a DateTime instance.',
      '```twig',
      "{% if date(user.created_at) < date('+2days') %}",
      '  {# do something #}',
      '{% endif %}',
      '```',
    ],
    parameters: [
      {
        label: '\\DateTimeInterface|string|null $date = null',
        documentation: 'A date or null to use the current time',
      },
      {
        label: '\\DateTimeZone|string|false|null $timezone = null',
        documentation:
          'The target timezone, null to use the default, false to leave unchanged',
      },
    ],
    return: '\\DateTimeInterface',
  },
];

export const twigFunctionsSignatureInformation = new Map<
  string,
  SignatureInformation
>(
  twigFunctions.map((item) => {
    const params = item.parameters.map((item) => item.label).join(', ');

    return [
      item.name,
      {
        label: `${item.name}(${params}): ${item.return}`,
        documentation: {
          kind: MarkupKind.Markdown,
          value: item.documentation.join('\n'),
        },
        parameters: item.parameters,
      },
    ];
  })
);
