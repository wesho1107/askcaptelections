"use client";
import { useChat } from "@ai-sdk/react"
import { useState, useEffect, useRef } from 'react';
import { cn } from "./lib/utils"
import LoadingBubble from "./components/LoadingBubble"
import ChatBubble from "./components/ChatBubble"

const Home = () => {
  const [input, setInput] = useState('');
  const { sendMessage, status, messages, error } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const hasMessages = messages.length > 0
  const isLoading = status === 'streaming' || status === 'submitted'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handlePrompt = (prompt: string) => {
    sendMessage({ text: prompt })
    setInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      handlePrompt(input)
    }
  }

  return (
    <main className="flex flex-col w-[80vw] h-[80vh] p-10 items-center text-center justify-between rounded-2xl bg-background">
      <section className={cn(
          "w-full",
          hasMessages && "flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar"
        )}>
        {hasMessages ? (
          <>
            {messages.map((message, index) => (
              <ChatBubble key={`message-${index}`} message={message} />
            ))}
            {isLoading && <LoadingBubble />}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <>
            <h1 className="text-5xl font-bold text-secondary">AskCAPTElections</h1>
            <br/>
            <p className="text-2xl text-secondary">Ask me anything about the CAPT Elections</p>
          </>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error: </strong>{error.message}
          </div>
        )}
      </section>
      <form onSubmit={handleSubmit} className="w-full flex items-center justify-center border-t-1 border-secondary p-2 rounded-br-2xl rounded-bl-2xl overflow-hidden">
        <input
          className="w-[85%] p-2 text-secondary border-0 focus:border-0 focus:outline-none"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask me anything..."
        />
        <input className="w-[15%] p-2 rounded-md bg-foreground text-white" type="submit" disabled={isLoading}/>
      </form>
    </main>
  );
}

export default Home