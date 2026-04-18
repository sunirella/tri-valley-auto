import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";

const SYMPTOMS = [
  { v: "check_engine", l: "Check Engine Light" },
  { v: "smog_inspection", l: "Smog Inspection" },
  { v: "fluid_leak", l: "Fluid Leak" },
  { v: "brakes", l: "Brake Service" },
  { v: "overheating", l: "Overheating" },
  { v: "oil_change", l: "Oil Change" },
  { v: "diagnostic", l: "General Diagnostic" },
  { v: "other", l: "Other" },
];

const TIMELINES = [
  { v: "immediate", l: "Today / ASAP" },
  { v: "this_week", l: "This Week" },
  { v: "next_week", l: "Next Week" },
  { v: "flexible", l: "Flexible" },
];

const STEPS = [
  { id: 1, label: "Symptom" },
  { id: 2, label: "Vehicle" },
  { id: 3, label: "Schedule" },
  { id: 4, label: "Contact" },
];

export default function BookingFlow({ initialSymptom, initialTimeline }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [data, setData] = useState({
    symptom: initialSymptom || "check_engine",
    timeline: initialTimeline || "this_week",
    vehicle: "",
    diagnostic_log: "",
    preferred_date: "",
    customer_name: "",
    phone: "",
    email: "",
  });

  const update = (k, v) => setData((p) => ({ ...p, [k]: v }));

  const canNext = useMemo(() => {
    if (step === 1) return !!data.symptom && !!data.timeline;
    if (step === 2) return data.vehicle.trim().length > 2;
    if (step === 3) return !!data.preferred_date;
    if (step === 4) return data.customer_name.trim() && data.phone.trim();
    return false;
  }, [step, data]);

  const progress = (step / STEPS.length) * 100;

  const submit = async () => {
    setSubmitting(true);
    await base44.entities.Appointment.create({ ...data, status: "pending" });
    setSubmitting(false);
    setDone(true);
  };

  // Generate next 14 days
  const dates = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  if (done) {
    return <SuccessScreen data={data} onHome={() => navigate("/")} />;
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-6 md:px-10">
        {/* Calibration progress */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-3">
            <span className="text-micro text-accent">◈ CALIBRATION SEQUENCE</span>
            <span className="text-micro text-muted-foreground">
              STEP {String(step).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
            </span>
          </div>
          <div className="relative h-px bg-hairline">
            <motion.div
              className="absolute inset-y-0 left-0 bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            />
          </div>
          <div className="grid grid-cols-4 mt-3">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`text-micro transition-colors ${
                  step > i ? "text-foreground" : "text-muted-foreground/60"
                }`}
              >
                <span className={step > i ? "text-accent" : ""}>{String(s.id).padStart(2, "0")} · </span>
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {step === 1 && (
            <StepSymptom data={data} update={update} />
          )}
          {step === 2 && (
            <StepVehicle data={data} update={update} />
          )}
          {step === 3 && (
            <StepSchedule data={data} update={update} dates={dates} />
          )}
          {step === 4 && (
            <StepContact data={data} update={update} />
          )}
        </motion.div>

        {/* Footer actions */}
        <div className="mt-14 hairline-t pt-6 flex items-center justify-between">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : navigate("/"))}
            className="group flex items-center gap-2 text-label text-foreground/70 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {step > 1 ? "Previous" : "Exit"}
          </button>

          {step < STEPS.length ? (
            <button
              onClick={() => canNext && setStep(step + 1)}
              disabled={!canNext}
              className="group flex items-center gap-3 bg-primary text-primary-foreground px-6 py-3 text-label hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!canNext || submitting}
              className="group flex items-center gap-3 bg-accent text-accent-foreground px-6 py-3 text-label hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40"
            >
              <span>{submitting ? "Submitting…" : "Submit Intake"}</span>
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ————— Steps —————

function StepSymptom({ data, update }) {
  return (
    <div>
      <Heading eyebrow="01 · DIAGNOSTIC VECTOR" title="What are you experiencing?" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 hairline">
        {SYMPTOMS.map((s) => {
          const active = data.symptom === s.v;
          return (
            <button
              key={s.v}
              onClick={() => update("symptom", s.v)}
              className={`p-5 text-left hairline-r hairline-b transition-all ${
                active ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
            >
              <div className={`text-micro mb-2 ${active ? "text-accent" : "text-muted-foreground"}`}>
                {String(SYMPTOMS.indexOf(s) + 1).padStart(2, "0")}
              </div>
              <div className="font-tight text-lg leading-tight">{s.l}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-10">
        <div className="text-label text-muted-foreground mb-3">▸ Timeline urgency</div>
        <div className="flex flex-wrap gap-2">
          {TIMELINES.map((t) => (
            <button
              key={t.v}
              onClick={() => update("timeline", t.v)}
              className={`text-label px-4 py-2.5 hairline transition-all ${
                data.timeline === t.v
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:border-foreground"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepVehicle({ data, update }) {
  return (
    <div>
      <Heading eyebrow="02 · VEHICLE IDENTIFICATION" title="Tell us about the specimen." />
      <Field label="Year / Make / Model">
        <input
          type="text"
          value={data.vehicle}
          onChange={(e) => update("vehicle", e.target.value)}
          placeholder="e.g. 2016 Audi A4 Quattro"
          className="w-full bg-transparent border-0 border-b-[0.5px] border-hairline focus:border-accent outline-none py-3 font-tight text-2xl md:text-3xl font-light tracking-tight"
          autoFocus
        />
      </Field>
      <Field label="Diagnostic log (optional)">
        <textarea
          rows={5}
          value={data.diagnostic_log}
          onChange={(e) => update("diagnostic_log", e.target.value)}
          placeholder="Describe any sounds, warning lights, when it occurs, etc."
          className="w-full bg-transparent border-[0.5px] border-hairline focus:border-accent outline-none p-4 text-sm font-mono leading-relaxed resize-none"
        />
      </Field>
    </div>
  );
}

function StepSchedule({ data, update, dates }) {
  return (
    <div>
      <Heading eyebrow="03 · TEMPORAL COORDINATE" title="Select a preferred day." />
      <div className="grid grid-cols-3 md:grid-cols-7 gap-0 hairline">
        {dates.map((d, i) => {
          const iso = d.toISOString().split("T")[0];
          const active = data.preferred_date === iso;
          const weekday = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
          const isSun = d.getDay() === 0;
          return (
            <button
              key={iso}
              onClick={() => !isSun && update("preferred_date", iso)}
              disabled={isSun}
              className={`relative p-4 hairline-r hairline-b text-left transition-all ${
                active
                  ? "bg-accent text-accent-foreground"
                  : isSun
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-secondary"
              }`}
            >
              <div className="text-micro opacity-70">{weekday}</div>
              <div className="font-tight text-2xl md:text-3xl font-light mt-1">
                {String(d.getDate()).padStart(2, "0")}
              </div>
              <div className="text-micro opacity-60 mt-1">
                {d.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
              </div>
              {active && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
              )}
              {isSun && (
                <div className="absolute inset-0 flex items-end justify-end p-2 text-micro">CLSD</div>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between text-micro text-muted-foreground">
        <span>AVAILABLE SLOTS · HIGHLIGHTED IN ELECTRIC SKY</span>
        <span>SUN · CLOSED</span>
      </div>
    </div>
  );
}

function StepContact({ data, update }) {
  return (
    <div>
      <Heading eyebrow="04 · OPERATOR CHANNEL" title="How do we reach you?" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        <Field label="Full name *">
          <input
            type="text"
            value={data.customer_name}
            onChange={(e) => update("customer_name", e.target.value)}
            className="w-full bg-transparent border-0 border-b-[0.5px] border-hairline focus:border-accent outline-none py-3 font-tight text-2xl font-light"
          />
        </Field>
        <Field label="Phone *">
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="(925) 000-0000"
            className="w-full bg-transparent border-0 border-b-[0.5px] border-hairline focus:border-accent outline-none py-3 font-tight text-2xl font-light"
          />
        </Field>
        <Field label="Email (optional)" className="md:col-span-2">
          <input
            type="email"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full bg-transparent border-0 border-b-[0.5px] border-hairline focus:border-accent outline-none py-3 font-tight text-2xl font-light"
          />
        </Field>
      </div>

      {/* Summary */}
      <div className="mt-14 hairline p-6">
        <div className="text-micro text-accent mb-4">◈ INTAKE SUMMARY</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm">
          <SummaryRow label="Symptom" v={SYMPTOMS.find((s) => s.v === data.symptom)?.l} />
          <SummaryRow label="Timeline" v={TIMELINES.find((t) => t.v === data.timeline)?.l} />
          <SummaryRow label="Vehicle" v={data.vehicle || "—"} />
          <SummaryRow label="Date" v={data.preferred_date || "—"} />
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, v }) {
  return (
    <div className="flex items-baseline justify-between hairline-b pb-2">
      <span className="text-micro text-muted-foreground">{label}</span>
      <span className="font-tight">{v}</span>
    </div>
  );
}

function Heading({ eyebrow, title }) {
  return (
    <div className="mb-10">
      <div className="text-micro text-accent mb-3">{eyebrow}</div>
      <h2 className="font-tight text-4xl md:text-6xl font-extralight tracking-[-0.04em] leading-[0.95]">
        {title}
      </h2>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="text-label text-muted-foreground mb-2">▸ {label}</div>
      {children}
    </div>
  );
}

function SuccessScreen({ data, onHome }) {
  return (
    <div className="min-h-screen bg-background pt-20 pb-20 flex items-center">
      <div className="max-w-3xl mx-auto px-6 md:px-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="w-2 h-2 bg-success rounded-full" />
            <span className="text-micro text-success">STATUS · RECEIVED</span>
          </div>
          <h1 className="font-tight text-5xl md:text-8xl font-extralight tracking-[-0.05em] leading-[0.9]">
            Intake
            <br />
            <span className="italic">calibrated.</span>
          </h1>
          <p className="mt-8 max-w-xl text-sm text-foreground/80 leading-relaxed">
            Thank you, {data.customer_name}. Your diagnostic intake has been logged.
            Ron or one of our technicians will contact you at {data.phone} to confirm
            the appointment.
          </p>

          <div className="mt-10 hairline p-6 grid grid-cols-2 gap-6 max-w-lg">
            <SummaryRow label="Confirmation" v={`LOG.${Date.now().toString().slice(-6)}`} />
            <SummaryRow label="Status" v="Pending review" />
            <SummaryRow label="Phone" v="(925) 600-8975" />
            <SummaryRow label="ETA callback" v="< 24 HRS" />
          </div>

          <button
            onClick={onHome}
            className="mt-12 inline-flex items-center gap-3 bg-primary text-primary-foreground px-6 py-3 text-label hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Return to Overview
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
