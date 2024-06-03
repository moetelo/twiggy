import { describe, before, test } from 'node:test';
import assert from 'node:assert/strict';
import Parser from 'web-tree-sitter';
import { collectLocals } from '../src/symbols/locals';
import { createLengthRange, documentFromCode, initializeTestParser } from './utils';
import { LocalSymbolInformation } from '../src/symbols/types';

describe('locals', () => {
    let parser!: Parser;

    before(async () => {
        parser = await initializeTestParser();
    });

    test('collects `set` variables', () => {
        const var0 = 'variable0';
        const var1 = 'anotherVariable';
        const code = `{% set ${var0} = 123 %}{% set ${var1} = 'asdf' %}`;

        const tree = parser.parse(code);
        const locals = collectLocals(tree.rootNode);

        assert.strictEqual(locals.variable[0].name, var0);
        assert.strictEqual(locals.variable[1].name, var1);
        assert.deepStrictEqual(locals.variable[0].value, '123');
        assert.deepStrictEqual(locals.variable[1].value, "'asdf'");

        assert.deepEqual(
            locals.variable[0].nameRange,
            createLengthRange(code.indexOf(var0), var0.length),
        );
        assert.deepEqual(
            locals.variable[1].nameRange,
            createLengthRange(code.indexOf(var1), var1.length),
        );

        assert.strictEqual(locals.variable.length, 2);
    });

    test('collects implicitly defined variables', () => {
        const var0 = 'variable0';
        const var1 = 'anotherVariable';
        const code = `{{ ${var0} }}{{ ${var1} }}{{ ${var0} }}{{ ${var1} }}`;

        const tree = parser.parse(code);
        const locals = collectLocals(tree.rootNode);

        assert.strictEqual(locals.variable[0].name, var0);
        assert.strictEqual(locals.variable[1].name, var1);

        assert.deepEqual(
            locals.variable[0].nameRange,
            createLengthRange(code.indexOf(var0), var0.length),
        );
        assert.deepEqual(
            locals.variable[1].nameRange,
            createLengthRange(code.indexOf(var1), var1.length),
        );

        assert.deepEqual(
            locals.variable[0].references,
            [ locals.variable[0].nameRange, createLengthRange(code.lastIndexOf(var0), var0.length) ],
        );
        assert.deepEqual(
            locals.variable[1].references,
            [ locals.variable[1].nameRange, createLengthRange(code.lastIndexOf(var1), var1.length) ],
        );

        assert.strictEqual(locals.variable.length, 2);
    });

    test('collects implicitly defined variable reference inside of block', () => {
        const var0 = 'variable0';
        const code = `{{ ${var0} }}{% block block1 %}{{ ${var0} }}{% endblock %}`;

        const tree = parser.parse(code);
        const locals = collectLocals(tree.rootNode);

        assert.strictEqual(locals.variable.length, 1);

        assert.strictEqual(locals.variable[0].name, var0);

        assert.deepEqual(
            locals.variable[0].nameRange,
            createLengthRange(code.indexOf(var0), var0.length),
        );

        assert.deepEqual(
            locals.variable[0].references,
            [ locals.variable[0].nameRange, createLengthRange(code.lastIndexOf(var0), var0.length) ],
        );
    });

    const testOneVariable = (varName: string, code: string, scope?: LocalSymbolInformation) => {
        if (!scope) {
            const tree = parser.parse(code);
            scope = collectLocals(tree.rootNode);
        }

        assert.strictEqual(scope.variable.length, 1);

        const variable = scope.variable[0];
        assert.strictEqual(variable.name, varName);

        assert.deepEqual(
            variable.nameRange,
            createLengthRange(code.indexOf(varName), varName.length),
        );

        return variable;
    };

    test('collects implicitly defined variable inside of if condition', () => {
        const varName = 'variable0';
        const code = `{% if ${varName} %}{{ ${varName}[0].prop }}{% endif %}{% if not ${varName} %} var0 is falsy :( {% endif %}`;

        const variable = testOneVariable(varName, code);

        assert.deepEqual(
            variable.references,
            [
                variable.nameRange,
                createLengthRange(code.indexOf(varName, variable.nameRange.end.character), varName.length),
                createLengthRange(code.lastIndexOf(varName), varName.length),
            ],
        );
    });

    test('collects references inside of filter args', async () => {
        const varName = 'variable0';
        const document = await documentFromCode(`{% if ${varName} %}{{ 'something'|trans({ prop1: ${varName}, prop2: 123 }) }}{% endif %}`);

        const variable = document.locals.variable[0];

        assert.strictEqual(variable.name, varName);

        assert.deepEqual(
            variable.references,
            [
                variable.nameRange,
                createLengthRange(document.text.lastIndexOf(varName), varName.length),
            ],
        );
    });

    test('collects implicitly defined variable inside of block', () => {
        const varName = 'variable0';
        const code = `{% block block1 %}{{ ${varName}.hello }} {% if ${varName} %}var0 is truthy!{% endif %} {% endblock %}`;

        const tree = parser.parse(code);
        const locals = collectLocals(tree.rootNode);
        const variable = testOneVariable(varName, code, locals.block[0].symbols);

        assert.deepEqual(
            variable.references,
            [
                variable.nameRange,
                createLengthRange(code.lastIndexOf(varName), varName.length),
            ],
        );
    });

    test('collects implicitly defined variable inside of the second block', () => {
        const varName = 'variable0';
        const code = `{% block block1 %}{% endblock %}{% block block2 %}{{ ${varName}.hello }} {% if ${varName} %}var0 is truthy!{% endif %} {% endblock %}`;

        const tree = parser.parse(code);
        const locals = collectLocals(tree.rootNode);
        const variable = testOneVariable(varName, code, locals.block[1].symbols);

        assert.deepEqual(
            variable.references,
            [
                variable.nameRange,
                createLengthRange(code.lastIndexOf(varName), varName.length),
            ],
        );
    });

    test('collects implicitly defined variable inside of set assignment', () => {
        const varName = 'post';
        const code = `{% set canEdit = ${varName}.author.id == 1 %}`;

        const tree = parser.parse(code);
        const locals = collectLocals(tree.rootNode);

        assert.strictEqual(locals.variable.length, 2);
        assert.strictEqual(locals.variable[0].name, 'canEdit');
        assert.strictEqual(locals.variable[1].name, varName);

    });

    test('collects variables defined inside of for', () => {
        const keyVar = 'keyInList';
        const itemVar = 'itemInList';
        const listVar = 'items';
        const varNames = [keyVar, itemVar, listVar];

        const code = `{% for ${keyVar}, ${itemVar} in ${listVar} %}{{ ${keyVar} }}{{ ${itemVar}.prop }}{{ count(${listVar}) }}{% endfor %}`;

        const tree = parser.parse(code);
        const locals = collectLocals(tree.rootNode);

        assert.strictEqual(locals.variable.length, 3);

        for (let i = 0; i < locals.variable.length; i++) {
            const variable = locals.variable[i];
            const varName = varNames[i];

            assert.strictEqual(variable.name, varName);

            assert.deepEqual(
                variable.nameRange,
                createLengthRange(code.indexOf(varName), varName.length),
                varName + ' nameRange',
            );
            assert.deepEqual(
                variable.references,
                [
                    variable.nameRange,
                    createLengthRange(code.lastIndexOf(varName), varName.length),
                ],
                varName + ' references',
            );
        }

    });
});
