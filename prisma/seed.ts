import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@smartcrm.com" },
    update: {},
    create: {
      email: "admin@smartcrm.com",
      password,
      firstName: "Alex",
      lastName: "Admin",
      role: "ADMIN",
      isVerified: true,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: "agent@smartcrm.com" },
    update: {},
    create: {
      email: "agent@smartcrm.com",
      password,
      firstName: "Jamie",
      lastName: "Agent",
      role: "AGENT",
      isVerified: true,
    },
  });

  const contact1 = await prisma.contact.create({
    data: {
      firstName: "Maria", lastName: "Chen", email: "maria.chen@acme.com", phone: "+1 555-0101",
      company: "Acme Corp", position: "VP of Operations", source: "referral", status: "LEAD",
      notes: "Met at SaaStr conference.", userId: admin.id,
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      firstName: "Diego", lastName: "Alvarez", email: "diego@northwind.io", phone: "+1 555-0192",
      company: "Northwind", position: "CTO", source: "website", status: "CUSTOMER", userId: agent.id,
    },
  });

  await prisma.lead.create({
    data: {
      title: "Acme Corp — Annual Plan", description: "Upgrading from monthly to annual billing.",
      status: "PROPOSAL", source: "referral", score: 72, probability: 60, value: 24000,
      contactId: contact1.id, assignedTo: agent.id, userId: admin.id,
    },
  });

  await prisma.lead.create({
    data: {
      title: "Northwind — Expansion Seats", description: "Adding 40 more seats.",
      status: "NEGOTIATION", source: "website", score: 85, probability: 80, value: 18000,
      contactId: contact2.id, assignedTo: admin.id, userId: admin.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Send updated proposal to Acme", priority: "HIGH", status: "PENDING",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      assignedTo: agent.id, userId: admin.id, contactId: contact1.id,
    },
  });

  console.log("Seed complete. Login with admin@smartcrm.com / agent@smartcrm.com, password: Password123!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());
