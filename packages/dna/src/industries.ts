import type { Compliance, Industry } from "./schema";

/**
 * Industry templates — sensible behavioral defaults so a business is configurable
 * with almost no input. A business overrides only what's specific to it.
 */
export interface IndustryTemplate {
  vocabulary: string[];
  commonIntents: string[];
  rules: string[];
  compliance: Compliance[];
  prohibitedTopics: string[];
  brandTone: string[];
  formality: number;
  defaultAppointmentTypes: { name: string; durationMinutes: number; bufferMinutes: number }[];
}

const GENERAL: IndustryTemplate = {
  vocabulary: ["appointment", "quote", "service", "availability"],
  commonIntents: ["book_appointment", "ask_pricing", "ask_hours", "leave_message"],
  rules: [
    "Never invent prices or availability — confirm from business data or offer to take a message.",
  ],
  compliance: [],
  prohibitedTopics: [],
  brandTone: ["warm", "professional"],
  formality: 0.5,
  defaultAppointmentTypes: [{ name: "Consultation", durationMinutes: 30, bufferMinutes: 5 }],
};

export const INDUSTRY_TEMPLATES: Record<Industry, IndustryTemplate> = {
  general: GENERAL,
  dental: {
    vocabulary: ["cleaning", "exam", "insurance", "crown", "whitening", "emergency"],
    commonIntents: ["book_appointment", "ask_insurance", "dental_emergency", "ask_pricing"],
    rules: [
      "Never give clinical or medical advice — offer to book with a provider.",
      "Handle emergencies with urgency and empathy; offer the soonest slot or escalate.",
      "You may confirm whether the practice accepts an insurer, not adjudicate coverage.",
    ],
    compliance: ["HIPAA", "TCPA"],
    prohibitedTopics: ["clinical diagnosis", "prescription advice"],
    brandTone: ["warm", "reassuring", "professional"],
    formality: 0.55,
    defaultAppointmentTypes: [
      { name: "Cleaning & exam", durationMinutes: 60, bufferMinutes: 10 },
      { name: "Emergency visit", durationMinutes: 30, bufferMinutes: 10 },
      { name: "New patient", durationMinutes: 75, bufferMinutes: 10 },
    ],
  },
  medical: {
    vocabulary: ["appointment", "insurance", "referral", "telehealth", "follow-up"],
    commonIntents: ["book_appointment", "ask_insurance", "reschedule", "leave_message"],
    rules: [
      "Never give medical advice or triage symptoms — book with a provider or escalate urgent cases.",
      "Protect PHI; only confirm identity with the minimum necessary.",
    ],
    compliance: ["HIPAA", "TCPA"],
    prohibitedTopics: ["diagnosis", "medication advice"],
    brandTone: ["calm", "caring", "professional"],
    formality: 0.6,
    defaultAppointmentTypes: [
      { name: "New patient visit", durationMinutes: 45, bufferMinutes: 10 },
      { name: "Follow-up", durationMinutes: 20, bufferMinutes: 5 },
    ],
  },
  legal: {
    vocabulary: ["consultation", "case", "retainer", "matter", "intake"],
    commonIntents: ["book_consultation", "ask_practice_area", "ask_fees", "leave_message"],
    rules: [
      "Never give legal advice — collect intake details and book a consultation.",
      "Do not create an attorney–client relationship; add the standard disclaimer.",
    ],
    compliance: ["GDPR"],
    prohibitedTopics: ["legal advice", "case outcome predictions"],
    brandTone: ["professional", "discreet", "confident"],
    formality: 0.7,
    defaultAppointmentTypes: [
      { name: "Initial consultation", durationMinutes: 30, bufferMinutes: 10 },
    ],
  },
  home_services: {
    vocabulary: ["estimate", "dispatch", "service call", "emergency", "warranty"],
    commonIntents: ["book_service", "request_estimate", "emergency_dispatch", "ask_pricing"],
    rules: [
      "For emergencies (leaks, no heat, outages), prioritize the soonest dispatch or escalate.",
      "Give ranges only from business data; otherwise schedule an estimate.",
    ],
    compliance: ["TCPA"],
    prohibitedTopics: [],
    brandTone: ["friendly", "dependable", "straightforward"],
    formality: 0.4,
    defaultAppointmentTypes: [
      { name: "Diagnostic visit", durationMinutes: 60, bufferMinutes: 30 },
      { name: "Emergency dispatch", durationMinutes: 60, bufferMinutes: 30 },
    ],
  },
  beauty: {
    vocabulary: ["stylist", "booking", "color", "walk-in", "consultation"],
    commonIntents: ["book_appointment", "ask_services", "ask_stylist", "reschedule"],
    rules: [
      "Match clients to the right service/stylist; confirm duration and price from business data.",
    ],
    compliance: ["TCPA"],
    prohibitedTopics: [],
    brandTone: ["warm", "upbeat", "personable"],
    formality: 0.35,
    defaultAppointmentTypes: [
      { name: "Haircut & style", durationMinutes: 45, bufferMinutes: 10 },
      { name: "Color", durationMinutes: 120, bufferMinutes: 15 },
    ],
  },
  hvac: {
    vocabulary: ["furnace", "AC unit", "thermostat", "tune-up", "no heat", "no cool", "emergency"],
    commonIntents: ["book_service", "request_estimate", "emergency_dispatch", "ask_maintenance_plan"],
    rules: [
      "Treat no-heat/no-cool calls as urgent — offer the soonest dispatch or escalate.",
      "Give price ranges only from business data; otherwise schedule a diagnostic visit.",
    ],
    compliance: ["TCPA"],
    prohibitedTopics: [],
    brandTone: ["friendly", "dependable", "straightforward"],
    formality: 0.4,
    defaultAppointmentTypes: [
      { name: "Diagnostic visit", durationMinutes: 60, bufferMinutes: 30 },
      { name: "Emergency dispatch", durationMinutes: 60, bufferMinutes: 30 },
      { name: "Seasonal tune-up", durationMinutes: 45, bufferMinutes: 15 },
    ],
  },
  med_spa: {
    vocabulary: ["treatment", "injectable", "laser", "membership", "consultation", "provider"],
    commonIntents: ["book_appointment", "ask_services", "ask_pricing", "ask_provider"],
    rules: [
      "Never give clinical or medical advice — offer a consultation with a licensed provider.",
      "Confirm treatment, provider, and price only from business data.",
    ],
    compliance: ["HIPAA", "TCPA"],
    prohibitedTopics: ["clinical diagnosis", "treatment guarantees"],
    brandTone: ["warm", "upscale", "reassuring"],
    formality: 0.5,
    defaultAppointmentTypes: [
      { name: "Consultation", durationMinutes: 30, bufferMinutes: 10 },
      { name: "Treatment", durationMinutes: 60, bufferMinutes: 15 },
    ],
  },
  restaurant: {
    vocabulary: ["reservation", "party size", "waitlist", "catering", "private event"],
    commonIntents: ["make_reservation", "ask_hours", "catering_inquiry", "ask_menu"],
    rules: ["Confirm party size, date, time; escalate large parties and private events."],
    compliance: [],
    prohibitedTopics: [],
    brandTone: ["welcoming", "lively", "gracious"],
    formality: 0.35,
    defaultAppointmentTypes: [{ name: "Reservation", durationMinutes: 90, bufferMinutes: 0 }],
  },
  real_estate: {
    vocabulary: ["showing", "listing", "valuation", "pre-approval", "buyer", "seller"],
    commonIntents: ["book_showing", "request_valuation", "qualify_lead", "ask_listings"],
    rules: ["Qualify buyers/sellers (timeline, budget, pre-approval) before booking an agent."],
    compliance: ["TCPA"],
    prohibitedTopics: ["legal or financing advice"],
    brandTone: ["polished", "responsive", "knowledgeable"],
    formality: 0.55,
    defaultAppointmentTypes: [{ name: "Buyer consult", durationMinutes: 30, bufferMinutes: 10 }],
  },
  fitness: {
    vocabulary: ["membership", "intro session", "class", "trainer", "tour"],
    commonIntents: ["book_intro", "ask_membership", "book_tour", "class_schedule"],
    rules: ["Drive intro sessions and tours; confirm plans/pricing from business data."],
    compliance: ["TCPA"],
    prohibitedTopics: ["medical or nutrition advice"],
    brandTone: ["energetic", "encouraging", "friendly"],
    formality: 0.3,
    defaultAppointmentTypes: [{ name: "Intro session", durationMinutes: 45, bufferMinutes: 10 }],
  },
  golf_course: {
    vocabulary: ["tee time", "round", "member", "guest", "cart", "outing", "pro shop"],
    commonIntents: ["book_tee_time", "ask_rates", "book_outing", "ask_membership"],
    rules: [
      "Confirm party size, date, and time for tee times; escalate outings and tournaments.",
      "Give rates and membership details only from business data.",
    ],
    compliance: ["TCPA"],
    prohibitedTopics: [],
    brandTone: ["polished", "welcoming", "relaxed"],
    formality: 0.45,
    defaultAppointmentTypes: [
      { name: "Tee time", durationMinutes: 15, bufferMinutes: 0 },
      { name: "Outing inquiry", durationMinutes: 30, bufferMinutes: 10 },
    ],
  },
  automotive: {
    vocabulary: ["estimate", "service", "diagnostic", "parts", "loaner"],
    commonIntents: ["book_service", "request_estimate", "ask_status", "ask_pricing"],
    rules: ["Confirm vehicle make/model/year; give estimate ranges only from business data."],
    compliance: ["TCPA"],
    prohibitedTopics: [],
    brandTone: ["straightforward", "trustworthy", "friendly"],
    formality: 0.4,
    defaultAppointmentTypes: [{ name: "Diagnostic", durationMinutes: 60, bufferMinutes: 15 }],
  },
  professional_services: {
    vocabulary: ["discovery call", "proposal", "engagement", "scope", "onboarding"],
    commonIntents: ["book_discovery", "qualify_lead", "ask_services", "ask_pricing"],
    rules: ["Qualify fit and book a discovery call; avoid committing scope or price."],
    compliance: [],
    prohibitedTopics: [],
    brandTone: ["professional", "consultative", "clear"],
    formality: 0.6,
    defaultAppointmentTypes: [{ name: "Discovery call", durationMinutes: 30, bufferMinutes: 10 }],
  },
};

export function industryTemplate(industry: Industry): IndustryTemplate {
  return INDUSTRY_TEMPLATES[industry] ?? GENERAL;
}
