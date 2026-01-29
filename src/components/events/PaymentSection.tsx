import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Upload, X, IndianRupee } from 'lucide-react';

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
  
  function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
          <Label htmlFor="is-paid" className="text-base font-medium">Paid Event</Label>
          <p className="text-sm text-muted-foreground">
            Enable if participants need to pay a registration fee
          </p>
        </div>
        <Switch
          id="is-paid"
          checked={isPaid}
          onCheckedChange={onIsPaidChange}
        />
      </div>

      {isPaid && (
        <div className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label htmlFor="registration-fee">Registration Fee (₹)</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="registration-fee"
                type="number"
                min="0"
                step="1"
                placeholder="100"
                value={registrationFee}
                onChange={(e) => onRegistrationFeeChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="upi-id">UPI ID (Optional)</Label>
            <Input
              id="upi-id"
              placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => onUpiIdChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Participants will see this UPI ID for payment
            </p>
          </div>

          <div className="space-y-2">
            <Label>Payment QR Code (Optional)</Label>
            {qrPreview ? (
              <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-muted border">
                <img 
                  src={qrPreview} 
                  alt="Payment QR" 
                  className="h-full w-full object-contain p-2"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={removeQr}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <label className="flex w-48 h-48 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload QR Code
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrUpload}
                  className="hidden"
                />
              </label>
            )}
            <p className="text-xs text-muted-foreground">
              Upload your UPI app's QR code for easy payment
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
