"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, FileText, Clock3, Settings, Send } from "lucide-react";
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
        { num: 2, label: "Timing", icon: Clock3 },
        { num: 3, label: "Rules", icon: Settings },
    ];

    const progress = Math.round((step / 3) * 100);

    return (
        <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--background)" }}>
            <Navbar />

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="hero-orb" style={{ background: "var(--hero-orb-a)", width: 560, height: 560, top: -220, right: -150, animation: "float 24s ease-in-out infinite" }} />
                <div className="hero-grid-pattern absolute inset-0 opacity-36" />
            </div>

            <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-24 sm:px-6">
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    type="button"
                    onClick={() => (step > 1 ? setStep(step - 1) : router.push("/buyer/dashboard"))}
                    className="theme-btn-ghost mb-6 flex items-center gap-1.5 text-sm"
                >
                    <ArrowLeft size={14} />
                    {step > 1 ? "Previous Step" : "Back to Dashboard"}
                </motion.button>

                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="cinema-panel hidden lg:block">
                        <div className="relative h-full min-h-[620px]">
                            <Image src="/images/hero-rfq-network.svg" alt="RFQ flow" fill className="object-cover" />
                            <div className="absolute inset-0" style={{ background: "linear-gradient(130deg, rgba(6,10,22,0.65), rgba(6,10,22,0.2), rgba(6,10,22,0.72))" }} />
                            <div className="absolute left-5 right-5 top-5 rounded-xl border p-4" style={{ borderColor: "rgba(166,190,255,0.35)", background: "rgba(8,14,30,0.6)" }}>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">RFQ Submission Flow</p>
                                <h2 className="text-5xl leading-none text-slate-100" style={{ fontFamily: "var(--font-heading)" }}>
                                    Configure Once.
                                    <br />
                                    Run Fairly.
                                </h2>
                            </div>
                            <div className="absolute bottom-5 left-5 right-5 rounded-xl border p-3 text-sm text-slate-200" style={{ borderColor: "rgba(166,190,255,0.35)", background: "rgba(8,14,30,0.6)" }}>
                                <p>Set dates, extension policy, and trigger type. The engine handles late-stage fairness automatically.</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="theme-card overflow-hidden" style={{ boxShadow: "var(--shadow-soft)" }}>
                        <div className="border-b px-6 pt-6" style={{ borderColor: "var(--border)" }}>
                            <div className="mb-2 flex items-center justify-between">
                                <h1 className="text-5xl leading-none" style={{ fontFamily: "var(--font-heading)" }}>Create RFQ</h1>
                                <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted-foreground)" }}>{progress}% complete</span>
                            </div>
                            <div className="mb-4 h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-soft)" }}>
                                <motion.div className="h-full" style={{ background: "linear-gradient(130deg, var(--accent), var(--accent-alt))" }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
                            </div>

                            <div className="mb-4 grid grid-cols-3 gap-2">
                                {steps.map((s) => (
                                    <button
                                        key={s.num}
                                        type="button"
                                        onClick={() => setStep(s.num)}
                                        className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all"
                                        style={{
                                            background: step === s.num ? "var(--accent-glow)" : "var(--surface-soft)",
                                            border: `1px solid ${step === s.num ? "var(--accent)" : "var(--border)"}`,
                                            color: step === s.num ? "var(--accent)" : "var(--muted-foreground)",
                                        }}
                                    >
                                        <s.icon size={14} />
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {formError && <p className="theme-error px-6 pt-4">{formError}</p>}

                        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4">
                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                                    <div>
                                        <label className="theme-label">RFQ Name</label>
                                        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="theme-input" placeholder="e.g., Q3 Domestic Freight Procurement" />
                                        {fieldErrors.name && <p className="theme-error">{fieldErrors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="theme-label">Pickup / Service Date</label>
                                        <input type="datetime-local" required value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="theme-input" />
                                        {fieldErrors.pickupDate && <p className="theme-error">{fieldErrors.pickupDate}</p>}
                                    </div>
                                    <button type="button" onClick={() => setStep(2)} className="theme-btn-primary w-full">
                                        Continue to Timing <ArrowRight size={16} />
                                    </button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                                    <div>
                                        <label className="theme-label">Bid Start Date & Time</label>
                                        <input type="datetime-local" required value={bidStartTime} onChange={(e) => setBidStartTime(e.target.value)} className="theme-input" />
                                        {fieldErrors.bidStartTime && <p className="theme-error">{fieldErrors.bidStartTime}</p>}
                                    </div>
                                    <div>
                                        <label className="theme-label">Bid Close Date & Time</label>
                                        <input type="datetime-local" required value={bidCloseTime} onChange={(e) => setBidCloseTime(e.target.value)} className="theme-input" />
                                        {fieldErrors.bidCloseTime && <p className="theme-error">{fieldErrors.bidCloseTime}</p>}
                                    </div>
                                    <div>
                                        <label className="theme-label">Forced Close Date & Time</label>
                                        <input type="datetime-local" required value={forcedCloseTime} onChange={(e) => setForcedCloseTime(e.target.value)} className="theme-input" />
                                        {fieldErrors.forcedCloseTime && <p className="theme-error">{fieldErrors.forcedCloseTime}</p>}
                                    </div>
                                    <button type="button" onClick={() => setStep(3)} className="theme-btn-primary w-full">
                                        Continue to Rules <ArrowRight size={16} />
                                    </button>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                                    <div>
                                        <label className="theme-label">Trigger Window (minutes)</label>
                                        <input type="number" min={1} required value={triggerWindowMins} onChange={(e) => setTriggerWindowMins(e.target.value)} className="theme-input" />
                                        {fieldErrors.triggerWindowMins && <p className="theme-error">{fieldErrors.triggerWindowMins}</p>}
                                    </div>
                                    <div>
                                        <label className="theme-label">Extension Duration (minutes)</label>
                                        <input type="number" min={1} required value={extensionDurationMins} onChange={(e) => setExtensionDurationMins(e.target.value)} className="theme-input" />
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
                                                    className="w-full rounded-xl border p-4 text-left transition-all"
                                                    style={{
                                                        borderColor: triggerType === option.value ? "var(--accent)" : "var(--border)",
                                                        background: triggerType === option.value ? "var(--accent-glow)" : "var(--surface-soft)",
                                                    }}
                                                >
                                                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{option.label}</p>
                                                    <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{option.desc}</p>
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
        </div>
    );
}
