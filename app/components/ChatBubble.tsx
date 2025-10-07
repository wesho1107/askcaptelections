import { UIMessage } from 'ai'
import React from 'react'

const ChatBubble = ({ message }: { message: UIMessage }) => {
  const { parts, role } = message
  
  const isUser = role === 'user'
  const bubbleClasses = `m-2 p-2 text-md border-none shadow-md w-[80%] text-left ${
    isUser 
      ? 'rounded-tl rounded-tr rounded-br bg-blue-500 text-white ml-auto' 
      : 'rounded-tl rounded-tr rounded-bl bg-gray-200 text-gray-900'
  }`
  
  return (
    <div className={bubbleClasses}>
      {parts.map((part, index) => {
        if (part.type === "text") {
          return <span key={index}>{part.text}</span>
        }
        return null
      })}
    </div>
  )
}

export default ChatBubble