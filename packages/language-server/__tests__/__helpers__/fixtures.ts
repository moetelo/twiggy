import type { Position, Range } from 'vscode-languageserver';
import { documentFromCode, documentFromCodeWithTypeResolver, type DocumentWithText } from './documentFromCode';
import { TypeResolver } from 'typing/TypeResolver';

const CURSOR = '$0';

export const offsetToPosition = (text: string, offset: number): Position => {
    const pre = text.slice(0, offset);
    const line = (pre.match(/\n/g) ?? []).length;
    const character = offset - (pre.lastIndexOf('\n') + 1);
    return { line, character };
};

export const parseCursor = (src: string): { text: string; position: Position } => {
    const offset = src.indexOf(CURSOR);
    if (offset < 0) {
        throw new Error('fixture missing `$0` cursor marker');
    }
    if (src.indexOf(CURSOR, offset + CURSOR.length) >= 0) {
        throw new Error('fixture has multiple `$0` markers; use parseRange for a pair');
    }
    const text = src.slice(0, offset) + src.slice(offset + CURSOR.length);
    return { text, position: offsetToPosition(text, offset) };
};

export const parseRange = (src: string): { text: string; range: Range } => {
    const first = src.indexOf(CURSOR);
    if (first < 0) {
        throw new Error('fixture missing `$0` markers');
    }
    const second = src.indexOf(CURSOR, first + CURSOR.length);
    if (second < 0) {
        throw new Error('fixture needs two `$0` markers for a range');
    }
    const text =
        src.slice(0, first) +
        src.slice(first + CURSOR.length, second) +
        src.slice(second + CURSOR.length);
    return {
        text,
        range: {
            start: offsetToPosition(text, first),
            end: offsetToPosition(text, second - CURSOR.length),
        },
    };
};

export const rangeOf = (text: string, substr: string, nth = 0): Range => {
    let offset = -1;
    for (let i = 0; i <= nth; i++) {
        offset = text.indexOf(substr, offset + 1);
        if (offset < 0) {
            throw new Error(`rangeOf: occurrence #${nth} of ${JSON.stringify(substr)} not found`);
        }
    }
    return {
        start: offsetToPosition(text, offset),
        end: offsetToPosition(text, offset + substr.length),
    };
};

export const rangesOf = (text: string, substr: string): Range[] => {
    const ranges: Range[] = [];
    let offset = text.indexOf(substr);
    while (offset >= 0) {
        ranges.push({
            start: offsetToPosition(text, offset),
            end: offsetToPosition(text, offset + substr.length),
        });
        offset = text.indexOf(substr, offset + substr.length);
    }
    return ranges;
};

export const createLengthRange = (start: number, length: number): Range => ({
    start: { character: start, line: 0 },
    end: { character: start + length, line: 0 },
});

export const documentWithCursor = async (fixture: string, uri?: string) => {
    const { text, position } = parseCursor(fixture);
    const document = await documentFromCode(text, uri);
    const cursorNode = document.deepestAt(position);
    return { document, position, cursorNode, text };
};

export const documentWithCursorAndTypes = async (
    fixture: string,
    typeResolver: TypeResolver,
    uri?: string,
): Promise<{
    document: DocumentWithText;
    position: Position;
    cursorNode: ReturnType<DocumentWithText['deepestAt']>;
    text: string;
}> => {
    const { text, position } = parseCursor(fixture);
    const document = await documentFromCodeWithTypeResolver(text, typeResolver, uri);
    const cursorNode = document.deepestAt(position);
    return { document, position, cursorNode, text };
};
