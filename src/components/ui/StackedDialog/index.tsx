"use client";
import { AnimatePresence, AnimationProps, motion } from "framer-motion";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Dialog, VisuallyHidden } from "radix-ui";
import { useStackedDialog } from "./context";
import { cn } from "@/lib/utils";
import React from "react";
import { Slot } from "@radix-ui/react-slot";

interface DialogTriggerProps extends RadixDialog.DialogTriggerProps {
  id: string;
}

export const DialogTrigger: React.FC<DialogTriggerProps> = ({
  id,
  children,
  ...props
}) => {
  const { openDialog } = useStackedDialog();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(event);
    openDialog(id);
  };

  return (
    <RadixDialog.Trigger {...props} onClick={handleClick}>
      {children}
    </RadixDialog.Trigger>
  );
};

interface DialogCloseProps extends RadixDialog.DialogCloseProps {
  closeTarget?: "all" | "current";
}

export const DialogClose = ({
  closeTarget = "all",
  className,
  children,
  asChild,
  ...props
}: DialogCloseProps) => {
  const { popDialog, closeAll } = useStackedDialog();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (closeTarget === "all") {
      closeAll();
    } else {
      popDialog();
    }
  };

  const Comp = asChild ? Slot : "button";
  const defaultContent = (
    <div className="rounded-full h-6 w-6 flex items-center justify-center bg-accent text-accent-foreground hover:bg-accent/90 transition-colors">
      <X size={16} />
    </div>
  );

  return (
    <Comp
      type="button"
      {...props}
      className={cn("shrink-0", className)}
      onClick={handleClick}
    >
      {asChild ? children : children ?? defaultContent}
    </Comp>
  );
};

interface DialogContentProps {
  showCloseButton?: boolean;
  title: React.ReactNode;
  description: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const DialogContent = ({
  showCloseButton = true,
  title,
  description,
  children,
  className,
}: DialogContentProps) => {
  return (
    <div
      className={cn(
        "m-auto w-full min-w-96 bg-background rounded-xl p-6 shadow-lg border border-border",
        className
      )}
    >
      <div className="flex items-center gap-4 mb-1">
        <h2 className="flex-1 font-semibold text-xl">{title}</h2>
        {showCloseButton && <DialogClose />}
      </div>
      <p className="text-muted-foreground text-sm mb-6">{description}</p>
      {children}
    </div>
  );
};

const ActiveDialogWrapper = ({
  children,
  animationVariants,
  isActive,
}: {
  children: React.ReactNode;
  animationVariants: AnimationProps;
  isActive: boolean;
}) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isActive || !wrapperRef.current) return;

    const wrapper = wrapperRef.current;
    const focusableElements = wrapper.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      if (e.key !== "Tab") return;

      // If shift + tab on first element, go to last
      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
      // If tab on last element, go to first
      else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    };

    wrapper.addEventListener("keydown", handleKeyDown);
    if (isActive) firstFocusable?.focus();

    return () => {
      wrapper.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive]);

  return (
    <motion.div
      ref={wrapperRef}
      className={cn(
        "fixed left-1/2 top-1/2",
        !isActive && "pointer-events-none"
      )}
      {...animationVariants}
      aria-hidden={!isActive}
      tabIndex={-1}
    >
      {children}
    </motion.div>
  );
};

interface StackedDialogProps {
  trigger?: React.ReactNode;
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;
}

const StackedDialog: React.FC<StackedDialogProps> = ({
  trigger,
  closeOnEscape = true,
  closeOnClickOutside = true,
}) => {
  const stackedDialogContext = useStackedDialog();
  const { isOpen, closeAll, title, description, activeDialogs, definitions } =
    stackedDialogContext;

  const overlayAnimation = {
    initial: { background: "rgb(0 0 0 / 0)", backdropFilter: "blur(0px)" },
    animate: { background: "rgb(0 0 0 / 0.4)", backdropFilter: "blur(10px)" },
    exit: { background: "rgb(0 0 0 / 0)", backdropFilter: "blur(0px)" },
  };

  const getContentAnimation = (indexFromLast: number) => ({
    initial: {
      scale: 1.1,
      filter: "blur(2px)",
      opacity: 0,
      x: "-50%",
      y: "calc(-50% + 0px)",
    },
    animate: {
      scale: 1 - indexFromLast * 0.1,
      filter: `blur(${indexFromLast * 2}px) brightness(${
        100 - indexFromLast * 10
      }%)`,
      opacity: 1,
      x: "-50%",
      y: `calc(-50% + ${indexFromLast * -24}px)`,
    },
    exit: {
      scale: 1.1,
      filter: "blur(4px)",
      opacity: 0,
      x: "-50%",
      y: `calc(-50% + ${indexFromLast === 0 ? 24 : 0}px)`,
    },
  });

  const handleOpenChange = (value: boolean) => {
    if (!value && closeOnEscape) {
      closeAll();
    }
  };

  const handlePointerDownOutside = (e: Event) => {
    if (!closeOnClickOutside) {
      e.preventDefault();
    }
  };

  const handleEscapeKeyDown = (e: KeyboardEvent) => {
    if (!closeOnEscape) {
      e.preventDefault();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      {trigger}
      <Dialog.Portal forceMount>
        <AnimatePresence mode="popLayout">
          {isOpen && (
            <Dialog.Overlay className="fixed inset-0 z-20">
              <motion.div className="h-full w-full" {...overlayAnimation} />
            </Dialog.Overlay>
          )}
        </AnimatePresence>
        <AnimatePresence mode="popLayout">
          {isOpen && (
            <Dialog.Content
              className="h-0 w-0 z-30"
              onCloseAutoFocus={(e) => e.preventDefault()}
              onPointerDownOutside={handlePointerDownOutside}
              onEscapeKeyDown={handleEscapeKeyDown}
            >
              <VisuallyHidden.Root>
                <Dialog.Title>{title}</Dialog.Title>
                <Dialog.Description>{description}</Dialog.Description>
              </VisuallyHidden.Root>
              <AnimatePresence mode="popLayout">
                {activeDialogs.map((id, index) => {
                  const DialogDefinition = definitions.find((d) => d.id === id);
                  if (!DialogDefinition) return null;

                  const isLastDialog = index === activeDialogs.length - 1;

                  return (
                    <ActiveDialogWrapper
                      key={id}
                      animationVariants={getContentAnimation(
                        activeDialogs.length - 1 - index
                      )}
                      isActive={isLastDialog}
                    >
                      <DialogDefinition.dialog {...stackedDialogContext} />
                    </ActiveDialogWrapper>
                  );
                })}
              </AnimatePresence>
            </Dialog.Content>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default StackedDialog;
