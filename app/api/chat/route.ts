import OpenAI from "openai"
import { streamText } from "ai"
import { openai as openaiProvider } from "@ai-sdk/openai"
import { DataAPIClient } from "@datastax/astra-db-ts"
import { requireEnv } from "../../lib/utils"

const ASTRA_DB_NAMESPACE = requireEnv("ASTRA_DB_NAMESPACE")
const ASTRA_DB_COLLECTION = requireEnv("ASTRA_DB_COLLECTION")
const ASTRA_DB_API_ENDPOINT = requireEnv("ASTRA_DB_API_ENDPOINT")
const ASTRA_DB_APP_TOKEN = requireEnv("ASTRA_DB_APP_TOKEN")
const OPENAI_API_KEY = requireEnv("OPENAI_API_KEY")

// OpenAI SDK for embeddings
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

const client = new DataAPIClient(ASTRA_DB_APP_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE })
const collection = db.collection(ASTRA_DB_COLLECTION)

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    
    // Get the latest message content from parts array (v5 format)
    const lastMessage = messages[messages?.length - 1]
    const latestMessage = lastMessage?.parts?.[0]?.text || lastMessage?.content
    
    if (!latestMessage) {
      console.error('No message content found!')
      return new Response("No message content", { status: 400 })
    }

    let docContext = ""

    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: latestMessage,
      encoding_format: "float",
    })

    // Retrieve relevant documents from vector database
    try {
      const results = collection.find({}, {
        sort: {
          $vector: embedding.data[0].embedding,
        },
        limit: 5,
      })

      const documents = await results.toArray()
      console.log(`Found ${documents} documents`)
      const docsMap = documents?.map((doc) => doc.text)

      docContext = JSON.stringify(docsMap)
    } catch (error) {
      console.error('Vector DB error:', error)
      return new Response("Internal Server Error", { status: 500 })
    }

    // Create system message with context
    const systemMessage = `You are a helpful assistant that knows can answer questions about CAPT Elections. Use the below context about the CAPT Elections laws and by-laws to answer the user's questions. If the context doesn't include the information you need to answer the question, please provide a disclaimer and do not answer based on your own existing knowledge. Format responses using markdown where applicable and don't return images.
      
      ----------------
      START CONTEXT
      ${docContext}
      END CONTEXT
      ----------------
      QUESTION: ${latestMessage}
      ----------------
      `

    // Convert UIMessage format (with parts) to CoreMessage format (with content)
    const convertedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.parts?.[0]?.text || msg.content || ''
    }))
    
    // Use AI SDK v5's streamText
    const result = streamText({
      model: openaiProvider("gpt-4o-mini"),
      system: systemMessage,
      messages: convertedMessages,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('API Route Error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}