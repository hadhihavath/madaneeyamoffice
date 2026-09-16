import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "hadihavath921@gmail.com";
  const newPassword = "Adminhadi100";

  console.log(`🔒 Updating password for Super Admin: ${email}...`);

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const updatedUser = await prisma.user.update({
    where: { email: email.toLowerCase().trim() },
    data: {
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  console.log(`✅ Password successfully updated for ${updatedUser.email}!`);
  console.log(`Role: ${updatedUser.role}, Status: ${updatedUser.status}`);
}

main()
  .catch((e) => {
    console.error("❌ Failed to update admin password:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
