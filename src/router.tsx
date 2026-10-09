import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";
import { Bootstrap } from "./components/jarvis/Bootstrap";
import { HomePage } from "./routes/index";
import { ChatPage } from "./routes/chat.$threadId";
import { SettingsPage } from "./routes/configuraciones";

const rootRoute = createRootRoute({
  component: () => (
    <Bootstrap>
      <Outlet />
    </Bootstrap>
  ),
});

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: HomePage });
const chatRoute = createRoute({ getParentRoute: () => rootRoute, path: "/chat/$threadId", component: ChatPage });
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/configuraciones", component: SettingsPage });

export const routeTree = rootRoute.addChildren([indexRoute, chatRoute, settingsRoute]);
