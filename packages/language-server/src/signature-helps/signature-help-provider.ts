import {
  ParameterInformation,
  SignatureInformation,
  SignatureHelp,
  SignatureHelpParams,
} from 'vscode-languageserver';
import { Server } from '../server';
import { findNodeByPosition } from '../utils/find-element-by-position';

const twigFunctions = new Map<string, SignatureInformation>([
  [
    'date',
    {
      label: 'date',
      documentation: 'Converts an input to a \\DateTime instance.',
      parameters: [
        {
          label: 'date',
          documentation: 'A date or null to use the current time',
        },
        {
          label: 'timezone',
          documentation:
            'The target timezone, null to use the default, false to leave unchanged',
        },
      ],
    },
  ],
]);

export class SignatureHelpProvider {
  server: Server;

  constructor(server: Server) {
    this.server = server;

    this.server.connection.onSignatureHelp(
      this.provideSignatureHelp.bind(this)
    );
  }

  async provideSignatureHelp(
    params: SignatureHelpParams
  ): Promise<SignatureHelp | null | undefined> {
    const uri = params.textDocument.uri;
    const document = this.server.documentCache.getDocument(uri);

    if (!document) {
      return;
    }

    const cst = await document.cst();
    const cursorNode = findNodeByPosition(cst.rootNode, params.position);

    if (cursorNode?.parent?.type !== 'arguments') {
      return;
    }

    const callExpression = cursorNode.parent.parent;

    if (!callExpression || callExpression.type !== 'call_expression') {
      return;
    }

    const callName = callExpression.childForFieldName('name')?.text;

    if (!callName) {
      return;
    }

    const signatureInformation = twigFunctions.get(callName);

    if (!signatureInformation) {
      return;
    }

    return <SignatureHelp>{
      signatures: [signatureInformation],
    };
  }
}
