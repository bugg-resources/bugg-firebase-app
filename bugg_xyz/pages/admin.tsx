import { NextPage } from "next";
import { useState } from "react";
import Head from "next/head";
import NavBar from "../components/NavBar";
import SidePanel from "../components/admin/SidePanel";
import Loading from "../components/admin/Loading";
import AccessDenied from "../components/admin/AccessDenied";
import ProjectsPage from "./admin/projects";
import UsersPage from "./admin/users";
import { useCurrentProfile } from "../data/useAuth";
import { Toaster } from "react-hot-toast";

const Admin: NextPage = () => {
  const [currentPage, setCurrentPage] = useState<string>("projects");
  const currentProfile = useCurrentProfile();

  const renderContent = () => {
    switch (currentPage) {
      case "projects":
        return <ProjectsPage />;
      case "users":
        return <UsersPage />;
      default:
        return <ProjectsPage />;
    }
  };

  const PageHead = () => (
    <Head>
      <title>Admin - Bugg</title>
      <meta name="description" content="Admin Panel" />
      <link rel="icon" sizes="192x192" href="/favicon.png" />
    </Head>
  );

  if (!currentProfile) {
    return (
      <>
        <PageHead />
        <NavBar />
        <Loading />
      </>
    );
  }

  if (!currentProfile?.isAdmin) {
    return (
      <>
        <PageHead />
        <NavBar />
        <AccessDenied />
      </>
    );
  }

  return (
    <>
      <PageHead />
      <div className="flex flex-col h-screen">
        <NavBar />
        <Toaster />
        <div className="flex flex-grow overflow-hidden">
          <div className="flex-shrink-0">
            <SidePanel currentPage={currentPage} setPage={setCurrentPage} />
          </div>
          <main className="bg-gray-200 flex-grow overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </>
  );
};

export default Admin;
