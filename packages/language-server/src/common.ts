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
  documentation?: string[];
  parameters?: ParameterInformation[];
  return?: string;
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
    name: 'range',
    documentation: [
      'Returns a list containing an arithmetic progression of integers:',
      '```twig',
      '{% for i in range(0, 3) %}',
      '    {{ i }},',
      '{% endfor %}',
      '```',
    ],
    parameters: [
      {
        label: 'int $low',
        documentation: 'The first value of the sequence.',
      },
      {
        label: 'int $high',
        documentation: 'The highest possible value of the sequence.',
      },
      {
        label: 'int $step = 1',
        documentation: 'The increment between elements of the sequence.',
      },
    ],
    return: 'array',
  },
  {
    name: 'constant',
    documentation: [
      'Provides the ability to get constants from instances as well as class/global constants.',
    ],
    parameters: [
      {
        label: 'string $constant',
        documentation: 'The name of the constant',
      },
      {
        label: 'object|null $object = null',
        documentation: 'The object to get the constant from',
      },
    ],
    return: 'string',
  },
  {
    name: 'cycle',
    documentation: ['Cycles over a value.'],
    parameters: [
      {
        label: '\\ArrayAccess|array $values',
      },
      {
        label: 'int $position',
        documentation: 'The object to get the constant from',
      },
    ],
    return: 'string',
  },
  {
    name: 'random',
    documentation: [
      'Returns a random value depending on the supplied parameter type:',
      '- a random item from a \\Traversable or array',
      '- a random character from a string',
      '- a random integer between 0 and the integer parameter.',
    ],
    parameters: [
      {
        label: '\\Traversable|array|int|float|string $values = null',
        documentation: 'The values to pick a random item from',
      },
      {
        label: 'int|null $max = null',
        documentation: 'Maximum value used when $values is an int',
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
  {
    name: 'dump',
    documentation: [
      'The dump function dumps information about a template variable. This is mostly useful to debug a template that does not behave as expected by introspecting its variables:',
      '```twig',
      '{{ dump(user) }}',
      '```',
    ],
    parameters: [
      {
        label: 'mixed $context',
        documentation: 'The context to dump',
      },
    ],
  },
  {
    name: 'include',
    documentation: ['Renders a template.'],
    parameters: [
      {
        label: 'array $context',
      },
      {
        label: 'string|array $template',
        documentation:
          'The template to render or an array of templates to try consecutively',
      },
      {
        label: 'array $variables',
        documentation: 'The variables to pass to the template',
      },
      {
        label: 'bool $withContext',
      },
      {
        label: 'bool $ignoreMissing',
        documentation: 'Whether to ignore missing templates or not',
      },
      {
        label: 'bool $sandboxed',
        documentation: 'Whether to sandbox the template or not',
      },
    ],
    return: 'string',
  },
  {
    name: 'source',
    documentation: ['Returns a template content without rendering it.'],
    parameters: [
      {
        label: 'string $name',
        documentation: 'The template name',
      },
      {
        label: 'bool $ignoreMissing',
        documentation: 'Whether to ignore missing templates or not',
      },
    ],
    return: 'string',
  },
  {
    name: 'attribute',
    documentation: ['Returns the attribute value for a given array/object.'],
    parameters: [
      {
        label: 'mixed $object',
        documentation: 'The object or array from where to get the item',
      },
      {
        label: 'mixed $item',
        documentation: 'The item to get from the array or object',
      },
      {
        label: 'array $arguments',
        documentation:
          'An array of arguments to pass if the item is an object method',
      },
    ],
    return: 'mixed',
  },
  {
    name: 'block',
    documentation: [
      'When a template uses inheritance and if you want to print a block multiple times, use the `block` function',
    ],
    parameters: [
      {
        label: 'string $name',
      },
      {
        label: 'string $template',
      },
    ],
  },
  {
    name: 'html_classes',
    documentation: [
      'The `html_classes` function returns a string by conditionally joining class names together',
    ],
    parameters: [
      {
        label: 'mixed ...$args',
      },
    ],
    return: 'string',
  },
  {
    name: 'parent',
    documentation: [
      "When a template uses inheritance, it's possible to render the contents of the parent block when overriding a block by using the `parent` function",
    ],
  },
  {
    name: 'country_timezones',
    documentation: [
      'The `country_timezones` function returns the names of the timezones associated with a given country code',
    ],
    parameters: [
      {
        label: 'string $country',
      },
    ],
    return: 'array',
  },
  {
    name: 'language_names',
    documentation: [
      'The `language_names` function returns the names of the languages',
    ],
    parameters: [
      {
        label: 'string $locale = null',
      },
    ],
    return: 'array',
  },
  {
    name: 'script_names',
    documentation: [
      'The `script_names` function returns the names of the scripts',
    ],
    parameters: [
      {
        label: 'string $locale = null',
      },
    ],
    return: 'array',
  },
  {
    name: 'country_names',
    documentation: [
      'The `country_names` function returns the names of the countries',
    ],
    parameters: [
      {
        label: 'string $locale = null',
      },
    ],
    return: 'array',
  },
  {
    name: 'locale_names',
    documentation: [
      'The `locale_names` function returns the names of the locales',
    ],
    parameters: [
      {
        label: 'string $locale = null',
      },
    ],
    return: 'array',
  },
  {
    name: 'currency_names',
    documentation: [
      'The `currency_names` function returns the names of the currencies',
    ],
    parameters: [
      {
        label: 'string $locale = null',
      },
    ],
    return: 'array',
  },
  {
    name: 'timezone_names',
    documentation: [
      'The `timezone_names` function returns the names of the timezones',
    ],
    parameters: [
      {
        label: 'string $locale = null',
      },
    ],
    return: 'array',
  },
  {
    name: 'template_from_string',
    documentation: [
      'Loads a template from a string.',
      '```twig',
      '{{ include(template_from_string("Hello {{ name }}")) }}',
      '```',
    ],
    parameters: [
      {
        label: 'string $template',
        documentation:
          'A template as a string or object implementing __toString()',
      },
      {
        label: 'string $name = null',
        documentation:
          'An optional name of the template to be used in error messages',
      },
    ],
  },
];

export const twigFunctionsSignatureInformation = new Map<
  string,
  SignatureInformation
>(
  twigFunctions.map((item) => {
    const params = item.parameters?.map((item) => item.label).join(', ');
    const signatureInformation: SignatureInformation = {
      label: `${item.name}(${params ?? ''})`,
      parameters: item.parameters,
    };

    if (item.return) {
      signatureInformation.label += `: ${item.return}`;
    }

    if (item.documentation) {
      signatureInformation.documentation = {
        kind: MarkupKind.Markdown,
        value: item.documentation.join('\n'),
      };
    }

    return [item.name, signatureInformation];
  })
);
