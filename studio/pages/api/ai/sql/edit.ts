import { SchemaBuilder } from '@serafin/schema-builder'
import { stripIndent } from 'common-tags'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import type {
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
  ErrorResponse,
} from 'openai'

const openAiKey = process.env.OPENAI_KEY

const editSqlSchema = SchemaBuilder.emptySchema().addString('sql', {
  description: stripIndent`
      The modified SQL (must be valid SQL).
      - Assume the query hasn't been executed yet
      - For primary keys, always use "id bigint primary key generated always as identity" (not serial)
      - When creating tables, always add foreign key references inline
      - Prefer 'text' over 'varchar'
      - Prefer 'timestamp with time zone' over 'date'
      - Use vector(384) data type for any embedding/vector related query
      - Always use double apostrophe in SQL strings (eg. 'Night''s watch')
    `,
})

type EditSqlResult = typeof editSqlSchema.T

const completionFunctions = {
  editSql: {
    name: 'editSql',
    description: "Edits a Postgres SQL query based on the user's instructions",
    parameters: editSqlSchema.schema,
  },
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!openAiKey) {
    return res.status(500).json({
      error: 'No OPENAI_KEY set. Create this environment variable to use AI features.',
    })
  }

  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

export async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {
    body: { prompt, sql },
  } = req

  const model = 'gpt-3.5-turbo-0613'
  const maxCompletionTokenCount = 2048

  const completionMessages: ChatCompletionRequestMessage[] = [
    {
      role: 'user',
      content: stripIndent`
        Here is my current SQL:
        ${sql}
      `,
    },
    {
      role: 'user',
      content: prompt,
    },
  ]

  const completionOptions: CreateChatCompletionRequest = {
    model,
    messages: completionMessages,
    max_tokens: maxCompletionTokenCount,
    temperature: 0,
    function_call: {
      name: completionFunctions.editSql.name,
    },
    functions: [completionFunctions.editSql],
    stream: false,
  }

  console.log({ sql, prompt, completionMessages })

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(completionOptions),
  })

  if (!response.ok) {
    const errorResponse: ErrorResponse = await response.json()
    console.error(`AI SQL editing failed: ${errorResponse.error.message}`)

    return res.status(500).json({
      error: 'There was an unknown error editing the SQL snippet. Please try again.',
    })
  }

  const completionResponse: CreateChatCompletionResponse = await response.json()

  console.log(completionResponse)

  const [firstChoice] = completionResponse.choices

  const sqlResponseString = firstChoice.message?.function_call?.arguments

  if (!sqlResponseString) {
    console.error(
      `AI SQL editing failed: OpenAI response succeeded, but response format was incorrect`
    )

    return res.status(500).json({
      error: 'There was an unknown error editing the SQL snippet. Please try again.',
    })
  }

  console.log({ sqlResponseString })

  const editSqlResult: EditSqlResult = JSON.parse(sqlResponseString)

  if (!editSqlResult.sql) {
    console.error(`AI SQL editing failed: Unable to edit SQL for the given prompt`)

    return res.status(400).json({
      error: 'Unable to edit SQL. Try adding more details to your prompt.',
    })
  }

  return res.json(editSqlResult)
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrapper