import { createContext, useContext } from "react";
import type { AppContainer } from "@presentation/di/container";
import { container } from "@presentation/di/container";

const DependencyContext = createContext<AppContainer>(container);

export const DependencyProvider = DependencyContext.Provider;

export const useDependencies = () => useContext(DependencyContext);
