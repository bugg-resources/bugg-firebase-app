import {
  NavigationContainer,
  NavigationContainerRef,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useRef } from "react";
import { useCurrentUid } from "./data/useAuth";

const DashboardChartsPage = React.lazy(
  () => import("./pages/DashboardChartsPage")
);
const DashboardMapPage = React.lazy(() => import("./pages/DashboardMapPage"));
const DashboardTablePage = React.lazy(
  () => import("./pages/DashboardTablePage")
);

const LoginPage = React.lazy(() => import("./pages/login"));
const ProjectSelector = React.lazy(() => import("./pages/ProjectSelector"));
const TagEditorPage = React.lazy(() => import("./pages/TagEditorPage"));

const DeviceSettingsPage = React.lazy(
  () => import("./pages/DeviceSettingsPage")
);

const ConfigurationPage = React.lazy(() => import("./pages/ConfigurationPage"));
const ExportListPage = React.lazy(() => import("./pages/ExportListPage"));

export type MainStackParamList = {
  ProjectSelector: {};
  DashboardChartsPage: {
    projectId: string;
    dateRange?: string;
    devices?: string;
    tags?: string;
  };
  DashboardMapPage: {
    projectId: string;
    dateRange?: string;
    devices?: string;
    tags?: string;
  };
  DashboardTablePage: {
    projectId: string;
    dateRange?: string;
    devices?: string;
    tags?: string;
  };

  TagEditor: {
    projectId: string;
    audioId: string;
    tag?: string;
  };

  DeviceSettingsPage: {
    projectId: string;
    device?: string;
  };

  ConfigurationPage: {
    projectId: string;
    configId?: string;
  };

  ExportListPage: {
    projectId: string;
  };
};

export type LoginStackParamList = {
  Login: {};
};

const linking = {
  prefixes: ["/", "bugg://"],
  config: {
    screens: {
      Login: {
        screens: {
          Login: "login",
        },
      },
      Main: {
        screens: {
          ProjectSelector: "projects",
          DashboardChartsPage: ":projectId/charts/:dateRange?/:devices?/:tags?",
          DashboardMapPage: ":projectId/map/:dateRange?/:devices?/:tags?",
          DashboardTablePage: ":projectId/table/:dateRange?/:devices?/:tags?",
          DeviceSettingsPage: ":projectId/settings/:deviceId?/:assign?",
          ConfigurationPage: ":projectId/config/:configId?",
          ExportListPage: ":projectId/exports/:exportId?",
        },
      },
      TagEditor: ":projectId/editor/:audioId/:tag?",
    },
  },
};

const MainStack = createStackNavigator<MainStackParamList>();
export function MainStackScreen() {
  return (
    <MainStack.Navigator
      initialRouteName="ProjectSelector"
      screenOptions={{
        headerShown: false,
      }}
    >
      <MainStack.Screen
        name="ProjectSelector"
        component={ProjectSelector}
        options={{ title: "Projects | Bugg" }}
      />
      <MainStack.Screen
        name="DashboardChartsPage"
        component={DashboardChartsPage}
        options={{ title: "Dashboard | Bugg" }}
      />
      <MainStack.Screen
        name="DashboardMapPage"
        component={DashboardMapPage}
        options={{ title: "Dashboard Map | Bugg" }}
      />
      <MainStack.Screen
        name="DashboardTablePage"
        component={DashboardTablePage}
        options={{ title: "Dashboard | Bugg" }}
      />
      <MainStack.Screen
        name="DeviceSettingsPage"
        component={DeviceSettingsPage}
        options={{ title: "Settings |  Bugg" }}
      />
      <MainStack.Screen
        name="ConfigurationPage"
        component={ConfigurationPage}
        options={{ title: "Configuration |  Bugg" }}
      />
      <MainStack.Screen
        name="ExportListPage"
        component={ExportListPage}
        options={{ title: "Exports |  Bugg" }}
      />
    </MainStack.Navigator>
  );
}

const LoginStack = createStackNavigator<LoginStackParamList>();
export function LoginStackScreen() {
  return (
    <LoginStack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <LoginStack.Screen name="Login" component={LoginPage} />
    </LoginStack.Navigator>
  );
}

interface RouterProps {}

const RootStack = createStackNavigator();
export default function Router(props: RouterProps) {
  const navigationRef = useRef(null as null | NavigationContainerRef);
  let isLoggedIn = useCurrentUid();

  if (isLoggedIn === undefined) {
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <RootStack.Navigator
        mode="modal"
        initialRouteName={isLoggedIn ? "Main" : "Login"}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: "transparent" },
          cardOverlayEnabled: true,
          animationEnabled: true,
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress.interpolate({
                inputRange: [0, 0.5, 0.9, 1],
                outputRange: [0, 0.25, 0.7, 1],
              }),
            },
            overlayStyle: {
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
                extrapolate: "clamp",
              }),
            },
          }),
        }}
      >
        {isLoggedIn && (
          <RootStack.Screen
            name="Main"
            component={MainStackScreen}
            options={{ headerShown: false }}
          />
        )}

        {isLoggedIn === null && (
          <LoginStack.Screen
            name="Login"
            component={LoginStackScreen}
            options={{ headerShown: false }}
          />
        )}

        <RootStack.Screen
          name="TagEditor"
          component={TagEditorPage}
          options={{ headerShown: false }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
