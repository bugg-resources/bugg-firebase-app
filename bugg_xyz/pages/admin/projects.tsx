import { NextPage } from "next";
import React, { useEffect, useState } from "react";
import {
  PlusSmIcon,
  SearchIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
} from "@heroicons/react/outline";
import toast from "react-hot-toast";
import {
  doc,
  collection,
  getFirestore,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { useLoadingBar } from "../../components/LoadingBar";
import NewProjectModal from "../../components/admin/NewProjectModal";
import ConfirmationModal from "../../components/admin/ConfirmationModal";
import ProjectModal from "../../components/admin/ProjectModal";
import { Project } from "../../types";

const ProjectAdmin: NextPage = () => {
  const loadingBar = useLoadingBar();

  const [projects, setProjects] = useState<Project[]>([]);
  const [analyses, setAnalyses] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [isNewProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    loadingBar.start();

    fetchAnalyses();

    const unsubscribe = onSnapshot(
      collection(getFirestore(), "projects"),
      (snapshot) => {
        const projectsData: Project[] = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Project)
        );
        setProjects(projectsData);
        loadingBar.complete();
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const openDeleteModal = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedProject(null);
    setIsDeleteModalOpen(false);
  };

  const openProjectModal = (project: Project, editMode: boolean) => {
    setSelectedProject(project);
    setIsEditMode(editMode);
    setProjectModalOpen(true);
  };

  const closeProjectModal = () => {
    setProjectModalOpen(false);
    setSelectedProject(null);
  };

  const handleUpdateProject = async (
    newName: string,
    newAnalyses: string[]
  ) => {
    if (selectedProject) {
      const projectRef = doc(getFirestore(), "projects", selectedProject.id);

      try {
        await updateDoc(projectRef, {
          name: newName,
          analyses: newAnalyses,
        });
        console.log("Project updated successfully");
      } catch (error) {
        console.error("Error updating project: ", error);
      }
    }
    toast(`✅️ Successfully updated project ${selectedProject?.name}`);
    closeProjectModal();
  };

  const fetchAnalyses = async () => {
    try {
      const analysesSnapshot = await getDocs(
        collection(getFirestore(), "analyses")
      );
      const analysesData = analysesSnapshot.docs.map((doc) => doc.id);
      setAnalyses(analysesData);
    } catch (error) {
      console.error("Error fetching analyses:", error);
    }
  };

  const addProject = async (name: string, analyses: string[]) => {
    if (!name) {
      toast("⚠️ Error name is required to create project");
      return;
    }

    await addDoc(collection(getFirestore(), "projects"), {
      name,
      analyses,
    });
    toast(`✅️ Successfully added project ${name}`);
  };

  const removeProject = async () => {
    await deleteDoc(doc(getFirestore(), "projects", selectedProject!.id));
    setIsDeleteModalOpen(false);
    toast(`✅️ Successfully deleted project ${selectedProject?.name}`);
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {isNewProjectModalOpen && (
        <NewProjectModal
          onClose={() => setNewProjectModalOpen(false)}
          analyses={analyses}
          createProject={addProject}
        />
      )}

      {isProjectModalOpen && (
        <ProjectModal
          onClose={closeProjectModal}
          analyses={analyses}
          projectDetails={selectedProject}
          updateProject={handleUpdateProject}
          isEditMode={isEditMode}
        />
      )}

      {isDeleteModalOpen && (
        <ConfirmationModal
          title="Confirm Deletion"
          text={`Are you sure you want to delete ${selectedProject?.name}?`}
          onClose={closeDeleteModal}
          onConfirm={removeProject}
        />
      )}

      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center py-3 bg-white border-b border-gray-500 sticky top-0 z-10">
          <button
            className="flex items-center focus:outline-none text-white font-medium text-base text-white bg-borange hover:opacity-90 rounded-md px-4 py-2 mr-2"
            onClick={() => setNewProjectModalOpen(true)}
          >
            <PlusSmIcon className="h-6 w-6" />
            {/* Project */}
          </button>
          <div className="relative w-1/2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search"
              className="text-sm w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-borange focus:border-borange"
              value={searchTerm}
              onChange={handleSearch}
            />
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setSearchTerm("")}
              >
                <XIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          <ul className="list-none p-0">
            {filteredProjects.map((project: Project) => (
              <li
                key={project.id}
                className="cursor-pointer bg-white shadow rounded-md p-3 m-3"
                onClick={(e) => {
                  e.stopPropagation();
                  openProjectModal(project, true);
                }}
              >
                <div className="flex">
                  <h3 className="text-md text-gray-500 hover:text-gray-900">{project.name}</h3>
                  {/* <button
                    className="text-borange hover:text-red-700 ml-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      openProjectModal(project, true);
                    }}
                  >
                    <PencilIcon width={20}></PencilIcon>
                  </button> */}
                  <button
                    className="text-red-500 hover:text-red-700 ml-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(project);
                    }}
                  >
                    <TrashIcon width={20}></TrashIcon>
                  </button>
                </div>
                <hr className="my-1" />
                <p className="text-sm text-gray-500">
                  Analyses:<span className="ml-4">{project.analyses?.join(", ")}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default ProjectAdmin;
