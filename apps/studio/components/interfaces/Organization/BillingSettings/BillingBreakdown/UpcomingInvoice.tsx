import clsx from 'clsx'
import { partition } from 'lodash'

import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrgUpcomingInvoiceQuery } from 'data/invoices/org-invoice-upcoming-query'
import { useMemo, useState } from 'react'
import { Button, Collapsible, IconChevronRight, IconInfo } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PricingMetric } from 'data/analytics/org-daily-stats-query'
import { formatBytes } from 'lib/helpers'

export interface UpcomingInvoiceProps {
  slug?: string
}

const UpcomingInvoice = ({ slug }: UpcomingInvoiceProps) => {
  const {
    data: upcomingInvoice,
    error: error,
    isLoading,
    isError,
    isSuccess,
  } = useOrgUpcomingInvoiceQuery({ orgSlug: slug })

  const [showUsageFees, setShowUsageFees] = useState(false)
  const [, fixedFees] = partition(upcomingInvoice?.lines ?? [], (item) => item.usage_based)

  const usageFees = useMemo(() => {
    return (upcomingInvoice?.lines || [])
      .filter((item) => item.usage_based)
      .sort((a, b) => b.amount - a.amount)
  }, [upcomingInvoice])

  const formatUsage = (pricingMetric: PricingMetric, usage: number) => {
    if (
      [PricingMetric.DATABASE_SIZE, PricingMetric.EGRESS, PricingMetric.STORAGE_SIZE].includes(
        pricingMetric
      )
    ) {
      return formatBytes(usage, undefined, 1000)
    } else {
      return usage.toLocaleString()
    }
  }

  return (
    <>
      {isLoading && (
        <div className="space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      )}

      {isError && <AlertError subject="Failed to retrieve upcoming invoice" error={error} />}

      {isSuccess && (
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="py-2 font-medium text-left text-sm text-foreground-light max-w-[200px]">
                Item
              </th>
              <th className="py-2 font-medium text-left text-sm text-foreground-light">Usage</th>
              <th className="py-2 font-medium text-left text-sm text-foreground-light">
                Unit price
              </th>
              <th className="py-2 font-medium text-right text-sm text-foreground-light">Price</th>
            </tr>
          </thead>
          <tbody>
            {fixedFees.map((item) => (
              <tr key={item.description} className='border-b'>
                <td className="py-2 text-sm max-w-[200px]">{item.description ?? 'Unknown'}</td>
                <td className="py-2 text-sm">{item.quantity}</td>
                <td className="py-2 text-sm">
                  {item.unit_price === 0 ? 'FREE' : `$${item.unit_price}`}
                </td>
                <td className="py-2 text-sm text-right">${item.amount}</td>
              </tr>
            ))}
          </tbody>

          {usageFees.length > 0 &&
            usageFees.map((fee) => (
              <Collapsible
                asChild
                open={showUsageFees}
                onOpenChange={setShowUsageFees}
                key={fee.description}
              >
                <tbody>
                  <Collapsible.Trigger asChild>
                    <tr
                      className={showUsageFees ? '' : 'border-b'}
                      key={fee.description}
                      style={{ WebkitAppearance: 'initial' }}
                    >
                      <td className="py-2 text-sm max-w-[200px]">
                        <span>{fee.description}</span>{' '}
                        <Button
                          type="text"
                          className="!px-1"
                          icon={
                            <IconChevronRight
                              className={clsx('transition', showUsageFees && 'rotate-90')}
                            />
                          }
                        />
                      </td>
                      <td className="py-2 text-sm tabular-nums max-w-[100px]">
                        {fee.usage_original
                          ? `${formatUsage(fee.usage_metric!, fee.usage_original)}`
                          : null}
                      </td>
                      <td className="py-2 text-sm">
                        {fee.unit_price_desc ? `${fee.unit_price_desc}` : null}
                      </td>
                      <td className="py-2 text-sm text-right max-w-[70px]">${fee.amount ?? 0}</td>
                    </tr>
                  </Collapsible.Trigger>

                  <Collapsible.Content asChild>
                    <>
                      {fee.breakdown?.map((breakdown) => (
                        <tr
                          className="last:border-b cursor-pointer"
                          style={{ WebkitAppearance: 'initial' }}
                          key={breakdown.project_ref}
                        >
                          <td className="pb-1 text-xs pl-4 max-w-[200px]">
                            {breakdown.project_name}
                          </td>
                          <td className="pb-1 text-xs tabular-nums">
                            {formatUsage(fee.usage_metric!, breakdown.usage)}
                          </td>
                          <td />
                          <td />
                        </tr>
                      ))}
                    </>
                  </Collapsible.Content>
                </tbody>
              </Collapsible>
            ))}

          <tfoot>
            <tr>
              <td className="py-4 text-sm font-medium">
                <span className="mr-2">Projected Costs</span>
                <Tooltip.Root delayDuration={0}>
                  <Tooltip.Trigger>
                    <IconInfo size={12} strokeWidth={2} />
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
                        <span className="text-xs text-foreground">
                          Estimated costs at the end of the billing cycle. Final amounts may vary
                          depending on your usage.
                        </span>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </td>
              <td className="py-4 text-sm text-right font-medium" colSpan={3}>
                ${upcomingInvoice?.amount_projected ?? '-'}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </>
  )
}

export default UpcomingInvoice
