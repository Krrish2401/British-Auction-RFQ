export type CreateRFQRequestDto = {
    name: string;
    bidStartTime: string;
    bidCloseTime: string;
    forcedCloseTime: string;
    pickupDate: string;
    triggerWindowMins: number;
    extensionDurationMins: number;
    triggerType: "BID_RECEIVED" | "ANY_RANK_CHANGE" | "L1_CHANGE_ONLY";
};

export type RFQListItemDto = {
    id: string;
    referenceId: string;
    name: string;
    status: "DRAFT" | "ACTIVE" | "CLOSED" | "FORCE_CLOSED";
    bidStartTime: Date;
    bidCloseTime: Date;
    originalBidCloseTime: Date;
    forcedCloseTime: Date;
    pickupDate: Date;
    buyerId: string;
    createdAt: Date;
    updatedAt: Date;
    auctionConfig: {
        id: string;
        rfqId: string;
        triggerWindowMins: number;
        extensionDurationMins: number;
        triggerType: "BID_RECEIVED" | "ANY_RANK_CHANGE" | "L1_CHANGE_ONLY";
        createdAt: Date;
    } | null;
    currentLowestBid: number | null;
    totalBidCount: number;
};
