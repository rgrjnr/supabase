import * as Tooltip from '@radix-ui/react-tooltip'
import clsx from 'clsx'
import Link from 'next/link'

import { BILLING_BREAKDOWN_METRICS } from 'components/interfaces/Billing/Subscription/Subscription.constants'
import SparkBar from 'components/ui/SparkBar'
import { OrgSubscription } from 'data/subscriptions/org-subscription-query'
import { OrgUsageResponse } from 'data/usage/org-usage-query'
import { useOrgSettingsPageStateSnapshot } from 'state/organization-settings'
import { Button, IconAlertTriangle, IconChevronRight, IconInfo } from 'ui'
import { Metric, USAGE_APPROACHING_THRESHOLD } from './BillingBreakdown.constants'

export interface ComputeUsageMetricProps {
  idx: number
  slug?: string
  metric: Metric
  usage: OrgUsageResponse
  subscription: OrgSubscription
}

const ComputeUsageMetric = ({
  idx,
  slug,
  metric,
  usage,
  subscription,
}: ComputeUsageMetricProps) => {
  const usageMeta = usage.usages.find((x) => x.metric === metric.key)

  console.log({ usageMeta })

  const hasLimit = !!usageMeta?.unlimited === false

  const usageCurrentLabel = `${usageMeta?.usage?.toLocaleString() ?? 0} hours`

  const usageCurrentLabel2 = `${usageMeta?.usage?.toLocaleString() ?? 0} / ${
    usageMeta?.pricing_free_units ?? 0
  } hours`

  const usageLabel = usageMeta?.cost && usageMeta.cost > 0 ? usageCurrentLabel : usageCurrentLabel2

  // TODO sort metrics so the ones with higher usage show up first

  return (
    <div className="flex items-center justify-between">
      <div>
        <Link href={`/org/${slug}/usage#${metric.anchor}`}>
          <div className="group flex items-center space-x-2">
            <p className="text-sm text-foreground-light group-hover:text-foreground transition cursor-pointer">
              {metric.name}
            </p>
            <IconChevronRight strokeWidth={1.5} size={16} className="transition" />
          </div>
        </Link>
        <span className="text-sm">{usageLabel}</span>&nbsp;
        {usageMeta?.cost && usageMeta.cost > 0 ? (
          <span className="text-sm">(${usageMeta?.cost})</span>
        ) : null}
      </div>
    </div>
  )
}

export default ComputeUsageMetric
