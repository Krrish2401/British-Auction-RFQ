import type { CreateRFQRequestDto } from "../dto/rfq.dto.js";

const VALID_TRIGGER_TYPES = new Set(["BID_RECEIVED", "ANY_RANK_CHANGE", "L1_CHANGE_ONLY"]);

function isValidDate(value: unknown): value is string {
    if (typeof value !== "string") {
        return false;
    }

    return !Number.isNaN(new Date(value).getTime());
}

function toDate(value: string): Date {
    return new Date(value);
}

export function generateReferenceId(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const randomPart = String(Math.floor(Math.random() * 10000)).padStart(4, "0");

    return `RFQ-${year}${month}${day}-${randomPart}`;
}

export function validateRFQInput(body: Partial<CreateRFQRequestDto>): string[] {
    const errors: string[] = [];

    if (typeof body.name !== "string" || body.name.trim() === "") {
        errors.push("name is required");
    }

    if (!isValidDate(body.bidStartTime)) {
        errors.push("bidStartTime must be a valid ISO datetime string");
    }

    if (!isValidDate(body.bidCloseTime)) {
        errors.push("bidCloseTime must be a valid ISO datetime string");
    }

    if (!isValidDate(body.forcedCloseTime)) {
        errors.push("forcedCloseTime must be a valid ISO datetime string");
    }

    if (!isValidDate(body.pickupDate)) {
        errors.push("pickupDate must be a valid ISO datetime string");
    }

    if (!Number.isInteger(body.triggerWindowMins) || Number(body.triggerWindowMins) <= 0) {
        errors.push("triggerWindowMins must be a positive integer");
    }

    if (!Number.isInteger(body.extensionDurationMins) || Number(body.extensionDurationMins) <= 0) {
        errors.push("extensionDurationMins must be a positive integer");
    }

    if (typeof body.triggerType !== "string" || !VALID_TRIGGER_TYPES.has(body.triggerType)) {
        errors.push("triggerType must be BID_RECEIVED, ANY_RANK_CHANGE, or L1_CHANGE_ONLY");
    }

    if (
        !body.bidStartTime ||
        !body.bidCloseTime ||
        !body.forcedCloseTime ||
        !body.pickupDate ||
        !isValidDate(body.bidStartTime) ||
        !isValidDate(body.bidCloseTime) ||
        !isValidDate(body.forcedCloseTime) ||
        !isValidDate(body.pickupDate)
    ) {
        return errors;
    }

    const now = new Date();
    const bidStartTime = toDate(body.bidStartTime);
    const bidCloseTime = toDate(body.bidCloseTime);
    const forcedCloseTime = toDate(body.forcedCloseTime);
    const pickupDate = toDate(body.pickupDate);

    if (bidStartTime <= now) {
        errors.push("bidStartTime must be in the future");
    }

    if (bidCloseTime <= bidStartTime) {
        errors.push("bidCloseTime must be greater than bidStartTime");
    }

    if (forcedCloseTime <= bidCloseTime) {
        errors.push("forcedCloseTime must be greater than bidCloseTime");
    }

    if (pickupDate < bidCloseTime) {
        errors.push("pickupDate must be greater than or equal to bidCloseTime");
    }

    const triggerWindowMins = body.triggerWindowMins;
    const parsedTriggerWindowMins = Number(triggerWindowMins);

    if (Number.isInteger(triggerWindowMins)) {
        const auctionDurationMins = (bidCloseTime.getTime() - bidStartTime.getTime()) / 60000;

        if (parsedTriggerWindowMins >= auctionDurationMins) {
            errors.push("triggerWindowMins must be less than total auction duration in minutes");
        }
    }

    return errors;
}
