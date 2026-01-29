import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, QrCode } from 'lucide-react';

interface PaymentInfoProps {
  registrationFee: number;
  upiId?: string | null;
  paymentQrUrl?: string | null;
  eventTitle: string;
}

export default function PaymentInfo({
  registrationFee,
  upiId,
  paymentQrUrl,
  eventTitle
}: PaymentInfoProps) {
  const [showQr, setShowQr] = useState(false);

  return (
    <>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Registration Fee
            </CardTitle>
            <Badge className="text-lg px-3 py-1">
              ₹{registrationFee}
            </Badge>
          </div>
          <CardDescription>
            Payment required to complete registration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {upiId && (
            <div className="flex items-center justify-between rounded-lg bg-background p-3">
              <span className="text-sm text-muted-foreground">UPI ID</span>
              <span className="font-mono font-medium">{upiId}</span>
            </div>
          )}
          
          {paymentQrUrl && (
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => setShowQr(true)}
            >
              <QrCode className="h-4 w-4" />
              Show Payment QR Code
            </Button>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Pay the registration fee and wait for organizer approval
          </p>
        </CardContent>
      </Card>

      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment QR Code</DialogTitle>
            <DialogDescription>
              Scan to pay ₹{registrationFee} for {eventTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4">
            <img 
              src={paymentQrUrl!} 
              alt="Payment QR Code"
              className="max-w-full max-h-80 rounded-lg"
            />
          </div>
          {upiId && (
            <p className="text-center text-sm text-muted-foreground">
              Or pay to: <span className="font-mono font-medium">{upiId}</span>
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
