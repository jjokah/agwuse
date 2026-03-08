import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { hash } from "bcryptjs";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://agwuse:agwuse_dev_2026@localhost:5433/agwuse";

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // ============================================================
  // 1. DEPARTMENTS (23 from the project brief)
  // ============================================================
  const departments = [
    // Ministries & Groups
    {
      name: "Sunday School Department",
      description: "Church-wide Bible education program led by the Sunday School Superintendent.",
      category: "MINISTRY" as const,
    },
    {
      name: "Men Ministry",
      description: "Ministry dedicated to the spiritual growth and fellowship of men in the church.",
      category: "MINISTRY" as const,
    },
    {
      name: "Women Ministry",
      description: "Ministry dedicated to the spiritual growth, empowerment, and fellowship of women.",
      category: "MINISTRY" as const,
    },
    {
      name: "Young Singles Ministry",
      description: "Ministry for young unmarried adults, fostering spiritual growth and community.",
      category: "MINISTRY" as const,
    },
    {
      name: "Christ Ambassadors",
      description: "Student outreach ministry reaching campuses and young people for Christ.",
      category: "OUTREACH" as const,
    },
    // Music & Worship
    {
      name: "Rhema Choir",
      description: "Youth choir ministering through contemporary praise and worship music.",
      category: "CHOIR" as const,
    },
    {
      name: "The Exalters",
      description: "Senior choir ministering through hymns, anthems, and traditional worship music.",
      category: "CHOIR" as const,
    },
    {
      name: "Praise Team and Instrumentalists",
      description: "Worship leaders and musicians who lead the congregation in praise and worship.",
      category: "CHOIR" as const,
    },
    // Operational Committees
    {
      name: "Church Ushers",
      description: "Committee responsible for welcoming worshippers and maintaining order during services.",
      category: "COMMITTEE" as const,
    },
    {
      name: "Security Committee",
      description: "Committee responsible for the safety and security of church premises and members.",
      category: "COMMITTEE" as const,
    },
    {
      name: "Medical Team",
      description: "Healthcare professionals providing first aid and medical support during church activities.",
      category: "COMMITTEE" as const,
    },
    {
      name: "Legal Team",
      description: "Legal professionals providing counsel and support on church legal matters.",
      category: "COMMITTEE" as const,
    },
    {
      name: "Media Committee",
      description: "Committee managing church media, sound, visuals, photography, and online presence.",
      category: "COMMITTEE" as const,
    },
    {
      name: "Mission Department",
      description: "Department coordinating local and international mission outreach programs.",
      category: "OUTREACH" as const,
    },
    {
      name: "Harvest/Thanksgiving Planning Committee",
      description: "Committee responsible for planning the annual harvest and thanksgiving celebrations.",
      category: "COMMITTEE" as const,
    },
    {
      name: "Technical Services Committee",
      description: "Committee managing sound systems, projectors, lighting, and technical infrastructure.",
      category: "COMMITTEE" as const,
    },
    {
      name: "Revival Planning Committee",
      description: "Committee responsible for organizing church revivals and spiritual renewal programs.",
      category: "COMMITTEE" as const,
    },
    {
      name: "Follow-up Team",
      description: "Team responsible for following up with first-time visitors and new converts.",
      category: "OUTREACH" as const,
    },
    {
      name: "Fund Raising Committee",
      description: "Committee coordinating fundraising activities for church projects and building development.",
      category: "COMMITTEE" as const,
    },
    {
      name: "Welfare Committee",
      description: "Committee providing benevolence support and welfare assistance to members in need.",
      category: "COMMITTEE" as const,
    },
    {
      name: "Hospital and Prison Ministry",
      description: "Outreach ministry visiting hospitals and prisons to share the gospel and provide support.",
      category: "OUTREACH" as const,
    },
    {
      name: "Online Radio",
      description: "Ministry managing live message streaming and online radio broadcasts.",
      category: "OUTREACH" as const,
    },
    {
      name: "Sermon Archive",
      description: "Ministry managing the recording, storage, and distribution of sermon audio and video.",
      category: "COMMITTEE" as const,
    },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }
  console.log(`  ✓ ${departments.length} departments seeded`);

  // ============================================================
  // 2. FINANCIAL CATEGORIES
  // ============================================================
  const financialCategories = [
    // Income categories
    { name: "Tithe", type: "INCOME" },
    { name: "General Offering", type: "INCOME" },
    { name: "Special Offering", type: "INCOME" },
    { name: "Mission Offering", type: "INCOME" },
    { name: "Building Fund", type: "INCOME" },
    { name: "Welfare Fund", type: "INCOME" },
    { name: "Thanksgiving Offering", type: "INCOME" },
    { name: "Harvest Offering", type: "INCOME" },
    { name: "First Fruit", type: "INCOME" },
    { name: "Donation", type: "INCOME" },
    { name: "Pledge Payment", type: "INCOME" },
    // Expense categories
    { name: "Utilities", type: "EXPENSE" },
    { name: "Staff Salaries", type: "EXPENSE" },
    { name: "Ministry Expenses", type: "EXPENSE" },
    { name: "Building Maintenance", type: "EXPENSE" },
    { name: "Equipment", type: "EXPENSE" },
    { name: "Outreach & Missions", type: "EXPENSE" },
    { name: "Welfare & Benevolence", type: "EXPENSE" },
    { name: "Office Supplies", type: "EXPENSE" },
    { name: "Transport", type: "EXPENSE" },
    { name: "Miscellaneous", type: "EXPENSE" },
  ];

  for (const cat of financialCategories) {
    await prisma.financialCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log(`  ✓ ${financialCategories.length} financial categories seeded`);

  // ============================================================
  // 3. SUPER ADMIN USER
  // ============================================================
  const adminEmail = "admin@agwuse.org";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await hash("Admin@2026!", 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: "System",
        lastName: "Admin",
        name: "System Admin",
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    });
    console.log("  ✓ Super admin user created (admin@agwuse.org / Admin@2026!)");
  } else {
    console.log("  ✓ Super admin user already exists");
  }

  // ============================================================
  // 4. CHURCH SETTINGS
  // ============================================================
  const churchSettings = [
    {
      key: "church_name",
      value: JSON.stringify("Assemblies of God Church, Wuse Zone 5"),
    },
    {
      key: "church_short_name",
      value: JSON.stringify("AG Wuse"),
    },
    {
      key: "church_address",
      value: JSON.stringify("53, Accra Street, Wuse Zone 5, Abuja, Nigeria"),
    },
    {
      key: "church_phones",
      value: JSON.stringify(["0803 591 0333", "0807 226 9401", "0803 787 1278"]),
    },
    {
      key: "church_email",
      value: JSON.stringify("info@agwuse.org"),
    },
    {
      key: "church_tagline",
      value: JSON.stringify("Center of Love and Worship"),
    },
    {
      key: "bank_name",
      value: JSON.stringify("Zenith International Bank"),
    },
    {
      key: "bank_account",
      value: JSON.stringify("1010327196"),
    },
    {
      key: "service_times",
      value: JSON.stringify([
        { day: "Sunday", activity: "Main Service / Sunday School", time: "8:00 AM" },
        { day: "Monday", activity: "New Believers Class", time: "6:00 PM" },
        { day: "Tuesday", activity: "Bible Study", time: "6:00 PM" },
        { day: "Wednesday", activity: "Prayer Meeting", time: "6:00 PM" },
        { day: "Friday", activity: "Sunday Preparatory Meeting", time: "6:00 PM" },
      ]),
    },
  ];

  for (const setting of churchSettings) {
    await prisma.churchSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: {
        key: setting.key,
        value: setting.value,
      },
    });
  }
  console.log(`  ✓ ${churchSettings.length} church settings seeded`);

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
