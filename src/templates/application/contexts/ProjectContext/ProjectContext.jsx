import { createContext } from 'react';

export const createProjectStore = (value) => {
  const systemData = value?.systemData ?? {};
  const transferData = value?.transferData ?? {};
  const userLocation = value?.userLocation ?? {};

  return {
    systemData,
    transferData,
    userLocation,
  };
};

export const ProjectContext = createContext({
  store: createProjectStore(),
  pages: {},
});
