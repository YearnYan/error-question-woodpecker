import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: 'sk-oCnB0Sa4TAZpPubgQmsXYH6hDDB1JcPY6vXuk8th9Gka32Oj',
  baseURL: 'https://api.linapi.net/v1',
})

const MODEL = 'gemini-3-flash-preview'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
}

export async function chatWithAI(messages: ChatMessage[], options?: {
  temperature?: number
  maxTokens?: number
}): Promise<string> {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: messages as any,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4096,
  })

  return response.choices[0]?.message?.content || ''
}

export async function chatWithImage(
  systemPrompt: string,
  userPrompt: string,
  imageBase64: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        { type: 'text', text: userPrompt },
        {
          type: 'image_url',
          image_url: { url: imageBase64 },
        },
      ],
    },
  ]

  return chatWithAI(messages, options)
}

export async function chatWithText(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]

  return chatWithAI(messages, options)
}
