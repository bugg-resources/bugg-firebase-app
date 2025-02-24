import { NextPage } from "next";
import React, { useEffect, useState } from "react";
import { SearchIcon, PencilIcon, XIcon } from "@heroicons/react/outline";
import toast from "react-hot-toast";
import {
  doc,
  collection,
  getFirestore,
  getDocs,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import clsx from "clsx";
import { useLoadingBar } from "../../components/LoadingBar";
import ProfileModal from "../../components/admin/ProfileModal";
import { useCurrentProfile } from "../../data/useAuth";
import { Profile } from "../../types";

const ProfileAdmin: NextPage = () => {
  const currentProfile = useCurrentProfile();
  const loadingBar = useLoadingBar();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [isProfileModalOpen, setProfileModalOpen] = useState(false);

  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    loadingBar.start();

    fetchProjects();

    const unsubscribe = onSnapshot(
      collection(getFirestore(), "profiles"),
      (snapshot) => {
        const profilesData: Profile[] = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Profile)
        );
        setProfiles(profilesData);
        loadingBar.complete();
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const openProfileModal = (profile: Profile, editMode: boolean) => {
    setSelectedProfile(profile);
    setIsEditMode(editMode);
    setProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
    setSelectedProfile(null);
  };

  const handleUpdateProfile = async (
    newName: string,
    newIsAdmin: boolean,
    newProjects: string[]
  ) => {
    if (selectedProfile) {
      const profileRef = doc(getFirestore(), "profiles", selectedProfile.id);

      try {
        await updateDoc(profileRef, {
          displayName: newName,
          isAdmin: newIsAdmin,
          projects: newProjects,
        });
        console.log("Profile updated successfully");
      } catch (error) {
        console.error("Error updating profile: ", error);
      }
    }
    toast(`✅️ Successfully updated profile ${selectedProfile?.displayName}`);
    closeProfileModal();
  };

  const fetchProjects = async () => {
    try {
      const projectsSnapshot = await getDocs(
        collection(getFirestore(), "projects")
      );
      const projectsData = projectsSnapshot.docs.map((doc) => doc.id);
      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const filteredProfiles = profiles.filter((profile) =>
    profile.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {isProfileModalOpen && (
        <ProfileModal
          onClose={closeProfileModal}
          projects={projects}
          profileDetails={selectedProfile}
          updateProfile={handleUpdateProfile}
          isEditMode={isEditMode}
        />
      )}

      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center py-3 bg-white border-b border-gray-500 sticky top-0 z-10">
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
            {filteredProfiles.map((profile: Profile) => (
              <li
                key={profile.id}
                className="cursor-pointer bg-white shadow rounded-md p-3 m-3"
                onClick={(e) => {
                  e.stopPropagation();
                  openProfileModal(profile, true);
                }}
              >
                <div className="flex">
                  <h3
                    className={clsx(
                      profile.id === currentProfile?.id ? "text-borange" : "text-gray-500 hover:text-gray-900",
                      "text-md"
                    )}
                  >
                    {profile.displayName}
                  </h3>
                  {/* <button
                    className="text-borange hover:text-red-700 ml-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      openProfileModal(profile, true);
                    }}
                  >
                    <PencilIcon width={20}></PencilIcon>
                  </button> */}
                </div>
                <hr className="my-1" />
                <div className="text-sm text-gray-500">
                  <p>
                    Admin:<span className="ml-4">{profile.isAdmin ? "Yes" : "No"}</span>
                  </p>
                  <p>
                    Projects:<span className="ml-4">{profile.projects?.join(", ")}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default ProfileAdmin;
