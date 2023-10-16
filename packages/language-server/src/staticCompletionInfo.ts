import {
    MarkupKind,
    ParameterInformation,
    MarkupContent,
    CompletionItem,
    CompletionItemKind,
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
    {
        label: `rootform`,
        documentation:
            'This test will check if the current form does not have a parent form view.',
    },
    {
        label: `selectedchoice`,
        documentation:
            'This test will check if the current choice is equal to the selected_value or if the current choice is in the array (when selected_value is an array).',
    },
];

type TwigFunctionCompletionItem = {
    label: string;
    documentation?: MarkupContent;
    parameters?: ParameterInformation[];
    return?: string;
};

export const twigFunctions: TwigFunctionCompletionItem[] = [
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
                documentation:
                    'The increment between elements of the sequence.',
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
            value: ['Returns a template content without rendering it.'].join(
                '\n',
            ),
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
            value: [
                'Returns the attribute value for a given array/object.',
            ].join('\n'),
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
    {
        label: 'form',
    },
    {
        label: 'form_end',
    },
    {
        label: 'form_errors',
    },
    {
        label: 'form_help',
    },
    {
        label: 'form_label',
    },
    {
        label: 'form_parent',
    },
    {
        label: 'form_rest',
    },
    {
        label: 'form_row',
    },
    {
        label: 'form_start',
    },
    {
        label: 'form_widget',
    },
    {
        label: 'importmap',
    },
];

export const twigFilters: TwigFunctionCompletionItem[] = [
    {
        label: 'date',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'Converts a date to the given format.',
                '```twig',
                '{{ post.published_at|date("m/d/Y") }}',
                '```',
            ].join('\n'),
        },
        parameters: [
            {
                label: 'string|null $format = null',
                documentation: 'The date format',
            },
            {
                label: '\\DateTimeZone|string|false|null $timezone = null',
                documentation: 'The date timezone',
            },
        ],
        return: 'string',
    },
    {
        label: 'date_modify',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'Returns a new date object modified.',
                '```twig',
                '{{ post.published_at|date_modify("-1day")|date("m/d/Y") }}',
                '```',
            ].join('\n'),
        },
        parameters: [
            {
                label: 'string $modifier',
                documentation: 'A modifier string',
            },
        ],
    },
    {
        label: 'format',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Returns a formatted string.'].join('\n'),
        },
        parameters: [
            {
                label: '...$values',
            },
        ],
        return: 'string',
    },
    {
        label: 'replace',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Replaces strings within a string.'].join('\n'),
        },
        parameters: [
            {
                label: 'from',
                documentation: 'The placeholder values as a hash',
            },
        ],
        return: 'string',
    },
    {
        label: 'number_format',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'Number format filter.',
                '',
                'All of the formatting options can be left null, in that case the defaults will be used. Supplying any of the parameters will override the defaults set in the environment object.',
            ].join('\n'),
        },
        parameters: [
            {
                label: 'int $decimal',
                documentation: 'The number of decimal points to display',
            },
            {
                label: 'string $decimalPoint',
                documentation: 'The character(s) to use for the decimal point',
            },
            {
                label: 'string $thousandSep',
                documentation:
                    'The character(s) to use for the thousands separator',
            },
        ],
        return: 'string',
    },
    {
        label: 'abs',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Absolute value'].join('\n'),
        },
        return: 'int|float',
    },
    {
        label: 'round',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Rounds a number.'].join('\n'),
        },
        parameters: [
            {
                label: 'int|float $precision',
                documentation: 'The rounding precision',
            },
            {
                label: 'string $method',
                documentation: 'The method to use for rounding',
            },
        ],
        return: 'int|float',
    },
    {
        label: 'url_encode',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'URL encodes (RFC 3986) a string as a path segment or an array as a query string.',
            ].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'json_encode',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Returns the JSON representation of a value'].join('\n'),
        },
        parameters: [
            {
                label: 'options',
                documentation:
                    "A bitmask of json_encode options: {{data|json_encode(constant('JSON_PRETTY_PRINT')) }}. Combine constants using bitwise operators: {{ data|json_encode(constant('JSON_PRETTY_PRINT') b-or constant('JSON_HEX_QUOT')) }}",
            },
        ],
        return: 'string|false',
    },
    {
        label: 'convert_encoding',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The convert_encoding filter converts a string from one encoding to another.',
            ].join('\n'),
        },
        parameters: [
            {
                label: 'string $to',
                documentation: 'The output charset',
            },
            {
                label: 'string $from',
                documentation: 'The input charset',
            },
        ],
        return: 'string',
    },
    {
        label: 'title',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Returns a titlecased string.'].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'capitalize',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Returns a capitalized string.'].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'upper',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Converts a string to uppercase.'].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'lower',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Converts a string to lowercase.'].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'striptags',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Strips HTML and PHP tags from a string.'].join('\n'),
        },
        parameters: [
            {
                label: 'string[]|string|null $allowable_tags',
                documentation: 'Tags which should not be stripped',
            },
        ],
        return: 'string',
    },
    {
        label: 'trim',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Returns a trimmed string.'].join('\n'),
        },
        parameters: [
            {
                label: 'string|null $characterMask',
            },
            {
                label: "string $side = 'both'",
            },
        ],
        return: 'string',
    },
    {
        label: 'nl2br',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'Inserts HTML line breaks before all newlines in a string.',
            ].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'spaceless',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Removes whitespaces between HTML tags.'].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'join',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'Joins the values to a string.',
                '',
                'The separators between elements are empty strings per default, you can define them with the optional parameters.',
                '```twig',
                "{{ [1, 2, 3]|join(', ', ' and ') }}",
                '{# returns 1, 2 and 3 #}',
                '```',
            ].join('\n'),
        },
        parameters: [
            {
                label: 'string $glue',
                documentation: 'The separator',
            },
            {
                label: 'string|null $and = null',
                documentation: 'The separator for the last pair',
            },
        ],
        return: 'string',
    },
    {
        label: 'split',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'Splits the string into an array.',
                '',
                '```twig',
                '{{ "one,two,three"|split(\',\') }}',
                '{# returns [one, two, three] #}',
                '```',
            ].join('\n'),
        },
        parameters: [
            {
                label: 'string $delimiter',
                documentation: 'The delimiter',
            },
            {
                label: 'int $limit',
                documentation: 'The limit',
            },
        ],
        return: 'array',
    },
    {
        label: 'sort',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Sorts an array.'].join('\n'),
        },
        return: 'array',
    },
    {
        label: 'merge',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'Merges any number of arrays or Traversable objects.',
                '',
                '```twig',
                "{% set items = { 'apple': 'fruit', 'orange': 'fruit' } %}",
                '',
                "{% set items = items|merge({ 'peugeot': 'car' }, { 'banana': 'fruit' }) %}",
                '',
                "{# items now contains { 'apple': 'fruit', 'orange': 'fruit', 'peugeot': 'car', 'banana': 'fruit' } #}",
                '```',
            ].join('\n'),
        },
        return: 'array',
    },
    {
        label: 'batch',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'Batches item.',
                '',
                '```twig',
                "{% set items = { 'apple': 'fruit', 'orange': 'fruit' } %}",
                '',
                "{% set items = items|merge({ 'peugeot': 'car' }, { 'banana': 'fruit' }) %}",
                '',
                "{# items now contains { 'apple': 'fruit', 'orange': 'fruit', 'peugeot': 'car', 'banana': 'fruit' } #}",
                '```',
            ].join('\n'),
        },
        parameters: [
            {
                label: 'int $size',
                documentation: 'The size of the batch',
            },
            {
                label: 'mixed $fill',
                documentation: 'A value used to fill missing items',
            },
        ],
        return: 'array',
    },
    {
        label: 'column',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'Returns the values from a single column in the input array.',
                '',
                '```twig',
                '<pre>',
                "  {% set items = [{ 'fruit' : 'apple'}, {'fruit' : 'orange' }] %}",
                '',
                "  {% set fruits = items|column('fruit') %}",
                '',
                "  {# fruits now contains ['apple', 'orange'] #}",
                '</pre>',
                '```',
            ].join('\n'),
        },
        parameters: [
            {
                label: 'mixed $name',
                documentation: 'The column name',
            },
            {
                label: 'mixed $index',
                documentation:
                    'The column to use as the index/keys for the returned array',
            },
        ],
        return: 'array',
    },
    {
        label: 'filter',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The `filter` filter filters elements of a sequence or a mapping using an arrow function.',
            ].join('\n'),
        },
        parameters: [
            {
                label: 'arrow',
                documentation: 'The arrow function',
            },
        ],
        return: 'array',
    },
    {
        label: 'map',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The `map` filter applies an arrow function to the elements of a sequence or a mapping.',
            ].join('\n'),
        },
        parameters: [
            {
                label: 'arrow',
                documentation: 'The arrow function',
            },
        ],
        return: 'array',
    },
    {
        label: 'reduce',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The `reduce` filter iteratively reduces a sequence or a mapping to a single value using an arrow function, so as to reduce it to a single value.',
            ].join('\n'),
        },
        parameters: [
            {
                label: 'arrow',
                documentation: 'The arrow function',
            },
            {
                label: 'initial',
                documentation: 'The initial value',
            },
        ],
        return: 'array',
    },
    {
        label: 'reverse',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Reverses a variable.'].join('\n'),
        },
        parameters: [
            {
                label: 'bool $preserveKeys',
                documentation: 'Whether to preserve key or not',
            },
        ],
        return: 'mixed',
    },
    {
        label: 'length',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Slices a variable.'].join('\n'),
        },
        return: 'int',
    },
    {
        label: 'slice',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Returns the length of a variable.'].join('\n'),
        },
        parameters: [
            {
                label: 'int $start',
                documentation: 'Start of the slice',
            },
            {
                label: 'int $length',
                documentation: 'Size of the slice',
            },
            {
                label: 'bool $preserveKeys',
                documentation:
                    'Whether to preserve key or not (when the input is an array)',
            },
        ],
        return: 'mixed',
    },
    {
        label: 'first',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Returns the first element of the item.'].join('\n'),
        },
        return: 'mixed',
    },
    {
        label: 'last',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Returns the last element of the item.'].join('\n'),
        },
        return: 'mixed',
    },
    {
        label: 'default',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The default filter returns the passed default value if the value is undefined or empty, otherwise the value of the variable',
            ].join('\n'),
        },
        parameters: [
            {
                label: 'default',
                documentation: 'The default value',
            },
        ],
        return: 'mixed',
    },
    {
        label: 'keys',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Returns the keys for the given array.'].join('\n'),
        },
        return: 'array',
    },
    {
        label: 'data_uri',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'Creates a data URI (RFC 2397).',
                'Length validation is not performed on purpose, validation should be done before calling this filter.',
            ].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'escape',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Escapes a string.'].join('\n'),
        },
        parameters: [
            {
                label: 'string $strategy',
                documentation: 'The escaping strategy',
            },
            {
                label: 'string $charset',
                documentation: 'The charset',
            },
            {
                label: 'bool $autoescape',
                documentation:
                    'Whether the function is called by the auto-escaping feature (true) or by the developer (false)',
            },
        ],
        return: 'string',
    },
    {
        label: 'e',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Escapes a string.'].join('\n'),
        },
        parameters: [
            {
                label: 'string $strategy',
                documentation: 'The escaping strategy',
            },
            {
                label: 'string $charset',
                documentation: 'The charset',
            },
            {
                label: 'bool $autoescape',
                documentation:
                    'Whether the function is called by the auto-escaping feature (true) or by the developer (false)',
            },
        ],
        return: 'string',
    },
    {
        label: 'raw',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Marks a variable as being safe.'].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'inky_to_html',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['Marks a variable as being safe.'].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'country_name',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The `country_name` filter returns the country name given its ISO-3166 two-letter code',
            ].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'currency_name',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The `currency_name` filter returns the currency name given its three-letter code',
            ].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'currency_symbol',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The currency_symbol filter returns the currency symbol given its three-letter code',
            ].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'language_name',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The `language_name` filter returns the language name given its two-letter code',
            ].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'locale_name',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The `locale_name` filter returns the locale name given its two-letter code',
            ].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'timezone_name',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The `timezone_name` filter returns the timezone name given a timezone identifier',
            ].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'format_currency',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The `format_currency` filter formats a number as a currency',
            ].join('\n'),
        },
        parameters: [
            {
                label: 'currency',
                documentation: 'The currency',
            },
            {
                label: 'attrs',
                documentation: 'A map of attributes',
            },
            {
                label: 'locale',
                documentation: 'The locale',
            },
        ],
        return: 'string',
    },
    {
        label: 'format_number',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['The `format_number` filter formats a number'].join('\n'),
        },
        parameters: [
            {
                label: 'locale',
                documentation: 'The locale',
            },
            {
                label: 'attrs',
                documentation: 'A map of attributes',
            },
            {
                label: 'style',
                documentation: 'The style of the number output',
            },
        ],
        return: 'string',
    },
    {
        label: 'format_datetime',
        documentation: {
            kind: MarkupKind.Markdown,
            value: ['The `format_datetime` filter formats a date time'].join(
                '\n',
            ),
        },
        return: 'string',
    },
    {
        label: 'format_date',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The `format_date` filter formats a date. It behaves in the exact same way as the format_datetime filter, but without the time.',
            ].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'format_time',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The `format_time` filter formats a time. It behaves in the exact same way as the format_datetime filter, but without the date.',
            ].join('\n'),
        },
        return: 'string',
    },
    {
        label: 'markdown_to_html',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The `markdown_to_html` filter converts a block of Markdown to HTML',
            ].join('\n'),
        },
    },
    {
        label: 'html_to_markdown',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The `html_to_markdown` filter converts a block of HTML to Markdown',
            ].join('\n'),
        },
    },
    {
        label: 'slug',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The slug filter transforms a given string into another string that only includes safe ASCII characters.',
            ].join('\n'),
        },
        parameters: [
            {
                label: 'separator',
                documentation:
                    'The separator that is used to join words (defaults to -)',
            },
            {
                label: 'locale',
                documentation:
                    'The locale of the original string (if none is specified, it will be automatically detected)',
            },
        ],
        return: 'string',
    },
    {
        label: 'u',
        documentation: {
            kind: MarkupKind.Markdown,
            value: [
                'The `u` filter wraps a text in a Unicode object (a Symfony UnicodeString instance) that exposes methods to "manipulate" the string.',
            ].join('\n'),
        },
    },
    {
        label: 'abbr_class',
    },
    {
        label: 'abbr_method',
    },
    {
        label: 'file_excerpt',
    },
    {
        label: 'file_link',
    },
    {
        label: 'file_relative',
    },
    {
        label: 'format_args',
    },
    {
        label: 'format_args_as_text',
    },
    {
        label: 'format_file',
    },
    {
        label: 'format_file_from_text',
    },
    {
        label: 'humanize',
    },
    {
        label: 'sanitize_html',
    },
    {
        label: 'serialize',
    },
    {
        label: 'trans',
    },
    {
        label: 'yaml_dump',
    },
    {
        label: 'yaml_encode',
    },
];

export const forLoopProperties: CompletionItem[] = [
    {
        label: 'index',
        detail: 'The current iteration of the loop. (1 indexed)',
        kind: CompletionItemKind.Property,
    },
    {
        label: 'index0',
        detail: 'The current iteration of the loop. (0 indexed)',
        kind: CompletionItemKind.Property,
    },
    {
        label: 'revindex',
        detail: 'The number of iterations from the end of the loop (1 indexed)',
        kind: CompletionItemKind.Property,
    },
    {
        label: 'revindex0',
        detail: 'The number of iterations from the end of the loop (0 indexed)',
        kind: CompletionItemKind.Property,
    },
    {
        label: 'first',
        detail: 'True if first iteration',
        kind: CompletionItemKind.Property,
    },
    {
        label: 'last',
        detail: 'True if last iteration',
        kind: CompletionItemKind.Property,
    },
    {
        label: 'length',
        detail: 'The number of items in the sequence',
        kind: CompletionItemKind.Property,
    },
    {
        label: 'parent',
        detail: 'The parent context',
        kind: CompletionItemKind.Property,
    },
];
