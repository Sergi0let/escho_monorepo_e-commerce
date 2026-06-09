'use client'

import { useEffect } from 'react'
import OneSignal from 'react-onesignal'

const OneSignalProvider = () => {
  useEffect(() => {
    void OneSignal.init({ appId: 'c61e7f6e-b8dc-4d40-865a-f577c3628cd9' })
  }, [])
  return null
}

export default OneSignalProvider
