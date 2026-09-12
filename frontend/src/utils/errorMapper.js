/**
 * GreenSync Standard Frontend Error Mapper
 * Maps backend error codes & HTTP situations to exact handbook copy (Section 28)
 */

export const ERROR_MESSAGES = {
  INVALID_LOGIN: "That email or password doesn't match our records.",
  EXPIRED_TOKEN: "Your session expired — please log in again.",
  NETWORK_FAILURE: "We couldn't reach GreenSync. Check your connection and try again.",
  SERVER_ERROR: "Something went wrong on our end. Please try again in a moment.",
  NO_FEASIBLE_SCHEDULE: "We couldn't find a suitable renewable window. Your deadline is still safe — try expanding your flexibility window.",
};

export function getFriendlyErrorMessage(error) {
  if (!error) return ERROR_MESSAGES.SERVER_ERROR;

  // Network offline / connection refused
  if (error.code === 'ERR_NETWORK' || !error.response) {
    return ERROR_MESSAGES.NETWORK_FAILURE;
  }

  const status = error.response?.status;
  const backendCode = error.response?.data?.error?.code || error.response?.data?.code;
  const backendMessage = error.response?.data?.error?.message || error.response?.data?.message;

  if (status === 401 || backendCode === 'TOKEN_EXPIRED' || backendCode === 'UNAUTHORIZED') {
    if (backendCode === 'INVALID_CREDENTIALS') {
      return ERROR_MESSAGES.INVALID_LOGIN;
    }
    return ERROR_MESSAGES.EXPIRED_TOKEN;
  }

  if (backendCode === 'NO_FEASIBLE_SLOT' || backendCode === 'NO_FEASIBLE_SCHEDULE') {
    return ERROR_MESSAGES.NO_FEASIBLE_SCHEDULE;
  }

  if (status >= 500) {
    return ERROR_MESSAGES.SERVER_ERROR;
  }

  return backendMessage || ERROR_MESSAGES.SERVER_ERROR;
}

export const mapBackendError = getFriendlyErrorMessage;

