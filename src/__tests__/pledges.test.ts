/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import {
  isPledgeFulfilled,
  applyPledgePayment,
  pledgeStatusAfterReversal,
} from "@/lib/finance/pledges";
import { Prisma } from "@prisma/client";

describe("pledges helper", () => {
  describe("isPledgeFulfilled", () => {
    it("returns true when amountPaid equals target amount", () => {
      expect(isPledgeFulfilled(new Prisma.Decimal(50000), new Prisma.Decimal(50000))).toBe(true);
    });

    it("returns true when amountPaid exceeds target amount", () => {
      expect(isPledgeFulfilled(new Prisma.Decimal(60000), new Prisma.Decimal(50000))).toBe(true);
    });

    it("returns false when amountPaid is less than target amount", () => {
      expect(isPledgeFulfilled(new Prisma.Decimal(49999.99), new Prisma.Decimal(50000))).toBe(false);
    });
  });

  describe("applyPledgePayment", () => {
    it("rejects non-positive payment amounts", async () => {
      const mockTx: any = { pledge: { findFirst: vi.fn() } };
      await expect(
        applyPledgePayment(mockTx, {
          pledgeId: "p1",
          memberId: "m1",
          amount: 0,
        }),
      ).rejects.toThrow("Pledge payment amount must be greater than zero");
    });

    it("throws if pledge does not belong to member", async () => {
      const mockTx: any = {
        pledge: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      };

      await expect(
        applyPledgePayment(mockTx, {
          pledgeId: "p1",
          memberId: "m1",
          amount: 5000,
        }),
      ).rejects.toThrow("Pledge not found for this member");
    });

    it("rejects payments to cancelled pledges", async () => {
      const mockTx: any = {
        pledge: {
          findFirst: vi.fn().mockResolvedValue({
            id: "p1",
            memberId: "m1",
            status: "CANCELLED",
          }),
        },
      };

      await expect(
        applyPledgePayment(mockTx, {
          pledgeId: "p1",
          memberId: "m1",
          amount: 5000,
        }),
      ).rejects.toThrow("Cannot apply payment to a cancelled pledge");
    });

    it("rejects payments to already fulfilled pledges", async () => {
      const mockTx: any = {
        pledge: {
          findFirst: vi.fn().mockResolvedValue({
            id: "p1",
            memberId: "m1",
            status: "FULFILLED",
          }),
        },
      };

      await expect(
        applyPledgePayment(mockTx, {
          pledgeId: "p1",
          memberId: "m1",
          amount: 5000,
        }),
      ).rejects.toThrow("Cannot apply payment to an already fulfilled pledge");
    });

    it("increments amount and marks FULFILLED when payment completes pledge", async () => {
      const mockTx: any = {
        pledge: {
          findFirst: vi.fn().mockResolvedValue({
            id: "p1",
            memberId: "m1",
            amount: new Prisma.Decimal(10000),
            amountPaid: new Prisma.Decimal(6000),
            status: "ACTIVE",
          }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUniqueOrThrow: vi.fn().mockResolvedValue({
            id: "p1",
            amount: new Prisma.Decimal(10000),
            amountPaid: new Prisma.Decimal(10000),
            status: "ACTIVE",
          }),
        },
      };

      const result = await applyPledgePayment(mockTx, {
        pledgeId: "p1",
        memberId: "m1",
        amount: 4000,
      });

      // Increment is guarded so a concurrently cancelled pledge is not credited
      expect(mockTx.pledge.updateMany).toHaveBeenNthCalledWith(1, {
        where: { id: "p1", memberId: "m1", status: { in: ["ACTIVE", "OVERDUE"] } },
        data: { amountPaid: { increment: new Prisma.Decimal(4000) } },
      });
      expect(mockTx.pledge.updateMany).toHaveBeenNthCalledWith(2, {
        where: { id: "p1", status: { in: ["ACTIVE", "OVERDUE"] } },
        data: { status: "FULFILLED" },
      });
      expect(result.status).toBe("FULFILLED");
    });

    it("fails when the pledge was closed between the check and the increment", async () => {
      const mockTx: any = {
        pledge: {
          findFirst: vi.fn().mockResolvedValue({ id: "p1", memberId: "m1", status: "ACTIVE" }),
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      };

      await expect(
        applyPledgePayment(mockTx, { pledgeId: "p1", memberId: "m1", amount: 100 }),
      ).rejects.toThrow("Pledge is no longer open for payments");
    });
  });

  describe("pledgeStatusAfterReversal", () => {
    const D = (n: number) => new Prisma.Decimal(n);

    it("never resurrects a cancelled pledge", () => {
      expect(pledgeStatusAfterReversal("CANCELLED", D(0), D(1000))).toBe("CANCELLED");
    });

    it("reopens a fulfilled pledge only when it is no longer covered", () => {
      expect(pledgeStatusAfterReversal("FULFILLED", D(500), D(1000))).toBe("ACTIVE");
      expect(pledgeStatusAfterReversal("FULFILLED", D(1200), D(1000))).toBe("FULFILLED");
    });

    it("keeps open pledges as they are", () => {
      expect(pledgeStatusAfterReversal("ACTIVE", D(0), D(1000))).toBe("ACTIVE");
    });
  });
});
