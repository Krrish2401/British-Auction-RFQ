"use client";

import { useMemo, useState } from "react";

import { submitBid } from "../lib/api";

export function BidForm({
    rfqId,
    onBidSubmitted,
    disabled = false
}: {
    rfqId: string;
    onBidSubmitted: () => void;
    disabled?: boolean;
}) {
    const [carrierName, setCarrierName] = useState("");
    const [freightCharges, setFreightCharges] = useState("");
    const [originCharges, setOriginCharges] = useState("");
    const [destinationCharges, setDestinationCharges] = useState("");
    const [transitTimeDays, setTransitTimeDays] = useState("");
    const [quoteValidityDate, setQuoteValidityDate] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalAmount = useMemo(() => {
        const freight = Number(freightCharges) || 0;
        const origin = Number(originCharges) || 0;
        const destination = Number(destinationCharges) || 0;
        return freight + origin + destination;
    }, [freightCharges, originCharges, destinationCharges]);

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (disabled) {
            return;
        }
        setError("");
        setIsSubmitting(true);

        try {
            await submitBid(rfqId, {
                carrierName,
                freightCharges: Number(freightCharges),
                originCharges: Number(originCharges),
                destinationCharges: Number(destinationCharges),
                transitTimeDays: Number(transitTimeDays),
                quoteValidityDate: new Date(quoteValidityDate).toISOString()
            });

            setCarrierName("");
            setFreightCharges("");
            setOriginCharges("");
            setDestinationCharges("");
            setTransitTimeDays("");
            setQuoteValidityDate("");
            onBidSubmitted();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Failed to submit bid");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Submit Bid</h3>

            <div className="grid gap-3 md:grid-cols-2">
                <input
                    type="text"
                    required
                    disabled={disabled || isSubmitting}
                    placeholder="Carrier Name"
                    value={carrierName}
                    onChange={(event) => setCarrierName(event.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2"
                />
                <input
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    disabled={disabled || isSubmitting}
                    placeholder="Freight Charges"
                    value={freightCharges}
                    onChange={(event) => setFreightCharges(event.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2"
                />
                <input
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    disabled={disabled || isSubmitting}
                    placeholder="Origin Charges"
                    value={originCharges}
                    onChange={(event) => setOriginCharges(event.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2"
                />
                <input
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    disabled={disabled || isSubmitting}
                    placeholder="Destination Charges"
                    value={destinationCharges}
                    onChange={(event) => setDestinationCharges(event.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2"
                />
                <input
                    type="number"
                    min={1}
                    required
                    disabled={disabled || isSubmitting}
                    placeholder="Transit Time (Days)"
                    value={transitTimeDays}
                    onChange={(event) => setTransitTimeDays(event.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2"
                />
                <input
                    type="datetime-local"
                    required
                    disabled={disabled || isSubmitting}
                    value={quoteValidityDate}
                    onChange={(event) => setQuoteValidityDate(event.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2"
                />
            </div>

            <p className="mt-3 text-sm font-medium text-slate-700">Total Amount: ${totalAmount.toFixed(2)}</p>
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

            <button
                type="submit"
                disabled={disabled || isSubmitting}
                className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
            >
                {disabled ? "Bidding Closed" : isSubmitting ? "Submitting..." : "Submit Bid"}
            </button>
        </form>
    );
}
