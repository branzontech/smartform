
import React from "react";
import { GoogleCalendarIntegration } from "../google-calendar/GoogleCalendarIntegration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const GoogleCalendarSettings = () => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Integración con Google Calendar</CardTitle>
        <CardDescription>
          Conecta tu cuenta de Google Calendar para sincronizar tus citas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleCalendarIntegration />
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarSettings;
