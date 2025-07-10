import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'medical-system-onboarding-completed';

export const useOnboarding = () => {
  const [showGuide, setShowGuide] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si es la primera vez que el usuario usa el sistema
    const isCompleted = localStorage.getItem(ONBOARDING_KEY);
    
    // Simular un pequeño delay para evitar flickering
    const timer = setTimeout(() => {
      if (!isCompleted) {
        setShowGuide(true);
      }
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowGuide(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowGuide(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setShowGuide(true);
  };

  return {
    showGuide,
    isLoading,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
};