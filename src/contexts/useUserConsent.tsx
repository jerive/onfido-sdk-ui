import {
  getApplicantConsents,
  updateApplicantConsents,
  updateApplicantLocation,
} from '~utils/onfidoApi'
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'preact/compat'
import { ComponentChildren, createContext, Fragment, h } from 'preact'
import { ApplicantConsent, ApplicantConsentStatus } from '~types/api'
import { getPayloadFromJWT } from '~utils/jwt'
import useSdkConfigurationService from '~contexts/useSdkConfigurationService'

type ConsentProviderProps = {
  children: ComponentChildren
  url?: string
  token?: string
  fallback?: ComponentChildren
}

export type ConsentContextValue = {
  enabled: boolean
  consents: ApplicantConsentStatus[]
  updateConsents: (granted: boolean) => Promise<void>
}

export const UserConsentContext = createContext<ConsentContextValue>({
  enabled: false,
  consents: [],
  updateConsents: () => Promise.resolve(),
})

export const UserConsentProvider = ({
  children,
  url,
  token,
  fallback,
}: ConsentProviderProps) => {
  if (!token) {
    throw new Error('token not provided')
  }

  if (!url) {
    throw new Error('url not provided')
  }

  const { sdk_features } = useSdkConfigurationService()

  const applicantUUID = useMemo(() => getPayloadFromJWT(token).app, [token])

  const [consents, setConsents] = useState<
    ApplicantConsentStatus[] | undefined
  >(undefined)

  const enabled = sdk_features?.enable_require_applicant_consents ?? false

  const updateConsents = useCallback(
    (granted: boolean) => {
      if (!consents) {
        throw new Error('no consents available')
      }

      if (!applicantUUID) {
        throw new Error('applicant UUID not provided')
      }

      const grantedConsentsStatus: ApplicantConsentStatus[] = consents.map(
        ({ name, required }) => ({
          name,
          granted,
          required,
        })
      )

      const grantedConsents: ApplicantConsent[] = consents.map(({ name }) => ({
        name,
        granted,
      }))

      return updateApplicantConsents(
        applicantUUID,
        grantedConsents,
        url,
        token
      ).then(() => setConsents(grantedConsentsStatus))
    },
    [applicantUUID, consents, token, url]
  )

  useEffect(() => {
    if (!enabled || !applicantUUID) {
      setConsents([])
      return
    }

    updateApplicantLocation(applicantUUID, url, token)
      .then(() => getApplicantConsents(applicantUUID, url, token))
      .then((applicantConsents) => setConsents(applicantConsents))
      .catch(() =>
        setConsents([
          {
            name: 'privacy_notices_read',
            granted: false,
            required: true,
          },
        ])
      )
  }, [url, token, applicantUUID, enabled])

  if (!consents) {
    return <Fragment>{fallback}</Fragment>
  }

  return (
    <UserConsentContext.Provider
      value={{
        enabled,
        consents,
        updateConsents,
      }}
    >
      {children}
    </UserConsentContext.Provider>
  )
}

const useUserConsent = () => {
  return useContext(UserConsentContext)
}

export default useUserConsent
