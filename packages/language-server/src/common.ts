import {
  MarkupKind,
  SignatureInformation,
  ParameterInformation,
  MarkupContent,
} from 'vscode-languageserver';

export const twigGlobalVariables = [
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

export const twigTests = [
  {
    label: 'constant',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        '`constant` checks if a variable has the exact same value as a constant. You can use either global constants or class constants:',
        '```twig',
        "{% if post.status is constant('Post::PUBLISHED') %}",
        '  the status attribute is exactly the same as Post::PUBLISHED',
        '{% endif %}',
        '```',
        'You can test constants from object instances as well:',
        '```twig',
        "{% if post.status is constant('PUBLISHED', post) %}",
        '  the status attribute is exactly the same as Post::PUBLISHED',
        '{% endif %}',
        '```',
      ].join('\n'),
    },
    parameters: [
      {
        label: 'string ...$values',
      },
    ],
    return: 'mixed',
  },
  {
    label: 'divisible by',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        '`divisible by` checks if a variable is divisible by a number',
      ].join('\n'),
    },
  },
  {
    label: 'same as',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        '`same as` checks if a variable is the same as another variable. This is equivalent to === in PHP',
      ].join('\n'),
    },
  },
  {
    label: `defined`,
    documentation:
      '`defined` checks if a variable is defined in the current context',
  },
  {
    label: `empty`,
    documentation:
      '`empty` checks if a variable is an empty string, an empty array, an empty hash, exactly false, or exactly null.',
  },
  {
    label: `even`,
    documentation: '`even` returns true if the given number is even',
  },
  {
    label: `iterable`,
    documentation:
      '`iterable` checks if a variable is an array or a traversable object',
  },
  {
    label: `null`,
    documentation: '`null` returns true if the variable is null:',
  },
  {
    label: `odd`,
    documentation: '`odd` returns true if the given number is odd',
  },
];

type twigFunction = {
  label: string;
  documentation?: MarkupContent;
  parameters?: ParameterInformation[];
  return?: string;
};

export const twigFunctions: twigFunction[] = [
  {
    label: 'max',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
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
      ].join('\n'),
    },
    parameters: [
      {
        label: 'mixed ...$values',
        documentation: 'Any comparable values.',
      },
    ],
    return: 'mixed',
  },
  {
    label: 'min',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
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
      ].join('\n'),
    },
    parameters: [
      {
        label: 'mixed ...$values',
        documentation: 'Any comparable values.',
      },
    ],
    return: 'mixed',
  },
  {
    label: 'range',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        'Returns a list containing an arithmetic progression of integers:',
        '```twig',
        '{% for i in range(0, 3) %}',
        '    {{ i }},',
        '{% endfor %}',
        '```',
      ].join('\n'),
    },
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
    label: 'constant',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        'Provides the ability to get constants from instances as well as class/global constants.',
      ].join('\n'),
    },
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
    label: 'cycle',
    documentation: {
      kind: MarkupKind.Markdown,
      value: ['Cycles over a value.'].join('\n'),
    },
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
    label: 'random',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        'Returns a random value depending on the supplied parameter type:',
        '- a random item from a \\Traversable or array',
        '- a random character from a string',
        '- a random integer between 0 and the integer parameter.',
      ].join('\n'),
    },
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
    label: 'date',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        'Converts an input to a DateTime instance.',
        '```twig',
        "{% if date(user.created_at) < date('+2days') %}",
        '  {# do something #}',
        '{% endif %}',
        '```',
      ].join('\n'),
    },
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
    label: 'dump',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        'The dump function dumps information about a template variable. This is mostly useful to debug a template that does not behave as expected by introspecting its variables:',
        '```twig',
        '{{ dump(user) }}',
        '```',
      ].join('\n'),
    },
    parameters: [
      {
        label: 'mixed $context',
        documentation: 'The context to dump',
      },
    ],
  },
  {
    label: 'include',
    documentation: {
      kind: MarkupKind.Markdown,
      value: ['Renders a template.'].join('\n'),
    },
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
    label: 'source',
    documentation: {
      kind: MarkupKind.Markdown,
      value: ['Returns a template content without rendering it.'].join('\n'),
    },
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
    label: 'attribute',
    documentation: {
      kind: MarkupKind.Markdown,
      value: ['Returns the attribute value for a given array/object.'].join(
        '\n'
      ),
    },
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
    label: 'block',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        'When a template uses inheritance and if you want to print a block multiple times, use the `block` function',
      ].join('\n'),
    },
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
    label: 'html_classes',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        'The `html_classes` function returns a string by conditionally joining class names together',
      ].join('\n'),
    },
    parameters: [
      {
        label: 'mixed ...$args',
      },
    ],
    return: 'string',
  },
  {
    label: 'parent',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        "When a template uses inheritance, it's possible to render the contents of the parent block when overriding a block by using the `parent` function",
      ].join('\n'),
    },
  },
  {
    label: 'country_timezones',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        'The `country_timezones` function returns the names of the timezones associated with a given country code',
      ].join('\n'),
    },
    parameters: [
      {
        label: 'string $country',
      },
    ],
    return: 'array',
  },
  {
    label: 'language_names',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        'The `language_names` function returns the names of the languages',
      ].join('\n'),
    },
    parameters: [
      {
        label: 'string $locale = null',
      },
    ],
    return: 'array',
  },
  {
    label: 'script_names',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        'The `script_names` function returns the names of the scripts',
      ].join('\n'),
    },
    parameters: [
      {
        label: 'string $locale = null',
      },
    ],
    return: 'array',
  },
  {
    label: 'country_names',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        'The `country_names` function returns the names of the countries',
      ].join('\n'),
    },
    parameters: [
      {
        label: 'string $locale = null',
      },
    ],
    return: 'array',
  },
  {
    label: 'locale_names',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        'The `locale_names` function returns the names of the locales',
      ].join('\n'),
    },
    parameters: [
      {
        label: 'string $locale = null',
      },
    ],
    return: 'array',
  },
  {
    label: 'currency_names',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        'The `currency_names` function returns the names of the currencies',
      ].join('\n'),
    },
    parameters: [
      {
        label: 'string $locale = null',
      },
    ],
    return: 'array',
  },
  {
    label: 'timezone_names',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        'The `timezone_names` function returns the names of the timezones',
      ].join('\n'),
    },
    parameters: [
      {
        label: 'string $locale = null',
      },
    ],
    return: 'array',
  },
  {
    label: 'template_from_string',
    documentation: {
      kind: MarkupKind.Markdown,
      value: [
        'Loads a template from a string.',
        '```twig',
        '{{ include(template_from_string("Hello {{ name }}")) }}',
        '```',
      ].join('\n'),
    },
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
  {
    label: 'render',
    parameters: [
      {
        label: 'string|ControllerReference $uri',
      },
      {
        label: 'array options = []',
      },
    ],
  },
  {
    label: 'render_esi',
    parameters: [
      {
        label: 'string|ControllerReference $uri',
      },
      {
        label: 'array options = []',
      },
    ],
  },
  {
    label: 'fragment_uri',
    parameters: [
      {
        label: 'ControllerReference controller',
      },
      {
        label: 'boolean absolute = false',
      },
      {
        label: 'boolean strict = true',
      },
      {
        label: 'boolean sign = true',
      },
    ],
  },
  {
    label: 'controller',
    parameters: [
      {
        label: 'string controller',
      },
      {
        label: 'array attributes = []',
      },
      {
        label: 'array query = []',
      },
    ],
  },
  {
    label: 'asset',
    parameters: [
      {
        label: 'string path',
      },
      {
        label: 'string|null packageName = null',
      },
    ],
  },
  {
    label: 'asset_version',
    parameters: [
      {
        label: 'string|null packageName = null',
      },
    ],
  },
  {
    label: 'csrf_token',
    parameters: [
      {
        label: 'string intention',
      },
    ],
  },
  {
    label: 'is_granted',
    parameters: [
      {
        label: 'string role',
      },
      {
        label: 'object object = null',
      },
      {
        label: 'string field = null',
      },
    ],
  },
  {
    label: 'logout_path',
    parameters: [
      {
        label: 'string key = null',
      },
    ],
  },
  {
    label: 'logout_url',
    parameters: [
      {
        label: 'string key = null',
      },
    ],
  },
  {
    label: 'path',
    parameters: [
      {
        label: 'string route_name',
      },
      {
        label: 'array route_parameters = []',
      },
      {
        label: 'boolean relative = false',
      },
    ],
  },
  {
    label: 'url',
    parameters: [
      {
        label: 'string route_name',
      },
      {
        label: 'array route_parameters = []',
      },
      {
        label: 'boolean schemeRelative = false',
      },
    ],
  },
  {
    label: 'absolute_url',
    parameters: [
      {
        label: 'string path',
      },
    ],
  },
  {
    label: 'relative_path',
    parameters: [
      {
        label: 'string path',
      },
    ],
  },
  {
    label: 'impersonation_exit_path',
    parameters: [
      {
        label: 'string exitTo = null',
      },
    ],
  },
  {
    label: 'impersonation_exit_url',
    parameters: [
      {
        label: 'string exitTo = null',
      },
    ],
  },
  {
    label: 't',
    parameters: [
      {
        label: 'string message',
      },
      {
        label: 'array parameters = []',
      },
      {
        label: "string domain = 'messages'",
      },
    ],
  },
];

export const twigFunctionsSignatureInformation = new Map<
  string,
  SignatureInformation
>(
  twigFunctions.map((item) => {
    const label = item.label;
    const params = item.parameters?.map((item) => item.label).join(', ');
    const signatureInformation: SignatureInformation = {
      label: `${item.label}(${params ?? ''})`,
      parameters: item.parameters,
    };

    if (item.return) {
      signatureInformation.label += `: ${item.return}`;
    }

    return [label, signatureInformation];
  })
);
