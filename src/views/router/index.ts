import { createContext, useContext } from "react";

export type CurrentRouteType = "chat" | "config";
export interface IRouter {
  currentRoute: CurrentRouteType;
  updateRoute: (route: CurrentRouteType) => void;
}

// 创建一个 Context 对象
export const RouterContext = createContext<IRouter | undefined>(undefined);

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (context === undefined) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return context;
};
