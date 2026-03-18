"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, DollarSign, Truck, MapPin, Navigation, Calendar, ChevronDown, ChevronUp } from "lucide-react";

import { submitBid } from "../lib/api";

export function BidForm({
    rfqId,
    onBidSubmitted,
    disabled = false,
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
    const [isExpanded, setIsExpanded] = useState(true);

    const totalAmount = useMemo(() => {
        const freight = Number(freightCharges) || 0;
        const origin = Number(originCharges) || 0;
        const destination = Number(destinationCharges) || 0;
        return freight + origin + destination;
    }, [freightCharges, originCharges, destinationCharges]);

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (disabled) return;
        setError("");
        setIsSubmitting(true);

        try {
            await submitBid(rfqId, {
                carrierName,
                freightCharges: Number(freightCharges),
                originCharges: Number(originCharges),
                destinationCharges: Number(destinationCharges),
                transitTimeDays: Number(transitTimeDays),
                quoteValidityDate: new Date(quoteValidityDate).toISOString(),
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
        <div className="rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface-strong)", boxShadow: "var(--shadow-soft)" }}>
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full items-center justify-between px-5 py-4"
                style={{ borderBottom: isExpanded ? "1px solid var(--border)" : "none" }}
            >
                <div className="flex items-center gap-2">
                    <Send size={16} style={{ color: "var(--accent)" }} />
                    <h3 className="text-base" style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.04em", color: "var(--foreground)" }}>
                        {disabled ? "Bidding Closed" : "Submit Bid"}
                    </h3>
                </div>
                {isExpanded ? <ChevronUp size={16} style={{ color: "var(--muted-foreground)" }} /> : <ChevronDown size={16} style={{ color: "var(--muted-foreground)" }} />}
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <form onSubmit={onSubmit} className="p-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="theme-label">Carrier Name</label>
                                    <div className="relative">
                                        <Truck size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
                                        <input
                                            type="text"
                                            required
                                            disabled={disabled || isSubmitting}
                                            placeholder="Carrier Name"
                                            value={carrierName}
                                            onChange={(e) => setCarrierName(e.target.value)}
                                            className="theme-input"
                                            style={{ paddingLeft: "2.25rem" }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="theme-label">Freight Charges</label>
                                    <div className="relative">
                                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
                                        <input
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            required
                                            disabled={disabled || isSubmitting}
                                            placeholder="0.00"
                                            value={freightCharges}
                                            onChange={(e) => setFreightCharges(e.target.value)}
                                            className="theme-input"
                                            style={{ paddingLeft: "2.25rem" }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="theme-label">Origin Charges</label>
                                    <div className="relative">
                                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
                                        <input
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            required
                                            disabled={disabled || isSubmitting}
                                            placeholder="0.00"
                                            value={originCharges}
                                            onChange={(e) => setOriginCharges(e.target.value)}
                                            className="theme-input"
                                            style={{ paddingLeft: "2.25rem" }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="theme-label">Destination Charges</label>
                                    <div className="relative">
                                        <Navigation size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
                                        <input
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            required
                                            disabled={disabled || isSubmitting}
                                            placeholder="0.00"
                                            value={destinationCharges}
                                            onChange={(e) => setDestinationCharges(e.target.value)}
                                            className="theme-input"
                                            style={{ paddingLeft: "2.25rem" }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="theme-label">Transit Time (Days)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        required
                                        disabled={disabled || isSubmitting}
                                        placeholder="Days"
                                        value={transitTimeDays}
                                        onChange={(e) => setTransitTimeDays(e.target.value)}
                                        className="theme-input"
                                    />
                                </div>
                                <div>
                                    <label className="theme-label">Quote Validity</label>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
                                        <input
                                            type="datetime-local"
                                            required
                                            disabled={disabled || isSubmitting}
                                            value={quoteValidityDate}
                                            onChange={(e) => setQuoteValidityDate(e.target.value)}
                                            className="theme-input"
                                            style={{ paddingLeft: "2.25rem" }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                                <div className="rounded-xl border px-4 py-2" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted-foreground)" }}>
                                        Total Bid
                                    </span>
                                    <p className="text-2xl leading-none" style={{ fontFamily: "var(--font-heading)", color: "var(--accent)" }}>
                                        ${totalAmount.toFixed(2)}
                                    </p>
                                </div>

                                {error && <p className="theme-error">{error}</p>}

                                <button type="submit" disabled={disabled || isSubmitting} className="theme-btn-primary">
                                    {disabled ? (
                                        "Bidding Closed"
                                    ) : isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} />
                                            Submitting...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Send size={14} />
                                            Place Bid
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
