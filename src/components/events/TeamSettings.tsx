import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Users, User } from 'lucide-react';

interface TeamSettingsProps {
  registrationType: 'individual' | 'team';
  onRegistrationTypeChange: (value: 'individual' | 'team') => void;
  minTeamSize: string;
  onMinTeamSizeChange: (value: string) => void;
  maxTeamSize: string;
  onMaxTeamSizeChange: (value: string) => void;
}

export default function TeamSettings({
  registrationType,
  onRegistrationTypeChange,
  minTeamSize,
  onMinTeamSizeChange,
  maxTeamSize,
  onMaxTeamSizeChange
}: TeamSettingsProps) {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-0.5">
        <Label className="text-base font-medium">Registration Type</Label>
        <p className="text-sm text-muted-foreground">
          Choose how participants can register for this event
        </p>
      </div>

      <RadioGroup
        value={registrationType}
        onValueChange={(v) => onRegistrationTypeChange(v as 'individual' | 'team')}
        className="grid grid-cols-2 gap-4"
      >
        <label 
          className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
            registrationType === 'individual' 
              ? 'border-primary bg-primary/5' 
              : 'border-muted hover:border-muted-foreground/50'
          }`}
        >
          <RadioGroupItem value="individual" id="individual" className="sr-only" />
          <User className={`h-8 w-8 ${registrationType === 'individual' ? 'text-primary' : 'text-muted-foreground'}`} />
          <div className="text-center">
            <p className="font-medium">Individual</p>
            <p className="text-xs text-muted-foreground">Single participant</p>
          </div>
        </label>

        <label 
          className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
            registrationType === 'team' 
              ? 'border-primary bg-primary/5' 
              : 'border-muted hover:border-muted-foreground/50'
          }`}
        >
          <RadioGroupItem value="team" id="team" className="sr-only" />
          <Users className={`h-8 w-8 ${registrationType === 'team' ? 'text-primary' : 'text-muted-foreground'}`} />
          <div className="text-center">
            <p className="font-medium">Team</p>
            <p className="text-xs text-muted-foreground">Group participation</p>
          </div>
        </label>
      </RadioGroup>

      {registrationType === 'team' && (
        <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label htmlFor="min-team-size">Minimum Team Size</Label>
            <Input
              id="min-team-size"
              type="number"
              min="2"
              max="20"
              value={minTeamSize}
              onChange={(e) => onMinTeamSizeChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-team-size">Maximum Team Size</Label>
            <Input
              id="max-team-size"
              type="number"
              min="2"
              max="20"
              placeholder="No limit"
              value={maxTeamSize}
              onChange={(e) => onMaxTeamSizeChange(e.target.value)}
            />
          </div>
          <p className="col-span-full text-xs text-muted-foreground">
            Team leaders will create teams and share a unique code with members to join
          </p>
        </div>
      )}
    </div>
  );
}
