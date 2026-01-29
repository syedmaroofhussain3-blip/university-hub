import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { IndianRupee, Upload, X } from 'lucide-react';

interface PaymentSectionProps {
  isPaid: boolean;
  onIsPaidChange: (value: boolean) => void;
  registrationFee: string;
  onRegistrationFeeChange: (value: string) => void;
  upiId: string;
  onUpiIdChange: (value: string) => void;
  qrPreview: string | null;
  onQrChange: (file: File | null, preview: string | null) => void;
}

export default function PaymentSection({
  isPaid,
  onIsPaidChange,
  registrationFee,
  onRegistrationFeeChange,
  upiId,
  onUpiIdChange,
  qrPreview,
  onQrChange
}: PaymentSectionProps) {
  function handleQrChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onQrChange(file, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function removeQr() {
    onQrChange(null, null);
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4" />
            Paid Event
          </Label>
          <p className="text-sm text-muted-foreground">
            Require registration fee from participants
          </p>
        </div>
        <Switch 
          checked={isPaid} 
          onCheckedChange={onIsPaidChange} 
        />
      </div>

      {isPaid && (
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label htmlFor="registration-fee">Registration Fee (₹)</Label>
            <Input
              id="registration-fee"
              type="number"
              min="1"
              placeholder="e.g., 100"
              value={registrationFee}
              onChange={(e) => onRegistrationFeeChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upi-id">UPI ID (Optional)</Label>
            <Input
              id="upi-id"
              placeholder="e.g., yourname@upi"
              value={upiId}
              onChange={(e) => onUpiIdChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Payment QR Code (Optional)</Label>
            {qrPreview ? (
              <div className="relative w-40 h-40 rounded-lg overflow-hidden bg-muted">
                <img 
                  src={qrPreview} 
                  alt="Payment QR" 
                  className="h-full w-full object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={removeQr}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <label className="flex w-40 h-40 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-2">Upload QR</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Teams will need to upload their payment receipt for approval.
          </p>
        </div>
      )}
    </div>
  );
}