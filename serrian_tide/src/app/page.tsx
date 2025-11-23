import Link from "next/link";
import { GradientText } from "@/components/GradientText";
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center space-y-8">
        <GradientText 
          as="h1" 
          variant="title" 
          glow 
          className="font-evanescent text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight"
        >
          SERRIAN TIDE
        </GradientText>
        <p className="max-w-xl mx-auto text-lg text-slate-200">
          Enter your imagination.
        </p>
        <Link href="/login">
          <Button variant="primary" size="lg">
            Enter Your Imagination
          </Button>
        </Link>
      </div>
    </main>
  );
}
