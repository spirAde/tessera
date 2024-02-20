import React, { useCallback, useMemo, useState, useEffect } from 'react';

import { ProjectContext, createProjectStore } from './ProjectContext';

const setColorThemeLocal = (newTheme) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('themeColor', newTheme);
  }
};

const getColorThemeLocal = () => {
  if (typeof window !== 'undefined') {
    const localTheme = window.localStorage.getItem('themeColor');
    if (localTheme && ['light', 'dark'].includes(localTheme)) {
      return localTheme;
    }
  }
  return null;
};

const useChangeTheme = ({ store }) => {
  useEffect(() => {
    const newTheme = store.systemData?.colorTheme;
    if (newTheme) {
      setColorThemeLocal(newTheme);
    }
  }, [store.systemData?.colorTheme]);
};

export const ProjectContextProvider = ({
  breadcrumbs,
  store: initialStore,
  businessTheme,
  baseUrl,
  baseApiPrefix,
  children,
  userLocationData,
}) => {
  // const [store, setStore] = useState(
  //   platformStore({
  //     systemData: {
  //       menu: componentsData.menu,
  //       mediaHost: componentsData.mediaHost || 'https://www.vtb.ru/',
  //       footer: componentsData.footer,
  //       colorTheme: getColorThemeLocal() || 'light',
  //       businessTheme: businessTheme || 'main',
  //       projectSysName: componentsData.projectSysName || 'vtb.ru',
  //       pageCode: componentsData.pageCode || 0,
  //       handbooks: componentsData.handbooks || [],
  //       menuConstructorInstances: componentsData.menuConstructorInstances || [],
  //       baseUrl: componentsData.baseUrl || '',
  //       apiPath: componentsData.apiPath || '',
  //       pagePath: componentsData.pagePath || '',
  //       dictionaryPath: componentsData.dictionaryPath || '',
  //       baseApiPrefix: componentsData.baseApiPrefix || '',
  //     },
  //     userLocation: userLocationData,
  //   }),
  // );

  const [store, setStore] = useState(createProjectStore(initialStore));

  const getTransferData = useCallback(
    (key) => {
      return store.transferData[key];
    },
    [store.transferData],
  );

  const setTransferData = useCallback((key, data) => {
    setStore((prevState) => {
      return {
        ...prevState,
        transferData: {
          ...prevState.transferData,
          [key]: data,
        },
      };
    });
  }, []);

  const setSystemData = useCallback((key, data) => {
    setStore((prevState) => {
      return {
        ...prevState,
        systemData: {
          ...prevState.systemData,
          [key]: data,
        },
      };
    });
  }, []);

  const handlers = useMemo(
    () => ({
      getTransferData,
      setTransferData,
      setSystemData,
    }),
    [getTransferData, setTransferData, setSystemData],
  );

  const context = useMemo(
    () => ({
      store,
      breadcrumbs,
      handlers,
      colorTheme: store.systemData?.colorTheme,
      businessTheme: store.systemData?.businessTheme,
      baseUrl,
      baseApiPrefix,
    }),
    [breadcrumbs, store, handlers, baseUrl, baseApiPrefix],
  );

  useChangeTheme({ store });

  return <ProjectContext.Provider value={context}>{children}</ProjectContext.Provider>;
};
