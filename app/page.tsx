"use client";
import { useChat } from "@ai-sdk/react"
import { useState } from 'react';
import { cn } from "./lib/utils"
import LoadingBubble from "./components/LoadingBubble"
import ChatBubble from "./components/ChatBubble"

const Home = () => {
  const [input, setInput] = useState('');
  const chat = useChat()
  const { sendMessage, status, messages, error } = chat

  const hasMessages = messages.length > 0
  const isLoading = status === 'streaming' || status === 'submitted'

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
          hasMessages && "h-full flex flex-col justify-end overflow-y-scroll no-scrollbar"
        )}>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error: </strong>{error.message}
          </div>
        )}
        {hasMessages ? (
          <>
            {messages.map((message, index) => (
              <ChatBubble key={`message-${index}`} message={message} />
            ))}
            {isLoading && <LoadingBubble />}
          </>
        ) : (
          <>
            <h1 className="text-5xl font-bold text-secondary">AskCAPTElections</h1>
            <br/>
            <p className="text-2xl text-secondary">Ask me anything about the CAPT Elections</p>
          </>
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