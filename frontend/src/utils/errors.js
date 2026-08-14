import { ApiError } from '../api/client.js';

// Shared by every form that submits to the API: translate the backend's
// {code, params} into the viewer's language, falling back to a generic
// message for anything that isn't a recognized ApiError.
export function describeError(err, localeStore) {
  return err instanceof ApiError
    ? localeStore.t(`errorCode.${err.code}`, err.params)
    : localeStore.t('error.generic');
}
