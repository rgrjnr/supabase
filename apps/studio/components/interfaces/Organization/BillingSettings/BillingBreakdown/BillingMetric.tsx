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

export interface BillingMetricProps {
  idx: number
  slug?: string
  metric: Metric
  usage: OrgUsageResponse
  subscription: OrgSubscription
}

const BillingMetric = ({ idx, slug, metric, usage, subscription }: BillingMetricProps) => {
  const snap = useOrgSettingsPageStateSnapshot()
  const usageMeta = usage.usages.find((x) => x.metric === metric.key)
  const usageRatio =
    typeof usageMeta !== 'number'
      ? (usageMeta?.usage ?? 0) / (usageMeta?.pricing_free_units ?? 0)
      : 0

  console.log({ usageMeta })

  const usageFee = subscription?.usage_fees?.find((item) => item.metric === metric.key)!
  const isUsageBillingEnabled = subscription?.usage_billing_enabled
  const largeNumberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

  const hasLimit = !!usageMeta?.unlimited === false
  const isApproachingLimit = hasLimit && usageRatio >= USAGE_APPROACHING_THRESHOLD
  const isExceededLimit = hasLimit && usageRatio >= 1

  const usageCurrentLabel =
    metric.units === 'bytes'
      ? `${usageMeta?.usage?.toLocaleString() ?? 0} GB`
      : usageMeta?.usage?.toLocaleString()

  const usageCurrentLabel2 =
    metric.units === 'bytes'
      ? `${usageMeta?.usage?.toLocaleString() ?? 0} / ${usageMeta?.pricing_free_units ?? 0} GB`
      : `${usageMeta?.usage?.toLocaleString()} / ${usageMeta?.pricing_free_units?.toLocaleString()}`

  const usageLimitLabel =
    metric.units === 'bytes'
      ? `${usageMeta?.pricing_free_units ?? 0} GB`
      : usageMeta?.pricing_free_units?.toLocaleString()
  const percentageLabel = `${(usageRatio * 100).toFixed(0)}%`
  const usageLabel =
    usageMeta?.available_in_plan === false
      ? 'Unavailable in plan'
      : usageMeta?.cost && usageMeta.cost > 0
      ? usageCurrentLabel
      : usageCurrentLabel2

  // TODO sort metrics so the ones with higher usage show up first

  return (
    <div
      className={clsx(
        'col-span-12 md:col-span-6 space-y-4 py-4 border-overlay',
        idx % 2 === 0 ? 'md:border-r md:pr-4' : 'md:pl-4',
        idx < BILLING_BREAKDOWN_METRICS.length - 3 && 'border-b'
      )}
    >
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
          ) : usageMeta?.available_in_plan ? (
            <span className="text-sm">({percentageLabel})</span>
          ) : null}
        </div>

        {usageMeta?.available_in_plan ? (
          <div>
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <svg className="h-8 w-8 -rotate-90 transform">
                  <circle
                    cx={15}
                    cy={15}
                    r={12}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={4}
                    className="text-background-surface-300"
                  />
                  <circle
                    cx={15}
                    cy={15}
                    r={12}
                    fill="transparent"
                    stroke="currentColor"
                    strokeDasharray={75.398}
                    strokeDashoffset={`calc(75.39822 - ${
                      usageRatio < 1 ? usageRatio * 100 : 100
                    } / 100 * 75.39822)`}
                    strokeWidth={4}
                    className={
                      isUsageBillingEnabled
                        ? 'text-gray-dark-800'
                        : isExceededLimit
                        ? 'text-red-800'
                        : 'text-yellow-800'
                    }
                  />
                </svg>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-alternative py-1 px-2 leading-none shadow',
                      'border border-background',
                    ].join(' ')}
                  >
                    <div className="text-xs text-foreground">
                      {JSON.stringify(usageFee)}
                      {usageFee.pricingStrategy === 'UNIT' ? (
                        <div>
                          <p>
                            {largeNumberFormatter.format(usageFee.pricingOptions.freeUnits)}{' '}
                            {metric.unitName} included
                          </p>
                          <p>
                            then ${usageFee.pricingOptions.perUnitPrice} per {metric.unitName}
                          </p>
                        </div>
                      ) : usageFee.pricingStrategy === 'PACKAGE' ? (
                        <div>
                          <p>
                            {largeNumberFormatter.format(usageFee.pricingOptions.freeUnits)}{' '}
                            included
                          </p>

                          <p>
                            then ${usageFee.pricingOptions.packagePrice} per{' '}
                            {largeNumberFormatter.format(usageFee.pricingOptions.packageSize!)}
                          </p>
                        </div>
                      ) : null}

                      <p className="text-xs text-foreground">
                        Exceeding your plans included usage will lead to restrictions to your
                        project.
                      </p>
                      <p className="text-xs text-foreground">
                        Upgrade to a usage-based plan or disable the spend cap to avoid
                        restrictions.
                      </p>
                    </div>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </div>
        ) : (
          <div className="">
            <Button type="default" onClick={() => snap.setPanelKey('subscriptionPlan')}>
              Upgrade
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BillingMetric
