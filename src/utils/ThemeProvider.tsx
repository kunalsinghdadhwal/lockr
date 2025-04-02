"use client";
import {ThemeProvider as NextThemesProvider} from "next-themes";
import React, { ReactNode } from 'react';

export default function ThemeProvider({children, ...props}: {children: ReactNode}) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}