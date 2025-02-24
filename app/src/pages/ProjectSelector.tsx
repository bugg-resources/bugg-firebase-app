import { Link, useLinkTo } from "@react-navigation/native";
import React, { memo, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BuggLogo } from "../components/Icons";
import { useCurrentProfile } from "../data/useAuth";
import { useProject } from "../data/useProject";

interface ProjectSelectorProps {}

function ProjectSelector(props: ProjectSelectorProps) {
  let profile = useCurrentProfile();
  let linkTo = useLinkTo();

  useEffect(() => {
    if (profile && profile.projects.length === 1) {
      linkTo(`/${profile.projects[0]}/charts`);
    }
  }, [linkTo, profile]);

  if (!profile) {
    return null;
  }

  if (profile.projects.length === 1) {
    // redirecting
    return null;
  }

  return (
    <View style={styles.ProjectSelector}>
      <View style={styles.logo}>
        <BuggLogo width={200}></BuggLogo>
      </View>
      <Text style={styles.title}>Projects</Text>
      {profile.projects.map((p) => (
        <ProjectRow key={p} projectId={p}></ProjectRow>
      ))}
    </View>
  );
}

interface ProjectRowProps {
  projectId: string;
}

function ProjectRow(props: ProjectRowProps) {
  let project = useProject(props.projectId);

  return (
    <Link to={`/${props.projectId}/charts`}>
      <Text style={styles.projectText}>{project?.name}</Text>
    </Link>
  );
}

const styles = StyleSheet.create({
  ProjectSelector: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  title: {
    fontWeight: "bold",
    fontSize: 34,
    marginBottom: 16,
  },
  projectText: {
    fontSize: 24,
  },
  logo: {
    height: 90,
    overflow: "hidden",
    marginBottom: 24,
  },
});

export default memo(ProjectSelector);
