import { seedGeografia } from "./seed-geografia";
import { seedElecciones } from "./seed-elecciones";

export async function seedDatabase() {
  await seedGeografia();
  await seedElecciones();
}

seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });
