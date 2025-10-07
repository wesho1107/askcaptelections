// Load the database from the PDF file

import { DataAPIClient } from "@datastax/astra-db-ts"
import OpenAI from "openai"
import "dotenv/config"
import fs from "fs"
import path from "path"
import { getChunkedDocsFromPDF } from "./pdf-loader";
import { requireEnv } from "../app/lib/utils";
type SimilarityMetric = "dot_product" | "cosine" | "euclidean"

const ASTRA_DB_NAMESPACE = requireEnv("ASTRA_DB_NAMESPACE")
const ASTRA_DB_COLLECTION = requireEnv("ASTRA_DB_COLLECTION")
const ASTRA_DB_API_ENDPOINT = requireEnv("ASTRA_DB_API_ENDPOINT")
const ASTRA_DB_APP_TOKEN = requireEnv("ASTRA_DB_APP_TOKEN")
const OPENAI_API_KEY = requireEnv("OPENAI_API_KEY")

const DIMENSION_SIZE = 1536 // Depending on LLM embedding model

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

function getPdfFilesInDir(targetDir: string): string[] {
  const entries = fs.readdirSync(targetDir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
    .map((entry) => path.join(targetDir, entry.name))
}

const pdfRootDir = path.join(process.cwd(), "app", "data", "pdf")
const pdfFiles = fs.existsSync(pdfRootDir) ? getPdfFilesInDir(pdfRootDir) : []

const client = new DataAPIClient(ASTRA_DB_APP_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE })

const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
    const res = await db.createCollection(ASTRA_DB_COLLECTION, {
        vector: {
            dimension: DIMENSION_SIZE,
            metric: similarityMetric,
        },
    })
    console.log(res)
}

const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION)

    // Always restart with new state, deleting old records
    collection.deleteMany({})
    console.log("Deleted all documents from collection")

    for await (const pdfFile of pdfFiles) {
        const chunks = await getChunkedDocsFromPDF(pdfFile)
        
        for await (const chunk of chunks) {
            const embedding = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunk.pageContent,
                encoding_format: "float",
            })

            const vector = embedding.data[0].embedding

            const res = await collection.insertOne({
                $vector: vector,
                text: chunk.pageContent,
            })
            console.log(res)
        }
    }
}

createCollection().then(() => loadSampleData())
