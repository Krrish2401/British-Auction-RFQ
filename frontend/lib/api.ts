export type AuthUser = {
    id: string;
    email: string;
    name: string;
    role: "BUYER" | "SUPPLIER";
};

type ApiFetchOptions = Omit<RequestInit, "credentials">;

type RegisterData = {
    name: string;
    email: string;
    password: string;
    role: "BUYER" | "SUPPLIER";
};

type LoginData = {
    email: string;
    password: string;
};

export type RFQStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "FORCE_CLOSED";

export type TriggerType = "BID_RECEIVED" | "ANY_RANK_CHANGE" | "L1_CHANGE_ONLY";

export type CreateRFQRequest = {
    name: string;
    bidStartTime: string;
    bidCloseTime: string;
    forcedCloseTime: string;
    pickupDate: string;
    triggerWindowMins: number;
    extensionDurationMins: number;
    triggerType: TriggerType;
};

export type RFQSummary = {
    id: string;
    referenceId: string;
    name: string;
    status: RFQStatus;
    bidStartTime: string;
    bidCloseTime: string;
    originalBidCloseTime: string;
    forcedCloseTime: string;
    pickupDate: string;
    buyerId: string;
    createdAt: string;
    updatedAt: string;
    auctionConfig: {
        id: string;
        rfqId: string;
        triggerWindowMins: number;
        extensionDurationMins: number;
        triggerType: TriggerType;
        createdAt: string;
    } | null;
    currentLowestBid: number | null;
    totalBidCount: number;
};

export type RFQDetails = {
    id: string;
    referenceId: string;
    name: string;
    buyerId: string;
    status: RFQStatus;
    bidStartTime: string;
    bidCloseTime: string;
    originalBidCloseTime: string;
    forcedCloseTime: string;
    pickupDate: string;
    auctionConfig: {
        id: string;
        rfqId: string;
        triggerWindowMins: number;
        extensionDurationMins: number;
        triggerType: TriggerType;
        createdAt: string;
    } | null;
    extensions: Array<{
        id: string;
        rfqId: string;
        triggeringBidId: string;
        triggerType: TriggerType;
        previousCloseTime: string;
        newCloseTime: string;
        createdAt: string;
    }>;
    activityLogs: Array<{
        id: string;
        rfqId: string;
        activityType: string;
        description: string;
        bidId: string | null;
        extensionId: string | null;
        occurredAt: string;
    }>;
    bids: Array<{
        id: string;
        rfqId: string;
        supplierId: string;
        carrierName: string;
        freightCharges: string;
        originCharges: string;
        destinationCharges: string;
        transitTimeDays: number;
        quoteValidityDate: string;
        totalAmount: string;
        rankAtSubmission: number;
        receivedAt: string;
        currentRank: number | null;
        supplier: {
            name: string;
        };
    }>;
    rankings: Array<{
        supplierId: string;
        supplierName: string;
        bidId: string;
        totalAmount: string;
        rank: number;
        receivedAt: string;
    }>;
};

export type SubmitBidRequest = {
    carrierName: string;
    freightCharges: number;
    originCharges: number;
    destinationCharges: number;
    transitTimeDays: number;
    quoteValidityDate: string;
};

export type BidsListItem = {
    id: string;
    rfqId: string;
    supplierId: string;
    carrierName: string;
    freightCharges: string;
    originCharges: string;
    destinationCharges: string;
    transitTimeDays: number;
    quoteValidityDate: string;
    totalAmount: string;
    rankAtSubmission: number;
    receivedAt: string;
    currentRank: number | null;
    supplier: {
        name: string;
    };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
    const method = options.method ?? "GET";
    const shouldSendJsonHeader = method !== "GET";

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            ...(shouldSendJsonHeader ? { "Content-Type": "application/json" } : {}),
            ...(options.headers ?? {})
        }
    });

    const contentType = response.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json") ? await response.json() : {};

    if (!response.ok) {
        if (Array.isArray(data?.errors)) {
            throw new Error(JSON.stringify(data.errors));
        }

        const message = typeof data?.error === "string" ? data.error : "Request failed";
        throw new Error(message);
    }

    return data as T;
}

export function registerUser(data: RegisterData): Promise<AuthUser> {
    return apiFetch<AuthUser>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

export function loginUser(data: LoginData): Promise<AuthUser> {
    return apiFetch<AuthUser>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

export function logoutUser(): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/api/auth/logout", {
        method: "POST"
    });
}

export function getMe(): Promise<AuthUser> {
    return apiFetch<AuthUser>("/api/auth/me");
}

export function createRFQ(data: CreateRFQRequest): Promise<RFQDetails> {
    return apiFetch<RFQDetails>("/api/rfq", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

export function listRFQs(): Promise<RFQSummary[]> {
    return apiFetch<RFQSummary[]>("/api/rfq");
}

export function getRFQ(rfqId: string): Promise<RFQDetails> {
    return apiFetch<RFQDetails>(`/api/rfq/${rfqId}`);
}

export function getBids(rfqId: string): Promise<BidsListItem[]> {
    return apiFetch<BidsListItem[]>(`/api/rfq/${rfqId}/bids`);
}

export function submitBid(
    rfqId: string,
    data: SubmitBidRequest
): Promise<{ bid: BidsListItem; rankings: RFQDetails["rankings"] }> {
    return apiFetch<{ bid: BidsListItem; rankings: RFQDetails["rankings"] }>(`/api/rfq/${rfqId}/bids`, {
        method: "POST",
        body: JSON.stringify(data)
    });
}
