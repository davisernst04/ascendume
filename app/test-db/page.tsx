import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export default async function TestDbPage() {
  const allUsers = await db.select().from(users);

  async function addUser(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    if (!name || !email) return;

    await db.insert(users).values({
      name,
      email,
    });

    revalidatePath("/test-db");
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Database Test Page</h1>

      <section className="border p-6 rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-4">Add User (Write)</h2>
        <form action={addUser} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              name="name"
              type="text"
              required
              className="w-full p-2 border rounded bg-background"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full p-2 border rounded bg-background"
              placeholder="john@example.com"
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-primary-foreground py-2 px-4 rounded hover:opacity-90 transition-opacity"
          >
            Add User
          </button>
        </form>
      </section>

      <section className="border p-6 rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-4">Users List (Read)</h2>
        {allUsers.length === 0 ? (
          <p className="text-muted-foreground italic">No users found in database.</p>
        ) : (
          <ul className="divide-y">
            {allUsers.map((user) => (
              <li key={user.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  ID: {user.id}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="text-center">
        <a href="/" className="text-sm text-blue-500 hover:underline">
          &larr; Back to Home
        </a>
      </div>
    </div>
  );
}
