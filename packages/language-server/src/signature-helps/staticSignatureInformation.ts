import { SignatureInformation } from 'vscode-languageserver';
import { twigFunctions } from '../staticCompletionInfo';

export const twigFunctionsSignatureInformation = new Map<
    string,
    SignatureInformation
>(
    twigFunctions.map(item => {
        const label = item.label;
        const params = item.parameters?.map(item => item.label).join(', ');
        const signatureInformation: SignatureInformation = {
            label: `${item.label}(${params ?? ''})`,
            parameters: item.parameters,
        };

        if (item.return) {
            signatureInformation.label += `: ${item.return}`;
        }

        return [label, signatureInformation];
    }),
);
