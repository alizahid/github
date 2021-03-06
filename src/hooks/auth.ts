import * as Sentry from '@sentry/react-native'
import { useEffect, useState } from 'react'
import { Linking, Platform } from 'react-native'
import { DEEPLINK_AUTH } from 'react-native-dotenv'
import { GITHUB_CLIENT_ID } from 'react-native-dotenv'
import parse from 'url-parse'

import { browser, dialog, firebase, storage } from '../lib'
import { GitHubUser } from '../types'
import { request } from './notifications'

export const useAuth = () => {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Linking.addEventListener('url', handler)

    return () => {
      Linking.removeEventListener('url', handler)
    }
  }, [])

  const handler = async ({ url }: { url: string }) => {
    try {
      const {
        query: { code }
      } = parse(url, true)

      if (typeof code === 'string') {
        const token = await firebase.auth(code)

        await storage.set('@token', token)

        const { login } = await request<GitHubUser>('/user', 'get')

        await storage.set('@login', login)

        await firebase.login(token, login)
      }
    } catch (error) {
      const { message } = error

      dialog.alert('error', message)

      Sentry.captureException(error)
    } finally {
      setLoading(false)
    }
  }

  const login = async () => {
    setLoading(true)

    try {
      const response = await browser.openAuth(
        `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=notifications&allow_signup=false`,
        DEEPLINK_AUTH
      )

      if (response.type === 'success') {
        handler(response)
      } else if (Platform.OS === 'ios') {
        setLoading(false)
      }
    } catch (error) {
      setLoading(false)

      const { message } = error

      dialog.alert('error', message)

      Sentry.captureException(error)
    }
  }

  const logout = async () => {
    firebase.logout()

    await storage.remove('@token')
    await storage.remove('@login')
  }

  return {
    loading,
    login,
    logout
  }
}
