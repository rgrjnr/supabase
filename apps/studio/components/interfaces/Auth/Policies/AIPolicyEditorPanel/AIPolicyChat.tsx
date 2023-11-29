import { zodResolver } from '@hookform/resolvers/zod'
import { compact, last, sortBy } from 'lodash'
import { Loader2 } from 'lucide-react'
import { Dispatch, FormEventHandler, SetStateAction, useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import {
  AiIcon,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import * as z from 'zod'

import { Message } from 'ai'
import { useProfile } from 'lib/profile'
import MessageComponent from './Message'

export const AIPolicyChat = ({
  messages,
  loading,
  onSubmit,
  onDiff,
  onChangeInput,
}: {
  messages: Message[]
  loading: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  onDiff: (s: string) => void
  onChangeInput: Dispatch<SetStateAction<string>>
}) => {
  const { profile } = useProfile()
  const bottomRef = useRef<HTMLDivElement>(null)
  const name = compact([profile?.first_name, profile?.last_name]).join(' ')
  const sorted = useMemo(() => {
    return sortBy(messages, (m) => m.createdAt).filter((m) => {
      return !m.content.startsWith('Here is my database schema for reference:')
    })
  }, [messages])

  const FormSchema = z.object({ chat: z.string() })
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues: { chat: '' },
  })
  const formChatValue = form.getValues().chat
  const pendingReply = loading && last(sorted)?.role === 'user'

  useEffect(() => {
    // 👇️ scroll to bottom every time messages change
    if (bottomRef.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 500)
    }
  }, [messages.length])

  useEffect(() => {
    if (!loading) {
      form.setValue('chat', '')
      form.setFocus('chat')
    }
  }, [loading])

  useEffect(() => {
    onChangeInput(formChatValue)
  }, [formChatValue])

  return (
    <div id={'ai-chat-assistant'} className="flex flex-col h-full">
      <div className="overflow-auto flex-1">
        <MessageComponent
          role="assistant"
          content={`Hi${
            name ? ' ' + name : ''
          }, how can I help you? I'm powered by AI, so surprises and mistakes are possible.
        Make sure to verify any generated code or suggestions, and share feedback so that we can
        learn and improve.`}
        />

        {sorted.map((m, idx) => (
          <MessageComponent
            key={`message-${idx}`}
            name={name}
            role={m.role}
            content={m.content}
            createdAt={new Date(m.createdAt || new Date()).getTime()}
            isDebug={false}
            onDiff={onDiff}
          />
        ))}

        {pendingReply && <MessageComponent role="assistant" content="Thinking..." />}

        <div ref={bottomRef} className="h-1" />
      </div>

      <Form_Shadcn_ {...form}>
        <form
          id="rls-chat"
          className="sticky p-5 flex-0 border-t"
          onSubmit={(event) => {
            // validate using react-hook-form and if succesful, trigger the form submission
            return form.handleSubmit(() => {
              onSubmit(event)
            })(event)
          }}
        >
          <FormField_Shadcn_
            control={form.control}
            name="chat"
            render={({ field }) => (
              <FormItem_Shadcn_>
                <FormControl_Shadcn_>
                  <div className="relative">
                    <AiIcon className="absolute top-2 left-3 [&>div>div]:border-black dark:[&>div>div]:border-white" />
                    <Input_Shadcn_
                      {...field}
                      autoComplete="off"
                      disabled={loading}
                      autoFocus
                      className={`bg-surface-300 dark:bg-black rounded-full pl-10 ${
                        loading ? 'pr-10' : ''
                      }`}
                      placeholder="Ask for some changes to your policy"
                    />
                    {loading && <Loader2 className="absolute top-2 right-3 animate-spin" />}
                  </div>
                </FormControl_Shadcn_>
              </FormItem_Shadcn_>
            )}
          />
        </form>
      </Form_Shadcn_>
    </div>
  )
}
