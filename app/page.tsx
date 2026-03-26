import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-8">
      <h1 className="text-4xl font-bold mb-4">Ascendume</h1>
      <div className="flex gap-4">
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-md">
          Primary Action
        </button>
        <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg border border-border">
          Secondary Action
        </button>
      </div>
      <div className="mt-8 p-4 bg-muted text-muted-foreground rounded-md">
        This is a muted section to test the theme.
      </div>
    </div>
  );
}
