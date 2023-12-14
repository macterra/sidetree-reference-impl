import AnchoredOperationModel from '../../lib/core/models/AnchoredOperationModel';
import IOperationStore from '../../lib/core/interfaces/IOperationStore';
/**
 * A simple in-memory implementation of operation store.
 */
export default class MockOperationStore implements IOperationStore {
    private readonly didToOperations;
    private readonly didUpdatedSinceLastSort;
    /**
     * Inserts an operation into the in-memory store.
     */
    private insert;
    insertOrReplace(operations: AnchoredOperationModel[]): Promise<void>;
    /**
     * Implements OperationStore.get().
     * Get an iterator that returns all operations with a given
     * didUniqueSuffix ordered by (transactionNumber, operationIndex).
     */
    get(didUniqueSuffix: string): Promise<AnchoredOperationModel[]>;
    /**
     * Delete all operations transactionNumber greater than the given transactionNumber.
     */
    delete(transactionNumber?: number): Promise<void>;
    deleteUpdatesEarlierThan(_didUniqueSuffix: string, _transactionNumber: number, _operationIndex: number): Promise<void>;
    /**
     * Remove operations. A simple linear scan + filter that leaves the
     * original order intact for non-filters operations.
     */
    private static removeOperations;
    private ensureDidContainerExist;
}
