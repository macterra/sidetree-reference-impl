/**
 * Class containing reusable sorted array operations.
 */
export default class SortedArray {
    /**
     * Performs binary search on an item against the given sorted array using the given compare function.
     * @returns Returns the index of the item if found; `undefined` otherwise.
     */
    static binarySearch<T1, T2>(sortedArray: Array<T1>, searchItem: T2, compare: (item1: T1, item2: T2) => number): number | undefined;
}
