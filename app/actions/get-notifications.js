import {
  GET_NOTIFICATIONS_PENDING,
  GET_NOTIFICATIONS_SUCCESS,
  GET_NOTIFICATIONS_FAILURE
} from '../constants'

import { github } from '../lib'

export const getNotificationsPending = () => {
  return {
    type: GET_NOTIFICATIONS_PENDING
  }
}

export const getNotificationsSuccess = data => {
  return {
    type: GET_NOTIFICATIONS_SUCCESS,
    data
  }
}

export const getNotificationsFailure = error => {
  return {
    type: GET_NOTIFICATIONS_FAILURE,
    error
  }
}

export default () => {
  return async dispatch => {
    dispatch(getNotificationsPending())

    try {
      const notifications = await github.get('/notifications?all=1')

      dispatch(getNotificationsSuccess(notifications))
    } catch (err) {
      dispatch(getNotificationsFailure(err))
    }
  }
}