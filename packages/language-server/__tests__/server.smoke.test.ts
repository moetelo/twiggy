/**
 * Tier-2 smoke test: JSON-RPC roundtrip over in-memory streams.
 * Verifies server wiring and capability registration, not provider logic.
 * Provider logic is covered by unit tests in completions/, hovers/, etc.
 */
import { describe, test, beforeAll, expect } from 'bun:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'stream';
import {
    createConnection,
    createProtocolConnection,
    StreamMessageReader,
    StreamMessageWriter,
    InitializeParams,
    CompletionParams,
    DidOpenTextDocumentParams,
    ProtocolNotificationType,
} from 'vscode-languageserver/node';
import { Server } from 'server';
import { initializeTestParser } from './__helpers__/parser';

const TEST_URI = 'file:///tmp/test.html.twig';

const makeInMemoryConnectionPair = () => {
    const clientToServer = new PassThrough();
    const serverToClient = new PassThrough();

    const serverConn = createConnection(
        new StreamMessageReader(clientToServer),
        new StreamMessageWriter(serverToClient),
    );
    const clientConn = createProtocolConnection(
        new StreamMessageReader(serverToClient),
        new StreamMessageWriter(clientToServer),
    );

    return { serverConn, clientConn };
};

describe('server smoke', () => {
    beforeAll(async () => {
        // Pre-warm the parser singleton so Server.onInitialize's initializeParser()
        // hits the cache instead of require.resolving the WASM in dist/.
        await initializeTestParser();
    });

    test('initialize returns expected capabilities', async () => {
        const { serverConn, clientConn } = makeInMemoryConnectionPair();

        new Server(serverConn);
        serverConn.listen();
        clientConn.listen();

        const initParams: InitializeParams = {
            processId: null,
            rootUri: 'file:///tmp',
            capabilities: {},
            workspaceFolders: [{ name: 'test', uri: 'file:///tmp' }],
        };

        const result = await clientConn.sendRequest('initialize', initParams);
        const caps = (result as any).capabilities;

        assert.ok(caps, 'capabilities missing from initialize result');
        assert.ok(caps.completionProvider, 'completionProvider not advertised');
        assert.ok(caps.hoverProvider, 'hoverProvider not advertised');
        assert.ok(caps.definitionProvider, 'definitionProvider not advertised');
        assert.ok(caps.semanticTokensProvider, 'semanticTokensProvider not advertised');

        clientConn.end();
        serverConn.dispose();
    });

    test('textDocument/completion returns items for a simple template', async () => {
        const { serverConn, clientConn } = makeInMemoryConnectionPair();

        new Server(serverConn);
        serverConn.listen();
        clientConn.listen();

        await clientConn.sendRequest('initialize', {
            processId: null,
            rootUri: 'file:///tmp',
            capabilities: {},
            workspaceFolders: [{ name: 'test', uri: 'file:///tmp' }],
        });

        // Notify server that a document was opened.
        const didOpenParams: DidOpenTextDocumentParams = {
            textDocument: {
                uri: TEST_URI,
                languageId: 'twig',
                version: 1,
                text: `{% set variable = 123 %}{{ }}`,
            },
        };
        clientConn.sendNotification('textDocument/didOpen', didOpenParams);

        // Give the server one microtask loop to process didOpen (async updateText).
        await new Promise<void>((resolve) => setTimeout(resolve, 50));

        const completionParams: CompletionParams = {
            textDocument: { uri: TEST_URI },
            position: { line: 0, character: `{% set variable = 123 %}{{`.length },
        };

        const result = await clientConn.sendRequest('textDocument/completion', completionParams);
        const items: any[] = Array.isArray(result) ? result : (result as any)?.items ?? [];

        assert.ok(items.length > 0, 'expected at least one completion item');
        assert.ok(
            items.some((i: any) => i.label === 'variable'),
            `expected 'variable' in completions, got: ${items.map((i: any) => i.label).slice(0, 10).join(', ')}`,
        );

        clientConn.end();
        serverConn.dispose();
    });
});
