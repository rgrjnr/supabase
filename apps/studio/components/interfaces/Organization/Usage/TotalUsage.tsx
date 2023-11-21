import { DataPoint } from 'data/analytics/constants'
import { PricingMetric, computeUsageMetricLabel } from 'data/analytics/org-daily-stats-query'
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
import ComputeUsageMetric from '../BillingSettings/BillingBreakdown/ComputeUsageMetric'
import clsx from 'clsx'

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

  const usage = {
    slugs: ['ycippnjpzrhwqhfxahwq'],
    usage_billing_enabled: false,
    usages: [
      {
        usage: 150,
        metric: 'EGRESS',
        cost: 0,
        available_in_plan: true,
        unlimited: false,
        capped: true,
        pricing_strategy: 'NONE',
        pricing_free_units: 5,
      },
      {
        usage: 0,
        metric: 'DATABASE_SIZE',
        cost: 0,
        available_in_plan: true,
        unlimited: false,
        capped: true,
        pricing_strategy: 'NONE',
        pricing_free_units: 0.5,
      },
      {
        usage: 0,
        metric: 'STORAGE_SIZE',
        cost: 0,
        available_in_plan: true,
        unlimited: false,
        capped: false,
        pricing_strategy: 'NONE',
        pricing_free_units: 1,
      },
      {
        usage: 0,
        metric: 'STORAGE_IMAGES_TRANSFORMED',
        cost: 0,
        available_in_plan: false,
        unlimited: false,
        capped: false,
        pricing_strategy: 'NONE',
        pricing_free_units: 0,
      },
      {
        usage: 0,
        metric: 'MONTHLY_ACTIVE_USERS',
        cost: 0,
        available_in_plan: true,
        unlimited: false,
        capped: true,
        pricing_strategy: 'NONE',
        pricing_free_units: 50000,
      },
      {
        usage: 0,
        metric: 'MONTHLY_ACTIVE_SSO_USERS',
        cost: 0,
        available_in_plan: false,
        unlimited: false,
        capped: false,
        pricing_strategy: 'NONE',
        pricing_free_units: 0,
      },
      {
        usage: 0,
        metric: 'FUNCTION_INVOCATIONS',
        cost: 0,
        available_in_plan: true,
        unlimited: false,
        capped: true,
        pricing_strategy: 'NONE',
        pricing_free_units: 500000,
      },
      {
        usage: 0,
        metric: 'FUNCTION_COUNT',
        cost: 0,
        available_in_plan: true,
        unlimited: false,
        capped: true,
        pricing_strategy: 'NONE',
        pricing_free_units: 10,
      },
      {
        usage: 0,
        metric: 'REALTIME_MESSAGE_COUNT',
        cost: 0,
        available_in_plan: true,
        unlimited: false,
        capped: false,
        pricing_strategy: 'NONE',
        pricing_free_units: 2000000,
      },
      {
        usage: 0,
        metric: 'REALTIME_PEAK_CONNECTIONS',
        cost: 0,
        available_in_plan: true,
        unlimited: false,
        capped: true,
        pricing_strategy: 'NONE',
        pricing_free_units: 200,
      },
      {
        usage: 355,
        metric: 'COMPUTE_HOURS_XS',
        cost: 5,
        available_in_plan: true,
        unlimited: false,
        capped: true,
        pricing_strategy: 'NONE',
        pricing_free_units: 500,
      },
    ],
  }

  const {
    //data: usage,
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

  const sortedBillingMetrics = useMemo(() => {
    return BILLING_BREAKDOWN_METRICS.slice().sort((a, b) => {
      const usageMetaA = usage.usages.find((x) => x.metric === a.key)
      const usageRatioA =
        typeof usageMetaA !== 'number'
          ? (usageMetaA?.usage ?? 0) / (usageMetaA?.pricing_free_units ?? 0)
          : 0

      const usageMetaB = usage.usages.find((x) => x.metric === b.key)
      const usageRatioB =
        typeof usageMetaB !== 'number'
          ? (usageMetaB?.usage ?? 0) / (usageMetaB?.pricing_free_units ?? 0)
          : 0

      return usageRatioB - usageRatioA
    })
  }, [usage])

  const computeMetrics = ['COMPUTE_HOURS_XS']

  const allMetricsLength = sortedBillingMetrics.length + computeMetrics.length

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

        {isSuccessUsage && subscription && (
          <div>
            <p className="text-sm">
              You have not exceeded your{' '}
              <span className="font-medium">{subscription?.plan.name}</span> plan quota in this
              billing cycle.
            </p>
            <div className="grid grid-cols-12 mt-3">
              {sortedBillingMetrics.map((metric, i) => {
                return (
                  <div
                    className={clsx(
                      'col-span-12 md:col-span-6 space-y-4 py-4 border-overlay',
                      i % 2 === 0 ? 'md:border-r md:pr-4' : 'md:pl-4',
                      'border-b'
                    )}
                    key={metric.key}
                  >
                    <BillingMetric
                      idx={i}
                      slug={orgSlug}
                      metric={metric}
                      usage={usage}
                      subscription={subscription!}
                    />
                  </div>
                )
              })}

              {computeMetrics.map((metric, i) => (
                <div
                  className={clsx(
                    'col-span-12 md:col-span-6 space-y-4 py-4 border-overlay',
                    i % 2 === 0 ? 'md:border-r md:pr-4' : 'md:pl-4'
                  )}
                  key={metric}
                >
                  <ComputeUsageMetric
                    idx={123}
                    key={'key'}
                    slug={orgSlug}
                    metric={{
                      key: 'COMPUTE_HOURS_XS',
                      name: 'Compute Hours XS',
                      units: 'bytes',
                      anchor: 'dbSize',
                      category: 'Database',
                      unitName: 'GB',
                    }}
                    usage={usage}
                    subscription={subscription!}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionContent>
    </div>
  )
}

export default TotalUsage
