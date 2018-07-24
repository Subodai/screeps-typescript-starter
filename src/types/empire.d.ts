interface ResourceRequest {
    id: number;
    room: string;
    resource: ResourceConstant;
    amount: number;
}

interface ReactionRequest {
    id: number;
    room: string;
    compound: ResourceConstant;
    amount: number;
}

interface Empire {
    requestQueue: ResourceRequest[];
    addRequest(room: Room, res: ResourceConstant, amount: number): void;
    removeRequest(id: number): void;
    getTopRequest(): ResourceRequest;
    getAllRequests(): ResourceRequest[];
    fulfilRequest(id: number, room: Room, amount: number): ScreepsReturnCode;
    processRequestQueue(): void;
    loadQueueFromCache(): void;
    saveQueueToCache(): void;
    saveQueueToMemory(): void;
    run(): void;
}