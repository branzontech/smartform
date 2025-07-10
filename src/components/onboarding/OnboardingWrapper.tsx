import React from 'react';
import { UserGuide } from './UserGuide';
import { useOnboarding } from '@/hooks/use-onboarding';

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export const OnboardingWrapper: React.FC<OnboardingWrapperProps> = ({ children }) => {
  const { showGuide, isLoading, completeOnboarding, skipOnboarding } = useOnboarding();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-purple-600 rounded-full mx-auto mb-4 animate-bounce"></div>
            <h2 className="text-xl font-semibold text-gray-700">Cargando Sistema Médico...</h2>
            <p className="text-gray-500 mt-2">Preparando todo para ti</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {showGuide && (
        <UserGuide
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
        />
      )}
    </>
  );
};