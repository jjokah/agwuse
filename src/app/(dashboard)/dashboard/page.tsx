import type { Metadata } from "next";
import { requirePageRole } from "@/lib/auth";
import { ALL_ROLES } from "@/lib/authz/roles";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/shared/stat-card";
import { Calendar, Megaphone, Heart } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { TRANSACTION_TYPE_LABELS } from "@/lib/finance/labels";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await requirePageRole(ALL_ROLES);
  const userId = session.user.id;

  const now = new Date();

  // Fetch user's giving stats & counts
  const [
    givingTotal,
    recentGiving,
    upcomingEventsCount,
    upcomingEvents,
    announcementsCount,
    announcements,
  ] = await Promise.all([
    prisma.financialTransaction.aggregate({
      where: { memberId: userId, type: { not: "EXPENSE" }, voidedAt: null },
      _sum: { amount: true },
    }),
    prisma.financialTransaction.findMany({
      where: { memberId: userId, type: { not: "EXPENSE" }, voidedAt: null },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.event.count({
      where: {
        isPublished: true,
        startDate: { gte: now },
      },
    }),
    prisma.event.findMany({
      where: {
        isPublished: true,
        startDate: { gte: now },
      },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
    prisma.blogPost.count({
      where: { published: true, type: "ANNOUNCEMENT" },
    }),
    prisma.blogPost.findMany({
      where: { published: true, type: "ANNOUNCEMENT" },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
  ]);

  const totalGiving = givingTotal._sum.amount
    ? Number(givingTotal._sum.amount)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome, {session.user.name?.split(" ")[0] || "Member"}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your church activities.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Giving"
          value={formatCurrency(totalGiving)}
          icon={<Heart />}
        />
        <StatCard
          title="Upcoming Events"
          value={upcomingEventsCount}
          icon={<Calendar />}
        />
        <StatCard
          title="Announcements"
          value={announcementsCount}
          icon={<Megaphone />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Giving */}
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent Giving</h2>
            <Link
              href="/my-giving"
              className="text-sm text-brand-gold-dark hover:underline"
            >
              View All
            </Link>
          </div>
          {recentGiving.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No giving records yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentGiving.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {TRANSACTION_TYPE_LABELS[tx.type] || tx.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.date)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(Number(tx.amount))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Upcoming Events</h2>
            <Link
              href="/events"
              className="text-sm text-brand-gold-dark hover:underline"
            >
              View All
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming events.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block text-sm hover:text-brand-gold-dark"
                >
                  <p className="font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.startDate)}
                    {event.location && ` — ${event.location}`}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Latest Announcements</h2>
          <div className="space-y-3">
            {announcements.map((post) => (
              <div key={post.id} className="text-sm">
                <p className="font-medium">{post.title}</p>
                {post.excerpt && (
                  <p className="text-muted-foreground">{post.excerpt}</p>
                )}
                {post.publishedAt && (
                  <p className="text-xs text-muted-foreground">
                    {formatDate(post.publishedAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
