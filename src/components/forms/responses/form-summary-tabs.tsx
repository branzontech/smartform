
import React from 'react';
import { BarChart, Users } from "lucide-react";
import { QuestionSummary } from './question-summary';
import { IndividualResponse } from './individual-response';
import { Form } from '@/pages/Home';

interface FormResponse {
  timestamp: string;
  data: {
    [key: string]: string | string[];
  };
}

interface FormSummaryTabsProps {
  activeTab: "summary" | "individual";
  setActiveTab: (tab: "summary" | "individual") => void;
  formData: Form;
  responses: FormResponse[];
  onPrint: (response: FormResponse, index: number) => void;
}

export const FormSummaryTabs = ({ 
  activeTab, 
  setActiveTab, 
  formData, 
  responses,
  onPrint
}: FormSummaryTabsProps) => {
  return (
    <>
      <div className="flex space-x-1 border border-gray-200 rounded-lg p-1 mb-6 bg-gray-50 w-fit">
        <button
          className={`px-4 py-2 rounded ${activeTab === "summary" ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'} transition-all`}
          onClick={() => setActiveTab("summary")}
        >
          <div className="flex items-center">
            <BarChart size={16} className="mr-2" />
            Resumen
          </div>
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === "individual" ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'} transition-all`}
          onClick={() => setActiveTab("individual")}
        >
          <div className="flex items-center">
            <Users size={16} className="mr-2" />
            Individuales
          </div>
        </button>
      </div>
      
      {activeTab === "summary" ? (
        <div className="space-y-6 animate-fade-in">
          {formData.questions.map(question => (
            <QuestionSummary
              key={question.id}
              question={question}
              responses={responses}
              onViewAllResponses={() => setActiveTab("individual")}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {responses.map((response, index) => (
            <IndividualResponse
              key={index}
              response={response}
              index={index}
              formData={formData}
              onPrint={onPrint}
            />
          ))}
        </div>
      )}
    </>
  );
};
