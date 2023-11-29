import { OpenAIStream, StreamingTextResponse } from 'ai'
import { codeBlock, oneLine } from 'common-tags'
import { NextRequest } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'edge'

const openAiKey = process.env.OPENAI_KEY

enum MessageRole {
  User = 'user',
  Assistant = 'assistant',
}

interface Message {
  role: MessageRole
  content: string
}

class ApplicationError extends Error {
  constructor(message: string, public data: Record<string, any> = {}) {
    super(message)
  }
}

class UserError extends ApplicationError {}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export async function POST(req: NextRequest) {
  console.log('ello')
  try {
    if (!openAiKey) {
      throw new ApplicationError('Missing environment variable OPENAI_KEY')
    }

    let body = await (req.json() as Promise<{
      messages: { content: string; role: 'user' | 'assistant' }[]
      entityDefinitions: string[]
    }>)
    let { messages, entityDefinitions } = body

    if (!messages) {
      throw new UserError('Missing messages in request data')
    }

    const openai = new OpenAI({ apiKey: openAiKey })

    const initMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: codeBlock`
          ${oneLine`
          You're an Postgres expert in writing row level security policies. Your purpose is to 
          generate a policy with the constraints given by the user. You will be provided a schema 
          on which the policy should be applied.

          The output should use the following instructions:
          - The generated SQL must be valid SQL.
          - Always use double apostrophe in SQL strings (eg. 'Night''s watch')
          - You can use only CREATE POLICY queries, no other queries are allowed.
          - You can add short explanations to your messages.
          - The result should be a valid markdown. The SQL code should be wrapped in \`\`\`.
          - Always use "auth.uid()" instead of "current_user".
          - Only use "WITH CHECK" on INSERT or UPDATE policies.
          - The policy name should be short text explaining the policy, enclosed in double quotes.
          
          The output should look like this: 
          "CREATE POLICY user_policy ON users FOR INSERT USING (user_name = current_user) WITH (true);" 
          `}
        `,
      },
    ]

    if (entityDefinitions) {
      initMessages.push({
        role: 'user',
        content: codeBlock`
            Here is my database schema for reference:
            ${entityDefinitions.join('\n\n')}
          `,
      })
    }

    if (messages) {
      initMessages.push(...messages)
    }

    const model = 'gpt-3.5-turbo-0301'

    const completionOptions: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming = {
      model,
      messages: initMessages,
      max_tokens: 1024,
      temperature: 0,
      stream: true,
    }

    console.log(initMessages)
    try {
      const response = await openai.chat.completions.create(completionOptions)
      // Proxy the streamed SSE response from OpenAI
      const stream = OpenAIStream(response)

      return new StreamingTextResponse(stream)
    } catch (error: any) {
      throw new ApplicationError('Failed to generate completion', error)
    }
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return new Response(
        JSON.stringify({
          error: err.message,
          data: err.data,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else if (err instanceof ApplicationError) {
      // Print out application errors with their additional data
      console.error(`${err.message}: ${JSON.stringify(err.data)}`)
    } else {
      // Print out unexpected errors as is to help with debugging
      console.error(err)
    }
    // TODO: include more response info in debug environments
    return new Response(
      JSON.stringify({
        error: 'There was an error processing your request',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}
