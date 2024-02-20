import React from 'react';

import styled, { createGlobalStyle } from 'styled-components';

const Box = styled.div`
  display: flex;
  flex-direction: column;
  font-feature-settings: normal;
  height: 100%;
  width: 100%;
  -webkit-font-smoothing: antialiased;
`;

export const GlobalStyles = createGlobalStyle`
  html {
    scroll-behavior: smooth;
    box-sizing: border-box;
    line-height: 1.15;
    --webkit-text-size-adjust: 100%;
    font-family: ${({ $fontFamily }) => $fontFamily}, sans-serif;
  }
    
    body {
        margin: 0;
        padding: 0;
    }
    
    a {
      background-color: transparent;
    }
    
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }
    
    template {
      display: none;
    }
    
    [hidden] {
      display: none;
    }
    
    input {
      margin: 0;
    }

    #__next { width: 100%; background: white; }
`;

export const Body = ({ children, font = 'VTBGroupUI', fontFamily = 'VTB Group UI', ...attr }) => {
  return (
    <>
      <GlobalStyles $font={font} $fontFamily={fontFamily} />
      <Box {...attr}>{children}</Box>
    </>
  );
};
