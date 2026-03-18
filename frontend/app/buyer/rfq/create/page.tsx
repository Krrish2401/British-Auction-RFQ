"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, FileText, Clock, Settings, Send } from "lucide-react";

import { ApiError, createRFQ, type CreateRFQRequest, type TriggerType } from "../../../../lib/api";
import { useRequireAuth } from "../../../../lib/use-require-auth";
import { Navbar } from "../../../../components/Navbar";

type FieldErrors = Partial<Record<keyof CreateRFQRequest, string>>;

const triggerOptions: Array<{ label: string; value: TriggerType; desc: string }> = [
    { label: "Any Bid Received", value: "BID_RECEIVED", desc: "Extend whenever any bid arrives in the trigger window" },
    { label: "Any Rank Change", value: "ANY_RANK_CHANGE", desc: "Extend only when supplier rankings change" },
    { label: "L1 Change Only", value: "L1_CHANGE_ONLY", desc: "Extend only when the lowest bidder changes" },
];

function toIsoString(value: string): string {
    return new Date(value).toISOString();
}

function mapApiErrors(errors: string[]): FieldErrors {
    const mapped: FieldErrors = {};
    for (const error of errors) {
        const lower = error.toLowerCase();
        if (lower.includes("name")) mapped.name = error;
        else if (lower.includes("bidstarttime")) mapped.bidStartTime = error;
        else if (lower.includes("bidclosetime")) mapped.bidCloseTime = error;
        else if (lower.includes("forcedclosetime")) mapped.forcedCloseTime = error;
        else if (lower.includes("pickupdate")) mapped.pickupDate = error;
        else if (lower.includes("triggerwindowmins")) mapped.triggerWindowMins = error;
        else if (lower.includes("extensiondurationmins")) mapped.extensionDurationMins = error;
        else if (lower.includes("triggertype")) mapped.triggerType = error;
    }
    return mapped;
}

export default function CreateRFQPage() {
    const router = useRouter();
    const { user, loading } = useRequireAuth("BUYER");

    const [step, setStep] = useState(1);
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
        return (
            <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--background)" }}>
                <div className="h-10 w-10 animate-spin rounded-full border-2" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
            </div>
        );
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
                triggerType,
            });
            router.push("/buyer/dashboard");
        } catch (error) {
            if (error instanceof ApiError) {
                if (error.errors && error.errors.length > 0) {
                    setFieldErrors(mapApiErrors(error.errors));
                    setFormError("Please correct the highlighted fields.");
                    return;
                }
                setFormError(error.message);
                return;
            }
            setFormError("Failed to create RFQ");
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        { num: 1, label: "Details", icon: FileText },
        { num: 2, label: "Timing", icon: Clock },
        { num: 3, label: "Rules", icon: Settings },
    ];

    const progress = Math.round((step / 3) * 100);

    return (
        <div className="min-h-screen" style={{ background: "var(--background)" }}>
            <Navbar />

            <div className="mx-auto max-w-2xl px-4 pb-12 pt-24 sm:px-6">
                {/* Back */}
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    type="button"
                    onClick={() => step > 1 ? setStep(step - 1) : router.push("/buyer/dashboard")}
                    className="theme-btn-ghost mb-6 flex items-center gap-1.5 text-sm"
                >
                    <ArrowLeft size={14} />
                    {step > 1 ? "Previous Step" : "Back to Dashboard"}
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="theme-card overflow-hidden"
                    style={{ boxShadow: "var(--shadow-soft)" }}
                >
                    {/* Progress bar */}
                    <div className="px-6 pt-6">
                        <div className="mb-1 flex items-center justify-between">
                            <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Create RFQ</h1>
                            <span className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>{progress}% Complete</span>
                        </div>
                        <div className="mb-6 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-soft)" }}>
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: "var(--accent)" }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.4 }}
                            />
                        </div>

                        {/* Step indicators */}
                        <div className="mb-6 flex items-center gap-3">
                            {steps.map((s) => (
                                <button
                                    key={s.num}
                                    type="button"
                                    onClick={() => setStep(s.num)}
                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all"
                                    style={{
                                        background: step === s.num ? "var(--accent)" : "var(--surface-soft)",
                                        color: step === s.num ? "var(--accent-contrast)" : "var(--muted-foreground)",
                                        border: `1px solid ${step === s.num ? "var(--accent)" : "var(--border)"}`,
                                    }}
                                >
                                    <s.icon size={14} />
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {formError && <p className="theme-error px-6">{formError}</p>}

                    <form onSubmit={handleSubmit} className="px-6 pb-6">
                        {/* Step 1: Details */}
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                                <div>
                                    <label className="theme-label">RFQ Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="theme-input"
                                        placeholder="e.g., Q1 Freight Services 2026"
                                    />
                                    {fieldErrors.name && <p className="theme-error">{fieldErrors.name}</p>}
                                </div>
                                <div>
                                    <label className="theme-label">Pickup / Service Date</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={pickupDate}
                                        onChange={(e) => setPickupDate(e.target.value)}
                                        className="theme-input"
                                    />
                                    {fieldErrors.pickupDate && <p className="theme-error">{fieldErrors.pickupDate}</p>}
                                </div>
                                <button type="button" onClick={() => setStep(2)} className="theme-btn-primary w-full">
                                    Continue to Timing <ArrowRight size={16} />
                                </button>
                            </motion.div>
                        )}

                        {/* Step 2: Timing */}
                        {step === 2 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                                <div>
                                    <label className="theme-label">Bid Start Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={bidStartTime}
                                        onChange={(e) => setBidStartTime(e.target.value)}
                                        className="theme-input"
                                    />
                                    {fieldErrors.bidStartTime && <p className="theme-error">{fieldErrors.bidStartTime}</p>}
                                </div>
                                <div>
                                    <label className="theme-label">Bid Close Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={bidCloseTime}
                                        onChange={(e) => setBidCloseTime(e.target.value)}
                                        className="theme-input"
                                    />
                                    {fieldErrors.bidCloseTime && <p className="theme-error">{fieldErrors.bidCloseTime}</p>}
                                </div>
                                <div>
                                    <label className="theme-label">Forced Close Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={forcedCloseTime}
                                        onChange={(e) => setForcedCloseTime(e.target.value)}
                                        className="theme-input"
                                    />
                                    {fieldErrors.forcedCloseTime && <p className="theme-error">{fieldErrors.forcedCloseTime}</p>}
                                </div>
                                <button type="button" onClick={() => setStep(3)} className="theme-btn-primary w-full">
                                    Continue to Rules <ArrowRight size={16} />
                                </button>
                            </motion.div>
                        )}

                        {/* Step 3: Rules */}
                        {step === 3 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                                <div>
                                    <label className="theme-label">Trigger Window (minutes)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        required
                                        value={triggerWindowMins}
                                        onChange={(e) => setTriggerWindowMins(e.target.value)}
                                        className="theme-input"
                                    />
                                    {fieldErrors.triggerWindowMins && <p className="theme-error">{fieldErrors.triggerWindowMins}</p>}
                                </div>
                                <div>
                                    <label className="theme-label">Extension Duration (minutes)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        required
                                        value={extensionDurationMins}
                                        onChange={(e) => setExtensionDurationMins(e.target.value)}
                                        className="theme-input"
                                    />
                                    {fieldErrors.extensionDurationMins && <p className="theme-error">{fieldErrors.extensionDurationMins}</p>}
                                </div>
                                <div>
                                    <label className="theme-label">Extension Trigger Type</label>
                                    <div className="space-y-2">
                                        {triggerOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setTriggerType(option.value)}
                                                className="flex w-full items-start gap-3 rounded-xl p-4 text-left transition-all"
                                                style={{
                                                    background: triggerType === option.value ? "var(--accent-glow)" : "var(--surface-soft)",
                                                    border: `1px solid ${triggerType === option.value ? "var(--accent)" : "var(--border)"}`,
                                                }}
                                            >
                                                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                                                     style={{
                                                         border: `2px solid ${triggerType === option.value ? "var(--accent)" : "var(--border)"}`,
                                                         background: triggerType === option.value ? "var(--accent)" : "transparent",
                                                     }}
                                                >
                                                    {triggerType === option.value && (
                                                        <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent-contrast)" }} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{option.label}</p>
                                                    <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{option.desc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    {fieldErrors.triggerType && <p className="theme-error">{fieldErrors.triggerType}</p>}
                                </div>
                                <button type="submit" disabled={!canSubmit} className="theme-btn-primary w-full">
                                    {isSubmitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} />
                                            Creating...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <Send size={16} />
                                            Create RFQ
                                        </span>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
