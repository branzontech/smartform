import React from "react";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import WorkflowBuilder from "@/components/workflow/WorkflowBuilder";

const WorkflowPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-6">
        <BackButton />
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            Workflows Inteligentes
          </h1>
          <p className="text-muted-foreground">
            Automatiza procesos médicos con flujos de trabajo impulsados por IA
          </p>
        </div>
        
        <div className="h-[calc(100vh-240px)]">
          <WorkflowBuilder />
        </div>
      </main>
    </div>
  );
};

export default WorkflowPage;