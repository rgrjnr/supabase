import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Form,
  IconAlertCircle,
  Input,
} from 'ui'
import { object, string } from 'yup'

import {
  FormActions,
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionLabel,
  FormSectionContent,
} from 'components/ui/Forms'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useCheckPermissions, useStore } from 'hooks'

const schema = object({
  HOOKS_MFA_VERIFICATION_ATTEMPT: string(),
  HOOKS_WRONG_PASSWORD: string(),
  HOOKS_CUSTOMIZE_ACCESS_TOKEN: string(),
})

const HooksConfig = observer(() => {
  const { ui } = useStore()
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const formId = 'auth-config-general-form'
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const INITIAL_VALUES = {}

  const onSubmit = (values: any, { resetForm }: any) => {
    const payload = { ...values }
    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onError: () => {
          ui.setNotification({
            category: 'error',
            message: `Failed to update settings`,
          })
        },
        onSuccess: () => {
          ui.setNotification({
            category: 'success',
            message: `Successfully updated settings`,
          })
          resetForm({ values: values, initialValues: values })
        },
      }
    )
  }

  if (isError) {
    return (
      <Alert_Shadcn_ variant="destructive">
        <IconAlertCircle strokeWidth={2} />
        <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{authConfigError.message}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  return (
    <Form id={formId} initialValues={INITIAL_VALUES} onSubmit={onSubmit} validationSchema={schema}>
      {({ handleReset, resetForm, values, initialValues }: any) => {
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

        // Form is reset once remote data is loaded in store
        useEffect(() => {
          if (isSuccess) {
            resetForm({ values: INITIAL_VALUES, initialValues: INITIAL_VALUES })
          }
        }, [isSuccess])

        return (
          <>
            <FormHeader
              title="Hook into Auth"
              description="Use PostgreSQL functions to customize the behavior of Supabase Auth to meet your needs."
            />
            <FormPanel
              disabled={true}
              footer={
                <div className="flex py-4 px-8">
                  <FormActions
                    form={formId}
                    isSubmitting={isUpdatingConfig}
                    hasChanges={hasChanges}
                    handleReset={handleReset}
                    disabled={!canUpdateConfig}
                    helper={
                      !canUpdateConfig
                        ? 'You need additional permissions to update authentication settings'
                        : undefined
                    }
                  />
                </div>
              }
            >
              <FormSection
                header={<FormSectionLabel>Customize Access Token (JWT) Claims</FormSectionLabel>}
              >
                <FormSectionContent loading={isLoading}>
                  <Input
                    id="SITE_URL"
                    size="small"
                    label="PostgreSQL Function"
                    descriptionText="A function called by Supabase Auth each time a new JWT is created. Return the claims you want to see in the JWT."
                    disabled={!canUpdateConfig}
                  />
                </FormSectionContent>
              </FormSection>
              <div className="border-t border-muted"></div>
            </FormPanel>
            <FormHeader
              title="Enterprise Hooks"
              description="Advanced Auth hooks available only to Teams and Enterprise plan customers."
            />
            <FormPanel
              disabled={true}
              footer={
                <div className="flex py-4 px-8">
                  <FormActions
                    form={formId}
                    isSubmitting={isUpdatingConfig}
                    hasChanges={hasChanges}
                    handleReset={handleReset}
                    disabled={!canUpdateConfig}
                    helper={
                      !canUpdateConfig
                        ? 'You need additional permissions to update authentication settings'
                        : undefined
                    }
                  />
                </div>
              }
            >
              <FormSection header={<FormSectionLabel>MFA Verification Attempt</FormSectionLabel>}>
                <FormSectionContent loading={isLoading}>
                  <Input
                    id="SITE_URL"
                    size="small"
                    label="PostgreSQL Function"
                    descriptionText="A function called by Supabase Auth each time a user tries to verify an MFA factor. Return a decision on whether to reject the attempt and future ones, or to allow the user to keep trying."
                    disabled={!canUpdateConfig}
                  />
                </FormSectionContent>
              </FormSection>
              <div className="border-t border-muted"></div>

              <FormSection
                header={<FormSectionLabel>Password Verification Attempt</FormSectionLabel>}
              >
                <FormSectionContent loading={isLoading}>
                  <Input
                    id="SITE_URL"
                    size="small"
                    label="PostgreSQL Function"
                    descriptionText="A function called by Supabase Auth each time a user tries to sign in with a password. Return a decision whether to allow the user to reject the attempt, or to allow the user to keep trying."
                    disabled={!canUpdateConfig}
                  />
                </FormSectionContent>
              </FormSection>
              <div className="border-t border-muted"></div>
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
})

export default HooksConfig
