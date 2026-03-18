export type SubmitBidRequestDto = {
    carrierName: string;
    freightCharges: number;
    originCharges: number;
    destinationCharges: number;
    transitTimeDays: number;
    quoteValidityDate: string;
};
