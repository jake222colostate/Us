import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Heart } from "lucide-react";

interface SideBySideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userImage: string;
  matchImage: string;
  userName: string;
  matchName: string;
  onMatch: () => void;
}

export const SideBySideModal = ({
  open,
  onOpenChange,
  userImage,
  matchImage,
  userName,
  matchName,
  onMatch,
}: SideBySideModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center mb-2 sm:mb-4">
            See the Connection
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="space-y-2">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg">
              <img
                src={userImage}
                alt={userName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <p className="text-center font-semibold text-foreground text-sm sm:text-base">You</p>
          </div>

          <div className="space-y-2">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg">
              <img
                src={matchImage}
                alt={matchName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <p className="text-center font-semibold text-foreground text-sm sm:text-base">{matchName}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
          <Button
            variant="outline"
            className="flex-1 min-h-[48px] active:scale-95 transition-transform"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4 mr-2" />
            Not Now
          </Button>
          <Button
            className="flex-1 min-h-[48px] bg-gradient-to-r from-primary to-secondary hover:opacity-90 active:scale-95 transition-all"
            onClick={() => {
              onMatch();
              onOpenChange(false);
            }}
          >
            <Heart className="h-4 w-4 mr-2" />
            Match
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
