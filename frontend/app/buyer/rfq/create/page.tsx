"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createRFQ, type CreateRFQRequest, type TriggerType } from "../../../../lib/api";
import { useRequireAuth } from "../../../../lib/use-require-auth";

type FieldErrors = Partial<Record<keyof CreateRFQRequest, string>>;

const triggerOptions: Array<{ label: string; value: TriggerType }> = [
    { label: "Any Bid Received", value: "BID_RECEIVED" },
    { label: "Any Rank Change", value: "ANY_RANK_CHANGE" },
    { label: "L1 (Lowest Bidder) Change Only", value: "L1_CHANGE_ONLY" }
];

function toIsoString(value: string): string {
    return new Date(value).toISOString();
}

function mapApiErrors(errors: string[]): FieldErrors {
    const mapped: FieldErrors = {};

    for (const error of errors) {
        const lower = error.toLowerCase();

        if (lower.includes("name")) {
            mapped.name = error;
        } else if (lower.includes("bidstarttime")) {
            mapped.bidStartTime = error;
        } else if (lower.includes("bidclosetime")) {
            mapped.bidCloseTime = error;
        } else if (lower.includes("forcedclosetime")) {
            mapped.forcedCloseTime = error;
        } else if (lower.includes("pickupdate")) {
            mapped.pickupDate = error;
        } else if (lower.includes("triggerwindowmins")) {
            mapped.triggerWindowMins = error;
        } else if (lower.includes("extensiondurationmins")) {
            mapped.extensionDurationMins = error;
        } else if (lower.includes("triggertype")) {
            mapped.triggerType = error;
        }
    }

    return mapped;
}

export default function CreateRFQPage() {
    const router = useRouter();
    const { user, loading } = useRequireAuth("BUYER");

    const [name, setName] = useState("");
    const [bidStartTime, setBidStartTime] = useState("");
    const [bidCloseTime, setBidCloseTime] = useState("");
    const [forcedCloseTime, setForcedCloseTime] = useState("");
    const [pickupDate, setPickupDate] = useState("");
    const [triggerWindowMins, setTriggerWindowMins] = useState("1");
    const [extensionDurationMins, setExtensionDurationMins] = useState("1");
    const [triggerType, setTriggerType] = useState<TriggerType>("BID_RECEIVED");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = useMemo(() => !isSubmitting && !loading && !!user, [isSubmitting, loading, user]);

    if (loading || !user || user.role !== "BUYER") {
        return <main className="p-6">Loading...</main>;
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError("");
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            await createRFQ({
                name,
                bidStartTime: toIsoString(bidStartTime),
                bidCloseTime: toIsoString(bidCloseTime),
                forcedCloseTime: toIsoString(forcedCloseTime),
                pickupDate: toIsoString(pickupDate),
                triggerWindowMins: Number(triggerWindowMins),
                extensionDurationMins: Number(extensionDurationMins),
                triggerType
            });

            router.push("/buyer/dashboard");
        } catch (error) {
            if (error instanceof Error) {
                const message = error.message;

                if (message.startsWith("[") && message.endsWith("]")) {
                    try {
                        const parsedErrors = JSON.parse(message) as string[];
                        setFieldErrors(mapApiErrors(parsedErrors));
                        setFormError("Please correct the highlighted fields.");
                        return;
                    } catch {
                        setFormError(message);
                        return;
                    }
                }

                setFormError(message);
                return;
            }

            setFormError("Failed to create RFQ");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="theme-page-bg theme-text min-h-screen p-6">
            <div className="theme-surface theme-shadow-soft mx-auto max-w-3xl rounded-lg p-6">
                <h1 className="theme-text mb-6 text-2xl font-semibold">Create RFQ</h1>

                {formError ? <p className="mb-4 text-sm text-red-600">{formError}</p> : null}

                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div>
                        <label className="theme-text-muted mb-1 block text-sm font-medium">RFQ Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="theme-surface-soft theme-border theme-text w-full rounded-md border px-3 py-2"
                        />
                        {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Bid Start Date and Time</label>
                        <input
                            type="datetime-local"
                            required
                            value={bidStartTime}
                            onChange={(event) => setBidStartTime(event.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2"
                        />
                        {fieldErrors.bidStartTime ? <p className="mt-1 text-xs text-red-600">{fieldErrors.bidStartTime}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Bid Close Date and Time</label>
                        <input
                            type="datetime-local"
                            required
                            value={bidCloseTime}
                            onChange={(event) => setBidCloseTime(event.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2"
                        />
                        {fieldErrors.bidCloseTime ? <p className="mt-1 text-xs text-red-600">{fieldErrors.bidCloseTime}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Forced Bid Close Date and Time</label>
                        <input
                            type="datetime-local"
                            required
                            value={forcedCloseTime}
                            onChange={(event) => setForcedCloseTime(event.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2"
                        />
                        {fieldErrors.forcedCloseTime ? <p className="mt-1 text-xs text-red-600">{fieldErrors.forcedCloseTime}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Pickup / Service Date</label>
                        <input
                            type="datetime-local"
                            required
                            value={pickupDate}
                            onChange={(event) => setPickupDate(event.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2"
                        />
                        {fieldErrors.pickupDate ? <p className="mt-1 text-xs text-red-600">{fieldErrors.pickupDate}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Trigger Window in minutes</label>
                        <input
                            type="number"
                            min={1}
                            required
                            value={triggerWindowMins}
                            onChange={(event) => setTriggerWindowMins(event.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2"
                        />
                        {fieldErrors.triggerWindowMins ? <p className="mt-1 text-xs text-red-600">{fieldErrors.triggerWindowMins}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Extension Duration in minutes</label>
                        <input
                            type="number"
                            min={1}
                            required
                            value={extensionDurationMins}
                            onChange={(event) => setExtensionDurationMins(event.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2"
                        />
                        {fieldErrors.extensionDurationMins ? <p className="mt-1 text-xs text-red-600">{fieldErrors.extensionDurationMins}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Extension Trigger Type</label>
                        <select
                            value={triggerType}
                            onChange={(event) => setTriggerType(event.target.value as TriggerType)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2"
                        >
                            {triggerOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {fieldErrors.triggerType ? <p className="mt-1 text-xs text-red-600">{fieldErrors.triggerType}</p> : null}
                    </div>

                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="theme-accent-bg mt-2 rounded-md px-4 py-2 font-semibold disabled:opacity-60"
                    >
                        {isSubmitting ? "Creating..." : "Create RFQ"}
                    </button>
                </form>
            </div>
        </main>
    );
}
