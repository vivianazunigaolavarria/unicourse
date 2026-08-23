import "server-only";

import { getGoogleCalendarConfig, getGoogleCalendarMissingKeys } from "@/lib/env";

type GoogleCalendarEventResponse = {
  id?: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType?: string;
      uri?: string;
    }>;
    createRequest?: {
      status?: {
        statusCode?: "pending" | "success" | "failure";
      };
    };
  };
  error?: {
    message?: string;
  };
};

type CreateGoogleMeetEventInput = {
  title: string;
  description: string;
  startsAtIso: string;
  endsAtIso: string;
  attendeeEmails: string[];
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API_ROOT = "https://www.googleapis.com/calendar/v3";

function buildGoogleCalendarState() {
  const missingKeys = getGoogleCalendarMissingKeys();

  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

function requireGoogleCalendarConfig() {
  const config = getGoogleCalendarConfig();

  if (!config) {
    throw new Error("Google Calendar no está configurado todavía.");
  }

  return config;
}

function extractGoogleMeetUrl(event: GoogleCalendarEventResponse) {
  const videoEntryPoint = event.conferenceData?.entryPoints?.find((entryPoint) => entryPoint.entryPointType === "video");
  return videoEntryPoint?.uri ?? event.hangoutLink ?? null;
}

async function readGoogleJson<T>(response: Response) {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

async function getGoogleAccessToken() {
  const config = requireGoogleCalendarConfig();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  const payload = await readGoogleJson<{ access_token?: string; error?: string; error_description?: string }>(response);

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "No pudimos autenticar la cuenta de Google Calendar.");
  }

  return payload.access_token;
}

async function requestGoogleCalendar<T>(path: string, init: RequestInit, accessToken: string) {
  const response = await fetch(`${GOOGLE_CALENDAR_API_ROOT}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });

  if (response.status === 204) {
    return null as T;
  }

  const payload = await readGoogleJson<T & { error?: { message?: string } }>(response);

  if (!response.ok) {
    throw new Error(payload.error?.message || response.statusText || "Google Calendar devolvió un error.");
  }

  return payload;
}

async function waitForGoogleMeetUrl(eventId: string, accessToken: string) {
  const config = requireGoogleCalendarConfig();
  let latestEvent: GoogleCalendarEventResponse = {};

  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 900));
    }

    latestEvent = await requestGoogleCalendar<GoogleCalendarEventResponse>(
      `/calendars/${encodeURIComponent(config.calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: "GET" },
      accessToken,
    );

    const meetingUrl = extractGoogleMeetUrl(latestEvent);
    const statusCode = latestEvent.conferenceData?.createRequest?.status?.statusCode;

    if (meetingUrl || statusCode === "failure") {
      break;
    }
  }

  return latestEvent;
}

export async function createGoogleMeetEvent(input: CreateGoogleMeetEventInput) {
  const config = requireGoogleCalendarConfig();
  const accessToken = await getGoogleAccessToken();
  const attendeeEmails = Array.from(new Set(input.attendeeEmails.filter(Boolean)));

  const createdEvent = await requestGoogleCalendar<GoogleCalendarEventResponse>(
    `/calendars/${encodeURIComponent(config.calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      body: JSON.stringify({
        summary: input.title,
        description: input.description,
        start: {
          dateTime: input.startsAtIso,
          timeZone: config.timeZone,
        },
        end: {
          dateTime: input.endsAtIso,
          timeZone: config.timeZone,
        },
        attendees: attendeeEmails.map((email) => ({ email })),
        guestsCanModify: false,
        guestsCanInviteOthers: false,
        guestsCanSeeOtherGuests: true,
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
      }),
    },
    accessToken,
  );

  if (!createdEvent.id) {
    throw new Error("Google Calendar no devolvió el identificador del evento.");
  }

  let finalizedEvent = createdEvent;
  let meetingUrl = extractGoogleMeetUrl(createdEvent);

  if (!meetingUrl) {
    finalizedEvent = await waitForGoogleMeetUrl(createdEvent.id, accessToken);
    meetingUrl = extractGoogleMeetUrl(finalizedEvent);
  }

  if (!meetingUrl) {
    await deleteGoogleCalendarEvent(createdEvent.id).catch(() => undefined);
    throw new Error("Google Calendar creó el evento, pero Google Meet no quedó listo para usarse.");
  }

  return {
    eventId: createdEvent.id,
    calendarHtmlLink: finalizedEvent.htmlLink ?? createdEvent.htmlLink ?? null,
    meetingUrl,
    attendeeCount: attendeeEmails.length,
  };
}

export async function deleteGoogleCalendarEvent(eventId: string) {
  const config = requireGoogleCalendarConfig();
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(
    `${GOOGLE_CALENDAR_API_ROOT}/calendars/${encodeURIComponent(config.calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=none`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(`No pudimos limpiar el evento de Google Calendar (${response.status}).`);
  }
}

export function getGoogleCalendarIntegrationState() {
  return buildGoogleCalendarState();
}
