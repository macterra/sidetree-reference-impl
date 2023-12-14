import BlockchainTimeModel from '../../lib/core/models/BlockchainTimeModel';
import IBlockchain from '../../lib/core/interfaces/IBlockchain';
import ServiceVersionModel from '../../lib/common/models/ServiceVersionModel';
import TransactionModel from '../../lib/common/models/TransactionModel';
import ValueTimeLockModel from '../../lib/common/models/ValueTimeLockModel';
/**
 * Mock Blockchain class for testing.
 */
export default class MockBlockchain implements IBlockchain {
    /** Stores each hash & fee given in write() method. */
    hashes: [string, number][];
    write(anchorString: string, fee: number): Promise<void>;
    read(sinceTransactionNumber?: number, _transactionTimeHash?: string): Promise<{
        moreTransactions: boolean;
        transactions: TransactionModel[];
    }>;
    getFirstValidTransaction(_transactions: TransactionModel[]): Promise<TransactionModel | undefined>;
    getServiceVersion(): Promise<ServiceVersionModel>;
    private latestTime?;
    getLatestTime(): Promise<BlockchainTimeModel>;
    /**
     * Hardcodes the latest time to be returned.
     */
    setLatestTime(time: BlockchainTimeModel): void;
    getFee(transactionTime: number): Promise<number>;
    getValueTimeLock(_lockIdentifer: string): Promise<ValueTimeLockModel | undefined>;
    getWriterValueTimeLock(): Promise<ValueTimeLockModel | undefined>;
}
