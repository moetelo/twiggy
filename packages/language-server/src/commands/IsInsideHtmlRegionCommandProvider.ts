import { Connection } from 'vscode-languageserver';
import { isInsideHtmlRegion } from '../utils/node';
import { DocumentCache } from '../documents';
import { IsInsideHtmlRegionRequest } from 'customRequests/IsInsideHtmlRegionRequest';

export class IsInsideHtmlRegionCommandProvider {
    constructor(
        connection: Connection,
        private readonly documentCache: DocumentCache,
    ) {
        connection.onRequest(
            IsInsideHtmlRegionRequest.type,
            this.isInsideHtmlRegionCommand.bind(this),
        );
    }

    private async isInsideHtmlRegionCommand({ textDocument, position }: IsInsideHtmlRegionRequest.ParamsType) {
        const document = await this.documentCache.get(textDocument.uri);
        return isInsideHtmlRegion(document, position)
    };
}
