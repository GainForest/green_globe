"use client";

import React, { createContext, useContext, useState } from "react";

type DialogDefinition = {
  id: string;
  dialog: React.FC<StackedDialogContext>;
};

export type StackedDialogContext = {
  definitions: Array<DialogDefinition>;
  activeDialogs: Array<string>;
  title?: string;
  description?: string;
  openDialog: (id: string) => void;
  pushDialog: (id: string) => void;
  popDialog: (id?: string) => void;
  closeAll: () => void;
  isOpen: boolean;
};

const StackedDialogContext = createContext<StackedDialogContext | null>(null);

export const StackedDialogProvider = ({
  children,
  definitions,
  title,
  description,
}: {
  children: React.ReactNode;
  definitions: DialogDefinition[];
  title?: string;
  description?: string;
}) => {
  const [activeDialogs, setActiveDialogs] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openDialog = (id: string) => {
    const dialog = definitions.find((dialog) => dialog.id === id);
    if (dialog) {
      setActiveDialogs([dialog.id]);
      setIsOpen(true);
    }
  };

  const pushDialog = (id: string) => {
    const dialog = definitions.find((dialog) => dialog.id === id);
    if (!dialog || activeDialogs.includes(id)) return;
    setActiveDialogs([...activeDialogs, id]);
  };

  const popDialog = (id?: string) => {
    if (activeDialogs.length === 0) return;
    if (id) {
      const index = activeDialogs.indexOf(id);
      if (index === -1) return;
      setActiveDialogs(activeDialogs.slice(0, index));
    } else {
      setActiveDialogs(activeDialogs.slice(0, -1));
    }
  };

  const closeAll = () => {
    setActiveDialogs([]);
    setIsOpen(false);
  };

  return (
    <StackedDialogContext.Provider
      value={{
        definitions,
        activeDialogs,
        title,
        description,
        openDialog,
        pushDialog,
        popDialog,
        closeAll,
        isOpen,
      }}
    >
      {children}
    </StackedDialogContext.Provider>
  );
};

export const useStackedDialog = () => {
  const context = useContext(StackedDialogContext);
  if (!context) {
    throw new Error(
      "useStackedDialog must be used within StackedDialogProvider"
    );
  }
  return context;
};
