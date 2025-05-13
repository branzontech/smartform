
import React from "react";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Layout } from "@/components/layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UpcomingSessions from "@/components/telemedicine/UpcomingSessions";
import NewSessionForm from "@/components/telemedicine/NewSessionForm";
import SessionHistory from "@/components/telemedicine/SessionHistory";
import VideoCall from "@/components/telemedicine/VideoCall";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TelemedicinePage = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "upcoming";
  const sessionId = searchParams.get("sessionId");
  const navigate = useNavigate();
  
  // Return to sessions list when ending a call
  const handleEndCall = () => {
    navigate("/app/telemedicina?tab=upcoming", { replace: true });
  };
  
  if (sessionId) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <Button 
            variant="back" 
            onClick={() => navigate("/app/telemedicina?tab=upcoming", { replace: true })}
            className="mb-4"
          >
            Volver a sesiones
          </Button>
          <VideoCall sessionId={sessionId} onEndCall={handleEndCall} />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <BackButton />
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Telemedicina</h1>
          <p className="text-muted-foreground">Gestione sus consultas médicas por videollamada</p>
        </div>
        
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={(value) => {
          navigate(`/app/telemedicina?tab=${value}`, { replace: true });
        }}>
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-8">
            <TabsTrigger value="upcoming">Próximas sesiones</TabsTrigger>
            <TabsTrigger value="new">Nueva sesión</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="space-y-4">
            <UpcomingSessions />
          </TabsContent>
          
          <TabsContent value="new" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Programar nueva consulta</CardTitle>
                <CardDescription>Complete el formulario para programar una nueva sesión de telemedicina</CardDescription>
              </CardHeader>
              <CardContent>
                <NewSessionForm />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <SessionHistory />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TelemedicinePage;
