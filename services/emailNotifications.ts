import { NotificationEmailProfile, SlotRequest } from "../types";

type EmailTemplateContext = Record<
  string,
  string | number | undefined | null
>;

const normalizeRecipients = (value: string): string =>
  value
    .split(/[;,]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(",");

export const applyEmailTemplate = (
  template: string,
  context: EmailTemplateContext,
): string =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = context[key];
    return value == null ? "" : String(value);
  });

export const joinEmailBodySegments = (
  segments: Array<string | undefined | null>,
): string => segments.map((segment) => segment?.trim()).filter(Boolean).join("\n\n");

export const openMailClient = ({
  to,
  cc,
  bcc,
  subject,
  body,
}: {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
}): boolean => {
  if (typeof window === "undefined") return false;

  const normalizedTo = normalizeRecipients(to);
  if (!normalizedTo) return false;

  const params = new URLSearchParams();
  const normalizedCc = normalizeRecipients(cc ?? "");
  const normalizedBcc = normalizeRecipients(bcc ?? "");

  if (normalizedCc) params.set("cc", normalizedCc);
  if (normalizedBcc) params.set("bcc", normalizedBcc);
  if (subject.trim()) params.set("subject", subject.trim());
  if (body.trim()) params.set("body", body.trim());

  const query = params.toString();
  window.location.href = `mailto:${normalizedTo}${query ? `?${query}` : ""}`;
  return true;
};

export const buildRequestEmailContext = (
  request: Partial<SlotRequest>,
  airlineName: string,
) => ({
  airline: airlineName,
  requestId: request.id ?? "SIN-FOLIO",
  requestType: request.requestType ?? "Solicitud",
  requestFormat: request.requestFormat ?? "",
  status: request.status ?? "Pendiente",
  flight: request.flightArr || request.flightDep || "N/A",
  origin: request.origin || "--",
  destination: request.destination || "--",
  date: new Date().toLocaleDateString("es-MX"),
});

export const buildEmailFromProfile = (
  profile: NotificationEmailProfile,
  context: EmailTemplateContext,
  extraBody?: string,
) => ({
  to: profile.to,
  cc: profile.cc,
  bcc: profile.bcc,
  subject: applyEmailTemplate(profile.subject, context),
  body: joinEmailBodySegments([
    applyEmailTemplate(profile.message, context),
    extraBody,
  ]),
});