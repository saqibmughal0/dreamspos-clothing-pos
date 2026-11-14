import React, { useEffect } from 'react'
import PosHeader from '../feature-module/pos/posHeader'
import { Outlet } from 'react-router-dom'
import ThemeSettings from '../InitialPage/themeSettings'

const PosLayout = () => {
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      window.location.href = "/signin";
    }
  }, []);

  return (
    <>
        <PosHeader />
        <Outlet />
        <ThemeSettings />
    </>
  )
}

export default PosLayout