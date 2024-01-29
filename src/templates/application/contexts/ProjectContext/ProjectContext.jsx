import { createContext } from 'react';

const initialSystemData = {
  menu: null,
  colorTheme: 'light',
  businessTheme: 'main',
};

const initialUserLocation = {
  userCountry: 'Россия',
  userRegion: 'Москва',
  userCity: 'Москва',
};

export const createProjectStore = (value) => {
  const systemData = value?.systemData ?? initialSystemData;
  const transferData = value?.transferData ?? {};
  const userLocation = value?.userLocation ?? initialUserLocation;

  return {
    systemData,
    transferData,
    userLocation,
  };
};

export const ProjectContext = createContext({
  breadcrumbs: [],
  store: createProjectStore(),
});
