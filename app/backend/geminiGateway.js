/* eslint-disable @typescript-eslint/no-require-imports */
const axios = require('axios')

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

function getApiKey() {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('Missing GEMINI_API_KEY (server environment variable)')
  return key
}

function assertTextInput(input) {
  if (typeof input === 'string') {
    const t = input.trim()
    if (!t) throw new Error('Input text is empty')
    return t
  }

  if (Array.isArray(input)) {
    if (input.length === 0) throw new Error('Input array is empty')
    return input.map((x) => {
      if (typeof x !== 'string') throw new Error('All inputs must be strings')
      const t = x.trim()
      if (!t) throw new Error('One of the input strings is empty')
      return t
    })
  }

  throw new Error('Invalid input: expected string or string[]')
}

async function geminiChat({
  model = 'gemini-2.5-flash',
  systemPrompt,
  userText,
  max_tokens = 4000,
  temperature = 0.7
}) {
  if (!systemPrompt || typeof systemPrompt !== 'string') {
    throw new Error('systemPrompt is required')
  }

  const text = assertTextInput(userText)
  const apiKey = getApiKey()

  // Ensure model does not have "models/" prefix twice in the endpoint URL
  const modelName = model.startsWith('models/') ? model.split('/')[1] : model

  const url = `${GEMINI_API_BASE_URL}/models/${modelName}:generateContent?key=${apiKey}`

  const response = await axios.post(url, {
    contents: [
      {
        role: 'user',
        parts: [{ text: text }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature,
      maxOutputTokens: max_tokens
    }
  }, {
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 60_000
  })

  const candidate = response.data?.candidates?.[0]
  const content = candidate?.content?.parts?.[0]?.text

  if (!content) {
    throw new Error('Gemini did not return any content')
  }

  return content
}

async function geminiEmbeddings({
  model = 'text-embedding-004',
  input
}) {
  const normalizedInput = assertTextInput(input)
  const apiKey = getApiKey()
  const modelName = model.startsWith('models/') ? model.split('/')[1] : model

  if (typeof normalizedInput === 'string') {
    const url = `${GEMINI_API_BASE_URL}/models/${modelName}:embedContent?key=${apiKey}`
    const response = await axios.post(url, {
      content: {
        parts: [{ text: normalizedInput }]
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60_000
    })

    const values = response.data?.embedding?.values
    if (!Array.isArray(values)) {
      throw new Error('Unexpected single embedding response shape')
    }

    return {
      embeddings: [values]
    }
  } else {
    // Array of strings
    const url = `${GEMINI_API_BASE_URL}/models/${modelName}:batchEmbedContents?key=${apiKey}`
    const requests = normalizedInput.map((text) => ({
      model: `models/${modelName}`,
      content: {
        parts: [{ text }]
      }
    }))

    const response = await axios.post(url, { requests }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60_000
    })

    const embeddingsList = response.data?.embeddings
    if (!Array.isArray(embeddingsList)) {
      throw new Error('Unexpected batch embeddings response shape')
    }

    const embeddings = embeddingsList.map((item) => {
      const values = item?.values
      if (!Array.isArray(values)) {
        throw new Error('Missing values in batch embedding response item')
      }
      return values
    })

    return {
      embeddings
    }
  }
}

module.exports = {
  geminiChat,
  geminiEmbeddings
}
