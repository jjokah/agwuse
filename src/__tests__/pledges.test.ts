/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { isPledgeFulfilled, applyPledgePayment } from "@/lib/finance/pledges";
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
          update: vi
            .fn()
            .mockResolvedValueOnce({
              id: "p1",
              amount: new Prisma.Decimal(10000),
              amountPaid: new Prisma.Decimal(10000),
              status: "ACTIVE",
            })
            .mockResolvedValueOnce({
              id: "p1",
              status: "FULFILLED",
            }),
        },
      };

      const result = await applyPledgePayment(mockTx, {
        pledgeId: "p1",
        memberId: "m1",
        amount: 4000,
      });

      expect(mockTx.pledge.update).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { amountPaid: { increment: new Prisma.Decimal(4000) } },
      });
      expect(result.status).toBe("FULFILLED");
    });
  });
});
