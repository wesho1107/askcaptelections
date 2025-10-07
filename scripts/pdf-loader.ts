import * as pdf from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";


export async function getChunkedDocsFromPDF(pdfFilePath: string): Promise<Document[]> {
    try {
        const dataBuffer = require('fs').readFileSync(pdfFilePath);
        const pdfData = await pdf.default(dataBuffer);
        
        const document: Document = {
            pageContent: pdfData.text,
            metadata: {
                source: pdfFilePath
            }
        };
        
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const chunks = await textSplitter.splitDocuments([document]);
        
        return chunks;
    } catch (error) {
        console.error(error);
        throw error;
    }
}