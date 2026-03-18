export type AuthUser = {
    id: string;
    email: string;
    name: string;
    role: "BUYER" | "SUPPLIER";
};

type ApiFetchOptions = Omit<RequestInit, "credentials">;

let serverTimeOffsetMs = 0;

type ApiErrorPayload = {
    error?: string;
    message?: string;
    code?: string;
    errors?: string[];
};

export class ApiError extends Error {
    readonly status: number;
    readonly code?: string;
    readonly errors?: string[];

    constructor(message: string, options: { status: number; code?: string; errors?: string[] }) {
        super(message);
        this.name = "ApiError";
        this.status = options.status;
        this.code = options.code;
        this.errors = options.errors;
    }
}

export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
}

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

export type BidsListResponse = {
    items: BidsListItem[];
    nextCursor: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function syncServerTimeOffset(response: Response): void {
    const serverDateHeader = response.headers.get("date");
    if (!serverDateHeader) {
        return;
    }

    const serverMs = new Date(serverDateHeader).getTime();
    if (Number.isNaN(serverMs)) {
        return;
    }

    serverTimeOffsetMs = serverMs - Date.now();
}

export function getServerNowMs(): number {
    return Date.now() + serverTimeOffsetMs;
}

function toApiError(status: number, payload: ApiErrorPayload): ApiError {
    const message =
        (typeof payload.error === "string" && payload.error) ||
        (typeof payload.message === "string" && payload.message) ||
        "Request failed";

    const code = typeof payload.code === "string" ? payload.code : undefined;
    const errors = Array.isArray(payload.errors)
        ? payload.errors.filter((item): item is string => typeof item === "string")
        : undefined;

    return new ApiError(message, { status, code, errors });
}

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

    syncServerTimeOffset(response);

    const contentType = response.headers.get("content-type") ?? "";
    const data: ApiErrorPayload | T = contentType.includes("application/json") ? await response.json() : {};

    if (!response.ok) {
        throw toApiError(response.status, (data as ApiErrorPayload) ?? {});
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

export function getBids(rfqId: string, options?: { limit?: number; cursor?: string }): Promise<BidsListResponse> {
    const params = new URLSearchParams();

    if (options?.limit !== undefined) {
        params.set("limit", String(options.limit));
    }

    if (options?.cursor) {
        params.set("cursor", options.cursor);
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<BidsListResponse>(`/api/rfq/${rfqId}/bids${suffix}`);
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


