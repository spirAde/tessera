import React from 'react';

import { ProjectBox, GlobalStyles } from './Project.styled';

export const Project = ({
  children,
  font = 'VTBGroupUI',
  fontFamily = 'VTB Group UI',
  ...attr
}) => {
  return (
    <>
      <GlobalStyles $font={font} $fontFamily={fontFamily} />
      <ProjectBox {...attr}>{children}</ProjectBox>
    </>
  );
};
