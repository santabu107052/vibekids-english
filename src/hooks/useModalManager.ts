import { useState, useCallback } from 'react';
import { WordItem } from '../types';

export interface ModalManagerHook {
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  isWordManagerOpen: boolean;
  setIsWordManagerOpen: (open: boolean) => void;
  isBackupOpen: boolean;
  setIsBackupOpen: (open: boolean) => void;
  isMonetizationOpen: boolean;
  setIsMonetizationOpen: (open: boolean) => void;
  echoWord: WordItem | null;
  setEchoWord: (word: WordItem | null) => void;
  closeAllModals: () => void;
}

export function useModalManager(): ModalManagerHook {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWordManagerOpen, setIsWordManagerOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isMonetizationOpen, setIsMonetizationOpen] = useState(false);
  const [echoWord, setEchoWord] = useState<WordItem | null>(null);

  const closeAllModals = useCallback(() => {
    setIsProfileModalOpen(false);
    setIsWordManagerOpen(false);
    setIsBackupOpen(false);
    setIsMonetizationOpen(false);
    setEchoWord(null);
  }, []);

  return {
    isProfileModalOpen,
    setIsProfileModalOpen,
    isWordManagerOpen,
    setIsWordManagerOpen,
    isBackupOpen,
    setIsBackupOpen,
    isMonetizationOpen,
    setIsMonetizationOpen,
    echoWord,
    setEchoWord,
    closeAllModals,
  };
}
