import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center space-y-8">
        <h1 className="font-evanescent st-title-gradient text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight">
          SERRIAN TIDE
        </h1>
        <p className="max-w-xl mx-auto text-lg opacity-90">
          Enter your imagination.
        </p>
        <Link href="/login" className="btn btn-gold">
          Enter Your Imagination
        </Link>
      </div>
    </main>
  );
}
