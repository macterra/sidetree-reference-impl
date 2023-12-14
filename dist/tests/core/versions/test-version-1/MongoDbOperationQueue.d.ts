/// <reference types="node" />
import MockOperationQueue from '../../../mocks/MockOperationQueue';
/**
 * Some documentation
 */
export default class MongoDbOperationQueue extends MockOperationQueue {
    private connectionString;
    constructor(connectionString: string);
    /**
     * Initialize.
     */
    initialize(): void;
    enqueue(didUniqueSuffix: string, operationBuffer: Buffer): Promise<void>;
}
