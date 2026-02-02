import { createFileRoute } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      {/* Hero Card */}
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-black uppercase tracking-tight">
            OMies Template
          </CardTitle>
          <CardDescription className="text-base">
            Your Web3 dApp is ready to build. Connect your wallet to get
            started.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex justify-center gap-4">
            <Button variant="default">Get Started</Button>
            <Button variant="secondary">Learn More</Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Message */}
      <p className="text-white/80 text-sm drop-shadow-sm">
        Built with React 19 • TanStack Router • Wagmi • AppKit
      </p>
    </div>
  );
}
