import React, { useCallback, useMemo, useState } from 'react';

import { ProjectContext, createProjectStore } from './ProjectContext';

export const ProjectContextProvider = ({ store: initialStore, pages, children }) => {
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
      handlers,
      pages,
    }),
    [store, handlers, pages],
  );

  return <ProjectContext.Provider value={context}>{children}</ProjectContext.Provider>;
};
