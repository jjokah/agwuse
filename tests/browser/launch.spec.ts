import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import { prisma } from "../../src/lib/prisma";

test.afterAll(async () => prisma.$disconnect());

test.beforeEach(async ({ page }, info) => {
  const octet = [...info.title].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 250 + 1;
  await page.setExtraHTTPHeaders({ "x-real-ip": `192.0.2.${octet}` });
});
async function login(page: Page, account = "member") {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(`browser-${account}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("BrowserPassword123");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("failed delivery recovers through resend and verification stays pending approval", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("First Name").fill("Recovery"); await page.getByLabel("Last Name").fill("Browser");
  await page.getByLabel("Email", { exact: true }).fill("delivery-fail@example.test");
  await page.getByLabel("Password", { exact: true }).fill("BrowserPassword123"); await page.getByLabel("Confirm Password").fill("BrowserPassword123");
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Email delivery failed" })).toBeVisible();
  await expect(page.getByLabel("First Name")).toHaveValue("Recovery");
  await page.goto("/resend-verification");
  await page.getByLabel("Email").fill("delivery-fail@example.test");
  await page.getByRole("button", { name: "Resend Verification Email" }).click();
  await expect(page.getByText("We've sent account guidance", { exact: false })).toBeVisible();
  const outbox = fs.readFileSync("test-results/provider-outbox.jsonl", "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const email = outbox.findLast((mail) => mail.to.includes("delivery-fail@example.test"));
  const url = email.html.match(/https?:[^"\s<>]+\/verify-email\?token=[a-f0-9]+/)?.[0];
  expect(url).toBeTruthy(); await page.goto(`/verify-email${new URL(url).search}`);
  await page.getByRole("button", { name: "Confirm My Email" }).click();
  await expect(page.getByText(/administrator will review and approve/)).toBeVisible();
});

test("expired verification provides a dedicated recovery link", async ({ page }) => {
  await page.goto("/verify-email?token=expired-link");
  await page.getByRole("button", { name: "Confirm My Email" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Invalid or expired" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Resend verification email" })).toHaveAttribute("href", "/resend-verification");
});

test("inactive account cannot sign in", async ({ page }) => {
  await page.goto("/login"); await page.getByLabel("Email").fill("browser-inactive@example.test");
  await page.getByLabel("Password", { exact: true }).fill("BrowserPassword123");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "awaiting approval" })).toBeVisible(); await expect(page).toHaveURL(/\/login$/);
});

test("directory hides contacts and prevents private contact search", async ({ page }) => {
  await login(page); await page.goto("/directory");
  await expect(page.getByText("Hidden Tester", { exact: true })).toBeVisible();
  await expect(page.getByText("browser-hidden@example.test", { exact: true })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Search member directory" }).fill("08090001111"); await page.keyboard.press("Enter");
  await expect(page.getByText("No members found", { exact: true })).toBeVisible();
  await page.goto("/directory?q=browser-hidden%40example.test");
  await expect(page.getByText("No members found", { exact: true })).toBeVisible();
});

test("profile contact toggles and clearing fields persist", async ({ page }) => {
  await login(page); await page.goto("/profile");
  await page.getByLabel("Show my email in the member directory").check();
  await page.getByLabel("Show my phone in the member directory").uncheck();
  await page.getByLabel("Occupation").fill("");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Profile updated successfully", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Show my email in the member directory")).toBeChecked();
  await expect(page.getByLabel("Show my phone in the member directory")).not.toBeChecked();
  await page.goto("/directory?q=browser-member%40example.test"); await expect(page.getByText("browser-member@example.test", { exact: true })).toBeVisible();
});

test("giving filters, CSV and receipt downloads remain owner-only", async ({ page }) => {
  await login(page); await page.goto("/my-giving");
  await page.getByLabel("From", { exact: true }).fill("2026-10-08");
  await page.getByLabel("To", { exact: true }).fill("2026-10-08");
  await page.getByLabel("All giving types").selectOption("TITHE"); await page.getByLabel("All methods").selectOption("CASH");
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await expect(page.getByText("E2E-RECEIPT-1", { exact: true })).toBeVisible(); await expect(page.getByText("E2E-RECEIPT-2", { exact: true })).toHaveCount(0);
  const response = await page.request.get("/api/me/giving/export?type=TITHE&method=CASH&memberId=browser-hidden");
  expect(response.ok()).toBe(true); expect(await response.text()).toContain("E2E-RECEIPT-1"); expect(await response.text()).not.toContain("OTHER-MEMBER-RECEIPT");
  expect((await page.request.get("/api/finance/receipts/browser-hidden-gift")).status()).toBe(403);
  expect((await page.request.get("/api/finance/receipts/browser-gift")).status()).toBe(200);
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Download CSV" }).click(); expect((await download).suggestedFilename()).toBe("my-giving.csv");
});

test("donor to Expense to donation clears donor and supports keyboard selection", async ({ page }) => {
  await login(page, "finance"); await page.goto("/finance/record");
  await page.getByLabel("Transaction Type").click(); await page.getByRole("option", { name: "Donation", exact: true }).click();
  await page.getByLabel("Member (optional)").click(); await page.getByRole("combobox", { name: "Search members" }).fill("Browser");
  await expect(page.getByRole("option", { name: /Browser Tester/ })).toBeVisible(); await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter");
  await expect(page.getByLabel("Member (optional)")).toContainText("Browser Tester");
  await page.getByLabel("Transaction Type").click(); await page.getByRole("option", { name: "Expense", exact: true }).click();
  await page.getByLabel("Transaction Type").click(); await page.getByRole("option", { name: "Donation", exact: true }).click();
  await expect(page.getByLabel("Member (optional)")).not.toContainText("Browser Tester");
  await expect(page.locator('input[name="memberId"]')).toHaveValue("");
  await page.getByLabel("Amount (NGN)").fill("123.45");
  await page.getByLabel("Notes (optional)").fill("Browser donor reset regression");
  await page.getByRole("button", { name: "Record Transaction", exact: true }).click();
  await expect(page).toHaveURL(/\/finance$/);
  const recorded = await prisma.financialTransaction.findFirstOrThrow({ where: { notes: "Browser donor reset regression" } });
  expect(recorded.memberId).toBeNull(); expect(recorded.pledgeId).toBeNull();
});

test("hosted checkout callback and repeated verification record one gift", async ({ page }) => {
  await login(page);
  const initialized = await page.request.post("/api/paystack/initialize", { data: { amount: 1250.50, type: "TITHE", email: "browser-member@example.test" } });
  expect(initialized.ok()).toBe(true);
  const result = await initialized.json();
  await page.goto(result.authorization_url);
  await expect(page.getByRole("heading", { name: "Thank You for Your Gift!" })).toBeVisible();
  const verified = await page.request.post("/api/paystack/verify", { data: { reference: result.reference } });
  expect(verified.ok()).toBe(true);
  expect(await prisma.financialTransaction.count({ where: { paystackRef: result.reference } })).toBe(1);
  const gift = await prisma.financialTransaction.findUniqueOrThrow({ where: { paystackRef: result.reference } });
  expect(gift.amount.toFixed(2)).toBe("1250.50"); expect(gift.memberId).toBe("browser-member");
});

test("mobile navigation is operable by keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/");
  const menu = page.getByRole("button", { name: /open menu/i }); await menu.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible(); await page.getByRole("dialog").getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL(/\/contact$/); await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("stale member search responses do not replace the current query", async ({ page }) => {
  await login(page, "finance"); await page.goto("/finance/record");
  let releaseOld!: () => void;
  const blocked = new Promise<void>((resolve) => { releaseOld = resolve; });
  await page.route("**/finance/record", async (route) => {
    if (route.request().method() === "POST" && route.request().postData()?.includes("Hidden")) await blocked;
    await route.continue();
  });
  await page.getByLabel("Member (optional)").click();
  const oldRequest = page.waitForEvent("request", (request) => request.method() === "POST" && !!request.postData()?.includes("Hidden"));
  await page.getByRole("combobox", { name: "Search members" }).fill("Hidden"); await oldRequest;
  await page.getByRole("combobox", { name: "Search members" }).fill("Browser");
  const oldResponse = page.waitForResponse((response) => response.request().method() === "POST" && !!response.request().postData()?.includes("Hidden"));
  // Next.js queues server actions. Change the query while the old action is in flight,
  // then release it so the newer search can run; its stale results must stay hidden.
  releaseOld(); await oldResponse;
  await expect(page.getByRole("option", { name: /Hidden Tester/ })).toHaveCount(0);
  await expect(page.getByRole("option", { name: /Browser Tester/ })).toBeVisible();
});

test("login error messages are announced and recovery form has accessible controls", async ({ page }) => {
  await page.goto("/login"); await page.getByLabel("Email").fill("missing@example.test"); await page.getByLabel("Password", { exact: true }).fill("WrongPassword123");
  await page.getByRole("button", { name: "Sign In", exact: true }).click(); await expect(page.getByRole("alert").filter({ hasText: "Invalid email or password" })).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue("missing@example.test");
  await page.goto("/resend-verification");
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(audit.violations).toEqual([]);
  // Load the actual persisted theme instead of auditing interpolated transition colors.
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  const darkAudit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(darkAudit.violations).toEqual([]);
});
