import * as vscode from 'vscode';
import type { BaseLanguageClient } from 'vscode-languageclient';
import { AutoInsertRequest } from 'twiggy-language-server/src/customRequests/AutoInsertRequest';

type AutoInsertProvider = (document: vscode.TextDocument, position: vscode.Position, lastChange: vscode.TextDocumentContentChangeEvent, isCancel: () => boolean) => Thenable<string | vscode.TextEdit | null | undefined>;

export async function activate(
	clients: BaseLanguageClient[],
	active: (document: vscode.TextDocument) => boolean,
) {
	let isEnabled = false;
	let timeout: NodeJS.Timeout | null = null;

	updateEnabledState();

	const d1 = vscode.workspace.onDidChangeTextDocument(onDidChangeTextDocument, null);
	const d2 = vscode.window.onDidChangeActiveTextEditor(updateEnabledState, null);

	return vscode.Disposable.from(d1, d2);

	function updateEnabledState() {
		isEnabled = false;
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const { document } = editor;
		if (!active(document)) {
			return;
		}
		isEnabled = true;
	}

	function onDidChangeTextDocument({ document, contentChanges, reason }: vscode.TextDocumentChangeEvent) {
		if (!isEnabled || contentChanges.length === 0 || reason === vscode.TextDocumentChangeReason.Undo || reason === vscode.TextDocumentChangeReason.Redo) {
			return;
		}
		const activeDocument = vscode.window.activeTextEditor?.document;
		if (document !== activeDocument) {
			return;
		}

		const lastChange = contentChanges.at(-1);
		if (!lastChange) {
			return;
		}

		doAutoInsert(document, lastChange, async (changedDocument, position, change, isCancel) => {
			for (const client of clients) {
				const params = {
					...client.code2ProtocolConverter.asTextDocumentPositionParams(changedDocument, position),
					options: {
						lastChange: {
							...change,
							range: client.code2ProtocolConverter.asRange(change.range),
						},
					},
				};

				if (isCancel()) return undefined;

				const result = await client.sendRequest<AutoInsertRequest.ResponseType>(AutoInsertRequest.type, params);

				if (result === undefined || result === null) {
					continue;
				}

				return typeof result === 'string'
					? result
					: client.protocol2CodeConverter.asTextEdit(result);
			}

			return undefined;
		});
	}

	function doAutoInsert(
		document: vscode.TextDocument,
		lastChange: vscode.TextDocumentContentChangeEvent,
		provider: AutoInsertProvider,
	) {
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}
		const { version } = document;
		timeout = setTimeout(() => {
			void applyAutoInsert(document, lastChange, provider, version);
			timeout = null;
		}, 100);
	}

	async function applyAutoInsert(
		document: vscode.TextDocument,
		lastChange: vscode.TextDocumentContentChangeEvent,
		provider: AutoInsertProvider,
		version: number,
	) {
		const rangeStart = lastChange.range.start;
		const position = new vscode.Position(rangeStart.line, rangeStart.character + lastChange.text.length);
		const text = await provider(document, position, lastChange, () => vscode.window.activeTextEditor?.document.version !== version);
		if (text === undefined || text === null || text === '' || !isEnabled) return;

		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) return;

		const activeDocument = activeEditor.document;
		if (document !== activeDocument || activeDocument.version !== version) return;

		if (typeof text === 'string') {
			const { selections } = activeEditor;
			if (selections.some(s => s.active.isEqual(position))) {
				activeEditor.insertSnippet(new vscode.SnippetString(text), selections.map(s => s.active));
			}
			else {
				activeEditor.insertSnippet(new vscode.SnippetString(text), position);
			}
		}
		else {
			activeEditor.insertSnippet(new vscode.SnippetString(text.newText), text.range);
		}
	}
}
