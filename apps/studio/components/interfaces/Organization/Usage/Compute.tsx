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
import { useOrgDailyComputeStatsQuery } from 'data/analytics/org-daily-compute-stats-query'

export interface ComputeProps {
  orgSlug: string
  projectRef?: string
  startDate: string | undefined
  endDate: string | undefined
  subscription: OrgSubscription | undefined
}

// [Joshen TODO] Needs to take in org slug and eventually use daily stats org query
const Compute = ({ orgSlug, projectRef, subscription, startDate, endDate }: ComputeProps) => {
  const allAttributeKeys = Object.values(ComputeUsageMetric).map((it) => it.toLowerCase())
  const { data: egressData, isLoading: isLoadingDbEgressData } = useOrgDailyComputeStatsQuery({
    orgSlug,
    projectRef,
    startDate,
    endDate,
  })

  const chartData: DataPoint[] = egressData?.data ?? []

  const attributes: Attribute[] = [
    {
      key: ComputeUsageMetric.COMPUTE_HOURS_BRANCH.toLowerCase(),
      color: 'blue',
      name: computeUsageMetricLabel(ComputeUsageMetric.COMPUTE_HOURS_BRANCH),
    },
    {
      key: ComputeUsageMetric.COMPUTE_HOURS_XS.toLowerCase(),
      color: 'white',
      name: computeUsageMetricLabel(ComputeUsageMetric.COMPUTE_HOURS_XS),
    },
    {
      key: ComputeUsageMetric.COMPUTE_HOURS_SM,
      color: 'green',
      name: computeUsageMetricLabel(ComputeUsageMetric.COMPUTE_HOURS_SM),
    },
    {
      key: ComputeUsageMetric.COMPUTE_HOURS_MD,
      color: 'dark-green',
      name: computeUsageMetricLabel(ComputeUsageMetric.COMPUTE_HOURS_MD),
    },
    {
      key: ComputeUsageMetric.COMPUTE_HOURS_L,
      color: 'yellow',
      name: computeUsageMetricLabel(ComputeUsageMetric.COMPUTE_HOURS_L),
    },
    {
      key: ComputeUsageMetric.COMPUTE_HOURS_XL,
      color: 'dark-yellow',
      name: computeUsageMetricLabel(ComputeUsageMetric.COMPUTE_HOURS_XL),
    },
    {
      key: ComputeUsageMetric.COMPUTE_HOURS_2XL,
      color: 'orange',
      name: computeUsageMetricLabel(ComputeUsageMetric.COMPUTE_HOURS_2XL),
    },
    {
      key: ComputeUsageMetric.COMPUTE_HOURS_4XL,
      color: 'dark-orange',
      name: computeUsageMetricLabel(ComputeUsageMetric.COMPUTE_HOURS_4XL),
    },
    {
      key: ComputeUsageMetric.COMPUTE_HOURS_8XL,
      color: 'red',
      name: computeUsageMetricLabel(ComputeUsageMetric.COMPUTE_HOURS_8XL),
    },
    {
      key: ComputeUsageMetric.COMPUTE_HOURS_12XL,
      color: 'dark-red',
      name: computeUsageMetricLabel(ComputeUsageMetric.COMPUTE_HOURS_12XL),
    },
    {
      key: ComputeUsageMetric.COMPUTE_HOURS_16XL,
      color: 'purple',
      name: computeUsageMetricLabel(ComputeUsageMetric.COMPUTE_HOURS_16XL),
    },
  ]

  const attributeKeysWithData = useMemo(() => {
    return allAttributeKeys.filter((attributeKey) => chartData.some((data) => data[attributeKey]))
  }, [chartData])

  const notAllValuesZero = useMemo(() => {
    return attributeKeysWithData.length > 0
  }, [attributeKeysWithData])

  const isLoading = false
  const isSuccess = true
  const isError = null

  return (
    <div id="compute">
      <SectionContent
        section={{
          attributes,
          anchor: 'compute',
          chartDescription: 'chartdesc',
          name: 'Compute Hours',
          unit: 'hours',
          description:
            'Amount of hours your projects were active. Each project is a dedicated server and database.\nPaid plans come with $10 in Compute Credits to cover one project running on Starter Compute or parts of any compute add-on.\nBilling is based on the sum of compute hours used. Paused projects do not incur compute costs.',
          key: 'compute',
          links: [
            {
              name: 'Compute Add-ons',
              url: 'https://supabase.com/docs/guides/platform/compute-add-ons',
            },
            {
              name: 'Usage-billing for Compute',
              url: 'https://supabase.com/docs/guides/platform/org-based-billing#usage-based-billing-for-compute',
            },
          ],
        }}
      >
        {isLoading && (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        )}

        {isError && <AlertError subject="Failed to retrieve usage data" error={error} />}

        {isSuccess && (
          <>
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <p className="text-sm">Compute usage</p>
                  </div>
                </div>

                {attributeKeysWithData.map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between border-b last:border-b-0 py-1 last:py-0"
                  >
                    <p className="text-xs text-foreground-light">
                      <span className="font-medium">
                        {computeUsageMetricLabel(key.toUpperCase() as ComputeUsageMetric)}
                      </span>{' '}
                      Compute Hours usage in period
                    </p>
                    <p className="text-xs">
                      {chartData.reduce((prev, cur) => prev + ((cur[key] as number) ?? 0), 0)} hours
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <p className="text-sm">Compute Usage per day</p>
                <p className="text-sm text-foreground-light">
                  The data refreshes every 15 minutes.
                </p>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-3/4" />
                  <ShimmeringLoader className="w-1/2" />
                </div>
              ) : chartData.length > 0 && notAllValuesZero ? (
                <UsageBarChart
                  name={`Chart name`}
                  unit={'hours'}
                  attributes={attributes}
                  data={chartData}
                  yMin={24}
                />
              ) : (
                <Panel>
                  <Panel.Content>
                    <div className="flex flex-col items-center justify-center">
                      <IconBarChart2 className="text-foreground-light mb-2" />
                      <p className="text-sm">No data in period</p>
                      <p className="text-sm text-foreground-light">
                        May take up to 15 minutes to show
                      </p>
                    </div>
                  </Panel.Content>
                </Panel>
              )}
            </>
          </>
        )}
      </SectionContent>
    </div>
  )
}

export default Compute
