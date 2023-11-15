import { DataPoint } from 'data/analytics/constants'
import { ComputeUsageMetric, computeUsageMetricLabel } from 'data/analytics/org-daily-stats-query'
import { OrgSubscription } from 'data/subscriptions/org-subscription-query'
import SectionContent from './SectionContent'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import AlertError from 'components/ui/AlertError'
import Panel from 'components/ui/Panel'
import { IconBarChart2 } from 'ui'
import UsageBarChart from './UsageBarChart'
import { Attribute } from './Usage.constants'
import { useMemo } from 'react'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import BillingMetric from '../BillingSettings/BillingBreakdown/BillingMetric'
import { BILLING_BREAKDOWN_METRICS } from '../BillingSettings/BillingBreakdown/BillingBreakdown.constants'

export interface ComputeProps {
  orgSlug: string
  projectRef?: string
  startDate: string | undefined
  endDate: string | undefined
  subscription: OrgSubscription | undefined
  currentBillingCycleSelected: boolean
}

// [Joshen TODO] Needs to take in org slug and eventually use daily stats org query
const TotalUsage = ({
  orgSlug,
  projectRef,
  subscription,
  startDate,
  endDate,
  currentBillingCycleSelected,
}: ComputeProps) => {
  const isUsageBillingEnabled = subscription?.usage_billing_enabled

  const {
    data: usage,
    error: usageError,
    isLoading: isLoadingUsage,
    isError: isErrorUsage,
    isSuccess: isSuccessUsage,
  } = useOrgUsageQuery({ orgSlug })

  const description = isUsageBillingEnabled
    ? 'Your plan includes a limited amount of usage. If the usage on your organization exceeds these quotas, your subscription will be charged for the overages. It may take up to 24 hours for usage stats to update.'
    : 'Your plan includes a limited amount of usage. If the usage on your organization exceeds these quotas, you may experience restrictions, as you are currently not billed for overages. It may take up to 24 hours for usage stats to update.'

  const hasExceededAnyLimits =
    !isUsageBillingEnabled &&
    Boolean(
      usage?.usages.find(
        (metric) =>
          !metric.unlimited && metric.capped && metric.usage > (metric?.pricing_free_units ?? 0)
      )
    )

  return (
    <div id="summary">
      <SectionContent
        section={{
          name: 'Usage Summary',
          description,
          links: [
            {
              name: 'How billing works',
              url: 'https://supabase.com/docs/guides/platform/org-based-billing',
            },
            {
              name: 'Supabase Plans',
              url: 'https://supabase.com/pricing',
            },
          ],
        }}
      >
        {isLoadingUsage && (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        )}

        {isErrorUsage && <AlertError subject="Failed to retrieve usage data" error={usageError} />}

        {isSuccessUsage && (
          <div>
            <p className="text-sm">
              You have not exceeded your{' '}
              <span className="font-medium">{subscription?.plan.name}</span> plan quota in this
              billing cycle.
            </p>
            <div className="grid grid-cols-12 mt-3">
              {BILLING_BREAKDOWN_METRICS.map((metric, i) => {
                return (
                  <BillingMetric
                    idx={i}
                    key={metric.key}
                    slug={orgSlug}
                    metric={metric}
                    usage={usage}
                    subscription={subscription!}
                  />
                )
              })}
            </div>
          </div>
        )}
      </SectionContent>
    </div>
  )
}

export default TotalUsage
