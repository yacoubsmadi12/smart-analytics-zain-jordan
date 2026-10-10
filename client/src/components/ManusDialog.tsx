import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

interface ManusDialogProps {
  title?: string;
  logo?: string;
  open?: boolean;
  onLogin: () => void;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

export function ManusDialog({
  title,
  logo,
  open = false,
  onLogin,
  onOpenChange,
  onClose,
}: ManusDialogProps) {
  const [internalOpen, setInternalOpen] = useState(open);

  useEffect(() => {
    if (!onOpenChange) {
      setInternalOpen(open);
    }
  }, [open, onOpenChange]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }

    if (!nextOpen) {
      onClose?.();
    }
  };

  return (
    <Dialog
      open={onOpenChange ? open : internalOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="bg-[var(--surface-1)] text-[var(--text-primary)] rounded-[var(--radius-lg)] w-[min(92vw,400px)] shadow-[var(--shadow-2)] border border-[var(--border-default)] p-0 gap-0 text-center">
        <div className="flex flex-col items-center gap-3 p-4 pt-6">
          {logo ? (
            <div className="w-16 h-16 bg-[var(--surface-2)] rounded-[var(--radius-md)] border border-[var(--border-default)] flex items-center justify-center">
              <img
                src={logo}
                alt="Dialog graphic"
                className="w-10 h-10 rounded-md"
              />
            </div>
          ) : null}

          {/* Title and subtitle */}
          {title ? (
            <DialogTitle className="text-[var(--text-section-title)] font-semibold text-[var(--text-primary)] leading-[1.4]">
              {title}
            </DialogTitle>
          ) : null}
          <DialogDescription className="text-[var(--text-body)] text-[var(--text-secondary)] leading-5">
            Please login with Manus to continue
          </DialogDescription>
        </div>

        <DialogFooter className="px-4 py-4">
          {/* Login button */}
          <Button
            onClick={onLogin}
            className="w-full min-h-11 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--color-bg)] rounded-[var(--radius-sm)] text-[var(--text-body)] font-medium leading-5"
          >
            Login with Manus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
