export class IdGenerator {
    private static lastId: number = 0;

    public static getNext(): number {
        this.lastId = this.lastId + 1;
        return this.lastId;
    }
}