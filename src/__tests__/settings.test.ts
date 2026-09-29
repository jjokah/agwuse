import { describe, it, expect } from "vitest";
import {
  parseServiceTime,
  toPublicChurchInfo,
  defaultServiceTimes,
  type ChurchInfo,
} from "@/lib/settings/schema";

describe("parseServiceTime", () => {
  it("splits 'Day Time: Activity' entries", () => {
    expect(parseServiceTime("Sunday 8:00 AM: Main Service / Sunday School")).toEqual({
      day: "Sunday",
      time: "8:00 AM",
      activity: "Main Service / Sunday School",
    });
  });

  it("accepts common variations", () => {
    expect(parseServiceTime("Friday 6pm - Vigil")).toEqual({ day: "Friday", time: "6PM", activity: "Vigil" });
    expect(parseServiceTime("Wednesday 6:00 p.m.: Prayer Meeting")).toEqual({
      day: "Wednesday",
      time: "6:00 PM",
      activity: "Prayer Meeting",
    });
  });

  it("keeps free-form entries whole instead of dropping them", () => {
    expect(parseServiceTime("Special programs are announced weekly")).toEqual({
      day: "",
      time: "",
      activity: "Special programs are announced weekly",
    });
  });

  it("parses every default service time", () => {
    for (const entry of defaultServiceTimes) {
      const parsed = parseServiceTime(entry);
      expect(parsed.day).not.toBe("");
      expect(parsed.time).not.toBe("");
    }
  });
});

describe("toPublicChurchInfo", () => {
  it("never exposes internal settings such as notification emails", () => {
    const info = {
      name: "AG Wuse",
      shortName: "AGW",
      tagline: "Center of Love",
      address: "53 Accra Street",
      phones: ["0800"],
      notificationEmails: ["pastor@example.com"],
      notification_emails: ["pastor@example.com"],
      bankAccount: "123",
    } as unknown as ChurchInfo;

    const pub = toPublicChurchInfo(info);
    expect(Object.keys(pub).sort()).toEqual(["address", "name", "phones", "shortName", "tagline"]);
    expect(JSON.stringify(pub)).not.toContain("pastor@example.com");
  });
});
