export class FilterDescriptor {
    constructor(id: any, predicate: (x: any) => boolean, groupId?: any) {
        this.predicate = predicate;
        this.groupId = groupId;
        this.id = id;
    }

    id: any;
    groupId: any;
    predicate: (x: any) => boolean;
}