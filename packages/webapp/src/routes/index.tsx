import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, Zap, Shield, Clock } from 'lucide-react';
import { useAccount } from 'wagmi';

import { Badge } from '@/components/ui/badge';
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
  const { isConnected } = useAccount();

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <Badge variant="secondary" className="text-sm">
          Powered by MANTRA Chain
        </Badge>
        <h1 className="text-5xl font-black uppercase tracking-tight text-primary">
          Gasless Token Transfers
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Send tokens without paying gas fees. Our relay service covers
          transaction costs so you can focus on what matters.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/transfer">
              Start Transfer <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          {!isConnected && (
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="mb-2">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Zero Gas Fees</CardTitle>
            <CardDescription>
              No need to hold native tokens for gas. Pay a small service fee in
              the token you're sending.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Secure & Non-Custodial</CardTitle>
            <CardDescription>
              You control your assets. Sign transactions with EIP-712 for
              maximum security.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Fast Settlement</CardTitle>
            <CardDescription>
              Transactions are relayed immediately. No waiting for manual
              approvals or confirmations.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Transfer Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Ready to Send?</CardTitle>
          <CardDescription>
            Connect your wallet and start sending OM tokens with zero gas fees.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full md:w-auto">
            <Link to="/transfer">Go to Transfer Page</Link>
          </Button>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Connect Wallet</h3>
                  <p className="text-sm text-muted-foreground">
                    Use any Web3 wallet to sign in securely
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">Enter Details</h3>
                  <p className="text-sm text-muted-foreground">
                    Specify amount and recipient address
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">Sign Transaction</h3>
                  <p className="text-sm text-muted-foreground">
                    No gas required - just sign with your wallet
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold">Relayer Submits</h3>
                  <p className="text-sm text-muted-foreground">
                    We handle the blockchain interaction for you
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
