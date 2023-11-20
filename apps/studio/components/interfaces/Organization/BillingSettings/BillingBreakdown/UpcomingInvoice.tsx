import clsx from 'clsx'
import { partition } from 'lodash'

import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrgUpcomingInvoiceQuery } from 'data/invoices/org-invoice-upcoming-query'
import { useState } from 'react'
import { Button, Collapsible, IconChevronRight, IconInfo } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'

export interface UpcomingInvoiceProps {
  slug?: string
}

const UpcomingInvoice = ({ slug }: UpcomingInvoiceProps) => {
  const upcomingInvoice = {
    subscription_id: 'sub_1O7y6gJDPojXS6LN92YUAeVw',
    amount_total: 37.22,
    billing_cycle_end: '2023-12-02T10:26:34.000Z',
    billing_cycle_start: '2023-11-02T10:26:34.000Z',
    customer_balance: 0,
    currency: 'usd',
    lines: [
      {
        amount: 0,
        description: 'Pro plan',
        quantity: 1,
        unit_price: 25,
        usage_based: false,
        period: {
          start: '2023-12-02T10:26:34.000Z',
          end: '2024-01-02T10:26:34.000Z',
        },
        proration: false,
      },

      {
        amount: 20,
        description: 'Custom Domain',
        quantity: '2',
        unit_price: '$10',
        usage_based: true,
        period: {
          start: '2023-12-02T10:26:34.000Z',
          end: '2024-01-02T10:26:34.000Z',
        },
        proration: false,
        breakdown: [
          {
            project_ref: 'abc',
            project_name: 'My super project',
            quantity: '1',
          },
          {
            project_ref: 'abc',
            project_name: 'My not so super project',
            quantity: '1',
          },
        ],
      },

      {
        amount: 15.99,
        description: 'Function Invocations',
        quantity: '15,645,888',
        unit_price: '2 Million included, then $2 per 1 Million',
        usage_based: true,
        period: {
          start: '2023-12-02T10:26:34.000Z',
          end: '2024-01-02T10:26:34.000Z',
        },
        proration: false,
        breakdown: [
          {
            project_ref: 'abc',
            project_name: 'My super project',
            quantity: '15,600,888',
          },
          {
            project_ref: 'abc',
            project_name: 'My not so super project',
            quantity: '45,000',
          },
        ],
      },

      {
        amount: 1.23,
        description: 'Compute Hours XS',
        quantity: '90',
        unit_price: '$0.0137 / hour',
        usage_based: true,
        period: {
          start: '2023-12-02T10:26:34.000Z',
          end: '2024-01-02T10:26:34.000Z',
        },
        proration: false,
        breakdown: [
          {
            project_ref: 'abc',
            project_name: 'My super project',
            quantity: '90',
          },
        ],
      },
    ],
  }

  const {
    //data: upcomingInvoice,
    error: error,
    isLoading,
    isError,
    isSuccess,
  } = useOrgUpcomingInvoiceQuery({ orgSlug: slug })

  const [showUsageFees, setShowUsageFees] = useState(false)
  const [usageFees, fixedFees] = partition(upcomingInvoice?.lines ?? [], (item) => item.usage_based)

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
              <th className="py-2 font-medium text-left text-sm text-foreground-light w-1/2">
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
              <tr key={item.description} className="border-b">
                <td className="py-2 text-sm">{item.description ?? 'Unknown'}</td>
                <td className="py-2 text-sm">{item.quantity}</td>
                <td className="py-2 text-sm">
                  {item.unit_price === 0 ? 'FREE' : `${item.unit_price}`}
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
                      className="border-b"
                      key={fee.description}
                      style={{ WebkitAppearance: 'initial' }}
                    >
                      <td className="py-2 text-sm">
                        {' '}
                        <Button
                          type="text"
                          className="!px-1"
                          icon={
                            <IconChevronRight
                              className={clsx('transition', showUsageFees && 'rotate-90')}
                            />
                          }
                        />{' '}
                        <span>{fee.description}</span>
                      </td>
                      <td className="py-2 text-sm">{fee.quantity ? `${fee.quantity}` : null}</td>
                      <td className="py-2 text-sm max-w-[30px]">
                        {fee.unit_price ? `${fee.unit_price}` : null}
                      </td>
                      <td className="py-2 text-sm text-right">${fee.amount ?? 0}</td>
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
                          <td className="py-2 text-sm pl-8">{breakdown.project_name}</td>
                          <td className="py-2 text-sm">{breakdown.quantity}</td>
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
                ${upcomingInvoice?.amount_projected ?? 0}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </>
  )
}

export default UpcomingInvoice
