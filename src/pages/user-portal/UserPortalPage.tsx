
import React from "react";
import { Layout } from "@/components/layout";
import { UserPortalDashboard } from "@/components/user-portal/UserPortalDashboard";

const UserPortalPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Portal de Usuario
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Accede a tu información médica de forma segura y organizada
          </p>
        </div>
        <UserPortalDashboard />
      </div>
    </Layout>
  );
};

export default UserPortalPage;
