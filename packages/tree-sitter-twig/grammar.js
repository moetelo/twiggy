module.exports = grammar({
  name: 'twig',
  extras: () => [/[\s\p{Zs}\uFEFF\u2060\u200B]/],
  supertypes: ($) => [$.expression, $.primary_expression],
  inline: ($) => [$._statement],
  precedences: ($) => [
    [
      'member',
      'filter',
      'call',
      'unary',
      'ternary',
      $.expression,
      $.arrow_function,
    ],
    [$.primary_expression, $.filter_expression],
  ],
  conflicts: ($) => [
    [$.primary_expression, $._property_name],
    [$.primary_expression, $._property_name, $.arrow_function],
    [$.primary_expression, $.arrow_function],
    [$.primary_expression, $.call_expression],
  ],
  externals: ($) => [$.content, $.comment],
  rules: {
    template: ($) => repeat($._source_element),

    _source_element: ($) =>
      choice($._statement, $.output, $.comment, $.content),

    output: ($) =>
      seq(
        alias(choice('{{', '{{-', '{{~'), 'embedded_begin'),
        $.expression,
        alias(choice('}}', '-}}', '~}}'), 'embedded_end'),
      ),

    _statement_start: ($) =>
      alias(choice('{%', '{%-', '{%~'), 'embedded_begin'),
    _statement_stop: ($) => alias(choice('%}', '-%}', '~%}'), 'embedded_end'),

    expression: ($) =>
      choice(
        $.primary_expression,
        $.unary_expression,
        $.binary_expression,
        $.ternary_expression,
      ),

    primary_expression: ($) =>
      choice(
        $.subscript_expression,
        $.member_expression,
        $.filter_expression,
        $.parenthesized_expression,
        alias($.identifier, $.variable),
        $.null,
        $.number,
        $.boolean,
        $.string,
        $.interpolated_string,
        $.array,
        $.object,
        $.arrow_function,
        $.call_expression,
      ),

    parenthesized_expression: ($) => seq('(', $.expression, ')'),

    identifier: ($) =>
      choice(
        /[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/,
        'divisible by',
        'same as',
      ),

    null: () => choice('null', 'none', 'NULL', 'NONE'),
    number: () => /[0-9]+(?:\.[0-9]+)?([Ee][\+\-][0-9]+)?/,
    boolean: () => choice('true', 'false', 'TRUE', 'FALSE'),
    string: () => /"([^#"\\]*(?:\\.[^#"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/,
    interpolated_string: ($) =>
      seq(
        alias('"', 'string'),
        repeat(
          choice(
            alias(choice('\\"', '\\#', '\\\\', /[^#"\\\\]+/), $.string),
            seq(
              alias('#{', 'embedded_begin'),
              $.expression,
              alias('}', 'embedded_begin'),
            ),
          ),
        ),
        alias('"', 'string'),
      ),
    spread_element: ($) =>
      seq('...', field('expr', alias($.identifier, $.variable))),
    array: ($) =>
      seq('[', commaSep($.expression), optional($.spread_element), ']'),
    object: ($) =>
      seq(
        '{',
        commaSep(choice($.pair, alias($.identifier, $.variable))),
        optional($.spread_element),
        '}',
      ),

    pair: ($) =>
      seq(field('key', $._property_name), ':', field('value', $.expression)),

    _property_name: ($) =>
      choice(
        $.string,
        $.number,
        alias($.identifier, $.variable),
        $.computed_property_name,
      ),

    computed_property_name: ($) => seq('(', $.expression, ')'),

    arrow_function: ($) =>
      seq(
        choice(
          field('parameter', alias($.identifier, $.parameter)),
          seq(
            '(',
            commaSep(field('parameter', alias($.identifier, $.parameter))),
            ')',
          ),
        ),
        '=>',
        field('expr', $.expression),
      ),

    member_expression: ($) =>
      prec(
        'member',
        seq(
          field('object', choice($.expression, $.primary_expression)),
          '.',
          field('property', alias(choice($.identifier, /[0-9]+/), $.property)),
        ),
      ),

    slice: ($) =>
      seq(
        optional(field('start', $._property_name)),
        ':',
        optional(field('length', $.expression)),
      ),

    subscript_expression: ($) =>
      prec.right(
        'member',
        seq(
          field('object', choice($.expression, $.primary_expression)),
          '[',
          choice(field('index', $.expression), field('slice', $.slice)),
          ']',
        ),
      ),

    call_expression: ($) =>
      choice(
        prec(
          'member',
          seq(
            field(
              'name',
              choice(alias($.identifier, $.function), $.primary_expression),
            ),
            field('arguments', $.arguments),
          ),
        ),
        // TODO: Do we need `call`?
        prec(
          'call',
          seq(
            field(
              'name',
              choice(alias($.identifier, $.function), $.expression),
            ),
            field('arguments', $.arguments),
          ),
        ),
      ),

    arguments: ($) =>
      seq(
        '(',
        commaSep(field('argument', choice($.named_argument, $.expression))),
        ')',
      ),

    named_argument: ($) =>
      seq(
        field('key', alias($.identifier, $.string)),
        '=',
        field('value', $.expression),
      ),

    unary_expression: ($) =>
      prec.left(
        'unary',
        choice(
          ...[
            ['+', 500],
            ['-', 500],
            ['not', 50],
          ].map(([operator, precedence]) =>
            prec.left(
              precedence,
              seq(field('operator', operator), field('argument', $.expression)),
            ),
          ),
        ),
      ),

    binary_expression: ($) =>
      choice(
        ...[
          ['or', 10],
          ['and', 15],
          ['b-or', 16],
          ['b-xor', 17],
          ['b-and', 18],
          ['==', 20],
          ['!=', 20],
          ['<=>', 20],
          ['<', 20],
          ['>', 20],
          ['>=', 20],
          ['<=', 20],
          ['not in', 20],
          ['in', 20],
          ['matches', 20],
          ['starts with', 20],
          ['ends with', 20],
          ['has some', 20],
          ['has every', 20],
          ['..', 25],
          ['+', 30],
          ['-', 30],
          ['~', 40],
          ['*', 60],
          ['/', 60],
          ['//', 60],
          ['%', 60],
          ['is', 100],
          ['is not', 100],
          ['**', 200, 'right'],
          ['??', 300, 'right'],
        ].map(([operator, precedence, associativity = 'left']) =>
          prec[associativity](
            precedence,
            seq(
              field('left', $.expression),
              field('operator', alias(operator, 'operator')),
              field('right', $.expression),
            ),
          ),
        ),
      ),

    ternary_expression: ($) =>
      prec.right(
        'ternary',
        seq(
          field('condition', $.expression),
          choice(
            seq(
              alias('?', 'operator'),
              field('consequence', $.expression),
              optional(
                seq(alias(':', 'operator'), field('alternative', $.expression)),
              ),
            ),
            seq(alias('?:', 'operator'), field('alternative', $.expression)),
          ),
        ),
      ),

    filter_expression: ($) =>
      prec.right(
        'filter',
        seq(
          field('object', choice($.expression, $.primary_expression)),
          alias('|', 'operator'),
          field('name', alias($.identifier, $.function)),
          optional(field('arguments', $.arguments)),
        ),
      ),

    tag: ($) =>
      statement(
        $,
        field('name', alias($.identifier, 'keyword')),
        repeat(prec.left($.expression)),
      ),

    set: ($) =>
      statement(
        $,
        alias('set', 'keyword'),
        commaSep1(field('variable', alias($.identifier, $.variable))),
        '=',
        commaSep1(field('value', $.expression)),
      ),

    set_block: ($) =>
      statement(
        $,
        alias('set', 'keyword'),
        field('variable', alias($.identifier, $.variable)),
        source_elements($),
        alias('endset', 'keyword'),
      ),

    apply: ($) =>
      statement(
        $,
        alias('apply', 'keyword'),
        field(
          'filter',
          choice(alias($.identifier, $.function), $.filter_expression),
        ),
        source_elements($),
        alias('endapply', 'keyword'),
      ),

    autoescape: ($) =>
      statement(
        $,
        alias('autoescape', 'keyword'),
        optional(field('strategy', choice($.string, $.boolean))),
        source_elements($),
        alias('endautoescape', 'keyword'),
      ),

    block: ($) =>
      statement(
        $,
        alias('block', 'keyword'),
        field('name', $.identifier),
        choice(
          field('expr', $.expression),
          seq(
            source_elements($),
            alias('endblock', 'keyword'),
            optional(field('name', $.identifier)),
          ),
        ),
      ),

    cache: ($) =>
      statement(
        $,
        alias('cache', 'keyword'),
        field('key', $.expression),
        ' ',
        optional(field('expiration', $.call_expression)),
        source_elements($),
        alias('endcache', 'keyword'),
      ),

    deprecated: ($) =>
      statement($, alias('deprecated', 'keyword'), field('expr', $.expression)),

    do: ($) =>
      statement($, alias('do', 'keyword'), field('expr', $.expression)),

    embed: ($) =>
      statement(
        $,
        alias('embed', 'keyword'),
        field('name', $.expression),
        optional(field('ignore_missing', alias('ignore missing', 'keyword'))),
        optional(seq('with', field('variables', $.expression))),
        optional(field('only', alias('only', 'keyword'))),
        source_elements($),
        alias('endembed', 'keyword'),
      ),

    extends: ($) =>
      statement($, alias('extends', 'keyword'), field('expr', $.expression)),

    flush: ($) => statement($, alias('flush', 'keyword')),

    for: ($) =>
      statement(
        $,
        alias('for', 'keyword'),
        commaSep1(field('variable', alias($.identifier, $.variable))),
        alias('in', 'keyword'),
        field('expr', $.expression),
        source_elements($),
        optional(seq(alias('else', 'keyword'), source_elements($))),
        alias('endfor', 'keyword'),
      ),

    from: ($) =>
      statement(
        $,
        alias('from', 'keyword'),
        field('expr', $.expression),
        alias('import', 'keyword'),
        commaSep1(
          field(
            'variable',
            choice(alias($.identifier, $.variable), $.as_operator),
          ),
        ),
      ),

    as_operator: ($) =>
      seq(
        field('left', alias($.identifier, $.variable)),
        field('operator', alias('as', 'keyword')),
        field('right', alias($.identifier, $.variable)),
      ),

    if: ($) =>
      statement(
        $,
        alias('if', 'keyword'),
        field('expr', $.expression),
        source_elements($, 'then'),
        optional(field('elseif', repeat($.elseif))),
        optional(seq(alias('else', 'keyword'), source_elements($, 'else'))),
        alias('endif', 'keyword'),
      ),

    elseif: ($) =>
      seq(
        alias('elseif', 'keyword'),
        field('expr', $.expression),
        source_elements($, 'then'),
      ),

    import: ($) =>
      statement(
        $,
        alias('import', 'keyword'),
        field('expr', $.expression),
        alias('as', 'keyword'),
        field('variable', alias($.identifier, $.variable)),
      ),

    include: ($) =>
      statement(
        $,
        alias('include', 'keyword'),
        field('expr', $.expression),
        optional(field('ignore_missing', alias('ignore missing', 'keyword'))),
        optional(seq('with', field('variables', $.expression))),
        optional(field('only', alias('only', 'keyword'))),
      ),

    macro: ($) =>
      statement(
        $,
        alias('macro', 'keyword'),
        field('name', $.identifier),
        field('arguments', $.arguments),
        source_elements($),
        alias('endmacro', 'keyword'),
        optional($.identifier),
      ),

    sandbox: ($) =>
      statement(
        $,
        alias('sandbox', 'keyword'),
        source_elements($),
        alias('endsandbox', 'keyword'),
      ),

    use: ($) =>
      statement(
        $,
        alias('use', 'keyword'),
        field('expr', $.expression),
        optional(
          seq(
            alias('with', 'keyword'),
            commaSep1(field('variable', $.as_operator)),
          ),
        ),
      ),

    verbatim: ($) =>
      statement(
        $,
        alias('verbatim', 'keyword'),
        source_elements($),
        alias('endverbatim', 'keyword'),
      ),

    with: ($) =>
      statement(
        $,
        alias('with', 'keyword'),
        optional(field('expr', $.expression)),
        optional(field('only', alias('only', 'keyword'))),
        source_elements($),
        alias('endwith', 'keyword'),
      ),

    _statement: ($) =>
      choice(
        $.tag,
        $.apply,
        $.autoescape,
        $.block,
        $.cache,
        $.deprecated,
        $.do,
        $.embed,
        $.extends,
        $.flush,
        $.for,
        $.from,
        $.if,
        $.import,
        $.include,
        $.macro,
        $.sandbox,
        $.set,
        $.set_block,
        $.use,
        $.verbatim,
        $.with,
      ),
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)), optional(','));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function source_elements($, fieldName = 'body') {
  return seq(
    $._statement_stop,
    optional(
      field(
        fieldName,
        alias(
          repeat(choice($._statement, $.output, $.comment, $.content)),
          $.source_elements,
        ),
      ),
    ),
    $._statement_start,
  );
}

function statement($, ...args) {
  return seq($._statement_start, ...args, $._statement_stop);
}
